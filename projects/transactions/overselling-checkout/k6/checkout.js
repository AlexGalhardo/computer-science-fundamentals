// EN: Load test: 200 buyers try to buy a product that has 10 units, all at the same time.
//     One run measures one strategy (`STRATEGY`), and writes a small JSON summary that the
//     report step turns into the results table.
// PT: Teste de carga: 200 compradores tentam comprar um produto que tem 10 unidades, todos ao
//     mesmo tempo. Uma execução mede uma estratégia (`STRATEGY`) e grava um resumo JSON pequeno
//     que a etapa de relatório transforma na tabela de resultados.

import { check } from "k6";
import http from "k6/http";
import { Counter, Gauge, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://api:3000";
const STRATEGY = __ENV.STRATEGY || "naive";
const ROUND = __ENV.ROUND || "1";
const BUYERS = Number(__ENV.BUYERS || 200);
const STOCK = Number(__ENV.STOCK || 10);

// EN: A load test is only ever pointed at a service of this lab. The script refuses any host
//     that is not local or a docker-compose service name, before a single request is sent.
// PT: Um teste de carga só é apontado para um serviço deste laboratório. O script recusa qualquer
//     host que não seja local ou um nome de serviço do docker-compose, antes de enviar uma
//     única requisição.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "api"];
const target = /^http:\/\/([a-z0-9.-]+)(:\d+)?$/.exec(BASE_URL);
if (target === null || !LOCAL_HOSTS.includes(target[1])) {
	throw new Error(`refusing to run: BASE_URL "${BASE_URL}" is not a local service (${LOCAL_HOSTS.join(", ")})`);
}

// EN: `per-vu-iterations` with one iteration: 200 virtual users start together and each one
//     makes exactly one purchase attempt. That is the "200 concurrent buyers" of the lesson.
// PT: `per-vu-iterations` com uma iteração: 200 usuários virtuais começam juntos e cada um faz
//     exatamente uma tentativa de compra. São os "200 compradores concorrentes" da lição.
export const options = {
	scenarios: {
		buyers: { executor: "per-vu-iterations", vus: BUYERS, iterations: 1, maxDuration: "60s" },
	},
};

const sold = new Counter("checkout_sold");
const soldOut = new Counter("checkout_sold_out");
const conflict = new Counter("checkout_conflict");
const unexpected = new Counter("checkout_unexpected");
const duration = new Trend("checkout_duration", true);
const windowStart = new Trend("window_start_ms");
const windowEnd = new Trend("window_end_ms");
const finalOrders = new Gauge("final_orders");
const finalStock = new Gauge("final_stock");

const JSON_HEADERS = { headers: { "Content-Type": "application/json" } };

export function setup() {
	const response = http.post(`${BASE_URL}/admin/reset`, JSON.stringify({ stock: STOCK }), JSON_HEADERS);
	if (response.status !== 200) {
		throw new Error(`reset failed with status ${response.status}`);
	}
	return { startedAt: Date.now() };
}

export default function (data) {
	// EN: The throughput window goes from the first request sent to the last response received,
	//     so k6 start-up, setup and teardown stay out of the requests-per-second number.
	// PT: A janela de vazão vai da primeira requisição enviada à última resposta recebida, então
	//     a inicialização do k6, o setup e o teardown ficam fora do número de requisições por segundo.
	windowStart.add(Date.now() - data.startedAt);
	const response = http.post(
		`${BASE_URL}/checkout/${STRATEGY}`,
		JSON.stringify({ buyerId: `fake-buyer-${__VU}` }),
		JSON_HEADERS,
	);
	windowEnd.add(Date.now() - data.startedAt);
	duration.add(response.timings.duration);
	if (response.status === 201) {
		sold.add(1);
	} else if (response.status === 409) {
		soldOut.add(1);
	} else if (response.status === 503) {
		conflict.add(1);
	} else {
		unexpected.add(1);
	}
	check(response, { "answered 201, 409 or 503": (r) => [201, 409, 503].includes(r.status) });
}

export function teardown() {
	const stats = http.get(`${BASE_URL}/stats`).json();
	finalOrders.add(stats.orders);
	finalStock.add(stats.stock);
}

function value(data, metric, field) {
	const found = data.metrics[metric];
	return found === undefined ? 0 : (found.values[field] ?? 0);
}

export function handleSummary(data) {
	const windowMs = value(data, "window_end_ms", "max") - value(data, "window_start_ms", "min");
	const summary = {
		strategy: STRATEGY,
		round: Number(ROUND),
		buyers: BUYERS,
		initialStock: STOCK,
		sold: value(data, "checkout_sold", "count"),
		soldOut: value(data, "checkout_sold_out", "count"),
		conflict: value(data, "checkout_conflict", "count"),
		unexpected: value(data, "checkout_unexpected", "count"),
		finalOrders: value(data, "final_orders", "value"),
		finalStock: value(data, "final_stock", "value"),
		windowMs,
		requestsPerSecond: windowMs > 0 ? (BUYERS * 1000) / windowMs : 0,
		medianMs: value(data, "checkout_duration", "med"),
		p95Ms: value(data, "checkout_duration", "p(95)"),
	};
	const line = `${STRATEGY} round ${ROUND}: ${summary.finalOrders} orders for ${STOCK} units, ${summary.requestsPerSecond.toFixed(0)} req/s, ${summary.soldOut} sold out, ${summary.conflict} gave up\n`;
	return {
		[`/results/${STRATEGY}-${ROUND}.json`]: JSON.stringify(summary, null, "\t"),
		stdout: line,
	};
}
