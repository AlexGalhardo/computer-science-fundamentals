// EN: k6 scenario that holds thousands of connections open against ONE LOCAL server and
//     measures two things while they are held: how much memory the server uses, and how fast it
//     still answers new requests. Three scenarios run on one timeline:
//
//       0s ........ RAMP ............................ RAMP + HOLD
//       hold   |-- connections open one batch at a time, each stays open for HOLD seconds --|
//       echo          |-- 50 small POST /echo per second, latency recorded --|
//       probe                   | one GET /stats: requests in flight and memory |
//
// PT: Cenário do k6 que mantém milhares de conexões abertas contra UM servidor LOCAL e mede
//     duas coisas enquanto elas estão abertas: quanta memória o servidor usa e com que rapidez
//     ele ainda responde a requisições novas. Três cenários rodam na mesma linha do tempo:
//     `hold` abre as conexões aos poucos e cada uma fica aberta por HOLD segundos, `echo` manda
//     50 POST /echo pequenos por segundo e registra a latência, e `probe` faz um GET /stats
//     para ler as requisições em andamento e a memória.

import { check, sleep } from "k6";
import exec from "k6/execution";
import http from "k6/http";
import { Counter, Gauge, Rate, Trend } from "k6/metrics";
import { requireLocalTarget } from "./target.js";

// EN: This line runs before anything else. With a target that is not local the script throws
//     here, k6 exits with an error and no connection is ever opened.
// PT: Esta linha roda antes de qualquer outra coisa. Com um alvo que não é local o script lança
//     um erro aqui, o k6 termina com erro e nenhuma conexão chega a ser aberta.
const TARGET = requireLocalTarget(__ENV.TARGET || "http://localhost:8080");

const CONNECTIONS = Number(__ENV.CONNECTIONS || 10000);
const PER_VU = Number(__ENV.PER_VU || 500);
const RAMP_S = Number(__ENV.RAMP_S || 10);
const HOLD_S = Number(__ENV.HOLD_S || 30);
const ECHO_RATE = Number(__ENV.ECHO_RATE || 50);
const ECHO_S = Number(__ENV.ECHO_S || 12);
const NAME = __ENV.NAME || "server";
const VUS = Math.ceil(CONNECTIONS / PER_VU);

const heldOk = new Counter("held_ok");
const holdFailed = new Rate("hold_failed");
const echoLatency = new Trend("echo_latency", true);
const echoFailed = new Rate("echo_failed");
const inFlightAtProbe = new Gauge("in_flight_at_probe");
const rssHoldingKb = new Gauge("rss_holding_kb");

export const options = {
	// EN: A k6 virtual user costs megabytes of memory, so ten thousand of them would need more
	//     memory than the servers under test. Instead, each virtual user opens PER_VU
	//     connections at once with http.batch. These two options lift the default limits of 20
	//     parallel requests per batch and 6 per host.
	// PT: Um usuário virtual do k6 custa megabytes de memória, então dez mil deles precisariam
	//     de mais memória do que os servidores testados. Em vez disso, cada usuário virtual abre
	//     PER_VU conexões de uma vez com http.batch. Estas duas opções tiram os limites padrão
	//     de 20 requisições paralelas por lote e 6 por host.
	batch: PER_VU,
	batchPerHost: PER_VU,
	summaryTrendStats: ["min", "med", "p(50)", "p(95)", "p(99)", "max", "count"],
	scenarios: {
		hold: {
			executor: "per-vu-iterations",
			exec: "hold",
			vus: VUS,
			iterations: 1,
			maxDuration: `${RAMP_S + HOLD_S + 60}s`,
		},
		echo: {
			executor: "constant-arrival-rate",
			exec: "echo",
			startTime: `${RAMP_S + 4}s`,
			duration: `${ECHO_S}s`,
			rate: ECHO_RATE,
			timeUnit: "1s",
			preAllocatedVUs: 20,
			maxVUs: 100,
		},
		probe: {
			executor: "per-vu-iterations",
			exec: "probe",
			startTime: `${RAMP_S + 4 + Math.floor(ECHO_S / 2)}s`,
			vus: 1,
			iterations: 1,
		},
	},
	thresholds: {
		// The run fails when more than 1% of the held connections or of the echoes fail.
		hold_failed: ["rate<0.01"],
		held_ok: [`count>=${Math.floor(CONNECTIONS * 0.99)}`],
		echo_failed: ["rate<0.01"],
	},
};

