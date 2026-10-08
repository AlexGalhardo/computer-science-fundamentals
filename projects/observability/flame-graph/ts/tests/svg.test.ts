import { describe, expect, test } from "bun:test";
import { parseFolded } from "../src/folded";
import { escapeXml, layout, renderFlameGraph } from "../src/svg";

const stacks = parseFolded("serve;handler;hot 6\nserve;handler;cold 2\nidle 2\n");

describe("layout", () => {
	const frames = layout(stacks);
	const frame = (name: string) => {
		const found = frames.find((item) => item.name === name);
		if (found === undefined) {
			throw new Error(`frame ${name} not found`);
		}
		return found;
	};

	test("the width of a frame is its share of the samples", () => {
		expect(frame("all").width).toBe(1);
		expect(frame("serve").width).toBeCloseTo(0.8);
		expect(frame("handler").width).toBeCloseTo(0.8);
		expect(frame("hot").width).toBeCloseTo(0.6);
		expect(frame("cold").width).toBeCloseTo(0.2);
		expect(frame("idle").width).toBeCloseTo(0.2);
	});

	test("the depth of a frame is its position in the stack", () => {
		expect(frame("all").depth).toBe(0);
		expect(frame("serve").depth).toBe(1);
		expect(frame("hot").depth).toBe(3);
	});

	test("children fill their parent from its left edge, sorted by name and not by time", () => {
		// "idle" sorts before "serve", although its samples came later in the input.
		expect(frame("idle").left).toBe(0);
		expect(frame("serve").left).toBeCloseTo(0.2);
		expect(frame("cold").left).toBeCloseTo(0.2);
		expect(frame("hot").left).toBeCloseTo(0.4);
		expect(frame("cold").width + frame("hot").width).toBeCloseTo(frame("handler").width);
	});

	test("the same function under two callers is two frames", () => {
		const twice = layout(parseFolded("a;shared 1\nb;shared 3\n")).filter((item) => item.name === "shared");
		expect(twice.map((item) => item.width)).toEqual([0.25, 0.75]);
	});

	test("no stacks, no frames", () => {
		expect(layout(new Map())).toEqual([]);
	});
});

describe("renderFlameGraph", () => {
	const svg = renderFlameGraph(stacks, { title: "demo", highlight: "hot", width: 1020 });

	test("draws one rect with a title for each frame, widths proportional to samples", () => {
		// Inner width is 1000 px, so "hot" (6 of 10 samples) is 600 px wide.
		expect(svg).toContain("<title>hot (6 samples, 60.0%)</title>");
		expect(svg).toMatch(/<title>hot \(6 samples, 60\.0%\)<\/title><rect x="410\.00" y="\d+" width="600\.00"/);
		expect(svg).toMatch(/<title>cold \(2 samples, 20\.0%\)<\/title><rect x="210\.00" y="\d+" width="200\.00"/);
		expect(svg.match(/<g>/g)?.length).toBe(6);
	});

	test("the root is the lowest row and the leaf the highest", () => {
		const y = (name: string): number =>
			Number(new RegExp(`<title>${name} [^<]*</title><rect x="[\\d.]+" y="(\\d+)"`).exec(svg)?.[1]);
		expect(y("all")).toBeGreaterThan(y("serve"));
		expect(y("serve")).toBeGreaterThan(y("handler"));
		expect(y("handler")).toBeGreaterThan(y("hot"));
	});

	test("the highlighted frame has its own colour and a legend with its share", () => {
		expect(svg).toMatch(/<title>hot [^<]*<\/title><rect [^>]*fill="rgb\(150,110,255\)"/);
		expect(svg).not.toMatch(/<title>cold [^<]*<\/title><rect [^>]*fill="rgb\(150,110,255\)"/);
		expect(svg).toContain("hot: 6 samples, 60.0% of all samples");
	});

	test("is deterministic", () => {
		expect(renderFlameGraph(stacks, { title: "demo", highlight: "hot", width: 1020 })).toBe(svg);
	});

	test("escapes names, so the output stays well-formed XML", () => {
		expect(escapeXml(`a<b>&"c"'d'`)).toBe("a&lt;b&gt;&amp;&quot;c&quot;&apos;d&apos;");
		const tricky = renderFlameGraph(parseFolded("main;Map<string,&int>.get 4\n"), { title: "a < b & c" });
		expect(tricky).toContain("Map&lt;string,&amp;int&gt;.get");
		expect(tricky).toContain("a &lt; b &amp; c");
		expect(tricky).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
		expect(wellFormed(tricky)).toBe(true);
		expect(wellFormed(svg)).toBe(true);
	});

	test("frames too narrow to see are left out", () => {
		const many = renderFlameGraph(parseFolded("main;big 99999\nmain;tiny 1\n"), { title: "t" });
		expect(many).toContain("<title>big ");
		expect(many).not.toContain("<title>tiny ");
	});
});

// EN: A minimal well-formedness check: every opening tag is closed in the right order and no
//     raw "<" is left inside text. It is enough for the fixed set of tags the renderer writes.
// PT: Uma checagem mínima de boa formação: toda tag aberta é fechada na ordem certa e nenhum
//     "<" cru sobra dentro de texto. É suficiente para o conjunto fixo de tags que o
//     renderizador escreve.
function wellFormed(xml: string): boolean {
	const open: string[] = [];
	const tag = /<(\/?)([a-zA-Z]+)((?:\s+[a-zA-Z:-]+="[^"<]*")*)\s*(\/?)>/y;
	let at = 0;
	while (at < xml.length) {
		const next = xml.indexOf("<", at);
		if (next < 0) {
			break;
		}
		tag.lastIndex = next;
		const match = tag.exec(xml);
		if (match === null) {
			return false;
		}
		const [, closing, name, , selfClosing] = match;
		if (closing === "/") {
			if (open.pop() !== name) {
				return false;
			}
		} else if (selfClosing !== "/" && name !== undefined) {
			open.push(name);
		}
		at = tag.lastIndex;
	}
	return open.length === 0;
}
