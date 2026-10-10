// EN: A small flame graph renderer: folded stacks in, one self-contained SVG out (no script,
//     no external font). How to read the picture:
//       - every box is a function; the box above it is a function it called;
//       - the WIDTH of a box is its share of the samples (itself plus what it called);
//       - the x axis is NOT time: siblings are sorted by name, so left and right mean nothing;
//       - a wide box with nothing above it (a plateau) is where the CPU actually was.
// PT: Um renderizador pequeno de flame graph: entram pilhas dobradas, sai um SVG autocontido
//     (sem script, sem fonte externa). Como ler a figura:
//       - cada caixa é uma função; a caixa acima dela é uma função que ela chamou;
//       - a LARGURA de uma caixa é a sua fatia das amostras (ela mesma mais o que chamou);
//       - o eixo x NÃO é tempo: irmãos são ordenados por nome, então esquerda e direita não
//         significam nada;
//       - uma caixa larga sem nada em cima (um platô) é onde a CPU realmente estava.
// ES: Un renderizador pequeño de flame graph: entran pilas plegadas, sale un SVG autocontenido
//     (sin script, sin fuente externa). Cómo leer la figura:
//       - cada caja es una función; la caja encima de ella es una función que ella llamó;
//       - el ANCHO de una caja es su porción de las muestras (ella misma más lo que llamó);
//       - el eje x NO es tiempo: los hermanos se ordenan por nombre, así que izquierda y derecha no
//         significan nada;
//       - una caja ancha sin nada encima (una meseta) es donde la CPU realmente estaba.

import { type Stacks, samplesWith, totalSamples } from "./folded";

export interface Frame {
	name: string;
	/** Samples in this function and in everything it called. */
	samples: number;
	depth: number;
	/** Left edge and width as fractions of the whole graph, from 0 to 1. */
	left: number;
	width: number;
}

interface Node {
	name: string;
	samples: number;
	children: Map<string, Node>;
}

/**
 * Merges the stacks into a tree and lays it out: one frame per function per call path.
 *
 * EN: Stacks that start with the same frames share those boxes. That merge is the whole trick
 *     of a flame graph: thousands of samples collapse into a picture where a hot function
 *     shows up as one wide box, however many different callers and callees it has.
 * PT: Pilhas que começam com os mesmos quadros compartilham essas caixas. Essa fusão é todo o
 *     truque de um flame graph: milhares de amostras viram uma figura em que uma função quente
 *     aparece como uma caixa larga, não importa quantos chamadores e chamados diferentes tenha.
 * ES: Las pilas que empiezan con los mismos cuadros comparten esas cajas. Esa fusión es todo el
 *     truco de un flame graph: miles de muestras se vuelven una figura en la que una función caliente
 *     aparece como una caja ancha, no importa cuántos llamadores y llamados distintos tenga.
 */
