import { afterEach, describe, expect, test } from "bun:test";
import { z } from "zod";
import { blockSchema } from "../src/block";
import { type NodeServer, startNode } from "../src/server";
import { pay } from "../src/transaction";
import { alice, bob, carol, RULES } from "./fixtures";

// EN: Three real HTTP nodes on loopback, inside one test process. The compose demo runs the
//     same code as three separate containers.
// PT: Três nós HTTP de verdade em loopback, dentro de um único processo de teste. A demo do
//     compose roda o mesmo código como três contêineres separados.
// ES: Tres nodos HTTP de verdad en loopback, dentro de un único proceso de prueba. La demo del
//     compose ejecuta el mismo código como tres contenedores separados.
let servers: NodeServer[] = [];

// EN: Each node mines to a different toy wallet: "alice", "bob" or "carol".
// PT: Cada nó minera para uma carteira de brinquedo diferente: "alice", "bob" ou "carol".
// ES: Cada nodo mina para una billetera de juguete distinta: "alice", "bob" o "carol".
function start(minerLabel: string): NodeServer {
	const server = startNode({ name: minerLabel, port: 0, hostname: "127.0.0.1", peers: [], rules: RULES, minerLabel });
	servers.push(server);
	return server;
}

async function post(url: string, path: string, body: unknown = {}): Promise<{ status: number; body: unknown }> {
	const response = await fetch(`${url}${path}`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
	return { status: response.status, body: await response.json() };
}

async function connect(group: NodeServer[]): Promise<void> {
	for (const server of group) {
		const peers = group.filter((other) => other !== server).map((other) => other.url);
		expect((await post(server.url, "/peers", { peers })).status).toBe(200);
	}
}

afterEach(async () => {
	await Promise.all(servers.map((server) => server.stop()));
	servers = [];
});

describe("HTTP node", () => {
	test("input is validated before it reaches the chain", async () => {
		const a = start("alice");
		expect((await post(a.url, "/transactions", "not json")).status).toBe(400);
		expect((await post(a.url, "/transactions", { id: "abc" })).status).toBe(400);
		expect((await post(a.url, "/blocks", { block: { header: {}, hash: "x", transactions: [] } })).status).toBe(400);
		// A peer must be a local address: no Internet host names, no IP addresses.
		expect((await post(a.url, "/peers", { peers: ["http://example.com:80"] })).status).toBe(400);
		expect((await post(a.url, "/peers", { peers: ["https://node-b:3000"] })).status).toBe(400);
		expect((await post(a.url, "/peers", { peers: ["http://10.0.0.7:3000"] })).status).toBe(400);
		expect((await fetch(`${a.url}/nothing`)).status).toBe(404);
		expect(a.node.tip.header.height).toBe(0);
	});

	test("transactions and blocks are gossiped to every connected node", async () => {
		const [a, b, c] = [start("alice"), start("bob"), start("carol")];
		// A line, not a triangle: C only hears about things through B.
		await post(a.url, "/peers", { peers: [b.url] });
		await post(b.url, "/peers", { peers: [a.url, c.url] });
		await post(c.url, "/peers", { peers: [b.url] });

		expect((await post(a.url, "/mine")).status).toBe(201);
		expect(c.node.tip.hash).toBe(a.node.tip.hash);

		const payment = pay(alice, a.node.utxo, bob.publicKey, 20, 1);
		expect((await post(c.url, "/transactions", payment)).body).toEqual({ status: "accepted" });
		expect(a.node.mempool.map((tx) => tx.id)).toEqual([payment.id]);

		// The double spend arrives at another node, which already heard of the first payment.
		const conflicting = pay(alice, a.node.utxo, carol.publicKey, 20, 1);
		const refused = await post(a.url, "/transactions", conflicting);
		expect(refused.status).toBe(409);

		await post(b.url, "/mine");
		for (const server of [a, b, c]) {
			expect(server.node.tip.header.height).toBe(2);
			// Bob received 20 and mined block 2: reward 50 plus the fee of 1.
			expect(server.node.balance(bob.publicKey)).toBe(71);
			expect(server.node.balance(carol.publicKey)).toBe(0);
			expect(server.node.mempool.length).toBe(0);
		}
	});

	test("a partition creates a fork, and reconnecting resolves it to the longest chain", async () => {
		const [a, b, c] = [start("alice"), start("bob"), start("carol")];
		await connect([a, b, c]);
		await post(a.url, "/mine");

		// Partition: {A, B} on one side, {C} alone on the other.
		await connect([a, b]);
		await connect([c]);
		await post(c.url, "/mine");
		await post(a.url, "/mine");
		expect(c.node.tip.header.height).toBe(2);
		expect(a.node.tip.header.height).toBe(2);
		expect(b.node.tip.hash).toBe(a.node.tip.hash);
		const abandoned = c.node.tip.hash;
		expect(abandoned).not.toBe(a.node.tip.hash);
		await post(b.url, "/mine");
		expect(a.node.tip.header.height).toBe(3);

		// Heal the partition. The next block announced by A is ahead of C, so C asks for the chain.
		await connect([a, b, c]);
		await post(a.url, "/mine");
		for (const server of [a, b, c]) {
			expect(server.node.tip.header.height).toBe(4);
			expect(server.node.tip.hash).toBe(a.node.tip.hash);
		}
		expect(c.node.chain.some((block) => block.hash === abandoned)).toBe(false);

		const chain = z.array(blockSchema).parse(await (await fetch(`${c.url}/chain`)).json());
		expect(chain.length).toBe(5);
	});
});
