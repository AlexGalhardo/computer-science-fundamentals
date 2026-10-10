import { z } from "zod";
import { blockSchema } from "./block";
import { DEFAULT_RULES, validateChain } from "./chain";
import { walletFromLabel } from "./keys";
import { peerUrlSchema } from "./server";
import { pay, txOutputSchema, type Utxo } from "./transaction";

// EN: The demo drives three node containers over HTTP and checks every claim it prints. It
//     exits with a non-zero code when one of them does not hold, so it is also the integration
//     test of the network. The node addresses are validated as local addresses and the script
//     refuses to run otherwise.
// PT: A demo conduz três contêineres de nós por HTTP e confere cada afirmação que imprime. Ela
//     termina com código diferente de zero quando alguma não vale, então também é o teste de
//     integração da rede. Os endereços dos nós são validados como endereços locais, e o script
//     se recusa a rodar se não forem.
// ES: La demo conduce tres contenedores de nodos por HTTP y comprueba cada afirmación que
//     imprime. Termina con código distinto de cero cuando alguna no se cumple, así que también
//     es la prueba de integración de la red. Las direcciones de los nodos se validan como
//     direcciones locales, y el script se niega a ejecutarse si no lo son.
const env = z
	.object({
		NODES: z.string().default("http://node-a:3000,http://node-b:3000,http://node-c:3000"),
		DIFFICULTY: z.coerce.number().int().min(0).max(8).default(DEFAULT_RULES.difficulty),
	})
	.parse(process.env);
const nodes = z.tuple([peerUrlSchema, peerUrlSchema, peerUrlSchema]).parse(env.NODES.split(","));
const [nodeA, nodeB, nodeC] = nodes;
const rules = { ...DEFAULT_RULES, difficulty: env.DIFFICULTY };

const statusSchema = z.object({ name: z.string(), height: z.number(), tip: z.string(), mempool: z.array(z.string()) });
const utxoSchema = z.array(txOutputSchema.extend({ outpoint: z.string() }));
const chainSchema = z.array(blockSchema);
const resultSchema = z.object({ status: z.string(), reason: z.string().optional() });

// EN: Toy wallets. The wallet of each miner is derived from the node name, so the demo can spend
//     the coins that node A mines. See the warning in `keys.ts`.
// PT: Carteiras de brinquedo. A carteira de cada minerador é derivada do nome do nó, então a demo
//     consegue gastar as moedas que o nó A minera. Veja o aviso em `keys.ts`.
// ES: Billeteras de juguete. La billetera de cada minero se deriva del nombre del nodo, así que
//     la demo puede gastar las monedas que mina el nodo A. Ve la advertencia en `keys.ts`.
const alice = walletFromLabel("miner-node-a");
const bob = walletFromLabel("bob");
const carol = walletFromLabel("carol");

let step = 0;
function title(text: string): void {
	step++;
	console.log(`\n${step}. ${text}`);
}

function check(condition: boolean, claim: string): void {
	console.log(`   ${condition ? "ok  " : "FAIL"} ${claim}`);
	if (!condition) {
		process.exit(1);
	}
}

async function get<T>(url: string, path: string, schema: z.ZodType<T>): Promise<T> {
	return schema.parse(await (await fetch(`${url}${path}`)).json());
}