export function layout(stacks: Stacks): Frame[] {
	const root: Node = { name: "all", samples: 0, children: new Map() };
	for (const [stack, count] of stacks) {
		root.samples += count;
		let node = root;
		for (const name of stack.split(";")) {
			let child = node.children.get(name);
			if (child === undefined) {
				child = { name, samples: 0, children: new Map() };
				node.children.set(name, child);
			}
			child.samples += count;
			node = child;
		}
	}
	const frames: Frame[] = [];
	if (root.samples === 0) {
		return frames;
	}
	const place = (node: Node, depth: number, left: number): void => {
		frames.push({ name: node.name, samples: node.samples, depth, left, width: node.samples / root.samples });
		let x = left;
		const sorted = [...node.children.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
		for (const child of sorted) {
			place(child, depth + 1, x);
			x += child.samples / root.samples;
		}
	};
	place(root, 0, 0);
	return frames;
}

export function escapeXml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

// EN: The colour means nothing, as in the classic flame graph: it only tells neighbours apart.
//     It comes from a hash of the name, so the same function has the same colour in every
//     picture and the output is deterministic.
// PT: A cor não significa nada, como no flame graph clássico: só diferencia vizinhos. Ela vem
//     de um hash do nome, então a mesma função tem a mesma cor em toda figura e a saída é
//     determinística.
// ES: El color no significa nada, como en el flame graph clásico: solo diferencia vecinos. Viene
//     de un hash del nombre, así que la misma función tiene el mismo color en cada figura y la
//     salida es determinista.
function warmColour(name: string): string {
	let hash = 2166136261;
	for (let i = 0; i < name.length; i++) {
		hash = Math.imul(hash ^ name.charCodeAt(i), 16777619) >>> 0;
	}
	const red = 205 + (hash % 50);
	const green = 90 + ((hash >>> 8) % 130);
	const blue = 30 + ((hash >>> 16) % 50);
	return `rgb(${red},${green},${blue})`;
}

export interface RenderOptions {
	title: string;
	/** Frames with exactly this name are painted in a contrasting colour, like a search hit. */
	highlight?: string;
	width?: number;
}

const ROW = 18;
const TOP = 62;
const SIDE = 10;
const HIGHLIGHT = "rgb(150,110,255)";
/** Frames narrower than this many pixels are not drawn: they would be invisible slivers. */
const MIN_PIXELS = 0.4;

export function renderFlameGraph(stacks: Stacks, options: RenderOptions): string {
	const width = options.width ?? 1200;
	const inner = width - 2 * SIDE;
	const total = totalSamples(stacks);
	const frames = layout(stacks).filter((frame) => frame.width * inner >= MIN_PIXELS);
	const maxDepth = frames.reduce((max, frame) => Math.max(max, frame.depth), 0);
	const height = TOP + (maxDepth + 1) * ROW + SIDE;
	const percent = (samples: number): string => (total === 0 ? "0.0" : ((100 * samples) / total).toFixed(1));

	const out: string[] = [];
	out.push(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="monospace" font-size="11">`,
	);
	out.push(`<rect width="${width}" height="${height}" fill="rgb(252,250,244)"/>`);
	out.push(`<text x="${SIDE}" y="20" font-size="15" font-weight="bold">${escapeXml(options.title)}</text>`);
	out.push(
		`<text x="${SIDE}" y="38" fill="rgb(90,90,90)">${total} samples. Width = share of samples (the x axis is not time). A box sits on top of its caller.</text>`,
	);
	if (options.highlight !== undefined) {
		const hit = samplesWith(stacks, options.highlight);
		out.push(
			`<rect x="${SIDE}" y="45" width="10" height="10" fill="${HIGHLIGHT}"/><text x="${SIDE + 15}" y="54" fill="rgb(90,90,90)">${escapeXml(options.highlight)}: ${hit} samples, ${percent(hit)}% of all samples</text>`,
		);
	}
	for (const frame of frames) {
		// EN: The root is the bottom row and the stacks grow upwards, like flames.
		// PT: A raiz é a linha de baixo e as pilhas crescem para cima, como chamas.
		// ES: La raíz es la fila de abajo y las pilas crecen hacia arriba, como llamas.
		const x = SIDE + frame.left * inner;
		const y = TOP + (maxDepth - frame.depth) * ROW;
		const w = frame.width * inner;
		const fill =
			frame.depth === 0
				? "rgb(210,210,210)"
				: frame.name === options.highlight
					? HIGHLIGHT
					: warmColour(frame.name);
		const fits = Math.floor((w - 6) / 6.7);
		const label = fits >= frame.name.length ? frame.name : fits >= 3 ? `${frame.name.slice(0, fits - 2)}..` : "";
		out.push(
			`<g><title>${escapeXml(frame.name)} (${frame.samples} samples, ${percent(frame.samples)}%)</title>` +
				`<rect x="${x.toFixed(2)}" y="${y}" width="${w.toFixed(2)}" height="${ROW - 1}" fill="${fill}" rx="2"/>` +
				(label === "" ? "" : `<text x="${(x + 3).toFixed(2)}" y="${y + 12}">${escapeXml(label)}</text>`) +
				"</g>",
		);
	}
	out.push("</svg>");
	return `${out.join("\n")}\n`;
}
