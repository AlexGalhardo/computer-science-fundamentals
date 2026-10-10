// EN: Unit tests, with no network and no clock: the metrics text, the behaviour of the shop
//     under load, the arithmetic of the objective, the webhook receiver and the refusal of
//     non-local load targets.
// PT: Testes unitários, sem rede e sem relógio: o texto das métricas, o comportamento da loja
//     sob carga, a aritmética do objetivo, o webhook receiver e a recusa de alvos de carga que
//     não são locais.
// ES: Pruebas unitarias, sin red y sin reloj: el texto de las métricas, el comportamiento de la tienda
//     bajo carga, la aritmética del objetivo, el webhook receiver y el rechazo de objetivos de carga que
//     no son locales.

import { describe, expect, test } from "bun:test";
import { isLocalTarget, requireLocalTarget } from "../../load/target.js";
import { Counter, Histogram, renderAll } from "../src/metrics";
import { createReceiver } from "../src/receiver";
import { createShop, LATENCY_BUCKETS } from "../src/shop";
import {
	AVAILABILITY,
	budgetRemaining,
	budgetSpent,
	burnRate,
	errorBudget,
	hoursToExhaustion,
	LATENCY,
	LATENCY_THRESHOLD_SECONDS,
	shouldAlert,
} from "../src/slo";
import { requestsHandled, sampleValue } from "../src/watch";

describe("exposition format", () => {
	test("a counter starts at zero for every expected series", () => {
		const counter = new Counter("http_requests_total", "Requests handled, by status code.");
		counter.init({ code: "200" });
		counter.init({ code: "503" });
		counter.inc({ code: "200" });
		counter.inc({ code: "200" });
		expect(counter.render()).toBe(
			[
				"# HELP http_requests_total Requests handled, by status code.",
				"# TYPE http_requests_total counter",
				'http_requests_total{code="200"} 2',
				'http_requests_total{code="503"} 0',
			].join("\n"),
		);
	});

	test("label values are escaped", () => {
		const counter = new Counter("demo_total", "Demo.");
		counter.inc({ path: 'a"b\\c\nd' });
		expect(counter.render()).toContain('demo_total{path="a\\"b\\\\c\\nd"} 1');
	});

	test("histogram buckets are cumulative and end with +Inf, sum and count", () => {
		const histogram = new Histogram("latency_seconds", "Latency.", [0.05, 0.1, 0.5]);
		for (const value of [0.01, 0.07, 0.1, 0.3, 2]) {
			histogram.observe(value);
		}
		// EN: 0.01 is under every limit, so it is counted in the three buckets. 0.1 is counted
		//     in le="0.1" because the limit is inclusive ("less than or equal").
		// PT: 0,01 está abaixo de todos os limites, então é contado nos três buckets. 0,1 é
		//     contado em le="0.1" porque o limite é inclusivo ("menor ou igual").
		// ES: 0,01 está por debajo de todos los límites, así que se cuenta en los tres buckets. 0,1 se
		//     cuenta en le="0.1" porque el límite es inclusivo ("menor o igual").
		expect(histogram.render().split("\n").slice(2)).toEqual([
			'latency_seconds_bucket{le="0.05"} 1',
			'latency_seconds_bucket{le="0.1"} 3',
			'latency_seconds_bucket{le="0.5"} 4',
			'latency_seconds_bucket{le="+Inf"} 5',
			"latency_seconds_sum 2.48",
			"latency_seconds_count 5",
		]);
		expect(histogram.bucket(0.1) / histogram.bucket(Number.POSITIVE_INFINITY)).toBe(0.6);
	});

	test("bucket bounds must increase", () => {
		expect(() => new Histogram("x", "x", [0.1, 0.05])).toThrow();
		expect(() => new Histogram("x", "x", [])).toThrow();
	});

	test("the latency objective is a bucket limit of the shop", () => {
		expect(LATENCY_BUCKETS).toContain(LATENCY_THRESHOLD_SECONDS);
	});
});

