import { z } from "zod";
import { blockSchema, MAX_DIFFICULTY } from "./block";
import { type ChainRules, DEFAULT_RULES } from "./chain";
import { walletFromLabel } from "./keys";
import { ChainNode } from "./node";
import { transactionSchema } from "./transaction";

// EN: A peer is always a local address: loopback or a docker-compose service name (no dots, so
//     it cannot be an Internet host name or an IP address). This toy network must never talk to
//     anything outside the lab, and the compose network is `internal` as a second barrier.
// PT: Um par é sempre um endereço local: loopback ou um nome de serviço do docker-compose (sem
//     pontos, então não pode ser um nome de host da Internet nem um endereço IP). Esta rede de
//     brinquedo nunca deve falar com nada fora do laboratório, e a rede do compose é `internal`
//     como segunda barreira.
export const peerUrlSchema = z
	.string()
	.regex(/^http:\/\/(127\.0\.0\.1|[a-z0-9-]+):\d{1,5}$/, "peer must be a local URL");

const blockMessageSchema = z.strictObject({ block: blockSchema, from: peerUrlSchema.optional() });
const peersMessageSchema = z.strictObject({ peers: z.array(peerUrlSchema).max(16) });
const chainSchema = z.array(blockSchema).min(1).max(10_000);

export interface NodeServerOptions {
	name: string;
	/** 0 lets the operating system choose a free port (used by the tests). */
	port: number;
	hostname: string;
	peers: string[];
	rules?: ChainRules;
	/** Label of the toy wallet that receives the mining reward. */
	minerLabel?: string;
	/** Address the other nodes use to reach this one. Defaults to loopback and the bound port. */
	selfUrl?: string;
}

export interface NodeServer {
	node: ChainNode;
	url: string;
	stop: () => Promise<void>;
}

function json(body: unknown, status = 200): Response {
	return Response.json(body, { status });
}

async function readBody<T>(request: Request, schema: z.ZodType<T>): Promise<{ data: T } | { error: Response }> {
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return { error: json({ error: "body must be JSON" }, 400) };
	}
	const parsed = schema.safeParse(raw);
	if (!parsed.success) {
		return { error: json({ error: "invalid body", issues: z.prettifyError(parsed.error) }, 400) };
	}
	return { data: parsed.data };
}

