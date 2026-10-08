// EN: k6 scenario of the benchmark: a fixed number of virtual users send `GET /work` through
//     ONE LOCAL proxy, in a closed loop (each user sends the next request when the previous
//     one was answered). It measures two things: how many requests per second get through,
//     and how long the slowest 1% take (p99).
// PT: Cenário do k6 do benchmark: um número fixo de usuários virtuais manda `GET /work` por UM
//     proxy LOCAL, em laço fechado (cada usuário manda a próxima requisição quando a anterior
//     foi respondida). Ele mede duas coisas: quantas requisições por segundo passam, e quanto
//     demoram as 1% mais lentas (p99).

import { check } from "k6";
import http from "k6/http";
import { requireLocalTarget } from "./target.js";

// EN: This line runs before anything else. With a target that is not local the script throws
//     here, k6 exits with an error and no request is ever sent.
// PT: Esta linha roda antes de qualquer outra coisa. Com um alvo que não é local o script lança
//     um erro aqui, o k6 termina com erro e nenhuma requisição chega a ser enviada.
const TARGET = requireLocalTarget(__ENV.TARGET || "http://localhost:8080");

const NAME = __ENV.NAME || "proxy";
const REPETITION = Number(__ENV.REPETITION || 1);
const VUS = Number(__ENV.VUS || 50);
const DURATION_S = Number(__ENV.DURATION_S || 10);
const RAW_DIR = __ENV.RAW_DIR || "/raw";

export const options = {
	vus: VUS,
	duration: `${DURATION_S}s`,
	discardResponseBodies: true,
	summaryTrendStats: ["med", "p(95)", "p(99)", "max"],
};

export default function () {
	const response = http.get(`${TARGET}/work`);
	check(response, { "status is 200": (r) => r.status === 200 });
}

// EN: The summary is reduced to the few numbers of the report and written as one small JSON
//     file per run. NAME=warmup runs are thrown away: they only open the connections and warm
//     the proxies up.
// PT: O resumo é reduzido aos poucos números do relatório e escrito como um JSON pequeno por
//     execução. As execuções com NAME=warmup são descartadas: elas só abrem as conexões e
//     aquecem os proxies.
export function handleSummary(data) {
	const value = (metric, key) => data.metrics[metric]?.values?.[key] ?? 0;
	const result = {
		name: NAME,
		target: TARGET,
		repetition: REPETITION,
		virtualUsers: VUS,
		durationSeconds: DURATION_S,
		requests: value("http_reqs", "count"),
		requestsPerSecond: value("http_reqs", "rate"),
		failedRate: value("http_req_failed", "rate"),
		p50Ms: value("http_req_duration", "med"),
		p95Ms: value("http_req_duration", "p(95)"),
		p99Ms: value("http_req_duration", "p(99)"),
	};
	const line = `${NAME} run ${REPETITION}: ${result.requestsPerSecond.toFixed(0)} requests/s, p99 ${result.p99Ms.toFixed(2)} ms, failed ${(result.failedRate * 100).toFixed(2)}%\n`;
	if (NAME === "warmup") {
		return { stdout: line };
	}
	return { stdout: line, [`${RAW_DIR}/${NAME}-${REPETITION}.json`]: JSON.stringify(result) };
}
