// EN: Hit rate and latency experiment. 20 virtual users read and write 200 products for a few
//     seconds, 98% reads and 2% writes. One run measures one strategy (`STRATEGY`) with one time
//     to live (`TTL_MS`). The hit rate comes from the `X-Cache` header of each answer, the
//     latency from k6, and the database counters from the API.
// PT: Experimento de taxa de acerto e latência. 20 usuários virtuais leem e escrevem 200 produtos
//     por alguns segundos, 98% leituras e 2% escritas. Uma execução mede uma estratégia
//     (`STRATEGY`) com um tempo de vida (`TTL_MS`). A taxa de acerto vem do cabeçalho `X-Cache`
//     de cada resposta, a latência do k6, e os contadores do banco vêm da API.
// ES: Experimento de tasa de aciertos y latencia. 20 usuarios virtuales leen y escriben 200
//     productos durante unos segundos, 98% lecturas y 2% escrituras. Una ejecución mide una
//     estrategia (`STRATEGY`) con un tiempo de vida (`TTL_MS`). La tasa de aciertos sale del
//     encabezado `X-Cache` de cada respuesta, la latencia de k6, y los contadores de la base de
//     datos vienen de la API.

import { sleep } from "k6";
import http from "k6/http";
import { Counter, Gauge, Trend } from "k6/metrics";
import { assertLocalTarget, metricValue } from "./guard.js";

const BASE_URL = assertLocalTarget(__ENV.BASE_URL || "http://api:3000");
const STRATEGY = __ENV.STRATEGY || "cache-aside";
const ROUND = __ENV.ROUND || "1";
const TTL_MS = Number(__ENV.TTL_MS || 1000);
const USERS = Number(__ENV.USERS || 20);
const PRODUCTS = Number(__ENV.PRODUCTS || 200);
const QUERY_COST_MS = Number(__ENV.QUERY_COST_MS || 5);
const WRITE_SHARE = Number(__ENV.WRITE_SHARE || 0.02);
const WARMUP_S = Number(__ENV.WARMUP_S || 1);
const DURATION_S = Number(__ENV.DURATION_S || 5);

// EN: Three scenarios in sequence. `warmup` fills the cache and is not measured. `mark` runs
//     once and zeroes the counters of the API. `measure` is the only one that records metrics.
//     Without this, every run would start with an empty cache and the cold misses would be
//     charged to the strategy.
// PT: Três cenários em sequência. `warmup` enche o cache e não é medido. `mark` roda uma vez e
//     zera os contadores da API. `measure` é o único que registra métricas. Sem isso, toda
//     execução começaria com o cache vazio e as falhas a frio entrariam na conta da estratégia.
// ES: Tres escenarios en secuencia. `warmup` llena el caché y no se mide. `mark` se ejecuta una
//     vez y pone en cero los contadores de la API. `measure` es el único que registra métricas.
//     Sin esto, cada ejecución empezaría con el caché vacío y los fallos en frío se cargarían a
//     la cuenta de la estrategia.
export const options = {
	scenarios: {
		warmup: { executor: "constant-vus", vus: USERS, duration: `${WARMUP_S}s`, gracefulStop: "2s", exec: "warmup" },
		mark: {
			executor: "shared-iterations",
			vus: 1,
			iterations: 1,
			startTime: `${WARMUP_S + 2}s`,
			exec: "mark",
		},
		measure: {
			executor: "constant-vus",
			vus: USERS,
			duration: `${DURATION_S}s`,
			startTime: `${WARMUP_S + 3}s`,
			gracefulStop: "5s",
			exec: "measure",
		},
	},
};

const readDuration = new Trend("read_duration", true);
const hitDuration = new Trend("read_hit_duration", true);
const missDuration = new Trend("read_miss_duration", true);
const writeDuration = new Trend("write_duration", true);
const hits = new Counter("cache_hits");
const misses = new Counter("cache_misses");
const unexpected = new Counter("unexpected");
const dbReads = new Gauge("db_reads");
const dbWrites = new Gauge("db_writes");
const dbRowsWritten = new Gauge("db_rows_written");

const JSON_HEADERS = { headers: { "Content-Type": "application/json" } };

