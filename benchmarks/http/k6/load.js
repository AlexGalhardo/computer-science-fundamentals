// EN: Load script for the HTTP workload. A fixed number of virtual users (VUs) each send one
//     request, wait for the answer and send the next, for a fixed time. This is a "closed"
//     model: a slow server receives fewer requests, so requests per second and latency are two
//     views of the same thing.
//     Safety rule of the repository: load tests only hit local services. The target comes from
//     the TARGET variable, defaults to localhost, and the script refuses to start otherwise.
// PT: Script de carga da carga HTTP. Um número fixo de usuários virtuais (VUs) envia uma
//     requisição, espera a resposta e envia a próxima, por um tempo fixo. É um modelo
//     "fechado": um servidor lento recebe menos requisições, então requisições por segundo e
//     latência são duas visões da mesma coisa.
//     Regra de segurança do repositório: testes de carga só atingem serviços locais. O alvo vem
//     da variável TARGET, tem localhost como padrão, e o script se recusa a iniciar caso contrário.

import { check } from "k6";
import http from "k6/http";

// EN: The only hosts allowed: the machine itself and the service names of docker-compose.yml.
// PT: Os únicos hosts permitidos: a própria máquina e os nomes de serviço do docker-compose.yml.
const LOCAL_HOSTS = [
	"localhost",
	"127.0.0.1",
	"[::1]",
	"server-cpp",
	"server-rust",
	"server-go",
	"server-java",
	"server-ts",
	"server-elixir",
	"server-python",
];

const target = __ENV.TARGET || "http://localhost:8080";

// EN: Takes the host out of "http://host:port". Anything that does not have exactly this shape
//     (https, a user name before the host, a path) gives null and is refused.
// PT: Tira o host de "http://host:porta". Qualquer coisa que não tenha exatamente esse formato
//     (https, um nome de usuário antes do host, um caminho) dá null e é recusada.
function hostOf(url) {
	const match = /^http:\/\/(\[[0-9a-fA-F:]+\]|[A-Za-z0-9.-]+)(:\d{1,5})?\/?$/.exec(url);
	return match === null ? null : match[1].toLowerCase();
}

const host = hostOf(target);
if (host === null || !LOCAL_HOSTS.includes(host)) {
	// EN: An exception here, before the test starts, makes k6 exit with an error and send nothing.
	// PT: Uma exceção aqui, antes de o teste começar, faz o k6 sair com erro e não enviar nada.
	throw new Error(`refusing to run: "${target}" is not a local target (allowed hosts: ${LOCAL_HOSTS.join(", ")})`);
}

const base = target.replace(/\/$/, "");
const endpoint = __ENV.ENDPOINT || "echo";
const ECHO_BODY = JSON.stringify({
	message: "hello from k6",
	numbers: [1, 2, 3, 5, 8, 13, 21, 34],
	nested: { ok: true, nothing: null, text: "olá" },
});

export const options = {
	scenarios: {
		load: {
			executor: "constant-vus",
			vus: Number(__ENV.VUS || 32),
			duration: __ENV.DURATION || "10s",
		},
	},
	summaryTrendStats: ["avg", "min", "med", "max", "p(50)", "p(95)", "p(99)"],
	discardResponseBodies: true,
};

export default function () {
	const response =
		endpoint === "primes"
			? http.get(`${base}/primes?limit=${__ENV.LIMIT || 5000}`)
			: http.post(`${base}/echo`, ECHO_BODY, { headers: { "Content-Type": "application/json" } });
	check(response, { "status is 200": (r) => r.status === 200 });
}

// EN: Replaces the text report with one JSON line that the collector reads.
// PT: Substitui o relatório de texto por uma linha JSON que o coletor lê.
export function handleSummary(data) {
	const duration = data.metrics.http_req_duration.values;
	const summary = {
		requests: data.metrics.http_reqs.values.count,
		rps: data.metrics.http_reqs.values.rate,
		failedRate: data.metrics.http_req_failed.values.rate,
		p50Ms: duration["p(50)"],
		p95Ms: duration["p(95)"],
		p99Ms: duration["p(99)"],
		meanMs: duration.avg,
		maxMs: duration.max,
	};
	return { stdout: `K6_SUMMARY ${JSON.stringify(summary)}\n` };
}
