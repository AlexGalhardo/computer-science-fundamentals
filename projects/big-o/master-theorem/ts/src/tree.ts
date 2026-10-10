// EN: The recursion tree of T(n) = a * T(n / b) + f(n). Each call is a node whose value is the
//     work it does outside its recursive calls. Adding the nodes level by level shows where the
//     cost lives, and that is exactly what the three cases of the master theorem describe.
// PT: A árvore de recursão de T(n) = a * T(n / b) + f(n). Cada chamada é um nó cujo valor é o
//     trabalho que ela faz fora das chamadas recursivas. Somar os nós nível a nível mostra onde
//     o custo mora, e é exatamente isso que os três casos do teorema mestre descrevem.
// ES: El árbol de recursión de T(n) = a * T(n / b) + f(n). Cada llamada es un nodo cuyo valor es
//     el trabajo que hace fuera de sus llamadas recursivas. Sumar los nodos nivel por nivel
//     muestra dónde vive el costo, y eso es exactamente lo que describen los tres casos del
//     teorema maestro.

import type { Recurrence } from "./classify";

export interface Level {
	depth: number;
	/** a^depth calls at this depth. */
	nodes: number;
	/** n / b^depth: the input size of each call. */
	size: number;
	/** f(size): the work of one call outside its recursive calls. */
	nodeCost: number;
	/** nodes * nodeCost. */
	levelCost: number;
}

// EN: f(n) = n^d * (log2 n)^k. A subproblem of size 1 or less is a base case and costs 1,
//     whatever the formula says: the recursion stops there and something still has to answer.
// PT: f(n) = n^d * (log2 n)^k. Um subproblema de tamanho 1 ou menos é um caso base e custa 1,
//     diga o que disser a fórmula: a recursão para ali e algo ainda precisa responder.
// ES: f(n) = n^d * (log2 n)^k. Un subproblema de tamaño 1 o menos es un caso base y cuesta 1,
//     diga lo que diga la fórmula: la recursión se detiene ahí y algo todavía tiene que responder.
export function drivingCost(recurrence: Recurrence, size: number): number {
	if (size <= 1) {
		return 1;
	}
	return size ** recurrence.d * Math.log2(size) ** recurrence.k;
}

// EN: Level i has a^i nodes of size n / b^i, so it costs a^i * f(n / b^i). The tree ends when
//     the size reaches 1, after about log_b n levels.
// PT: O nível i tem a^i nós de tamanho n / b^i, então custa a^i * f(n / b^i). A árvore termina
//     quando o tamanho chega a 1, depois de cerca de log_b n níveis.
// ES: El nivel i tiene a^i nodos de tamaño n / b^i, así que cuesta a^i * f(n / b^i). El árbol
//     termina cuando el tamaño llega a 1, después de unos log_b n niveles.
export function recursionTree(recurrence: Recurrence, n: number): Level[] {
	const levels: Level[] = [];
	let size = n;
	let nodes = 1;
	for (let depth = 0; ; depth++) {
		const nodeCost = drivingCost(recurrence, size);
		levels.push({ depth, nodes, size, nodeCost, levelCost: nodes * nodeCost });
		if (size <= 1) {
			return levels;
		}
		size = Math.floor(size / recurrence.b);
		nodes *= recurrence.a;
	}
}

export type Shape = "leaf-heavy" | "balanced" | "root-heavy";

// EN: The shape of the tree is the case of the theorem, seen in numbers: costs that grow
//     towards the leaves (case 1), stay level (case 2) or shrink from the root (case 3).
//     The base level is left out because base cases cost 1 instead of f(1).
// PT: O formato da árvore é o caso do teorema, visto em números: custos que crescem em direção
//     às folhas (caso 1), ficam iguais (caso 2) ou diminuem a partir da raiz (caso 3).
//     O nível base fica de fora porque casos base custam 1 em vez de f(1).
// ES: La forma del árbol es el caso del teorema, visto en números: costos que crecen hacia las
//     hojas (caso 1), se mantienen iguales (caso 2) o disminuyen desde la raíz (caso 3).
//     El nivel base queda fuera porque los casos base cuestan 1 en lugar de f(1).
export function treeShape(levels: Level[]): Shape {
	const inner = levels.slice(0, -1);
	const first = inner[0]?.levelCost ?? 0;
	const last = inner[inner.length - 1]?.levelCost ?? 0;
	if (Math.abs(last - first) <= 1e-9 * Math.max(first, last)) {
		return "balanced";
	}
	return last > first ? "leaf-heavy" : "root-heavy";
}

function formatCost(value: number): string {
	return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toFixed(2);
}

export function renderTree(levels: Level[]): string {
	const total = levels.reduce((sum, level) => sum + level.levelCost, 0);
	const widest = Math.max(...levels.map((level) => level.levelCost));
	const lines = levels.map((level) => {
		const bar = "#".repeat(Math.max(1, Math.round((level.levelCost / widest) * 30)));
		return [
			`depth ${String(level.depth).padStart(2)}`,
			`${formatCost(level.nodes).padStart(12)} node(s)`,
			`size ${formatCost(level.size).padStart(8)}`,
			`level cost ${formatCost(level.levelCost).padStart(14)}`,
			bar,
		].join("  ");
	});
	return [...lines, `total cost ${formatCost(total)}`].join("\n");
}
