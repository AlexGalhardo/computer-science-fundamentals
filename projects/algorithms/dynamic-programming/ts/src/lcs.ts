import type { Counter } from "./counter";

// EN: Longest common subsequence (LCS): the longest sequence of characters that appears in both
//     strings in the same order, not necessarily side by side. lcs(i, j) is the answer for the
//     suffixes a[i..] and b[j..]:
//         a[i] == b[j]  ->  1 + lcs(i + 1, j + 1)
//         otherwise     ->  max( lcs(i + 1, j), lcs(i, j + 1) )
// PT: Maior subsequência comum (LCS): a maior sequência de caracteres que aparece nas duas
//     strings na mesma ordem, não necessariamente lado a lado. lcs(i, j) é a resposta para os
//     sufixos a[i..] e b[j..]:
//         a[i] == b[j]  ->  1 + lcs(i + 1, j + 1)
//         caso contrário ->  max( lcs(i + 1, j), lcs(i, j + 1) )
// ES: Subsecuencia común más larga (LCS): la secuencia de caracteres más larga que aparece en las dos
//     cadenas en el mismo orden, no necesariamente una al lado de otra. lcs(i, j) es la respuesta para los
//     sufijos a[i..] y b[j..]:
//         a[i] == b[j]  ->  1 + lcs(i + 1, j + 1)
//         en otro caso   ->  max( lcs(i + 1, j), lcs(i, j + 1) )

// EN: Naive: on a mismatch the recursion branches in two, and both branches soon reach the
//     same pair (i + 1, j + 1). With few matches the number of calls grows exponentially.
// PT: Ingênua: quando os caracteres diferem a recursão se divide em duas, e os dois ramos logo
//     chegam ao mesmo par (i + 1, j + 1). Com poucas coincidências o número de chamadas cresce
//     de forma exponencial.
// ES: Ingenua: cuando los caracteres difieren la recursión se divide en dos, y las dos ramas pronto
//     llegan al mismo par (i + 1, j + 1). Con pocas coincidencias el número de llamadas crece
//     de forma exponencial.
export function lcsNaive(a: string, b: string, counter: Counter): number {
	function lcs(i: number, j: number): number {
		counter.calls++;
		if (i === a.length || j === b.length) {
			return 0;
		}
		return a[i] === b[j] ? 1 + lcs(i + 1, j + 1) : Math.max(lcs(i + 1, j), lcs(i, j + 1));
	}
	return lcs(0, 0);
}

// EN: Memoised: only (m + 1) * (n + 1) pairs (i, j) exist, so each one is solved once.
// PT: Memoizada: só existem (m + 1) * (n + 1) pares (i, j), então cada um é resolvido uma vez.
// ES: Memoizada: solo existen (m + 1) * (n + 1) pares (i, j), así que cada uno se resuelve una vez.
export function lcsMemo(a: string, b: string, counter: Counter): number {
	const width = b.length + 1;
	const memo = new Array<number | undefined>((a.length + 1) * width);
	function lcs(i: number, j: number): number {
		counter.calls++;
		if (i === a.length || j === b.length) {
			return 0;
		}
		const key = i * width + j;
		const cached = memo[key];
		if (cached !== undefined) {
			return cached;
		}
		const result = a[i] === b[j] ? 1 + lcs(i + 1, j + 1) : Math.max(lcs(i + 1, j), lcs(i, j + 1));
		memo[key] = result;
		return result;
	}
	return lcs(0, 0);
}

// EN: Tabulated: table[i][j] is the LCS of the first i characters of `a` and the first j of
//     `b`. A match extends the diagonal, a mismatch copies the larger of "above" and "left".
// PT: Tabulada: table[i][j] é a LCS dos i primeiros caracteres de `a` e dos j primeiros de `b`.
//     Uma coincidência estende a diagonal, uma diferença copia o maior entre "acima" e "esquerda".
// ES: Tabulada: table[i][j] es la LCS de los primeros i caracteres de `a` y los primeros j de `b`.
//     Una coincidencia extiende la diagonal, una diferencia copia el mayor entre "arriba" e "izquierda".
export function lcsTable(a: string, b: string): number[][] {
	const table: number[][] = [new Array<number>(b.length + 1).fill(0)];
	for (let i = 1; i <= a.length; i++) {
		const previous = table[i - 1] as number[];
		const row = new Array<number>(b.length + 1).fill(0);
		for (let j = 1; j <= b.length; j++) {
			row[j] =
				a[i - 1] === b[j - 1]
					? (previous[j - 1] as number) + 1
					: Math.max(previous[j] as number, row[j - 1] as number);
		}
		table.push(row);
	}
	return table;
}

export function lcsTab(a: string, b: string): number {
	return lcsTable(a, b).at(-1)?.[b.length] ?? 0;
}
