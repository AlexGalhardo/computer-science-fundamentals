// EN: "Folded stacks" are the plain text format flame graphs are drawn from. One line per
//     distinct call stack: the frames from the root to the leaf joined by ";", a space, and
//     how many samples had exactly that stack.
//
//         serve;handleQuoteBefore;quoteBefore;buildPriceIndex 912
//
//     Both languages of this project end up in this format, so one renderer serves both.
// PT: "Pilhas dobradas" (folded stacks) são o formato de texto a partir do qual os flame graphs
//     são desenhados. Uma linha por pilha de chamadas distinta: os quadros da raiz até a folha
//     unidos por ";", um espaço, e quantas amostras tinham exatamente aquela pilha.
//     As duas linguagens deste projeto terminam neste formato, então um renderizador serve às duas.

import { z } from "zod";

/** Samples per stack. The key is the frames joined by ";", root first. */
export type Stacks = Map<string, number>;

export function parseFolded(text: string): Stacks {
	const stacks: Stacks = new Map();
	for (const [index, raw] of text.split("\n").entries()) {
		const line = raw.trim();
		if (line === "") {
			continue;
		}
		// EN: The count is whatever follows the LAST space: a frame name may contain spaces.
		// PT: A contagem é o que vem depois do ÚLTIMO espaço: um nome de quadro pode ter espaços.
		const cut = line.lastIndexOf(" ");
		const count = Number(line.slice(cut + 1));
		if (cut <= 0 || !Number.isInteger(count) || count < 0) {
			throw new Error(`folded stacks, line ${index + 1}: expected "<frames> <count>", got "${line}"`);
		}
		const stack = line.slice(0, cut);
		stacks.set(stack, (stacks.get(stack) ?? 0) + count);
	}
	return stacks;
}

/** Sorted lines, so the same profile always gives the same file. */
export function formatFolded(stacks: Stacks): string {
	return [...stacks.entries()]
		.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
		.map(([stack, count]) => `${stack} ${count}\n`)
		.join("");
}

export function totalSamples(stacks: Stacks): number {
	let total = 0;
	for (const count of stacks.values()) {
		total += count;
	}
	return total;
}

/** Samples whose stack contains the frame anywhere: the frame itself plus everything it called. */
export function samplesWith(stacks: Stacks, frame: string): number {
	let total = 0;
	for (const [stack, count] of stacks) {
		if (stack.split(";").includes(frame)) {
			total += count;
		}
	}
	return total;
}

/**
 * Share of the samples under `parent` that are also under `frame`, from 0 to 1.
 *
 * EN: This is the question a flame graph answers by width: of all the CPU time spent inside
 *     the handler, how much was spent inside this one function and what it calls?
 * PT: Esta é a pergunta que um flame graph responde pela largura: de todo o tempo de CPU gasto
 *     dentro do handler, quanto foi gasto dentro desta função e do que ela chama?
 */
export function shareUnder(stacks: Stacks, parent: string, frame: string): number {
	let under = 0;
	let both = 0;
	for (const [stack, count] of stacks) {
		const frames = stack.split(";");
		const at = frames.indexOf(parent);
		if (at < 0) {
			continue;
		}
		under += count;
		if (frames.indexOf(frame, at + 1) >= 0) {
			both += count;
		}
	}
	return under === 0 ? 0 : both / under;
}

// EN: The `.cpuprofile` format of the JavaScript inspector protocol (the one Chrome DevTools
//     reads). It is a call tree: each node is a function called from its parent, and
//     `hitCount` says how many samples found the CPU exactly in that node (self time).
//     The profile is external input, so it is validated before use.
// PT: O formato `.cpuprofile` do protocolo de inspeção do JavaScript (o que o Chrome DevTools
//     lê). É uma árvore de chamadas: cada nó é uma função chamada a partir do pai, e `hitCount`
//     diz quantas amostras encontraram a CPU exatamente naquele nó (tempo próprio).
//     O perfil é entrada externa, então é validado antes do uso.
export const cpuProfileSchema = z.object({
	nodes: z.array(
		z.object({
			id: z.number().int(),
			callFrame: z.object({ functionName: z.string() }),
			hitCount: z.number().int().min(0).optional(),
			children: z.array(z.number().int()).optional(),
		}),
	),
});

export type CpuProfile = z.infer<typeof cpuProfileSchema>;

/**
 * Converts a call tree with self-time counts into folded stacks.
 *
 * EN: Walking from each node up to the root rebuilds the stack that node stands for. A node
 *     with no hit of its own produces no line: its time is in its children.
 * PT: Subir de cada nó até a raiz reconstrói a pilha que aquele nó representa. Um nó sem
 *     amostra própria não gera linha: o tempo dele está nos filhos.
 */
export function cpuProfileToFolded(profile: CpuProfile): Stacks {
	const parentOf = new Map<number, number>();
	const nameOf = new Map<number, string>();
	for (const node of profile.nodes) {
		nameOf.set(node.id, (node.callFrame.functionName || "(anonymous)").replaceAll(";", ":"));
		for (const child of node.children ?? []) {
			parentOf.set(child, node.id);
		}
	}
	const stacks: Stacks = new Map();
	for (const node of profile.nodes) {
		const hits = node.hitCount ?? 0;
		if (hits === 0) {
			continue;
		}
		const frames: string[] = [];
		for (let id: number | undefined = node.id; id !== undefined; id = parentOf.get(id)) {
			const name = nameOf.get(id) ?? "(unknown)";
			// The synthetic "(root)" node is the same for every stack and says nothing.
			if (name !== "(root)") {
				frames.push(name);
			}
			if (frames.length > 10_000) {
				throw new Error("cpu profile: the call tree has a cycle");
			}
		}
		const stack = frames.reverse().join(";");
		stacks.set(stack, (stacks.get(stack) ?? 0) + hits);
	}
	return stacks;
}
