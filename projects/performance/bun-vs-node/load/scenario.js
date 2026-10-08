// EN: The load scenario: the same k6 script is run against each setup (`bun`, `node`, `node-pm2`),
//     one at a time. It has three phases that never overlap:
//       1. warm-up: a few requests that are NOT measured, so the JIT compiler has already
//          optimised the hot code and the connections are open when the measurement starts;
//       2. cpu: virtual users calling the CPU-bound endpoint in a closed loop;
//       3. io: virtual users calling the I/O-bound endpoint in a closed loop.
//     At the end, `handleSummary` writes a small JSON file that the report step reads.
// PT: O cenário de carga: o mesmo script do k6 roda contra cada configuração (`bun`, `node`,
//     `node-pm2`), uma de cada vez. Ele tem três fases que nunca se sobrepõem:
//       1. aquecimento: algumas requisições que NÃO são medidas, para que o compilador JIT já
//          tenha otimizado o código quente e as conexões estejam abertas quando a medição começa;
//       2. cpu: usuários virtuais chamando o endpoint CPU-bound em laço fechado;
//       3. io: usuários virtuais chamando o endpoint I/O-bound em laço fechado.
//     No fim, o `handleSummary` grava um JSON pequeno que a etapa de relatório lê.

import { check } from "k6";
import http from "k6/http";
import { Counter, Gauge, Trend } from "k6/metrics";
import { requireLocalTarget } from "./target.js";

// EN: Refused before a single request is sent when the host is not local (see target.js).
// PT: Recusado antes de enviar uma única requisição quando o host não é local (veja target.js).
const BASE_URL = requireLocalTarget(__ENV.BASE_URL || "http://bun-server:3000");

