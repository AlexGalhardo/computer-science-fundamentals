// EN: Watches one incident from the outside and writes down when each thing happened: the
//     load starts, the alert goes pending, it fires, the receiver is notified, the load stops,
//     the alert resolves. The end-to-end test asserts on this timeline and the demo prints it.
//     The watcher also sends a little steady traffic of its own, the "normal users": without
//     it there would be no requests after the load, and a ratio of zero requests is not 0, it
//     is undefined.
// PT: Observa um incidente de fora e anota quando cada coisa aconteceu: a carga começa, o
//     alerta fica pending, dispara, o receiver é notificado, a carga para, o alerta se resolve.
//     O teste de ponta a ponta faz asserções sobre essa linha do tempo e a demo a imprime.
//     O observador também manda um pouco de tráfego constante próprio, os "usuários normais":
//     sem ele não haveria requisições depois da carga, e uma razão de zero requisições não é
//     0, é indefinida.
// ES: Observa un incidente desde afuera y anota cuándo ocurrió cada cosa: la carga empieza, la
//     alerta queda pending, se dispara, se notifica al receiver, la carga se detiene, la alerta se resuelve.
//     La prueba de extremo a extremo hace aserciones sobre esa línea de tiempo y la demo la imprime.
//     El observador también manda un poco de tráfico constante propio, los "usuarios normales":
//     sin él no habría peticiones después de la carga, y una razón de cero peticiones no es
//     0, es indefinida.

import { z } from "zod";

const envSchema = z.object({
	SHOP_URL: z.url().default("http://shop:8080"),
	PROMETHEUS_URL: z.url().default("http://prometheus:9090"),
	ALERTMANAGER_URL: z.url().default("http://alertmanager:9093"),
	RECEIVER_URL: z.url().default("http://receiver:8080"),
	PROJECT_DIR: z.string().min(1).default("/project"),
});

export type LabEnv = z.infer<typeof envSchema>;

export function readLabEnv(env: Record<string, string | undefined> = process.env): LabEnv {
	return envSchema.parse(env);
}

const vectorSchema = z.object({
	data: z.object({
		result: z.array(
			z.object({ metric: z.record(z.string(), z.string()), value: z.tuple([z.number(), z.string()]) }),
		),
	}),
});

const alertsSchema = z.object({
	data: z.object({
		alerts: z.array(
			z.object({ labels: z.record(z.string(), z.string()), state: z.enum(["pending", "firing", "inactive"]) }),
		),
	}),
});

const notificationsSchema = z.array(
	z.object({
		receivedAt: z.string(),
		alertname: z.string(),
		status: z.enum(["firing", "resolved"]),
		severity: z.string(),
		summary: z.string(),
	}),
);

export type Notification = z.infer<typeof notificationsSchema>[number];

async function getJson(url: string): Promise<unknown> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`${url} answered ${response.status}`);
	}
	return response.json();
}

/**
 * The number inside one sample of the Prometheus HTTP API, or undefined when it is not a number.
 *
 * EN: Prometheus sends sample values as text, and one of them is "NaN": the result of 0 / 0.
 *     A ratio rule such as errors / requests records NaN while the service has had no request
 *     in the window (the first seconds of the lab, before the normal traffic was scraped twice).
 *     NaN means "there is no ratio yet", so it is reported as a missing value. Passing it on as
 *     a number would poison every peak: `Math.max(0.8, NaN)` is NaN, and it stays NaN forever.
 * PT: O Prometheus envia os valores das amostras como texto, e um deles é "NaN": o resultado
 *     de 0 / 0. Uma regra de razão como erros / requisições grava NaN enquanto o serviço não
 *     teve nenhuma requisição na janela (os primeiros segundos do laboratório, antes de o
 *     tráfego normal ser coletado duas vezes). NaN significa "ainda não existe razão", então é
 *     informado como valor ausente. Repassá-lo como número envenenaria todo pico:
 *     `Math.max(0.8, NaN)` é NaN, e continua NaN para sempre.
 * ES: Prometheus envía los valores de las muestras como texto, y uno de ellos es "NaN": el
 *     resultado de 0 / 0. Una regla de razón como errores / peticiones graba NaN mientras el
 *     servicio no tuvo ninguna petición en la ventana (los primeros segundos del laboratorio,
 *     antes de que el tráfico normal se recolectara dos veces). NaN significa "todavía no hay
 *     razón", así que se informa como valor ausente. Pasarlo como número envenenaría todo pico:
 *     `Math.max(0.8, NaN)` es NaN, y sigue siendo NaN para siempre.
 */
