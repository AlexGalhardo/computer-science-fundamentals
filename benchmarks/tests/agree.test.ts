// EN: Proves that the seven implementations of each workload compute the same thing. Each
//     program runs in its image with a small input and prints a checksum. All checksums must be
//     equal to each other and to a reference calculated here, independently. Comparing times
//     between programs that do different work would mean nothing.
//     Requires the images: `bun run images` (the setup scripts do it).
// PT: Prova que as sete implementações de cada carga calculam a mesma coisa. Cada programa roda
//     na sua imagem com uma entrada pequena e imprime um checksum. Todos os checksums precisam
//     ser iguais entre si e a uma referência calculada aqui, de forma independente. Comparar
//     tempos entre programas que fazem trabalhos diferentes não significaria nada.
//     Precisa das imagens: `bun run images` (os scripts de setup fazem isso).
// ES: Prueba que las siete implementaciones de cada carga calculan lo mismo. Cada programa corre
//     en su imagen con una entrada pequeña e imprime un checksum. Todos los checksums deben ser
//     iguales entre sí y a una referencia calculada aquí, de forma independiente. Comparar
//     tiempos entre programas que hacen trabajos distintos no significaría nada.
//     Necesita las imágenes: `bun run images` (los scripts de setup lo hacen).

import { describe, expect, test } from "bun:test";
import { fill, imageTag, LANGUAGES, readConfig, runProgram } from "../scripts/lib";

const TIMEOUT_MS = 180_000;

function sieveReference(n: number): string {
	const composite = new Uint8Array(n + 1);
	let count = 0;
	let largest = 0;
	for (let i = 2; i <= n; i++) {
		if (composite[i] === 0) {
			count++;
			largest = i;
			for (let j = i * i; j <= n; j += i) {
				composite[j] = 1;
			}
		}
	}
	return `${count}:${largest}`;
}

// EN: A complete binary tree of depth d has 2^(d+1) - 1 nodes, so the total the programs must
//     report can be calculated without building a single tree.
// PT: Uma árvore binária completa de profundidade d tem 2^(d+1) - 1 nós, então o total que os
//     programas precisam informar pode ser calculado sem construir nenhuma árvore.
// ES: Un árbol binario completo de profundidad d tiene 2^(d+1) - 1 nodos, así que el total que
//     los programas deben informar se puede calcular sin construir ningún árbol.
function binaryTreesReference(n: number): string {
	const nodes = (depth: number): number => 2 ** (depth + 1) - 1;
	const minDepth = 4;
	const maxDepth = Math.max(minDepth + 2, n);
	let total = nodes(maxDepth + 1) + nodes(maxDepth);
	for (let depth = minDepth; depth <= maxDepth; depth += 2) {
		total += 2 ** (maxDepth - depth + minDepth) * nodes(depth);
	}
	return String(total);
}

interface Case {
	workload: string;
	/** Undefined means "every implementation the language declares" (they differ in concurrency). */
	implementation?: string;
	n: number;
	variant?: string;
	expected?: string;
}

const cases: Case[] = [
	// EN: -0.169087605 is the published energy of this system after 1,000 steps.
	// PT: -0.169087605 é a energia publicada desse sistema depois de 1.000 passos.
	// ES: -0.169087605 es la energía publicada de ese sistema después de 1.000 pasos.
	{ workload: "cpu-single", implementation: "nbody", n: 1000, expected: "-0.169087605" },
	{ workload: "cpu-single", implementation: "nbody", n: 20000 },
	{ workload: "cpu-single", implementation: "sieve", n: 100000, expected: sieveReference(100000) },
	{ workload: "parallelism", implementation: "primes", n: 200000, variant: "1", expected: "17984" },
	{ workload: "parallelism", implementation: "primes", n: 200000, variant: "4", expected: "17984" },
	{ workload: "parallelism", implementation: "primes", n: 200000, variant: "16", expected: "17984" },
	{ workload: "concurrency", n: 0, expected: "0" },
	{ workload: "concurrency", n: 1000, expected: "499500" },
	{ workload: "memory", implementation: "binary-trees", n: 10, expected: binaryTreesReference(10) },
	{ workload: "memory", implementation: "idle", n: 10, expected: "idle" },
];

for (const item of cases) {
	const config = readConfig(item.workload);
	const label = `${item.workload} ${item.implementation ?? "every model"} n=${item.n} variant=${item.variant ?? "default"}`;
	describe(label, () => {
		test("every language is present", () => {
			expect(config.targets.map((target) => target.language).sort()).toEqual([...LANGUAGES].sort());
		});

		test(
			"all languages print the same checksum",
			() => {
				const checksums = new Map<string, string | undefined>();
				for (const target of config.targets) {
					const implementations =
						item.implementation === undefined ? target.implementations : [item.implementation];
					for (const implementation of implementations) {
						const line = runProgram(
							imageTag(config.project, target.language),
							fill(target.command, implementation, item.n, item.variant),
						);
						expect(line.language).toBe(target.language);
						expect(line.implementation).toBe(implementation);
						expect(line.n).toBe(item.n);
						checksums.set(`${target.language}/${implementation}`, line.checksum);
					}
				}
				const distinct = new Set(checksums.values());
				expect({ checksums: Object.fromEntries(checksums), distinct: distinct.size }).toMatchObject({
					distinct: 1,
				});
				if (item.expected !== undefined) {
					expect([...distinct][0]).toBe(item.expected);
				}
			},
			TIMEOUT_MS,
		);
	});
}
