// EN: The scenarios of the lab, driven from the outside through HTTP only, like a real client.
//     The tests assert on them and the demo prints them. Nothing here touches a database
//     directly: what the scenarios see is what the two services answer.
// PT: Os cenários do laboratório, conduzidos de fora apenas por HTTP, como um cliente de verdade.
//     Os testes fazem asserções sobre eles e a demo os imprime. Nada aqui toca um banco
//     diretamente: o que os cenários enxergam é o que os dois serviços respondem.
// ES: Los escenarios del laboratorio, conducidos desde afuera solo por HTTP, como un cliente de verdad.
//     Las pruebas hacen aserciones sobre ellos y la demo los imprime. Nada aquí toca una base de
//     datos directamente: lo que los escenarios ven es lo que responden los dos servicios.

import type { Mode, Order } from "./orders";
import type { Payment } from "./payments";

export interface Lab {
	orderServiceUrl: string;
	paymentServiceUrl: string;
}

export interface OrderRequest {
	orderId: string;
	customerId: string;
	amountCents: number;
	mode: Mode;
	crashAfterCommit?: boolean;
}

export interface Outcome {
	scenario: string;
	mode: Mode;
	/** False when the connection dropped because the service crashed. */
	answered: boolean;
	order: Order | null;
	payment: Payment | null;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

async function getJson<T>(url: string): Promise<T | null> {
	const response = await fetch(url);
	if (response.status === 404) {
		return null;
	}
	if (!response.ok) {
		throw new Error(`${url} answered ${response.status}`);
	}
	return (await response.json()) as T;
}

export function getOrder(lab: Lab, orderId: string): Promise<Order | null> {
	return getJson<Order>(`${lab.orderServiceUrl}/orders/${orderId}`);
}

export function getPayment(lab: Lab, orderId: string): Promise<Payment | null> {
	return getJson<Payment>(`${lab.paymentServiceUrl}/payments/${orderId}`);
}

// EN: Returns the HTTP status, or null when the connection was lost. A lost connection is the
//     honest view of the client during a crash: it does not know whether the order was stored.
// PT: Devolve o status HTTP, ou null quando a conexão caiu. Uma conexão perdida é a visão honesta
//     do cliente durante uma queda: ele não sabe se o pedido foi gravado.
// ES: Devuelve el estado HTTP, o null cuando la conexión se cayó. Una conexión perdida es la visión
//     honesta del cliente durante una caída: no sabe si el pedido se guardó.
export async function postOrder(lab: Lab, request: OrderRequest, idempotencyKey?: string): Promise<number | null> {
	try {
		const response = await fetch(`${lab.orderServiceUrl}/orders`, {
			method: "POST",
			headers:
				idempotencyKey === undefined ? JSON_HEADERS : { ...JSON_HEADERS, "Idempotency-Key": idempotencyKey },
			body: JSON.stringify(request),
		});
		await response.text();
		return response.status;
	} catch {
		return null;
	}
}

// EN: Asynchronous systems are tested by polling for a condition with a deadline, never by
//     sleeping a fixed time and hoping. Returns the last value seen, matching or not.
// PT: Sistemas assíncronos são testados consultando uma condição até um prazo, nunca dormindo um
//     tempo fixo e torcendo. Devolve o último valor visto, satisfazendo a condição ou não.
// ES: Los sistemas asíncronos se prueban consultando una condición hasta un plazo, nunca durmiendo un
//     tiempo fijo y esperando que salga bien. Devuelve el último valor visto, cumpla o no la condición.
export async function waitFor<T>(read: () => Promise<T>, done: (value: T) => boolean, timeoutMs: number): Promise<T> {
	const deadline = Date.now() + timeoutMs;
	let value = await read();
	while (!done(value) && Date.now() < deadline) {
		await Bun.sleep(100);
		value = await read();
	}
	return value;
}

export async function waitHealthy(url: string, timeoutMs = 60_000): Promise<void> {
	const healthy = await waitFor(
		async () => {
			try {
				return (await fetch(`${url}/health`)).ok;
			} catch {
				return false;
			}
		},
		(ok) => ok,
		timeoutMs,
	);
	if (!healthy) {
		throw new Error(`${url} did not become healthy`);
	}
}

function settled(order: Order | null): boolean {
	return order !== null && order.status !== "PENDING";
}

/** A normal order: the saga should end with the order PAID and the payment COMPLETED. */
export async function happyPath(lab: Lab, mode: Mode, amountCents = 12_345): Promise<Outcome> {
	const orderId = crypto.randomUUID();
	const status = await postOrder(lab, { orderId, customerId: "fake-customer-1", amountCents, mode });
	const order = await waitFor(() => getOrder(lab, orderId), settled, 15_000);
	return { scenario: "happy path", mode, answered: status !== null, order, payment: await getPayment(lab, orderId) };
}

// EN: The crash scenario. The service is killed right after the order is committed. Then the
//     scenario waits for the restart and watches for `observeMs`: with the outbox the event
//     shows up after the restart, with the dual write it never does.
// PT: O cenário de queda. O serviço é morto logo depois de o pedido ser confirmado. Depois o
//     cenário espera o reinício e observa por `observeMs`: com o outbox o evento aparece depois
//     do reinício, com o dual write ele nunca aparece.
// ES: El escenario de caída. El servicio se mata justo después de que se confirma el pedido. Luego el
//     escenario espera el reinicio y observa durante `observeMs`: con el outbox el evento aparece después
//     del reinicio, con el dual write nunca aparece.
export async function crashAfterCommit(lab: Lab, mode: Mode, observeMs = 4_000): Promise<Outcome> {
	const orderId = crypto.randomUUID();
	const status = await postOrder(lab, {
		orderId,
		customerId: "fake-customer-2",
		amountCents: 9_900,
		mode,
		crashAfterCommit: true,
	});
	await waitHealthy(lab.orderServiceUrl);
	const order = await waitFor(() => getOrder(lab, orderId), settled, observeMs);
	return {
		scenario: "crash between the write and the publish",
		mode,
		answered: status !== null,
		order,
		payment: await getPayment(lab, orderId),
	};
}

/** An order above the fake card limit: the payment fails and the saga cancels the order. */
export async function failedPayment(lab: Lab, amountCents = 99_999): Promise<Outcome> {
	const orderId = crypto.randomUUID();
	const status = await postOrder(lab, { orderId, customerId: "fake-customer-3", amountCents, mode: "outbox" });
	const order = await waitFor(() => getOrder(lab, orderId), settled, 15_000);
	return {
		scenario: "payment fails",
		mode: "outbox",
		answered: status !== null,
		order,
		payment: await getPayment(lab, orderId),
	};
}

export function renderOutcomes(outcomes: Outcome[]): string {
	const lines = [
		"| Scenario | Mode | Client got an answer | Order | Payment | Event reached the payment service |",
		"| --- | --- | --- | --- | --- | --- |",
	];
	for (const outcome of outcomes) {
		lines.push(
			`| ${[
				outcome.scenario,
				`\`${outcome.mode}\``,
				outcome.answered ? "yes" : "no (connection lost)",
				outcome.order?.status ?? "missing",
				outcome.payment?.status ?? "none",
				outcome.payment === null ? "**no, lost**" : "yes",
			].join(" | ")} |`,
		);
	}
	return lines.join("\n");
}