export function startNode(options: NodeServerOptions): NodeServer {
	const node = new ChainNode(options.name, options.rules ?? DEFAULT_RULES);
	const miner = walletFromLabel(options.minerLabel ?? `miner-${options.name}`);
	let peers = [...options.peers];
	let selfUrl = options.selfUrl ?? "";

	// EN: Gossip: whatever this node newly accepts, it forwards to its peers. A peer that already
	//     has it answers "known" and does not forward again, which is what ends the flood. A peer
	//     that is down or slow is skipped: broadcasts tolerate lost messages, and a node that
	//     missed a block notices when the next one arrives.
	// PT: Difusão (gossip): tudo o que este nó aceita de novo, ele repassa aos pares. Um par que
	//     já tem responde "known" e não repassa de novo, e é isso que encerra a inundação. Um par
	//     fora do ar ou lento é pulado: a difusão tolera mensagens perdidas, e um nó que perdeu
	//     um bloco percebe quando o seguinte chega.
	async function gossip(path: string, body: unknown): Promise<void> {
		await Promise.allSettled(
			peers.map((peer) =>
				fetch(`${peer}${path}`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body),
					signal: AbortSignal.timeout(5000),
				}),
			),
		);
	}

	// EN: Ask a peer for its whole chain and apply the longest chain rule. The answer is parsed
	//     with the schema and then fully validated by `considerChain`: a peer is never trusted.
	// PT: Pede a um par a cadeia inteira dele e aplica a regra da cadeia mais longa. A resposta
	//     passa pelo schema e depois é validada por inteiro em `considerChain`: nunca se confia
	//     em um par.
	async function syncFrom(peer: string): Promise<boolean> {
		try {
			const response = await fetch(`${peer}/chain`, { signal: AbortSignal.timeout(5000) });
			const parsed = chainSchema.safeParse(await response.json());
			if (!parsed.success) {
				return false;
			}
			const result = node.considerChain(parsed.data);
			if (result.adopted) {
				await gossip("/blocks", { block: node.tip, from: selfUrl });
			}
			return result.adopted;
		} catch {
			return false;
		}
	}

	function status(): Record<string, unknown> {
		return {
			name: node.name,
			height: node.tip.header.height,
			tip: node.tip.hash,
			mempool: node.mempool.map((tx) => tx.id),
			peers,
			miner: miner.publicKey,
		};
	}

	async function route(request: Request): Promise<Response> {
		const { pathname } = new URL(request.url);
		const key = `${request.method} ${pathname}`;
		switch (key) {
			case "GET /status":
				return json(status());
			case "GET /chain":
				return json(node.chain);
			case "GET /utxo":
				return json([...node.utxo].map(([outpoint, output]) => ({ outpoint, ...output })));
			case "POST /transactions": {
				const body = await readBody(request, transactionSchema);
				if ("error" in body) {
					return body.error;
				}
				const result = node.submitTransaction(body.data);
				if (result.status === "accepted") {
					await gossip("/transactions", body.data);
				}
				return json(result, result.status === "rejected" ? 409 : 200);
			}
			case "POST /blocks": {
				const body = await readBody(request, blockMessageSchema);
				if ("error" in body) {
					return body.error;
				}
				const result = node.receiveBlock(body.data.block);
				if (result.status === "added") {
					await gossip("/blocks", { block: body.data.block, from: selfUrl });
				}
				if (result.status === "need-chain" && body.data.from !== undefined) {
					const adopted = await syncFrom(body.data.from);
					return json({ status: adopted ? "chain-adopted" : "chain-refused" });
				}
				return json(result, result.status === "rejected" ? 409 : 200);
			}
			case "POST /mine": {
				const block = node.mine(miner.publicKey);
				await gossip("/blocks", { block, from: selfUrl });
				return json(
					{ height: block.header.height, hash: block.hash, transactions: block.transactions.length },
					201,
				);
			}
			// EN: Used by the demo to cut and restore links, which is how it creates a fork on
			//     purpose.
			// PT: Usado pela demo para cortar e restaurar ligações, que é como ela cria uma
			//     bifurcação de propósito.
			case "POST /peers": {
				const body = await readBody(request, peersMessageSchema);
				if ("error" in body) {
					return body.error;
				}
				peers = body.data.peers;
				return json(status());
			}
			case "POST /sync": {
				for (const peer of peers) {
					await syncFrom(peer);
				}
				return json(status());
			}
			default:
				return json({ error: "not found" }, 404);
		}
	}

	const server = Bun.serve({
		port: options.port,
		hostname: options.hostname,
		maxRequestBodySize: 1024 * 1024,
		fetch: route,
	});
	if (selfUrl === "") {
		selfUrl = `http://127.0.0.1:${server.port}`;
	}
	return { node, url: selfUrl, stop: () => server.stop(true) };
}

// EN: Configuration comes from environment variables, validated like any other external input.
// PT: A configuração vem de variáveis de ambiente, validadas como qualquer outra entrada
//     externa.
const envSchema = z.object({
	NODE_NAME: z
		.string()
		.regex(/^[a-z0-9-]{1,32}$/)
		.default("node"),
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	PEERS: z.string().default(""),
	DIFFICULTY: z.coerce.number().int().min(0).max(MAX_DIFFICULTY).default(DEFAULT_RULES.difficulty),
});

if (import.meta.main) {
	const env = envSchema.parse(process.env);
	const peers = z.array(peerUrlSchema).parse(env.PEERS.split(",").filter((peer) => peer !== ""));
	const started = startNode({
		name: env.NODE_NAME,
		port: env.PORT,
		// EN: Inside its container the node listens on every interface so the other containers
		//     of the internal network reach it. No port is published on the host.
		// PT: Dentro do contêiner o nó escuta em todas as interfaces para que os outros
		//     contêineres da rede interna o alcancem. Nenhuma porta é publicada no host.
		hostname: "0.0.0.0",
		peers,
		rules: { ...DEFAULT_RULES, difficulty: env.DIFFICULTY },
		minerLabel: `miner-${env.NODE_NAME}`,
		selfUrl: `http://${env.NODE_NAME}:${env.PORT}`,
	});
	console.log(`${env.NODE_NAME} listening on ${started.url}, peers: ${peers.join(", ") || "none"}`);
}
