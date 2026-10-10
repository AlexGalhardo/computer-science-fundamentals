// EN: `bun run ts/src/demo.ts` prints, for one small example of each problem, the table being
//     filled step by step, and then how many calls each recursive version makes. Watching the
//     table grow is the fastest way to see that every cell is computed once, from cells that
//     are already there.
// PT: `bun run ts/src/demo.ts` imprime, para um exemplo pequeno de cada problema, a tabela sendo
//     preenchida passo a passo, e depois quantas chamadas cada versão recursiva faz. Ver a
//     tabela crescer é o jeito mais rápido de enxergar que cada célula é calculada uma vez, a
//     partir de células que já estão lá.
// ES: `bun run ts/src/demo.ts` imprime, para un ejemplo pequeño de cada problema, la tabla llenándose
//     paso a paso, y después cuántas llamadas hace cada versión recursiva. Ver crecer la tabla es la
//     forma más rápida de notar que cada celda se calcula una vez, a partir de celdas que ya están ahí.

import { coinChangeTable } from "./coin-change";
import { newCounter } from "./counter";
import { type Item, knapsackTable } from "./knapsack";
import { lcsTable } from "./lcs";
import { COINS, DOCUMENTED_SIZE, PROBLEMS } from "./problems";

const CELL = 4;

function cell(value: number | string): string {
	return String(value === Number.POSITIVE_INFINITY ? "-" : value).padStart(CELL);
}

function printRow(label: string, values: ReadonlyArray<number | string>): void {
	console.log(`${label.padEnd(16)}${values.map(cell).join("")}`);
}

function demoKnapsack(): void {
	const items: Item[] = [
		{ value: 3, weight: 2 },
		{ value: 4, weight: 3 },
		{ value: 5, weight: 4 },
		{ value: 6, weight: 5 },
	];
	const capacity = 5;
	console.log("== 0-1 knapsack / mochila 0-1 ==");
	console.log("items (value, weight) / itens (valor, peso): (3,2) (4,3) (5,4) (6,5), capacity / capacidade 5");
	printRow("capacity w", [0, 1, 2, 3, 4, 5]);
	knapsackTable(items, capacity).forEach((row, index) => {
		const item = items[index - 1];
		printRow(item === undefined ? "no items" : `+ item (${item.value},${item.weight})`, row);
	});
	console.log("answer / resposta: 7 (items 1 and 2 / itens 1 e 2)\n");
}

function demoLcs(): void {
	const a = "BANANA";
	const b = "ATANA";
	console.log("== longest common subsequence / maior subsequência comum ==");
	console.log(`a = ${a}, b = ${b}`);
	printRow("", ["", ...b]);
	lcsTable(a, b).forEach((row, index) => {
		printRow(index === 0 ? '""' : `+ ${a[index - 1]}`, row);
	});
	console.log("answer / resposta: 4 (AANA)\n");
}

function demoCoins(): void {
	const amount = 6;
	console.log("== coin change / troco ==");
	console.log(`coins / moedas: ${COINS.join(", ")}, amount / valor ${amount}`);
	printRow(
		"amount v",
		Array.from({ length: amount + 1 }, (_, v) => v),
	);
	// EN: One line per step: the table as it is after dp[v] was filled.
	// PT: Uma linha por passo: a tabela como fica depois que dp[v] foi preenchido.
	// ES: Una línea por paso: la tabla tal como queda después de llenar dp[v].
	const final = coinChangeTable(COINS, amount);
	for (let v = 0; v <= amount; v++) {
		printRow(
			`after dp[${v}]`,
			final.map((value, index) => (index <= v ? value : "")),
		);
	}
	console.log("answer / resposta: 2 (3 + 3), greedy / guloso: 3 (4 + 1 + 1)\n");
}

function demoCalls(): void {
	console.log("== calls of the recursive versions / chamadas das versões recursivas ==");
	console.log(
		`${"problem".padEnd(10)}${"n".padStart(4)}${"naive".padStart(12)}${"memo".padStart(8)}${"ratio".padStart(10)}`,
	);
	for (const [name, versions] of Object.entries(PROBLEMS)) {
		const n = DOCUMENTED_SIZE[name] ?? 0;
		const naive = newCounter();
		const memo = newCounter();
		versions.naive(n, naive);
		versions.memo(n, memo);
		const ratio = `${Math.round(naive.calls / memo.calls)}x`;
		console.log(
			`${name.padEnd(10)}${String(n).padStart(4)}${String(naive.calls).padStart(12)}${String(memo.calls).padStart(8)}${ratio.padStart(10)}`,
		);
	}
}

demoKnapsack();
demoLcs();
demoCoins();
demoCalls();