describe("the shop", () => {
	// EN: A fake sleep that the test finishes by hand, so "in flight" is fully controlled.
	// PT: Um sleep falso que o teste termina à mão, então "em andamento" fica sob controle total.
	// ES: Un sleep falso que la prueba termina a mano, así "en curso" queda bajo control total.
	function controlledShop(capacity: number): {
		shop: ReturnType<typeof createShop>;
		sleeps: { ms: number; finish: () => void }[];
		clock: { now: number };
	} {
		const sleeps: { ms: number; finish: () => void }[] = [];
		const clock = { now: 0 };
		const shop = createShop({
			capacity,
			baseMs: 15,
			perInFlightMs: 20,
			now: () => clock.now,
			sleep: (ms) => new Promise<void>((resolve) => sleeps.push({ ms, finish: resolve })),
		});
		return { shop, sleeps, clock };
	}
	const pay = (shop: ReturnType<typeof createShop>): Promise<Response> => shop.fetch(new Request("http://shop/pay"));

	test("each request in flight makes the next one slower", async () => {
		const { shop, sleeps } = controlledShop(8);
		const pending = [pay(shop), pay(shop), pay(shop)];
		expect(sleeps.map((sleep) => sleep.ms)).toEqual([35, 55, 75]);
		expect(shop.inFlight()).toBe(3);
		for (const sleep of sleeps) {
			sleep.finish();
		}
		expect((await Promise.all(pending)).map((response) => response.status)).toEqual([200, 200, 200]);
		expect(shop.inFlight()).toBe(0);
	});

	test("beyond its capacity it refuses at once with 503", async () => {
		const { shop, sleeps } = controlledShop(2);
		const first = pay(shop);
		const second = pay(shop);
		const third = await pay(shop);
		expect(third.status).toBe(503);
		expect(third.headers.get("retry-after")).toBe("1");
		expect(shop.requests.get({ code: "503" })).toBe(1);
		for (const sleep of sleeps) {
			sleep.finish();
		}
		await Promise.all([first, second]);
		expect(shop.requests.get({ code: "200" })).toBe(2);
		// EN: With room again, the next request is accepted: it reaches the (fake) work.
		// PT: Com espaço de novo, a próxima requisição é aceita: ela chega ao trabalho (falso).
		// ES: Con espacio otra vez, la siguiente petición se acepta: llega al trabajo (falso).
		const next = pay(shop);
		expect(shop.inFlight()).toBe(1);
		sleeps[2]?.finish();
		expect((await next).status).toBe(200);
	});

	test("refused requests are not observed by the latency histogram", async () => {
		const { shop, sleeps, clock } = controlledShop(1);
		const slow = pay(shop);
		await pay(shop);
		await pay(shop);
		clock.now = 180;
		sleeps[0]?.finish();
		await slow;
		expect(shop.requests.get({ code: "503" })).toBe(2);
		expect(shop.duration.bucket(Number.POSITIVE_INFINITY)).toBe(1);
		expect(shop.duration.bucket(0.1)).toBe(0);
		expect(shop.duration.bucket(0.25)).toBe(1);
	});

	test("/metrics is the text Prometheus scrapes", async () => {
		const { shop } = controlledShop(8);
		const response = await shop.fetch(new Request("http://shop/metrics"));
		expect(response.headers.get("content-type")).toBe("text/plain; version=0.0.4; charset=utf-8");
		const body = await response.text();
		expect(body).toContain('http_requests_total{code="503"} 0');
		expect(body).toContain('http_request_duration_seconds_bucket{le="0.1"} 0');
		expect(body.endsWith("\n")).toBe(true);
		expect(body).toBe(renderAll([shop.requests, shop.duration]));
	});
});