export function sampleValue(text: string): number | undefined {
	// EN: Prometheus spells infinity "+Inf" and "-Inf", which JavaScript does not parse.
	// PT: O Prometheus escreve infinito como "+Inf" e "-Inf", que o JavaScript não interpreta.
	// ES: Prometheus escribe infinito como "+Inf" y "-Inf", que JavaScript no interpreta.
	if (text === "+Inf" || text === "-Inf") {
		return text === "+Inf" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	}
	const value = Number(text);
	return Number.isNaN(value) ? undefined : value;
}

/**
 * The value of an instant query that returns one series, or undefined when it returns none
 * or when its value is NaN (see `sampleValue`).
 */
export async function scalar(prometheusUrl: string, promQl: string): Promise<number | undefined> {
	const raw = await getJson(`${prometheusUrl}/api/v1/query?query=${encodeURIComponent(promQl)}`);
	const first = vectorSchema.parse(raw).data.result[0];
	return first === undefined ? undefined : sampleValue(first.value[1]);
}

export async function alertState(prometheusUrl: string, alertname: string): Promise<"inactive" | "pending" | "firing"> {
	const raw = await getJson(`${prometheusUrl}/api/v1/alerts`);
	const alert = alertsSchema.parse(raw).data.alerts.find((candidate) => candidate.labels.alertname === alertname);
	return alert?.state ?? "inactive";
}

export async function notifications(receiverUrl: string): Promise<Notification[]> {
	return notificationsSchema.parse(await getJson(`${receiverUrl}/notifications`));
}

export async function waitReady(url: string, timeoutMs: number): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		const ready = await fetch(url).then(
			(response) => response.ok,
			() => false,
		);
		if (ready) {
			return;
		}
		if (Date.now() > deadline) {
			throw new Error(`timed out waiting for ${url}`);
		}
		await Bun.sleep(1000);
	}
}

export interface AlertTimeline {
	pendingAt?: number;
	firingAt?: number;
	notifiedAt?: number;
	resolvedAt?: number;
	resolvedNotifiedAt?: number;
	/** Burn rate of the long window at the moment the alert resolved. */
	longWindowBurnAtResolve?: number;
	peakBurnRate: number;
}

export interface Timeline {
	startedAt: number;
	loadStartedAt?: number;
	loadStoppedAt?: number;
	/**
	 * True when some alert was pending or firing while the watcher's own normal traffic was
	 * the only traffic the shop had received (see `requestsHandled`).
	 */
	alertBeforeLoad: boolean;
	peakRequestsPerSecond: number;
	peakErrorRatio: number;
	peakSlowRatio: number;
	budgetRemainingAtEnd?: number;
	availability: AlertTimeline;
	latency: AlertTimeline;
}

export const ALERTS = {
	availability: { name: "AvailabilityBudgetBurn", burn: "job:slo_availability_burn_rate" },
	latency: { name: "LatencyBudgetBurn", burn: "job:slo_latency_burn_rate" },
} as const;

/** Requests per second above which the watcher says "the load is on". Normal traffic is 5. */
const LOAD_ON_RPS = 40;

/**
 * Total of `/pay` requests the shop has handled, read from the text of its `/metrics` page.
 *
 * EN: This is the counter itself, read now, not a rate computed by Prometheus from scrapes.
 *     The watcher uses it for one exact question: "has any request that is not mine reached
 *     the shop?". The rate of the last 10 seconds cannot answer that in time. An overload
 *     that began a fraction of a second before a scrape already puts enough 503s in that
 *     scrape to make the alert pending, while the 10-second rate still looks normal for one
 *     more scrape or two. Judged by the rate, that alert would seem to come "before the load".
 * PT: Este é o próprio counter, lido agora, e não uma taxa calculada pelo Prometheus a partir
 *     das coletas. O observador o usa para uma pergunta exata: "alguma requisição que não é
 *     minha chegou à loja?". A taxa dos últimos 10 segundos não responde isso a tempo. Uma
 *     sobrecarga que começou uma fração de segundo antes de uma coleta já coloca nela 503
 *     suficientes para deixar o alerta pending, enquanto a taxa de 10 segundos ainda parece
 *     normal por mais uma ou duas coletas. Julgado pela taxa, esse alerta pareceria vir
 *     "antes da carga".
 * ES: Este es el propio counter, leído ahora, y no una tasa calculada por Prometheus a partir
 *     de las recolecciones. El observador lo usa para una pregunta exacta: "¿alguna petición
 *     que no es mía llegó a la tienda?". La tasa de los últimos 10 segundos no responde eso a
 *     tiempo. Una sobrecarga que empezó una fracción de segundo antes de una recolección ya
 *     pone en ella suficientes 503 para dejar la alerta pending, mientras la tasa de 10
 *     segundos todavía parece normal durante una o dos recolecciones más. Juzgada por la
 *     tasa, esa alerta parecería llegar "antes de la carga".
 */