function stats() {
	const response = http.get(`${TARGET}/stats`);
	if (response.status !== 200) {
		throw new Error(`GET /stats answered ${response.status}`);
	}
	return response.json();
}

// EN: Runs once, before the load. It waits for the server and records its memory at rest,
//     which is the baseline subtracted later.
// PT: Roda uma vez, antes da carga. Espera o servidor e registra a memória dele em repouso,
//     que é a linha de base subtraída depois.
export function setup() {
	for (let attempt = 0; attempt < 60; attempt++) {
		if (http.get(`${TARGET}/health`).status === 200) {
			sleep(2);
			const idle = stats();
			return { runtime: idle.runtime, rssIdleKb: idle.rssKb };
		}
		sleep(1);
	}
	throw new Error(`${TARGET} did not answer /health in 60 seconds`);
}

export function hold() {
	// EN: Virtual users start one after the other during the ramp, so the server receives the
	//     connections as a steady stream and not as one burst that overflows its accept queue.
	// PT: Os usuários virtuais começam um depois do outro durante a rampa, então o servidor
	//     recebe as conexões como um fluxo constante e não como uma rajada que estoura a fila
	//     de accept.
	// EN: Each virtual user runs this function once, so the iteration number of the scenario
	//     (0, 1, 2 ...) says which batch this is. The global id of the virtual user would not:
	//     ids are shared with the other scenarios.
	// PT: Cada usuário virtual roda esta função uma vez, então o número da iteração do cenário
	//     (0, 1, 2 ...) diz qual lote é este. O id global do usuário virtual não serviria: os
	//     ids são compartilhados com os outros cenários.
	const batchIndex = exec.scenario.iterationInTest;
	sleep((batchIndex / VUS) * RAMP_S);
	const count = Math.min(PER_VU, CONNECTIONS - batchIndex * PER_VU);
	const request = ["GET", `${TARGET}/delay?ms=${HOLD_S * 1000}`, null, { timeout: `${HOLD_S + 60}s` }];
	const responses = http.batch(Array.from({ length: count }, () => request));
	for (const response of responses) {
		const ok = response.status === 200;
		holdFailed.add(!ok);
		if (ok) {
			heldOk.add(1);
		}
	}
}

export function echo() {
	const response = http.post(`${TARGET}/echo`, "ping", { headers: { "Content-Type": "text/plain" } });
	const ok = check(response, {
		"echo answered 200 with the same body": (r) => r.status === 200 && r.body === "ping",
	});
	echoFailed.add(!ok);
	if (ok) {
		echoLatency.add(response.timings.duration);
	}
}

export function probe() {
	const current = stats();
	inFlightAtProbe.add(current.inFlight);
	rssHoldingKb.add(current.rssKb);
}

// EN: Builds the small JSON file that the report reads. Memory per connection is the growth of
//     the resident memory of the server divided by the connections that were open at the probe.
// PT: Monta o pequeno arquivo JSON que o relatório lê. Memória por conexão é o crescimento da
//     memória residente do servidor dividido pelas conexões que estavam abertas na sondagem.
export function handleSummary(data) {
	const value = (metric, key) => data.metrics[metric]?.values?.[key] ?? null;
	const inFlight = value("in_flight_at_probe", "value");
	const holding = value("rss_holding_kb", "value");
	const idle = data.setupData?.rssIdleKb ?? data.setup_data?.rssIdleKb ?? null;
	const result = {
		name: NAME,
		target: TARGET,
		runtime: data.setupData?.runtime ?? data.setup_data?.runtime ?? "unknown",
		connectionsAsked: CONNECTIONS,
		connectionsHeld: value("held_ok", "count") ?? 0,
		inFlightAtProbe: inFlight,
		rssIdleKb: idle,
		rssHoldingKb: holding,
		kbPerConnection: inFlight > 0 && idle !== null && holding !== null ? (holding - idle) / inFlight : null,
		holdSeconds: HOLD_S,
		rampSeconds: RAMP_S,
		echo: {
			ratePerSecond: ECHO_RATE,
			count: value("echo_latency", "count"),
			p50Ms: value("echo_latency", "p(50)"),
			p95Ms: value("echo_latency", "p(95)"),
			p99Ms: value("echo_latency", "p(99)"),
			maxMs: value("echo_latency", "max"),
			failedRate: value("echo_failed", "rate"),
		},
		holdFailedRate: value("hold_failed", "rate"),
	};
	const text = `${JSON.stringify(result, null, "\t")}\n`;
	return { stdout: text, [`/results/${NAME}.json`]: text };
}
