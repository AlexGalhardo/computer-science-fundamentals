// EN: End to end, over the docker-compose network: the shop, Prometheus with the committed
//     rules, Alertmanager, the webhook receiver, and k6 as the cause. The test only watches,
//     like a person on call would, and then checks the documented times:
//       the receiver is notified within 60 seconds of the load starting;
//       the alert is resolved within 120 seconds of the load stopping.
// PT: De ponta a ponta, pela rede do docker-compose: a loja, o Prometheus com as regras
//     versionadas, o Alertmanager, o webhook receiver, e o k6 como causa. O teste só observa,
//     como faria uma pessoa de plantão, e depois confere os tempos documentados:
//       o receiver é notificado em até 60 segundos depois de a carga começar;
//       o alerta se resolve em até 120 segundos depois de a carga parar.
// ES: De extremo a extremo, por la red de docker-compose: la tienda, Prometheus con las reglas
//     versionadas, Alertmanager, el webhook receiver, y k6 como causa. La prueba solo observa,
//     como lo haría una persona de guardia, y luego comprueba los tiempos documentados:
//       el receiver es notificado dentro de 60 segundos después de que empieza la carga;
//       la alerta se resuelve dentro de 120 segundos después de que la carga se detiene.

import { beforeAll, describe, expect, test } from "bun:test";
import { AVAILABILITY, LATENCY } from "../src/slo";
import { notifications, readLabEnv, secondsBetween, type Timeline, waitReady, watchIncident } from "../src/watch";

const env = readLabEnv();
const FIRES_WITHIN_S = 60;
const RESOLVES_WITHIN_S = 120;
let timeline: Timeline;

beforeAll(async () => {
	await Promise.all([
		waitReady(`${env.PROMETHEUS_URL}/-/ready`, 120_000),
		waitReady(`${env.ALERTMANAGER_URL}/-/ready`, 120_000),
		waitReady(`${env.SHOP_URL}/health`, 120_000),
	]);
	timeline = await watchIncident(env, 420_000, console.log);
}, 480_000);

describe("before the load", () => {
	test("normal traffic keeps both alerts silent", () => {
		expect(timeline.loadStartedAt).toBeDefined();
		expect(timeline.alertBeforeLoad).toBe(false);
	});
});

describe("the violation caused by k6", () => {
	test("the load breaks both objectives", () => {
		expect(timeline.peakRequestsPerSecond).toBeGreaterThan(40);
		expect(timeline.peakErrorRatio).toBeGreaterThan(1 - AVAILABILITY.objective);
		expect(timeline.peakSlowRatio).toBeGreaterThan(1 - LATENCY.objective);
		expect(timeline.availability.peakBurnRate).toBeGreaterThan(AVAILABILITY.burnRateThreshold);
		expect(timeline.latency.peakBurnRate).toBeGreaterThan(LATENCY.burnRateThreshold);
	});

	test.each(["availability", "latency"] as const)(
		"the %s alert goes pending, then fires, then reaches the receiver in time",
		(key) => {
			const entry = timeline[key];
			expect(entry.pendingAt).toBeDefined();
			expect(entry.firingAt).toBeDefined();
			expect(entry.notifiedAt).toBeDefined();
			expect(entry.pendingAt ?? 0).toBeLessThanOrEqual(entry.firingAt ?? 0);
			expect(
				secondsBetween(timeline.loadStartedAt, entry.notifiedAt) ?? Number.POSITIVE_INFINITY,
			).toBeLessThanOrEqual(FIRES_WITHIN_S);
		},
	);
});

describe("after the load stops", () => {
	test.each(["availability", "latency"] as const)("the %s alert resolves in time and the receiver is told", (key) => {
		const entry = timeline[key];
		expect(timeline.loadStoppedAt).toBeDefined();
		expect(entry.resolvedAt).toBeDefined();
		expect(entry.resolvedNotifiedAt).toBeDefined();
		expect(entry.resolvedAt ?? 0).toBeGreaterThan(timeline.loadStoppedAt ?? Number.POSITIVE_INFINITY);
		expect(
			secondsBetween(timeline.loadStoppedAt, entry.resolvedAt) ?? Number.POSITIVE_INFINITY,
		).toBeLessThanOrEqual(RESOLVES_WITHIN_S);
	});

	test("the short window resolved the alert while the long window was still burning", () => {
		// EN: At the moment of resolution the 5-minute burn rate is still above the threshold.
		//     Only the 1-minute window dropped, and the rule needs both.
		// PT: No momento da resolução o burn rate de 5 minutos ainda está acima do limite. Só
		//     a janela de 1 minuto caiu, e a regra precisa das duas.
		// ES: En el momento de la resolución el burn rate de 5 minutos aún está por encima del umbral. Solo
		//     la ventana de 1 minuto bajó, y la regla necesita las dos.
		expect(timeline.availability.longWindowBurnAtResolve ?? 0).toBeGreaterThan(AVAILABILITY.burnRateThreshold);
	});

	test("the receiver got one firing and one resolved notification per alert, as a page", async () => {
		const delivered = await notifications(env.RECEIVER_URL);
		const recent = delivered.filter((notification) => Date.parse(notification.receivedAt) >= timeline.startedAt);
		for (const alertname of ["AvailabilityBudgetBurn", "LatencyBudgetBurn"]) {
			const mine = recent.filter((notification) => notification.alertname === alertname);
			expect(mine.map((notification) => notification.status)).toEqual(["firing", "resolved"]);
			expect(mine[0]?.severity).toBe("page");
			expect(mine[0]?.summary).toContain("error budget");
		}
	});
});
