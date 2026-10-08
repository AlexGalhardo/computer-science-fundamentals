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

/** The value of an instant query that returns one series, or undefined when it returns none. */
export async function scalar(prometheusUrl: string, promQl: string): Promise<number | undefined> {
	const raw = await getJson(`${prometheusUrl}/api/v1/query?query=${encodeURIComponent(promQl)}`);
	const first = vectorSchema.parse(raw).data.result[0];
	return first === undefined ? undefined : Number(first.value[1]);
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
	/** True when some alert was pending or firing before the load began. */
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
 * Watches until both alerts fired and resolved, or until `timeoutMs`.
 *
 * EN: Everything is observed through the same doors a person would use: the Prometheus HTTP
 *     API for the rate and the alert state, and the receiver for what Alertmanager delivered.
 * PT: Tudo é observado pelas mesmas portas que uma pessoa usaria: a API HTTP do Prometheus
 *     para a taxa e o estado do alerta, e o receiver para o que o Alertmanager entregou.
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
	const normalUsers = (async (): Promise<void> => {
		while (running) {
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

				if (state !== "inactive" && timeline.loadStartedAt === undefined) {
					timeline.alertBeforeLoad = true;
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
