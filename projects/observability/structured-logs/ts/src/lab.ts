// EN: The client side of the lab, shared by the demo and the end-to-end test: send the same
//     checkouts to both variants, then ask Loki for the lines of one request.
// PT: O lado cliente do laboratório, compartilhado pela demo e pelo teste de ponta a ponta:
//     mandar os mesmos checkouts para as duas variantes e depois pedir ao Loki as linhas de uma
//     requisição.
// ES: El lado cliente del laboratorio, compartido por la demo y por la prueba de extremo a extremo:
//     enviar los mismos checkouts a las dos variantes y luego pedirle a Loki las líneas de una
//     petición.

import { z } from "zod";
import type { LabEnv } from "./config";
import { CORRELATION_HEADER, isCorrelationId } from "./correlation";

/** Lines each request writes: two in each of the three services. */
export const LINES_PER_REQUEST = 6;

// EN: Alice buys twice on purpose. In the text variant her name is the only thing some lines
//     have in common, and it cannot tell her two requests apart.
// PT: A Alice compra duas vezes de propósito. Na variante em texto o nome dela é a única coisa
//     que algumas linhas têm em comum, e ele não distingue as duas requisições dela.
// ES: Alice compra dos veces a propósito. En la variante en texto su nombre es lo único
//     que algunas líneas tienen en común, y no distingue sus dos peticiones.
export const CHECKOUTS = [
	{ customer: "alice", sku: "blue-pen", qty: 2 },
	{ customer: "alice", sku: "red-pen", qty: 1 },
	{ customer: "bob", sku: "blue-pen", qty: 5 },
	{ customer: "carol", sku: "notebook", qty: 1 },
] as const;

export interface SentRequest {
	correlationId: string;
	orderId: string;
	customer: string;
}

export interface LogLine {
	timestampNs: bigint;
	service: string;
	line: string;
}

// ------------------------------------------------------------------ the three searches

// EN: LogQL reads left to right. `{format="json"}` selects streams by label (the only indexed
//     part), `| json` parses each line into fields, and `correlation_id="..."` keeps the lines
//     whose field has that value. One query, every service, exactly one request.
// PT: O LogQL é lido da esquerda para a direita. `{format="json"}` escolhe streams pelo label (a
//     única parte indexada), `| json` transforma cada linha em campos, e `correlation_id="..."`
//     mantém as linhas cujo campo tem esse valor. Uma consulta, todos os serviços, exatamente
//     uma requisição.
// ES: LogQL se lee de izquierda a derecha. `{format="json"}` elige streams por el label (la
//     única parte indexada), `| json` convierte cada línea en campos, y `correlation_id="..."`
//     conserva las líneas cuyo campo tiene ese valor. Una consulta, todos los servicios, exactamente
//     una petición.
export function jsonQuery(correlationId: string): string {
	if (!isCorrelationId(correlationId)) {
		throw new Error("refusing to build a query from an invalid correlation id");
	}
	return `{format="json"} | json | correlation_id="${correlationId}"`;
}

// EN: The best available on free text: `|=` keeps the lines that contain a substring. It finds
//     only the sentences whose author happened to write that value.
// PT: O melhor disponível em texto livre: `|=` mantém as linhas que contêm um trecho. Ele acha
//     só as frases em que o autor por acaso escreveu aquele valor.
// ES: Lo mejor disponible en texto libre: `|=` conserva las líneas que contienen un fragmento. Solo
//     encuentra las frases en las que el autor por casualidad escribió ese valor.
export function textQuery(substring: string): string {
	if (!/^[a-z0-9-]{2,40}$/.test(substring)) {
		throw new Error("refusing to build a query from an unexpected substring");
	}
	return `{format="text"} |= "${substring}"`;
}

// ------------------------------------------------------------------ Loki HTTP API

const queryRangeSchema = z.object({
	status: z.literal("success"),
	data: z.object({
		result: z.array(
			z.object({
				stream: z.record(z.string(), z.string()),
				values: z.array(z.tuple([z.string().regex(/^\d+$/), z.string()])),
			}),
		),
	}),
});

