// EN: The decision tree of a comparison sort. Every run of the algorithm is a path: each
//     comparison is a node, each answer is a branch, and the final order is a leaf. The whole
//     lower bound follows from two facts about this tree: it needs at least n! leaves (one per
//     possible input order), and a binary tree of height h has at most 2^h leaves.
// PT: A árvore de decisão de uma ordenação por comparação. Cada execução do algoritmo é um
//     caminho: cada comparação é um nó, cada resposta é um ramo, e a ordem final é uma folha.
//     O limite inferior inteiro sai de dois fatos sobre essa árvore: ela precisa de pelo menos
//     n! folhas (uma por ordem de entrada possível), e uma árvore binária de altura h tem no
//     máximo 2^h folhas.

import type { ComparisonSort } from "./sorts";

export type DecisionTree =
	| { kind: "leaf"; order: number[] }
	| { kind: "compare"; left: number; right: number; yes: DecisionTree | null; no: DecisionTree | null };

// EN: Thrown by the comparator when the algorithm asks a question that has no answer yet.
// PT: Lançada pelo comparador quando o algoritmo faz uma pergunta que ainda não tem resposta.
class Question extends Error {
	constructor(
		readonly left: number,
		readonly right: number,
	) {
		super("unanswered comparison");
	}
}

export function permutations(n: number): number[][] {
	if (n === 0) {
		return [[]];
	}
	return permutations(n - 1).flatMap((rest) =>
		Array.from({ length: n }, (_, position) => [...rest.slice(0, position), n - 1, ...rest.slice(position)]),
	);
}

// EN: The tree is discovered by running the real algorithm many times on the items 0..n-1,
//     whose order is unknown. The comparator replays a list of answers already chosen. When the
//     algorithm asks one more question, the run stops, the question becomes a node, and the
//     algorithm is run again once for "yes" and once for "no".
//     `candidates` are the input orders still compatible with the answers so far. A branch
//     that no input can reach is not part of the tree (the algorithm asked something it could
//     already have deduced), so it is left empty.
// PT: A árvore é descoberta rodando o algoritmo de verdade várias vezes sobre os itens 0..n-1,
//     cuja ordem é desconhecida. O comparador repete uma lista de respostas já escolhidas.
//     Quando o algoritmo faz mais uma pergunta, a execução para, a pergunta vira um nó, e o
//     algoritmo roda de novo, uma vez para "sim" e outra para "não".
//     `candidates` são as ordens de entrada ainda compatíveis com as respostas dadas. Um ramo
//     que nenhuma entrada alcança não faz parte da árvore (o algoritmo perguntou algo que já
//     poderia ter deduzido), então ele fica vazio.
function explore(sort: ComparisonSort, n: number, answers: boolean[], candidates: number[][]): DecisionTree {
	const items = Array.from({ length: n }, (_, index) => index);
	let asked = 0;
	try {
		const order = sort(items, (left, right) => {
			const answer = answers[asked];
			if (answer === undefined) {
				throw new Question(left, right);
			}
			asked++;
			return answer;
		});
		return { kind: "leaf", order };
	} catch (error) {
		if (!(error instanceof Question)) {
			throw error;
		}
		const { left, right } = error;
		// EN: ranks[i] is the position item i has in sorted order, so "item left is smaller
		//     than item right" means ranks[left] < ranks[right].
		// PT: ranks[i] é a posição do item i na ordem final, então "o item left é menor que o
		//     item right" significa ranks[left] < ranks[right].
		const yes = candidates.filter((ranks) => (ranks[left] ?? 0) < (ranks[right] ?? 0));
		const no = candidates.filter((ranks) => (ranks[left] ?? 0) >= (ranks[right] ?? 0));
		return {
			kind: "compare",
			left,
			right,
			yes: yes.length > 0 ? explore(sort, n, [...answers, true], yes) : null,
			no: no.length > 0 ? explore(sort, n, [...answers, false], no) : null,
		};
	}
}

export function buildDecisionTree(sort: ComparisonSort, n: number): DecisionTree {
	if (!Number.isInteger(n) || n < 1 || n > 7) {
		throw new RangeError("n must be an integer from 1 to 7: the tree has n! leaves");
	}
	return explore(sort, n, [], permutations(n));
}

export function countLeaves(tree: DecisionTree | null): number {
	if (tree === null) {
		return 0;
	}
	return tree.kind === "leaf" ? 1 : countLeaves(tree.yes) + countLeaves(tree.no);
}

// EN: The height is the longest path from the root to a leaf, counted in comparisons. It is the
//     number of comparisons of the worst case.
// PT: A altura é o maior caminho da raiz até uma folha, contado em comparações. É o número de
//     comparações do pior caso.
export function height(tree: DecisionTree | null): number {
	if (tree === null || tree.kind === "leaf") {
		return 0;
	}
	return 1 + Math.max(height(tree.yes), height(tree.no));
}

// EN: The sum of the depths of all leaves. Divided by the number of leaves, it is the average
//     number of comparisons when every input order is equally likely.
// PT: A soma das profundidades de todas as folhas. Dividida pelo número de folhas, é o número
//     médio de comparações quando todas as ordens de entrada são igualmente prováveis.
export function totalLeafDepth(tree: DecisionTree | null, depth = 0): number {
	if (tree === null) {
		return 0;
	}
	if (tree.kind === "leaf") {
		return depth;
	}
	return totalLeafDepth(tree.yes, depth + 1) + totalLeafDepth(tree.no, depth + 1);
}

const NAMES = "abcdefg";

function name(item: number): string {
	return NAMES[item] ?? `x${item}`;
}

// EN: Draws the tree as indented text. Items are named a, b, c... by their input position.
// PT: Desenha a árvore como texto indentado. Os itens se chamam a, b, c... pela posição de entrada.
export function renderDecisionTree(tree: DecisionTree | null, indent = ""): string {
	if (tree === null) {
		return `${indent}(unreachable)`;
	}
	if (tree.kind === "leaf") {
		return `${indent}=> ${tree.order.map(name).join(" < ")}`;
	}
	const lines = [`${indent}${name(tree.left)} < ${name(tree.right)} ?`];
	if (tree.yes !== null) {
		lines.push(`${indent}  yes:`, renderDecisionTree(tree.yes, `${indent}    `));
	}
	if (tree.no !== null) {
		lines.push(`${indent}  no:`, renderDecisionTree(tree.no, `${indent}    `));
	}
	return lines.join("\n");
}
