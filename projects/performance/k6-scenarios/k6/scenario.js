// EN: One k6 script for the four scenarios. `SCENARIO` (load, stress, spike or soak) picks the
//     profile from profiles.js, and `VARIANT` (before or after) only labels the output file: the
//     script is identical before and after the fix, which is what makes the comparison fair.
// PT: Um único script de k6 para os quatro cenários. `SCENARIO` (load, stress, spike ou soak)
//     escolhe o perfil em profiles.js, e `VARIANT` (before ou after) só rotula o arquivo de saída:
//     o script é idêntico antes e depois da correção, e é isso que torna a comparação justa.

import { check } from "k6";
import http from "k6/http";
import { ERROR_BUDGET, P95_BUDGET_MS, PROFILES, phaseAt, stagesOf } from "./profiles.js";
import { requireLocalTarget } from "./target.js";

// EN: Refused before a single request is sent when the host is not local (see target.js).
// PT: Recusado antes de enviar uma única requisição quando o host não é local (veja target.js).
const BASE_URL = requireLocalTarget(__ENV.BASE_URL || "http://api:3000");

const SCENARIO = __ENV.SCENARIO || "load";
const VARIANT = __ENV.VARIANT || "before";
const profile = PROFILES[SCENARIO];
if (profile === undefined) {
	throw new Error(`SCENARIO must be one of ${Object.keys(PROFILES).join(", ")}, got "${SCENARIO}"`);
}
if (VARIANT !== "before" && VARIANT !== "after") {
	throw new Error(`VARIANT must be "before" or "after", got "${VARIANT}"`);
}

// EN: A threshold is the pass or fail rule of the test: when one is crossed, k6 exits with code
//     99. The first two are the service level the API promises. The ones per phase use the same
//     latency budget on the requests tagged with that phase, and they also make k6 keep separate
//     numbers for each phase, which the report needs (`count>=0` can never fail: it is there only
//     to ask for the count).
// PT: Um threshold é a regra de aprovação do teste: quando um é ultrapassado, o k6 termina com
//     código 99. Os dois primeiros são o nível de serviço que a API promete. Os por fase usam o
//     mesmo orçamento de latência nas requisições marcadas com aquela fase, e também fazem o k6
//     guardar números separados por fase, que o relatório precisa (`count>=0` nunca falha: está
//     ali só para pedir a contagem).
const thresholds = {
	http_req_duration: [`p(95)<${P95_BUDGET_MS}`],
	http_req_failed: [`rate<${ERROR_BUDGET}`],
};
for (const phase of profile.phases) {
	thresholds[`http_req_duration{phase:${phase.name}}`] = [`p(95)<${P95_BUDGET_MS}`];
	thresholds[`http_reqs{phase:${phase.name}}`] = ["count>=0"];
}

// EN: `ramping-arrival-rate` is an OPEN model: k6 starts a fixed number of iterations per second
//     whether or not the earlier ones were answered, like real users who do not know the server
//     is slow. A closed model (`ramping-vus`) would hide the bottleneck: each virtual user waits
//     for its answer, so a slow server automatically receives less load.
//     The price of the open model is virtual users: every request still waiting holds one, so
//     `maxVUs` must cover rate x worst waiting time.
// PT: `ramping-arrival-rate` é um modelo ABERTO: o k6 inicia um número fixo de iterações por
//     segundo, tenham as anteriores sido respondidas ou não, como usuários reais que não sabem que
//     o servidor está lento. Um modelo fechado (`ramping-vus`) esconderia o gargalo: cada usuário
//     virtual espera a sua resposta, então um servidor lento recebe menos carga automaticamente.
//     O preço do modelo aberto são usuários virtuais: toda requisição ainda esperando segura um,
//     então `maxVUs` precisa cobrir taxa x pior tempo de espera.
export const options = {
	summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
	scenarios: {
		[SCENARIO]: {
			executor: "ramping-arrival-rate",
			startRate: profile.startRate,
			timeUnit: "1s",
			preAllocatedVUs: 300,
			maxVUs: 2000,
			stages: stagesOf(profile),
			gracefulStop: "5s",
		},
	},
	thresholds,
};

export function setup() {
	const response = http.get(`${BASE_URL}/stats`);
	if (response.status !== 200) {
		throw new Error(`GET /stats failed with status ${response.status}`);
	}
	const stats = response.json();
	return { startedAt: Date.now(), poolSize: stats.poolSize, queryMs: stats.queryMs, poolWaitMs: stats.poolWaitMs };
}

export default function (data) {
	const phase = phaseAt(profile, (Date.now() - data.startedAt) / 1000);
	const productId = 1 + (__ITER % 100);
	const response = http.get(`${BASE_URL}/products/${productId}`, { tags: { phase }, timeout: "10s" });
	// EN: A check records what happened and never fails the run by itself. The run fails through
	//     the `http_req_failed` threshold, which counts every answer that is not 2xx or 3xx.
	// PT: Um check registra o que aconteceu e nunca reprova a execução sozinho. A execução reprova
	//     pelo threshold de `http_req_failed`, que conta toda resposta que não é 2xx ou 3xx.
	check(response, { "status is 200": (r) => r.status === 200 });
}

function metricValue(data, metric, field) {
	const found = data.metrics[metric];
	return found === undefined ? 0 : (found.values[field] ?? 0);
}

export function handleSummary(data) {
	const results = [];
	for (const [metric, expressions] of Object.entries(thresholds)) {
		for (const expression of expressions) {
			if (expression === "count>=0") {
				continue;
			}
			const outcome = data.metrics[metric]?.thresholds?.[expression];
			results.push({ metric, expression, ok: outcome !== undefined && outcome.ok === true });
		}
	}
	const summary = {
		scenario: SCENARIO,
		variant: VARIANT,
		poolSize: data.setup_data.poolSize,
		queryMs: data.setup_data.queryMs,
		poolWaitMs: data.setup_data.poolWaitMs,
		requests: metricValue(data, "http_reqs", "count"),
		failedRate: metricValue(data, "http_req_failed", "rate"),
		droppedIterations: metricValue(data, "dropped_iterations", "count"),
		medianMs: metricValue(data, "http_req_duration", "med"),
		p95Ms: metricValue(data, "http_req_duration", "p(95)"),
		p99Ms: metricValue(data, "http_req_duration", "p(99)"),
		maxMs: metricValue(data, "http_req_duration", "max"),
		phases: profile.phases.map((phase) => ({
			name: phase.name,
			seconds: phase.seconds,
			targetRate: phase.rate,
			requests: metricValue(data, `http_reqs{phase:${phase.name}}`, "count"),
			medianMs: metricValue(data, `http_req_duration{phase:${phase.name}}`, "med"),
			p95Ms: metricValue(data, `http_req_duration{phase:${phase.name}}`, "p(95)"),
		})),
		thresholds: results,
	};
	const failed = results.filter((result) => !result.ok).length;
	const line = `${SCENARIO} (${VARIANT}, pool ${summary.poolSize}): p95 ${summary.p95Ms.toFixed(0)} ms, ${(summary.failedRate * 100).toFixed(2)}% failed, ${failed} of ${results.length} thresholds crossed\n`;
	return {
		[`/results/${VARIANT}-${SCENARIO}.json`]: JSON.stringify(summary, null, "\t"),
		stdout: line,
	};
}