function positiveInteger(name, fallback) {
	const value = Number(__ENV[name] || fallback);
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${name} must be a positive integer, got "${__ENV[name]}"`);
	}
	return value;
}

const SETUP = __ENV.SETUP || "bun";
const ROUND = positiveInteger("ROUND", 1);
const WARMUP_S = positiveInteger("WARMUP_S", 3);
const DURATION_S = positiveInteger("DURATION_S", 8);
const CPU_VUS = positiveInteger("CPU_VUS", 32);
const IO_VUS = positiveInteger("IO_VUS", 200);
const CPU_N = positiveInteger("CPU_N", 200000);
const IO_MS = positiveInteger("IO_MS", 20);

// EN: Two seconds of silence between phases, so the tail of one phase never lands in the next.
// PT: Dois segundos de silêncio entre as fases, para que o fim de uma nunca caia na seguinte.
const GAP_S = 2;
const CPU_START_S = WARMUP_S + GAP_S;
const IO_START_S = CPU_START_S + DURATION_S + GAP_S;

// EN: `constant-vus` is a closed model: each virtual user sends a request, waits for the answer
//     and only then sends the next. So the number of requests in flight never passes the number
//     of virtual users, and a slower server simply receives fewer requests per second.
// PT: `constant-vus` é um modelo fechado: cada usuário virtual envia uma requisição, espera a
//     resposta e só então envia a próxima. Assim o número de requisições em andamento nunca passa
//     do número de usuários virtuais, e um servidor mais lento apenas recebe menos requisições por segundo.
export const options = {
	scenarios: {
		warmup: { executor: "constant-vus", exec: "warmup", vus: 8, duration: `${WARMUP_S}s`, gracefulStop: "1s" },
		cpu: {
			executor: "constant-vus",
			exec: "cpu",
			vus: CPU_VUS,
			duration: `${DURATION_S}s`,
			startTime: `${CPU_START_S}s`,
			gracefulStop: "1s",
		},
		io: {
			executor: "constant-vus",
			exec: "io",
			vus: IO_VUS,
			duration: `${DURATION_S}s`,
			startTime: `${IO_START_S}s`,
			gracefulStop: "1s",
		},
	},
	// EN: A check alone never fails a k6 run. This threshold does: a comparison of speed means
	//     nothing if one of the servers was answering errors quickly.
	// PT: Um check sozinho nunca reprova uma execução do k6. Este threshold reprova: uma comparação
	//     de velocidade não significa nada se um dos servidores estava devolvendo erros depressa.
	thresholds: { checks: ["rate>0.999"] },
};

const cpuRequests = new Counter("cpu_requests");
const ioRequests = new Counter("io_requests");
const cpuDuration = new Trend("cpu_duration", true);
const ioDuration = new Trend("io_duration", true);
// EN: Start and end of each request, relative to the start of the test. The throughput window of
//     a phase goes from its first request sent to its last answer received.
// PT: Início e fim de cada requisição, relativos ao início do teste. A janela de vazão de uma fase
//     vai da primeira requisição enviada à última resposta recebida.
const cpuStart = new Trend("cpu_start_ms");
const cpuEnd = new Trend("cpu_end_ms");
const ioStart = new Trend("io_start_ms");
const ioEnd = new Trend("io_end_ms");
const memoryBytes = new Gauge("memory_bytes");

export function setup() {
	const response = http.get(`${BASE_URL}/health`);
	if (response.status !== 200) {
		throw new Error(`health check failed with status ${response.status}`);
	}
	const memory = http.get(`${BASE_URL}/memory`).json();
	return { startedAt: Date.now(), health: response.json(), memorySource: memory.source };
}

export function warmup() {
	http.get(`${BASE_URL}/cpu?n=${CPU_N}`);
	http.get(`${BASE_URL}/io?ms=${IO_MS}`);
}

export function cpu(data) {
	cpuStart.add(Date.now() - data.startedAt);
	const response = http.get(`${BASE_URL}/cpu?n=${CPU_N}`);
	cpuEnd.add(Date.now() - data.startedAt);
	cpuDuration.add(response.timings.duration);
	cpuRequests.add(1);
	check(response, { "cpu answered 200": (r) => r.status === 200 });
}

export function io(data) {
	ioStart.add(Date.now() - data.startedAt);
	const response = http.get(`${BASE_URL}/io?ms=${IO_MS}`);
	ioEnd.add(Date.now() - data.startedAt);
	ioDuration.add(response.timings.duration);
	ioRequests.add(1);
	check(response, { "io answered 200": (r) => r.status === 200 });
}

export function teardown() {
	// EN: Asked once, after the load: the peak memory of the whole container (all its processes).
	// PT: Perguntado uma vez, depois da carga: o pico de memória do contêiner inteiro (todos os processos).
	const memory = http.get(`${BASE_URL}/memory`).json();
	memoryBytes.add(memory.bytes);
}

function value(data, metric, field) {
	const found = data.metrics[metric];
	return found === undefined ? 0 : (found.values[field] ?? 0);
}

function phase(data, name) {
	const requests = value(data, `${name}_requests`, "count");
	const windowMs = value(data, `${name}_end_ms`, "max") - value(data, `${name}_start_ms`, "min");
	return {
		requests,
		windowMs,
		requestsPerSecond: windowMs > 0 ? (requests * 1000) / windowMs : 0,
		medianMs: value(data, `${name}_duration`, "med"),
		p95Ms: value(data, `${name}_duration`, "p(95)"),
	};
}

export function handleSummary(data) {
	const health = data.setup_data.health;
	const summary = {
		setup: SETUP,
		round: ROUND,
		runtime: health.runtime,
		runtimeVersion: health.runtimeVersion,
		cpuVus: CPU_VUS,
		ioVus: IO_VUS,
		cpuN: CPU_N,
		ioMs: IO_MS,
		durationS: DURATION_S,
		checksRate: value(data, "checks", "rate"),
		cpu: phase(data, "cpu"),
		io: phase(data, "io"),
		memoryBytes: value(data, "memory_bytes", "value"),
		memorySource: data.setup_data.memorySource,
	};
	const line = `${SETUP} round ${ROUND}: cpu ${summary.cpu.requestsPerSecond.toFixed(0)} req/s (p95 ${summary.cpu.p95Ms.toFixed(0)} ms), io ${summary.io.requestsPerSecond.toFixed(0)} req/s (p95 ${summary.io.p95Ms.toFixed(0)} ms), memory ${(summary.memoryBytes / 2 ** 20).toFixed(0)} MiB\n`;
	return {
		[`/results/${SETUP}-${ROUND}.json`]: JSON.stringify(summary, null, "\t"),
		stdout: line,
	};
}