describe("the arithmetic of an objective", () => {
	test("error budget is what the objective leaves over", () => {
		expect(errorBudget(0.99)).toBeCloseTo(0.01, 12);
		expect(errorBudget(0.95)).toBeCloseTo(0.05, 12);
		expect(() => errorBudget(1)).toThrow();
	});

	test("burn rate is the bad share divided by the budget", () => {
		expect(burnRate(0.01, AVAILABILITY.objective)).toBeCloseTo(1, 9);
		expect(burnRate(0.144, AVAILABILITY.objective)).toBeCloseTo(14.4, 9);
		expect(burnRate(0.3, LATENCY.objective)).toBeCloseTo(6, 9);
	});

	test("14.4 for one hour spends 2% of a 30-day budget, and lasts 50 hours", () => {
		// EN: Two routes to the same number: 14.4 x 1 h / 720 h = 0.02, and 720 h / 50 h = 14.4.
		// PT: Dois caminhos para o mesmo número: 14,4 x 1 h / 720 h = 0,02, e 720 h / 50 h = 14,4.
		// ES: Dos caminos al mismo número: 14,4 x 1 h / 720 h = 0,02, y 720 h / 50 h = 14,4.
		expect(budgetSpent(14.4, 1)).toBeCloseTo(0.02, 12);
		expect(hoursToExhaustion(14.4)).toBeCloseTo(50, 9);
		expect(hoursToExhaustion(1)).toBe(720);
		expect(hoursToExhaustion(0)).toBe(Number.POSITIVE_INFINITY);
	});

	test("budget remaining can go below zero", () => {
		expect(budgetRemaining(0, 1000, 0.99)).toBe(1);
		expect(budgetRemaining(5, 1000, 0.99)).toBeCloseTo(0.5, 9);
		expect(budgetRemaining(10, 1000, 0.99)).toBeCloseTo(0, 9);
		expect(budgetRemaining(100, 1000, 0.99)).toBeCloseTo(-9, 9);
		expect(budgetRemaining(0, 0, 0.99)).toBe(1);
	});

	test("the alert needs both windows", () => {
		expect(shouldAlert(30, 30, 14.4)).toBe(true);
		// EN: A spike: the short window is high, the long one says little budget went.
		// PT: Um pico: a janela curta está alta, a longa diz que pouco orçamento se foi.
		// ES: Un pico: la ventana corta está alta, la larga dice que se fue poco presupuesto.
		expect(shouldAlert(3, 30, 14.4)).toBe(false);
		// EN: Just after recovery: the long window still remembers, the short one is clean.
		// PT: Logo depois da recuperação: a janela longa ainda lembra, a curta está limpa.
		// ES: Justo después de la recuperación: la ventana larga aún recuerda, la corta está limpia.
		expect(shouldAlert(30, 0, 14.4)).toBe(false);
	});
});

describe("the webhook receiver", () => {
	const webhook = (status: "firing" | "resolved"): Request =>
		new Request("http://receiver/alerts", {
			method: "POST",
			body: JSON.stringify({
				version: "4",
				status,
				alerts: [
					{
						status,
						labels: { alertname: "AvailabilityBudgetBurn", severity: "page", job: "shop" },
						annotations: { summary: "shop is burning its availability error budget 30.8 times too fast" },
						startsAt: "2026-10-07T10:00:00Z",
						endsAt: "0001-01-01T00:00:00Z",
					},
				],
			}),
		});

	test("remembers firing and resolved notifications in order", async () => {
		const receiver = createReceiver(() => new Date("2026-10-07T10:00:05Z"));
		expect((await receiver.fetch(webhook("firing"))).status).toBe(200);
		expect((await receiver.fetch(webhook("resolved"))).status).toBe(200);
		const listed = await receiver.fetch(new Request("http://receiver/notifications"));
		expect(await listed.json()).toEqual([
			{
				receivedAt: "2026-10-07T10:00:05.000Z",
				alertname: "AvailabilityBudgetBurn",
				status: "firing",
				severity: "page",
				summary: "shop is burning its availability error budget 30.8 times too fast",
			},
			{
				receivedAt: "2026-10-07T10:00:05.000Z",
				alertname: "AvailabilityBudgetBurn",
				status: "resolved",
				severity: "page",
				summary: "shop is burning its availability error budget 30.8 times too fast",
			},
		]);
	});

	test("refuses a body that is not an Alertmanager webhook", async () => {
		const receiver = createReceiver();
		const response = await receiver.fetch(new Request("http://receiver/alerts", { method: "POST", body: "{}" }));
		expect(response.status).toBe(400);
		expect(receiver.notifications).toHaveLength(0);
	});
});