export function requestsHandled(metricsText: string): number {
	const samples = [...metricsText.matchAll(/^http_requests_total\{[^}]*\} (\S+)$/gm)];
	if (samples.length === 0) {
		throw new Error("the shop's /metrics page has no http_requests_total sample");
	}
	return samples.reduce((total, sample) => total + z.coerce.number().int().min(0).parse(sample[1]), 0);
}

/**
 * Watches until both alerts fired and resolved, or until `timeoutMs`.
 *
 * EN: Everything is observed through the same doors a person would use: the Prometheus HTTP
 *     API for the rate and the alert state, and the receiver for what Alertmanager delivered.
 *     One question goes to the shop's own `/metrics` page instead: whether the load had
 *     already reached the shop when an alert became active (see `requestsHandled`).
 * PT: Tudo é observado pelas mesmas portas que uma pessoa usaria: a API HTTP do Prometheus
 *     para a taxa e o estado do alerta, e o receiver para o que o Alertmanager entregou.
 *     Uma pergunta vai para a página `/metrics` da própria loja: se a carga já tinha chegado
 *     à loja quando um alerta ficou ativo (veja `requestsHandled`).
 * ES: Todo se observa por las mismas puertas que usaría una persona: la API HTTP de Prometheus
 *     para la tasa y el estado de la alerta, y el receiver para lo que Alertmanager entregó.
 *     Una pregunta va a la página `/metrics` de la propia tienda: si la carga ya había llegado
 *     a la tienda cuando una alerta quedó activa (ve `requestsHandled`).
 */
