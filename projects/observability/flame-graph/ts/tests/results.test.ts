// EN: The acceptance test of the lesson, on the committed profiles in `results/`: the "before"
//     profile of each language points at the hidden function, the "after" profile is clear of
//     it, and the committed pictures are exactly what the renderer draws from those profiles.
//     `docker compose run --rm flame` repeats the same checks on freshly captured profiles.
// PT: O teste de aceitação da lição, sobre os perfis versionados em `results/`: o perfil
//     "before" de cada linguagem aponta para a função escondida, o perfil "after" está livre
//     dela, e as figuras versionadas são exatamente o que o renderizador desenha a partir
//     desses perfis. O `docker compose run --rm flame` repete as mesmas checagens em perfis
//     recém-capturados.

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseFolded } from "../src/folded";
import { readLabEnv, subjects, VARIANTS } from "../src/lab";
import { layout, renderFlameGraph } from "../src/svg";
import { FIXED_SHARE_MAX, HOT_SHARE_MIN, problems, verdict } from "../src/verdict";

const resultsDir = process.env.RESULTS_DIR ?? join(import.meta.dir, "..", "..", "results");
const read = (name: string): string => readFileSync(join(resultsDir, name), "utf8");

for (const subject of subjects(readLabEnv({}))) {
	describe(`committed profiles: ${subject.label}`, () => {
		const before = parseFolded(read(`${subject.language}-before.folded`));
		const after = parseFolded(read(`${subject.language}-after.folded`));
		const beforeVerdict = verdict(before, subject.handler.before, subject.hotFrame);
		const afterVerdict = verdict(after, subject.handler.after, subject.hotFrame);

		test("before the fix, the hot function holds most of the handler's samples", () => {
			expect(beforeVerdict.handlerSamples).toBeGreaterThanOrEqual(50);
			expect(beforeVerdict.hotShare).toBeGreaterThan(HOT_SHARE_MIN);
		});

		test("in the picture, the hot function covers most of the width of the handler", () => {
			const frames = layout(before);
			const width = (name: string): number =>
				frames.filter((frame) => frame.name === name).reduce((sum, frame) => sum + frame.width, 0);
			expect(width(subject.hotFrame) / width(subject.handler.before)).toBeGreaterThan(HOT_SHARE_MIN);
		});

		test("after the fix, its share collapses", () => {
			expect(afterVerdict.handlerSamples).toBeGreaterThanOrEqual(50);
			expect(afterVerdict.hotShare).toBeLessThan(FIXED_SHARE_MAX);
			expect(problems(beforeVerdict, afterVerdict)).toEqual([]);
		});

		for (const variant of VARIANTS) {
			test(`the committed ${variant} picture is what the renderer draws from the committed profile`, () => {
				const expected = renderFlameGraph(variant === "before" ? before : after, {
					title: `${subject.label}, ${variant} the fix: CPU profile of GET /${variant}/${subject.endpoint} under load`,
					highlight: subject.hotFrame,
				});
				// Line endings are normalised: a Windows checkout may convert them.
				expect(read(`flame-${subject.language}-${variant}.svg`).replaceAll("\r\n", "\n")).toBe(expected);
			});
		}
	});
}

describe("verdict", () => {
	test("reports each way a pair of profiles can fail to prove the lesson", () => {
		const weak = verdict(parseFolded("serve;handler;hot 30\nserve;handler;cold 70\n"), "handler", "hot");
		const stillHot = verdict(parseFolded("serve;handler;hot 30\nserve;handler;cold 70\n"), "handler", "hot");
		expect(problems(weak, stillHot)).toHaveLength(2);
		const few = verdict(parseFolded("serve;handler;hot 9\n"), "handler", "hot");
		expect(problems(few, few).some((problem) => problem.includes("at least 50"))).toBe(true);
	});
});