describe("load target", () => {
	test("only local hosts are accepted", () => {
		expect(isLocalTarget("http://shop:8080")).toBe(true);
		expect(isLocalTarget("http://localhost:8080/pay")).toBe(true);
		expect(isLocalTarget("http://127.0.0.1")).toBe(true);
		expect(requireLocalTarget("http://shop:8080/")).toBe("http://shop:8080");
	});

	test("anything else is refused, including look-alikes", () => {
		for (const target of [
			"https://example.com",
			"http://shop.example.com",
			"http://localhost@example.com",
			"http://localhost.example.com:8080",
			"shop:8080",
			"",
		]) {
			expect(isLocalTarget(target)).toBe(false);
			expect(() => requireLocalTarget(target)).toThrow("refusing to run");
		}
	});
});

describe("reading a Prometheus sample", () => {
	// EN: With no request in the window, errors / requests is 0 / 0 and Prometheus answers "NaN".
	//     The watcher must read that as "no value": a NaN kept as a number turns every later
	//     peak into NaN, and then no comparison with a threshold is ever true.
	// PT: Sem nenhuma requisição na janela, erros / requisições é 0 / 0 e o Prometheus responde
	//     "NaN". O observador precisa ler isso como "sem valor": um NaN guardado como número
	//     transforma todo pico seguinte em NaN, e aí nenhuma comparação com um limite é verdadeira.
	// ES: Sin ninguna petición en la ventana, errores / peticiones es 0 / 0 y Prometheus responde
	//     "NaN". El observador debe leer eso como "sin valor": un NaN guardado como número
	//     convierte todo pico posterior en NaN, y entonces ninguna comparación con un umbral es verdadera.
	test("NaN (0 requests / 0 requests) is a missing value, not a number", () => {
		expect(sampleValue("NaN")).toBeUndefined();
		expect(sampleValue("0")).toBe(0);
		expect(sampleValue("0.802")).toBe(0.802);
		expect(sampleValue("+Inf")).toBe(Number.POSITIVE_INFINITY);
	});

	test("a peak survives a window with no requests", () => {
		const samples = ["NaN", "0", "0.8", "NaN"];
		const peak = samples.reduce((highest, text) => Math.max(highest, sampleValue(text) ?? 0), 0);
		expect(peak).toBe(0.8);
	});
});

describe("reading the shop's own counter", () => {
	// EN: The watcher subtracts its own requests from this total to know, with no delay,
	//     whether the load has reached the shop. It reads the page a real shop renders.
	// PT: O observador subtrai as próprias requisições deste total para saber, sem atraso, se a
	//     carga chegou à loja. Ele lê a página que uma loja de verdade renderiza.
	// ES: El observador resta sus propias peticiones de este total para saber, sin retraso, si
	//     la carga llegó a la tienda. Lee la página que renderiza una tienda real.
	test("the total adds every status code, and ignores the histogram", async () => {
		const shop = createShop({ capacity: 1, sleep: () => new Promise((resolve) => setTimeout(resolve, 5)) });
		const metrics = async (): Promise<string> => (await shop.fetch(new Request("http://shop/metrics"))).text();
		expect(requestsHandled(await metrics())).toBe(0);

		await Promise.all([shop.fetch(new Request("http://shop/pay")), shop.fetch(new Request("http://shop/pay"))]);
		expect(shop.requests.get({ code: "200" })).toBe(1);
		expect(shop.requests.get({ code: "503" })).toBe(1);
		expect(requestsHandled(await metrics())).toBe(2);
	});

	test("a page with no request counter is an error, not zero", () => {
		expect(() => requestsHandled("# HELP something_else\nsomething_else 3")).toThrow(
			"no http_requests_total sample",
		);
	});
});