export async function watchIncident(env: LabEnv, timeoutMs: number, log: (line: string) => void): Promise<Timeline> {
	const timeline: Timeline = {
		startedAt: Date.now(),
		alertBeforeLoad: false,
		peakRequestsPerSecond: 0,
		peakErrorRatio: 0,
		peakSlowRatio: 0,
		availability: { peakBurnRate: 0 },
		latency: { peakBurnRate: 0 },
	};
	const seconds = (): string => `${((Date.now() - timeline.startedAt) / 1000).toFixed(0).padStart(4)}s`;

	let running = true;
	// EN: Counted BEFORE each request is sent, so it is never smaller than the number of the
	//     watcher's own requests inside the shop's counter. Whatever the counter has above
	//     it came from someone else: k6.
	// PT: Contado ANTES de cada requisição ser enviada, então nunca é menor que o número de
	//     requisições do próprio observador dentro do counter da loja. O que o counter tiver
	//     acima disso veio de outra origem: o k6.
	// ES: Contado ANTES de enviar cada petición, así que nunca es menor que el número de
	//     peticiones del propio observador dentro del counter de la tienda. Lo que el counter
	//     tenga por encima de eso vino de otro origen: k6.
	let ownRequestsSent = 0;
	let loadReachedShop = false;
	const requestsFromTheLoad = async (): Promise<number> => {
		const response = await fetch(`${env.SHOP_URL}/metrics`);
		if (!response.ok) {
			throw new Error(`${env.SHOP_URL}/metrics answered ${response.status}`);
		}
		const handled = requestsHandled(await response.text());
		return Math.max(0, handled - ownRequestsSent);
	};
	const normalUsers = (async (): Promise<void> => {
		while (running) {
			ownRequestsSent += 1;
			await fetch(`${env.SHOP_URL}/pay`).then(
				(response) => response.arrayBuffer(),
				() => undefined,
			);
			await Bun.sleep(170);
		}
	})();

	try {
		const deadline = Date.now() + timeoutMs;
		while (Date.now() < deadline) {
			const now = Date.now();
			const rps = (await scalar(env.PROMETHEUS_URL, "sum(rate(http_requests_total[10s]))")) ?? 0;
			timeline.peakRequestsPerSecond = Math.max(timeline.peakRequestsPerSecond, rps);
			timeline.peakErrorRatio = Math.max(
				timeline.peakErrorRatio,
				(await scalar(env.PROMETHEUS_URL, "job:slo_errors_per_request:ratio_rate1m")) ?? 0,
			);
			timeline.peakSlowRatio = Math.max(
				timeline.peakSlowRatio,
				(await scalar(env.PROMETHEUS_URL, "job:slo_slow_per_request:ratio_rate1m")) ?? 0,
			);

			if (timeline.loadStartedAt === undefined && rps > LOAD_ON_RPS) {
				timeline.loadStartedAt = now;
				log(`${seconds()}  load started (${rps.toFixed(0)} requests per second)`);
			} else if (
				timeline.loadStartedAt !== undefined &&
				timeline.loadStoppedAt === undefined &&
				rps < LOAD_ON_RPS
			) {
				timeline.loadStoppedAt = now;
				log(`${seconds()}  load stopped`);
			}

			const delivered = await notifications(env.RECEIVER_URL);
			for (const key of ["availability", "latency"] as const) {
				const entry = timeline[key];
				const state = await alertState(env.PROMETHEUS_URL, ALERTS[key].name);
				const burn = (await scalar(env.PROMETHEUS_URL, `${ALERTS[key].burn}:ratio_rate1m`)) ?? 0;
				entry.peakBurnRate = Math.max(entry.peakBurnRate, burn);

				// EN: An active alert is "before the load" only if the shop has seen no request
				//     but the watcher's own. The counter is read AFTER the alert state, so it
				//     contains at least the requests the alert was computed from. Once the load
				//     has reached the shop the question is closed.
				// PT: Um alerta ativo é "antes da carga" só se a loja não viu nenhuma requisição
				//     além das do próprio observador. O counter é lido DEPOIS do estado do
				//     alerta, então contém pelo menos as requisições a partir das quais o alerta
				//     foi calculado. Depois que a carga chegou à loja, a pergunta está encerrada.
				// ES: Una alerta activa es "antes de la carga" solo si la tienda no vio ninguna
				//     petición además de las del propio observador. El counter se lee DESPUÉS del
				//     estado de la alerta, así que contiene al menos las peticiones a partir de
				//     las cuales se calculó la alerta. Cuando la carga llegó a la tienda, la
				//     pregunta queda cerrada.
				if (state !== "inactive" && !loadReachedShop) {
					const fromTheLoad = await requestsFromTheLoad();
					if (fromTheLoad > 0) {
						loadReachedShop = true;
						if (timeline.loadStartedAt === undefined) {
							log(
								`${seconds()}  ${ALERTS[key].name} is ${state}: the shop already handled ${fromTheLoad} requests of the load, the 10-second rate has not shown it yet`,
							);
						}
					} else {
						timeline.alertBeforeLoad = true;
					}
				}
				if (state === "pending" && entry.pendingAt === undefined) {
					entry.pendingAt = now;
					log(`${seconds()}  ${ALERTS[key].name}: pending`);
				}
				if (state === "firing" && entry.firingAt === undefined) {
					entry.firingAt = now;
					log(`${seconds()}  ${ALERTS[key].name}: firing (burn rate ${burn.toFixed(1)})`);
				}
				if (state === "inactive" && entry.firingAt !== undefined && entry.resolvedAt === undefined) {
					entry.resolvedAt = now;
					entry.longWindowBurnAtResolve = await scalar(
						env.PROMETHEUS_URL,
						`${ALERTS[key].burn}:ratio_rate5m`,
					);
					log(
						`${seconds()}  ${ALERTS[key].name}: resolved (the 5-minute window still burns at ${(entry.longWindowBurnAtResolve ?? 0).toFixed(1)})`,
					);
				}
				// EN: Only notifications of this watch: the receiver may remember an earlier run.
				// PT: Só as notificações desta observação: o receiver pode lembrar de uma execução anterior.
				// ES: Solo las notificaciones de esta observación: el receiver puede recordar una ejecución anterior.
				const mine = delivered.filter(
					(notification) =>
						notification.alertname === ALERTS[key].name &&
						Date.parse(notification.receivedAt) >= timeline.startedAt,
				);
				if (entry.notifiedAt === undefined && mine.some((notification) => notification.status === "firing")) {
					entry.notifiedAt = now;
					log(`${seconds()}  ${ALERTS[key].name}: the receiver was notified (firing)`);
				}
				if (
					entry.resolvedNotifiedAt === undefined &&
					mine.some((notification) => notification.status === "resolved")
				) {
					entry.resolvedNotifiedAt = now;
					log(`${seconds()}  ${ALERTS[key].name}: the receiver was notified (resolved)`);
				}
			}

			if (
				timeline.availability.resolvedNotifiedAt !== undefined &&
				timeline.latency.resolvedNotifiedAt !== undefined
			) {
				break;
			}
			await Bun.sleep(1000);
		}
		timeline.budgetRemainingAtEnd = await scalar(
			env.PROMETHEUS_URL,
			"job:slo_availability_error_budget_remaining:ratio_1h",
		);
	} finally {
		running = false;
		await normalUsers;
	}
	return timeline;
}

/** Seconds between two moments of the timeline, or undefined when one of them did not happen. */
export function secondsBetween(from: number | undefined, to: number | undefined): number | undefined {
	return from === undefined || to === undefined ? undefined : (to - from) / 1000;
}
