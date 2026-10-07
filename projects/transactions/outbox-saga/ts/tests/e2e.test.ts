import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	crashAfterCommit,
	failedPayment,
	getOrder,
	getPayment,
	happyPath,
	type Lab,
	postOrder,
	waitFor,
	waitHealthy,
} from "../src/scenarios";
import { type Broker, connectBroker } from "../src/shared/broker";
import { loadConfig } from "../src/shared/config";
import { newEvent } from "../src/shared/events";

// EN: End-to-end tests: the two services, their two databases and the broker are real
//     containers, and the tests talk to them from the outside.
// PT: Testes de ponta a ponta: os dois serviços, seus dois bancos e o broker são contêineres de
//     verdade, e os testes falam com eles de fora.
const config = loadConfig();
const lab: Lab = { orderServiceUrl: config.ORDER_SERVICE_URL, paymentServiceUrl: config.PAYMENT_SERVICE_URL };
let broker: Broker;

interface Stats {
	unpublished: number;
	duplicatesSkipped?: number;
}

async function stats(url: string): Promise<Stats> {
	return (await (await fetch(`${url}/stats`)).json()) as Stats;
}

beforeAll(async () => {
	await waitHealthy(lab.orderServiceUrl);
	await waitHealthy(lab.paymentServiceUrl);
	broker = await connectBroker(config.BROKER_URL);
}, 90_000);

afterAll(async () => {
	await broker.close();
});

describe("happy path", () => {
	for (const mode of ["outbox", "dual-write"] as const) {
		test(`${mode}: both databases end up consistent`, async () => {
			const outcome = await happyPath(lab, mode, 12_345);
			expect(outcome.answered).toBe(true);
			expect(outcome.order).toMatchObject({ status: "PAID", amountCents: 12_345, cancelReason: null });
			expect(outcome.payment).toMatchObject({ status: "COMPLETED", amountCents: 12_345 });
			expect(outcome.payment?.orderId).toBe(outcome.order?.id);
		}, 30_000);
	}

	test("after the saga finishes, no event is left unpublished in either outbox", async () => {
		const pending = await waitFor(
			async () =>
				(await stats(lab.orderServiceUrl)).unpublished + (await stats(lab.paymentServiceUrl)).unpublished,
			(total) => total === 0,
			10_000,
		);
		expect(pending).toBe(0);
	}, 20_000);
});

describe("crash injected between the database write and the publish", () => {
	test("dual write: the order is stored and the event is lost", async () => {
		const outcome = await crashAfterCommit(lab, "dual-write");
		expect(outcome.answered).toBe(false);
		// EN: The write survived the crash, the event did not: no payment was ever created and
		//     nothing will ever move this order out of PENDING.
		// PT: A escrita sobreviveu à queda, o evento não: nenhum pagamento foi criado e nada
		//     jamais vai tirar este pedido de PENDING.
		expect(outcome.order?.status).toBe("PENDING");
		expect(outcome.payment).toBeNull();
	}, 90_000);

	test("transactional outbox: the event is published after the restart", async () => {
		const outcome = await crashAfterCommit(lab, "outbox", 20_000);
		expect(outcome.answered).toBe(false);
		expect(outcome.order?.status).toBe("PAID");
		expect(outcome.payment?.status).toBe("COMPLETED");
	}, 90_000);
});

describe("saga with compensation", () => {
	test("a failed payment cancels the order", async () => {
		const outcome = await failedPayment(lab, 99_999);
		expect(outcome.payment).toMatchObject({ status: "FAILED", reason: "amount above the fake card limit" });
		expect(outcome.order).toMatchObject({ status: "CANCELLED", cancelReason: "amount above the fake card limit" });
	}, 30_000);
});

describe("idempotency", () => {
	test("a redelivered event is processed once", async () => {
		const before = (await stats(lab.paymentServiceUrl)).duplicatesSkipped ?? 0;
		const event = newEvent("OrderCreated", crypto.randomUUID(), 2_000);
		// EN: The same event, with the same id, three times: what a broker does after a consumer
		//     crash or a relay that died before marking the row as published.
		// PT: O mesmo evento, com o mesmo id, três vezes: o que um broker faz depois de uma queda
		//     do consumidor ou de um relay que morreu antes de marcar a linha como publicada.
		await broker.publish(event);
		await broker.publish(event);
		await broker.publish(event);
		const skipped = await waitFor(
			async () => (await stats(lab.paymentServiceUrl)).duplicatesSkipped ?? 0,
			(total) => total >= before + 2,
			10_000,
		);
		expect(skipped).toBe(before + 2);
		expect(await getPayment(lab, event.orderId)).toMatchObject({ status: "COMPLETED", amountCents: 2_000 });
	}, 30_000);

	test("a retried request with the same Idempotency-Key does not create a second order", async () => {
		const key = `fake-key-${crypto.randomUUID()}`;
		const first = crypto.randomUUID();
		const request = { customerId: "fake-customer-4", amountCents: 500, mode: "outbox" as const };
		expect(await postOrder(lab, { ...request, orderId: first }, key)).toBe(201);
		// EN: The retry even carries a different order id: the key decides, and the answer is 200
		//     with the order that already exists.
		// PT: A nova tentativa até leva um id de pedido diferente: a chave decide, e a resposta é
		//     200 com o pedido que já existe.
		const second = crypto.randomUUID();
		expect(await postOrder(lab, { ...request, orderId: second }, key)).toBe(200);
		expect(await getOrder(lab, second)).toBeNull();
		const order = await waitFor(
			() => getOrder(lab, first),
			(value) => value?.status === "PAID",
			15_000,
		);
		expect(order?.status).toBe("PAID");
	}, 30_000);
});

describe("input validation", () => {
	test("an order with an invalid amount is rejected", async () => {
		const status = await postOrder(lab, {
			orderId: crypto.randomUUID(),
			customerId: "fake-customer-5",
			amountCents: -1,
			mode: "outbox",
		});
		expect(status).toBe(422);
	});
});
