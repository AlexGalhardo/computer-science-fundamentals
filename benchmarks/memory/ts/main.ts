// EN: Memory workload in TypeScript on Bun: `binary-trees` and `idle`. JavaScript model: a
//     tracing garbage collector inside the engine (JavaScriptCore in Bun). The program only
//     allocates objects. The collector is generational: it scans the young objects often,
//     because most of them are already dead, and the whole heap rarely. Part of the work
//     happens on helper threads, so CPU time can exceed the wall-clock time.
// PT: Carga de memória em TypeScript no Bun: `binary-trees` e `idle`. Modelo do JavaScript: um
//     coletor de lixo de rastreamento dentro do motor (JavaScriptCore no Bun). O programa só
//     aloca objetos. O coletor é geracional: varre os objetos jovens com frequência, porque a
//     maioria já morreu, e o heap inteiro raramente. Parte do trabalho acontece em threads
//     auxiliares, então o tempo de CPU pode passar do tempo de relógio.
// ES: Carga de memoria en TypeScript sobre Bun: `binary-trees` e `idle`. Modelo de JavaScript: un
//     recolector de basura de rastreo dentro del motor (JavaScriptCore en Bun). El programa solo
//     asigna objetos. El recolector es generacional: barre los objetos jóvenes con frecuencia, porque la
//     mayoría ya murió, y el heap completo rara vez. Parte del trabajo ocurre en threads
//     auxiliares, así que el tiempo de CPU puede superar el tiempo de reloj.

import { readFileSync } from "node:fs";

interface TreeNode {
	left: TreeNode | null;
	right: TreeNode | null;
}

function make(depth: number): TreeNode {
	return depth === 0 ? { left: null, right: null } : { left: make(depth - 1), right: make(depth - 1) };
}

// EN: Walks the whole tree and counts its nodes.
// PT: Percorre a árvore inteira e conta os nós.
// ES: Recorre el árbol completo y cuenta los nodos.
function check(node: TreeNode): number {
	return node.left === null || node.right === null ? 1 : 1 + check(node.left) + check(node.right);
}

function binaryTrees(n: number): number {
	const minDepth = 4;
	const maxDepth = Math.max(minDepth + 2, n);
	let total = check(make(maxDepth + 1));
	const longLived = make(maxDepth);
	for (let depth = minDepth; depth <= maxDepth; depth += 2) {
		const iterations = 2 ** (maxDepth - depth + minDepth);
		for (let i = 0; i < iterations; i++) {
			total += check(make(depth));
		}
	}
	return total + check(longLived);
}

function peakMemoryKb(): number {
	const match = /VmHWM:\s+(\d+)/.exec(readFileSync("/proc/self/status", "utf8"));
	return match?.[1] === undefined ? 0 : Number(match[1]);
}

const [implementation = "binary-trees", size = "10"] = process.argv.slice(2);
const n = Number(size);

const start = performance.now();
const checksum = implementation === "idle" ? "idle" : String(binaryTrees(n));
const elapsedMs = performance.now() - start;

console.log(JSON.stringify({ n, elapsedMs, memoryKb: peakMemoryKb(), language: "ts", implementation, checksum }));
