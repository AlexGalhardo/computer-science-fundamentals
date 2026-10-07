import { coinChangeMemo, coinChangeNaive, coinChangeTab } from "./coin-change";
import { type Counter, lehmer } from "./counter";
import { type Item, knapsackMemo, knapsackNaive, knapsackTab } from "./knapsack";
import { lcsMemo, lcsNaive, lcsTab } from "./lcs";

export const COINS = [1, 3, 4] as const;
const ALPHABET = "ACGT";

// EN: Each problem builds its instance from a single size `n` and a seed, so the benchmark, the
//     tests and the Python implementation all solve exactly the same instances.
//       knapsack: n items, weights 1..20, values 1..100, capacity 5n
//       lcs:      two strings of n letters over A, C, G, T
//       coins:    amount n with coins 1, 3 and 4
// PT: Cada problema monta sua instância a partir de um único tamanho `n` e de uma semente, então
//     o benchmark, os testes e a implementação em Python resolvem exatamente as mesmas instâncias.
//       knapsack: n itens, pesos 1..20, valores 1..100, capacidade 5n
//       lcs:      duas strings de n letras sobre A, C, G, T
//       coins:    valor n com moedas 1, 3 e 4
export function knapsackInstance(n: number, seed = 1): { items: Item[]; capacity: number } {
	const next = lehmer(seed * 1000 + n);
	const items = Array.from({ length: n }, () => ({ weight: 1 + (next() % 20), value: 1 + (next() % 100) }));
	return { items, capacity: 5 * n };
}

export function lcsInstance(n: number, seed = 1): { a: string; b: string } {
	const next = lehmer(seed * 1000 + n);
	const word = (): string => Array.from({ length: n }, () => ALPHABET[next() % 4]).join("");
	const a = word();
	return { a, b: word() };
}

export type Version = "naive" | "memo" | "tab";
export const VERSIONS: readonly Version[] = ["naive", "memo", "tab"];

export type Solver = (n: number, counter: Counter, seed?: number) => number;

// EN: One table for the three problems and the three versions. The tabulated versions make no
//     recursive call, so they leave the counter untouched.
// PT: Uma tabela para os três problemas e as três versões. As versões tabuladas não fazem
//     chamada recursiva, então não mexem no contador.
export const PROBLEMS: Readonly<Record<string, Readonly<Record<Version, Solver>>>> = {
	knapsack: {
		naive: (n, counter, seed) => {
			const { items, capacity } = knapsackInstance(n, seed);
			return knapsackNaive(items, capacity, counter);
		},
		memo: (n, counter, seed) => {
			const { items, capacity } = knapsackInstance(n, seed);
			return knapsackMemo(items, capacity, counter);
		},
		tab: (n, _counter, seed) => {
			const { items, capacity } = knapsackInstance(n, seed);
			return knapsackTab(items, capacity);
		},
	},
	lcs: {
		naive: (n, counter, seed) => {
			const { a, b } = lcsInstance(n, seed);
			return lcsNaive(a, b, counter);
		},
		memo: (n, counter, seed) => {
			const { a, b } = lcsInstance(n, seed);
			return lcsMemo(a, b, counter);
		},
		tab: (n, _counter, seed) => {
			const { a, b } = lcsInstance(n, seed);
			return lcsTab(a, b);
		},
	},
	coins: {
		naive: (n, counter) => coinChangeNaive(COINS, n, counter),
		memo: (n, counter) => coinChangeMemo(COINS, n, counter),
		tab: (n) => coinChangeTab(COINS, n),
	},
};

// EN: The input size at which the README and the tests compare call counts. Large enough for
//     the naive version to make at least 100 times more calls, small enough to run in a moment.
// PT: O tamanho de entrada em que o README e os testes comparam o número de chamadas. Grande o
//     bastante para a versão ingênua fazer pelo menos 100 vezes mais chamadas, pequeno o
//     bastante para rodar em um instante.
export const DOCUMENTED_SIZE: Readonly<Record<string, number>> = { knapsack: 20, lcs: 12, coins: 30 };
