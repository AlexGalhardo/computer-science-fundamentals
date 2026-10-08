// EN: Stampede experiment: 300 virtual users keep reading ONE hot key whose cached copy lives
//     for 2 seconds and whose query takes 100 ms. One run measures one protection (`MODE`):
//     none, lock or early. The number that matters is counted by the API, not by k6: how many
//     database queries each expiry caused.
// PT: Experimento do estouro da manada: 300 usuários virtuais leem sem parar UMA chave quente
//     cuja cópia em cache vive 2 segundos e cuja consulta leva 100 ms. Uma execução mede uma
//     proteção (`MODE`): none, lock ou early. O número que importa é contado pela API, não pelo
//     k6: quantas consultas ao banco cada expiração causou.

import { check, sleep } from "k6";
import http from "k6/http";
import { Counter, Gauge, Trend } from "k6/metrics";
import { assertLocalTarget, metricValue } from "./guard.js";

const BASE_URL = assertLocalTarget(__ENV.BASE_URL || "http://api:3000");
const MODE = __ENV.MODE || "none";
const ROUND = __ENV.ROUND || "1";
const USERS = Number(__ENV.USERS || 300);
const DURATION_S = Number(__ENV.DURATION_S || 9);
const TTL_MS = Number(__ENV.TTL_MS || 2000);
const SLOW_QUERY_MS = Number(__ENV.SLOW_QUERY_MS || 100);
const EARLY_REFRESH_MS = Number(__ENV.EARLY_REFRESH_MS || 600);

export const options = {
	scenarios: {
		readers: { executor: "constant-vus", vus: USERS, duration: `${DURATION_S}s`, gracefulStop: "20s" },
	},
};

const duration = new Trend("hot_duration", true);
const unexpected = new Counter("hot_unexpected");
const expiries = new Gauge("stampede_expiries");
const queries = new Gauge("stampede_queries");
const burstMin = new Gauge("stampede_burst_min");
const burstMedian = new Gauge("stampede_burst_median");
const burstMax = new Gauge("stampede_burst_max");

const JSON_HEADERS = { headers: { "Content-Type": "application/json" } };

export function setup() {
	const settings = { ttlMs: TTL_MS, slowQueryMs: SLOW_QUERY_MS, earlyRefreshMs: EARLY_REFRESH_MS };
	const response = http.post(`${BASE_URL}/admin/reset`, JSON.stringify(settings), JSON_HEADERS);
	if (response.status !== 200) {
		throw new Error(`reset failed with status ${response.status}`);
	}
}

// EN: There is no warm-up on purpose. The cold start is the first stampede of the run: 300
//     users find the cache empty at the same instant.
// PT: Não há aquecimento de propósito. A partida a frio é o primeiro estouro da execução: 300
//     usuários encontram o cache vazio no mesmo instante.
export default function () {
	const response = http.get(`${BASE_URL}/hot/${MODE}`);
	duration.add(response.timings.duration);
	if (response.status !== 200) {
		unexpected.add(1);
	}
	check(response, { "answered 200": (r) => r.status === 200 });
	// EN: A pause between reads keeps the machine usable. With 300 users it is still about
	//     3000 requests per second, far more than enough to pile up during a 100 ms query.
	// PT: Uma pausa entre as leituras mantém a máquina utilizável. Com 300 usuários ainda são
	//     cerca de 3000 requisições por segundo, muito mais que o bastante para empilhar durante
	//     uma consulta de 100 ms.
	sleep(0.1);
}

export function teardown() {
	const stats = http.get(`${BASE_URL}/stats`).json().stampede;
	const bursts = stats.bursts.slice().sort((a, b) => a - b);
	expiries.add(stats.expiries);
	queries.add(stats.queries);
	burstMin.add(bursts.length === 0 ? 0 : bursts[0]);
	burstMedian.add(bursts.length === 0 ? 0 : bursts[Math.floor((bursts.length - 1) / 2)]);
	burstMax.add(bursts.length === 0 ? 0 : bursts[bursts.length - 1]);
}

export function handleSummary(data) {
	const summary = {
		experiment: "stampede",
		mode: MODE,
		round: Number(ROUND),
		users: USERS,
		durationS: DURATION_S,
		ttlMs: TTL_MS,
		slowQueryMs: SLOW_QUERY_MS,
		requests: metricValue(data, "hot_duration", "count"),
		unexpected: metricValue(data, "hot_unexpected", "count"),
		expiries: metricValue(data, "stampede_expiries", "value"),
		queries: metricValue(data, "stampede_queries", "value"),
		burstMin: metricValue(data, "stampede_burst_min", "value"),
		burstMedian: metricValue(data, "stampede_burst_median", "value"),
		burstMax: metricValue(data, "stampede_burst_max", "value"),
		medianMs: metricValue(data, "hot_duration", "med"),
		p95Ms: metricValue(data, "hot_duration", "p(95)"),
		maxMs: metricValue(data, "hot_duration", "max"),
	};
	const line = `stampede ${MODE} round ${ROUND}: ${summary.queries} database queries in ${summary.expiries} expiries (largest ${summary.burstMax}), p95 ${summary.p95Ms.toFixed(0)} ms\n`;
	return {
		[`/results/stampede-${MODE}-${ROUND}.json`]: JSON.stringify(summary, null, "\t"),
		stdout: line,
	};
}