// EN: Real traffic is not uniform: a few products get most of the reads. Squaring a uniform
//     random number pushes the choices towards the low ids, so product 1 is read far more
//     often than product 200.
// PT: Tráfego real não é uniforme: poucos produtos recebem a maioria das leituras. Elevar ao
//     quadrado um número aleatório uniforme empurra as escolhas para os ids baixos, então o
//     produto 1 é lido muito mais vezes que o produto 200.
// ES: El tráfico real no es uniforme: pocos productos reciben la mayoría de las lecturas.
//     Elevar al cuadrado un número aleatorio uniforme empuja las elecciones hacia los ids
//     bajos, así que el producto 1 se lee muchas más veces que el producto 200.
function pickProduct() {
	return 1 + Math.floor(Math.random() ** 2 * PRODUCTS);
}

function request(record) {
	const url = `${BASE_URL}/products/${STRATEGY}/${pickProduct()}`;
	if (Math.random() < WRITE_SHARE) {
		const price = 1000 + Math.floor(Math.random() * 9000);
		const response = http.put(url, JSON.stringify({ price }), JSON_HEADERS);
		if (record) {
			writeDuration.add(response.timings.duration);
			unexpected.add(response.status === 200 ? 0 : 1);
		}
	} else {
		const response = http.get(url);
		if (record) {
			const hit = response.headers["X-Cache"] === "hit";
			readDuration.add(response.timings.duration);
			(hit ? hitDuration : missDuration).add(response.timings.duration);
			(hit ? hits : misses).add(1);
			unexpected.add(response.status === 200 ? 0 : 1);
		}
	}
	sleep(0.01);
}

export function setup() {
	const settings = { products: PRODUCTS, ttlMs: TTL_MS, queryCostMs: QUERY_COST_MS };
	const response = http.post(`${BASE_URL}/admin/reset`, JSON.stringify(settings), JSON_HEADERS);
	if (response.status !== 200) {
		throw new Error(`reset failed with status ${response.status}`);
	}
}

export function warmup() {
	request(false);
}

export function mark() {
	const response = http.post(`${BASE_URL}/admin/counters/reset`, null);
	if (response.status !== 200) {
		throw new Error(`counter reset failed with status ${response.status}`);
	}
}

export function measure() {
	request(true);
}

export function teardown() {
	const stats = http.get(`${BASE_URL}/stats`).json();
	dbReads.add(stats.dbReads);
	dbWrites.add(stats.dbWrites);
	dbRowsWritten.add(stats.dbRowsWritten);
}

export function handleSummary(data) {
	const hitCount = metricValue(data, "cache_hits", "count");
	const missCount = metricValue(data, "cache_misses", "count");
	const reads = hitCount + missCount;
	const summary = {
		experiment: "hit-rate",
		strategy: STRATEGY,
		ttlMs: TTL_MS,
		round: Number(ROUND),
		users: USERS,
		products: PRODUCTS,
		durationS: DURATION_S,
		queryCostMs: QUERY_COST_MS,
		writeShare: WRITE_SHARE,
		reads,
		hits: hitCount,
		misses: missCount,
		hitRate: reads > 0 ? hitCount / reads : 0,
		writes: metricValue(data, "write_duration", "count"),
		unexpected: metricValue(data, "unexpected", "count"),
		dbReads: metricValue(data, "db_reads", "value"),
		dbWrites: metricValue(data, "db_writes", "value"),
		dbRowsWritten: metricValue(data, "db_rows_written", "value"),
		readMedianMs: metricValue(data, "read_duration", "med"),
		readP95Ms: metricValue(data, "read_duration", "p(95)"),
		hitMedianMs: metricValue(data, "read_hit_duration", "med"),
		missMedianMs: metricValue(data, "read_miss_duration", "med"),
		writeMedianMs: metricValue(data, "write_duration", "med"),
		writeP95Ms: metricValue(data, "write_duration", "p(95)"),
	};
	const line = `hit-rate ${STRATEGY} ttl ${TTL_MS} ms round ${ROUND}: ${(summary.hitRate * 100).toFixed(1)}% hits, read p95 ${summary.readP95Ms.toFixed(1)} ms, write p95 ${summary.writeP95Ms.toFixed(1)} ms\n`;
	return {
		[`/results/hit-rate-${STRATEGY}-${TTL_MS}-${ROUND}.json`]: JSON.stringify(summary, null, "\t"),
		stdout: line,
	};
}