async function post(url: string, path: string, body: unknown = {}): Promise<{ code: number; body: unknown }> {
	const response = await fetch(`${url}${path}`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
	return { code: response.status, body: await response.json() };
}

async function utxoOf(url: string): Promise<Utxo> {
	const list = await get(url, "/utxo", utxoSchema);
	return new Map(list.map(({ outpoint, ...output }) => [outpoint, output]));
}

async function balance(url: string, publicKey: string): Promise<number> {
	let total = 0;
	for (const output of (await utxoOf(url)).values()) {
		total += output.publicKey === publicKey ? output.amount : 0;
	}
	return total;
}

async function tips(): Promise<string[]> {
	const all = await Promise.all(nodes.map((url) => get(url, "/status", statusSchema)));
	return all.map((status) => `${status.height}:${status.tip.slice(0, 12)}`);
}

async function connect(group: readonly string[]): Promise<void> {
	for (const url of group) {
		await post(url, "/peers", { peers: group.filter((other) => other !== url) });
	}
}

async function waitForNodes(): Promise<void> {
	for (let attempt = 0; attempt < 50; attempt++) {
		const up = await Promise.all(
			nodes.map((url) =>
				fetch(`${url}/status`)
					.then((response) => response.ok)
					.catch(() => false),
			),
		);
		if (up.every(Boolean)) {
			return;
		}
		await Bun.sleep(200);
	}
	throw new Error("nodes did not start");
}

await waitForNodes();
await connect(nodes);
console.log(`Three nodes, difficulty ${rules.difficulty} (${16 ** rules.difficulty} attempts per block on average).`);

title("Node A mines the first block and the others receive it by gossip");
await post(nodeA, "/mine");
const afterFirst = await tips();
check(new Set(afterFirst).size === 1 && afterFirst[0]?.startsWith("1:") === true, `all nodes at ${afterFirst[0]}`);
check((await balance(nodeC, alice.publicKey)) === 50, "node C sees the 50 new coins of the miner of node A (Alice)");

title("Alice pays 20 to Bob with a fee of 1, sent to node B and mined by node B");
const payment = pay(alice, await utxoOf(nodeB), bob.publicKey, 20, 1);
const sent = resultSchema.parse((await post(nodeB, "/transactions", payment)).body);
check(sent.status === "accepted", "node B accepted the signed transaction");
const poolA = await get(nodeA, "/status", statusSchema);
check(poolA.mempool.includes(payment.id), "node A received it by gossip and holds it as pending");
await post(nodeB, "/mine");
check((await balance(nodeA, bob.publicKey)) === 20, "Bob has 20");
check((await balance(nodeA, alice.publicKey)) === 29, "Alice has 29: 50 - 20 - 1, the rest came back as change");

title("Double spend, attempt 1: Alice signs again the output she already spent");
const replay = pay(
	alice,
	new Map([[`${payment.inputs[0]?.txId}:0`, { amount: 50, publicKey: alice.publicKey }]]),
	carol.publicKey,
	50,
);
const replayed = await post(nodeC, "/transactions", replay);
const replayResult = resultSchema.parse(replayed.body);
check(replayed.code === 409 && replayResult.status === "rejected", `node C rejected it: ${replayResult.reason}`);

title("Double spend, attempt 2: two conflicting payments sent to two different nodes");
const state = await utxoOf(nodeA);
const toBob = pay(alice, state, bob.publicKey, 29);
const toCarol = pay(alice, state, carol.publicKey, 29);
const first = resultSchema.parse((await post(nodeA, "/transactions", toBob)).body);
const second = await post(nodeC, "/transactions", toCarol);
check(first.status === "accepted", "node A accepted the payment to Bob (first seen)");
check(
	second.code === 409,
	`node C, which already heard of it, rejected the payment to Carol: ${resultSchema.parse(second.body).reason}`,
);
await post(nodeC, "/mine");
check((await balance(nodeB, bob.publicKey)) === 49, "Bob has 49 on every node");
check((await balance(nodeB, carol.publicKey)) === 0, "Carol has 0: the second spend never happened");

title("Tampering: change one amount in a copy of the chain and validate it again");
const copy = structuredClone(await get(nodeA, "/chain", chainSchema));
const output = copy[2]?.transactions[1]?.outputs[0];
if (output === undefined) {
	throw new Error("expected a payment in block 2");
}
output.amount = 2000;
const tampered = validateChain(copy, rules);
check(
	!tampered.ok,
	`the chain is invalid at block ${tampered.ok ? "?" : tampered.height}: ${tampered.ok ? "" : tampered.reason}`,
);
check(
	validateChain(await get(nodeA, "/chain", chainSchema), rules).ok,
	"the untouched chain validates from the genesis block",
);

title("Fork: the network is partitioned into {A, B} and {C}, and both sides mine");
await connect([nodeA, nodeB]);
await connect([nodeC]);
const lonely = pay(bob, await utxoOf(nodeC), carol.publicKey, 5);
await post(nodeC, "/transactions", lonely);
await post(nodeC, "/mine");
await post(nodeA, "/mine");
const forked = await tips();
check(
	forked[0] === forked[1] && forked[0] !== forked[2],
	`same height, different blocks: A and B at ${forked[0]}, C at ${forked[2]}`,
);
check((await balance(nodeC, carol.publicKey)) === 5, "on the side of C, Bob paid 5 to Carol (1 confirmation)");
await post(nodeB, "/mine");
check((await tips())[0]?.startsWith("5:") === true, "the side with two nodes mined one more block and is now longer");

title("The partition heals and the fork resolves to the longest chain");
await connect(nodes);
await post(nodeC, "/sync");
const healed = await tips();
check(new Set(healed).size === 1, `all nodes at ${healed[0]}: C abandoned its own block`);
check((await balance(nodeC, carol.publicKey)) === 0, "the payment to Carol lost its confirmation");
const poolC = await get(nodeC, "/status", statusSchema);
check(poolC.mempool.includes(lonely.id), "but it is still valid, so it went back to the pending pool of C");
await post(nodeC, "/mine");
const final = await tips();
check(new Set(final).size === 1 && final[0]?.startsWith("6:") === true, `all nodes at ${final[0]}`);
check((await balance(nodeA, carol.publicKey)) === 5, "Carol has 5 again, now on the chain every node agrees on");

console.log("\ndemo: every check passed");