/** Runs a log query over `[sinceMs, now]` and returns the lines in the order they were written. */
export async function queryLoki(lokiUrl: string, query: string, sinceMs: number): Promise<LogLine[]> {
	const params = new URLSearchParams({
		query,
		start: `${BigInt(sinceMs) * 1_000_000n}`,
		end: `${BigInt(Date.now() + 60_000) * 1_000_000n}`,
		limit: "1000",
		direction: "forward",
	});
	const response = await fetch(`${lokiUrl}/loki/api/v1/query_range?${params}`);
	if (!response.ok) {
		throw new Error(`Loki answered ${response.status}: ${await response.text()}`);
	}
	const parsed = queryRangeSchema.parse(await response.json());
	const lines = parsed.data.result.flatMap((stream) =>
		stream.values.map(([timestamp, line]) => ({
			timestampNs: BigInt(timestamp),
			service: stream.stream.service ?? "unknown",
			line,
		})),
	);
	return lines.sort((a, b) => (a.timestampNs < b.timestampNs ? -1 : a.timestampNs > b.timestampNs ? 1 : 0));
}

async function waitFor(what: string, check: () => Promise<boolean>, timeoutMs = 120_000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (await check().catch(() => false)) {
			return;
		}
		await Bun.sleep(500);
	}
	throw new Error(`timed out waiting for ${what}`);
}

/** The Loki image has no shell for a container health check, so the client polls `/ready`. */
export function waitForLoki(lokiUrl: string): Promise<void> {
	return waitFor("Loki to be ready", async () => (await fetch(`${lokiUrl}/ready`)).ok);
}

// ------------------------------------------------------------------ the scenario

const checkoutResponseSchema = z.object({ orderId: z.string().regex(/^ord-[0-9a-f]{8}$/) });

async function sendAll(apiUrl: string, runId: string, variant: string): Promise<SentRequest[]> {
	// EN: All requests are sent at once, so their lines interleave in the logs, as in production.
	// PT: Todas as requisições são enviadas de uma vez, então as linhas se intercalam nos logs,
	//     como em produção.
	// ES: Todas las peticiones se envían de una vez, así que las líneas se intercalan en los logs,
	//     como en producción.
	return Promise.all(
		CHECKOUTS.map(async (checkout, index) => {
			const correlationId = `req-${variant}-${index + 1}-${runId}`;
			const response = await fetch(`${apiUrl}/checkout`, {
				method: "POST",
				headers: { "content-type": "application/json", [CORRELATION_HEADER]: correlationId },
				body: JSON.stringify(checkout),
			});
			if (response.status !== 201) {
				throw new Error(`checkout failed with ${response.status}`);
			}
			const echoed = response.headers.get(CORRELATION_HEADER);
			if (echoed !== correlationId) {
				throw new Error(`the response carried correlation id ${echoed}, expected ${correlationId}`);
			}
			const { orderId } = checkoutResponseSchema.parse(await response.json());
			return { correlationId, orderId, customer: checkout.customer };
		}),
	);
}

export interface ScenarioResult {
	sinceMs: number;
	json: SentRequest[];
	text: SentRequest[];
}

/** Sends the checkouts to both variants and waits until every line of both reached Loki. */
export async function runScenario(env: LabEnv): Promise<ScenarioResult> {
	await waitForLoki(env.LOKI_URL);
	const sinceMs = Date.now() - 5_000;
	const runId = crypto.randomUUID().slice(0, 8);
	const [json, text] = await Promise.all([
		sendAll(env.API_JSON_URL, runId, "json"),
		sendAll(env.API_TEXT_URL, runId, "text"),
	]);

	// EN: The worker runs after the HTTP response and the shipper sends in batches, so the
	//     lines arrive a little later. Both variants write the same number of lines.
	// PT: O worker roda depois da resposta HTTP e o shipper envia em lotes, então as linhas
	//     chegam um pouco depois. As duas variantes gravam o mesmo número de linhas.
	// ES: El worker corre después de la respuesta HTTP y el shipper envía en lotes, así que las líneas
	//     llegan un poco después. Las dos variantes escriben el mismo número de líneas.
	const expected = CHECKOUTS.length * LINES_PER_REQUEST;
	for (const format of ["json", "text"]) {
		await waitFor(`${expected} ${format} lines in Loki`, async () => {
			const lines = await queryLoki(env.LOKI_URL, `{format="${format}"}`, sinceMs);
			return lines.length >= expected;
		});
	}
	return { sinceMs, json, text };
}
