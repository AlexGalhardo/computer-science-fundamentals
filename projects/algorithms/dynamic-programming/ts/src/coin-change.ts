import type { Counter } from "./counter";

// EN: Coin change: the fewest coins that add up to an amount, with unlimited coins of each
//     value. It returns -1 when the amount cannot be made. coins(v) is the answer for amount v:
//         coins(0) = 0
//         coins(v) = 1 + min( coins(v - c) )   over every coin c <= v
//     A greedy rule ("largest coin first") is wrong in general: with coins 1, 3 and 4 it pays 6
//     as 4 + 1 + 1, while 3 + 3 uses two coins. The recurrence tries every coin, so it cannot
//     fall into that trap.
// PT: Troco: o menor número de moedas que soma um valor, com moedas ilimitadas de cada tipo.
//     Devolve -1 quando o valor não pode ser formado. coins(v) é a resposta para o valor v:
//         coins(0) = 0
//         coins(v) = 1 + min( coins(v - c) )   sobre toda moeda c <= v
//     Uma regra gulosa ("maior moeda primeiro") está errada no caso geral: com moedas 1, 3 e 4
//     ela paga 6 como 4 + 1 + 1, enquanto 3 + 3 usa duas moedas. A recorrência tenta todas as
//     moedas, então não cai nessa armadilha.
// ES: Cambio de monedas: el menor número de monedas que suma un monto, con monedas ilimitadas de cada tipo.
//     Devuelve -1 cuando el monto no se puede formar. coins(v) es la respuesta para el monto v:
//         coins(0) = 0
//         coins(v) = 1 + min( coins(v - c) )   sobre toda moneda c <= v
//     Una regla voraz ("la moneda más grande primero") es incorrecta en el caso general: con monedas
//     1, 3 y 4 paga 6 como 4 + 1 + 1, mientras que 3 + 3 usa dos monedas. La recurrencia prueba todas
//     las monedas, así que no cae en esa trampa.
const IMPOSSIBLE = Number.POSITIVE_INFINITY;

function finish(result: number): number {
	return result === IMPOSSIBLE ? -1 : result;
}

// EN: Naive: each call branches once per coin, and the amount shrinks slowly, so the same
//     amounts are solved over and over.
// PT: Ingênua: cada chamada se ramifica uma vez por moeda, e o valor encolhe devagar, então os
//     mesmos valores são resolvidos repetidas vezes.
// ES: Ingenua: cada llamada se ramifica una vez por moneda, y el monto se reduce despacio, así que
//     los mismos montos se resuelven una y otra vez.
export function coinChangeNaive(coins: readonly number[], amount: number, counter: Counter): number {
	function fewest(v: number): number {
		counter.calls++;
		if (v === 0) {
			return 0;
		}
		let best = IMPOSSIBLE;
		for (const coin of coins) {
			if (coin <= v) {
				best = Math.min(best, 1 + fewest(v - coin));
			}
		}
		return best;
	}
	return finish(fewest(amount));
}

// EN: Memoised: only `amount + 1` distinct subproblems exist.
// PT: Memoizada: só existem `amount + 1` subproblemas distintos.
// ES: Memoizada: solo existen `amount + 1` subproblemas distintos.
export function coinChangeMemo(coins: readonly number[], amount: number, counter: Counter): number {
	const memo = new Array<number | undefined>(amount + 1);
	function fewest(v: number): number {
		counter.calls++;
		if (v === 0) {
			return 0;
		}
		const cached = memo[v];
		if (cached !== undefined) {
			return cached;
		}
		let best = IMPOSSIBLE;
		for (const coin of coins) {
			if (coin <= v) {
				best = Math.min(best, 1 + fewest(v - coin));
			}
		}
		memo[v] = best;
		return best;
	}
	return finish(fewest(amount));
}

// EN: Tabulated: fill dp[0], dp[1], ... in ascending order. dp[v] only reads smaller amounts,
//     which are already final.
// PT: Tabulada: preenche dp[0], dp[1], ... em ordem crescente. dp[v] só lê valores menores, que
//     já estão prontos.
// ES: Tabulada: llena dp[0], dp[1], ... en orden ascendente. dp[v] solo lee montos menores, que
//     ya están listos.
export function coinChangeTable(coins: readonly number[], amount: number): number[] {
	const dp = new Array<number>(amount + 1).fill(IMPOSSIBLE);
	dp[0] = 0;
	for (let v = 1; v <= amount; v++) {
		for (const coin of coins) {
			if (coin <= v) {
				dp[v] = Math.min(dp[v] as number, (dp[v - coin] as number) + 1);
			}
		}
	}
	return dp;
}

export function coinChangeTab(coins: readonly number[], amount: number): number {
	return finish(coinChangeTable(coins, amount)[amount] as number);
}
