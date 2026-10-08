import { expect, test } from "bun:test";
import { runDemo } from "../src/demo";

// EN: The demo is part of the lesson, so it is tested too: ten patterns, and the lines that
//     carry the point of three of them.
// PT: A demo faz parte da lição, então também é testada: dez padrões, e as linhas que carregam
//     o ponto de três deles.
test("the demo walks through the ten patterns", () => {
	const lines = runDemo();
	expect(lines.filter((line) => !line.startsWith(" "))).toEqual([
		"strategy",
		"observer",
		"factory",
		"adapter",
		"decorator",
		"repository",
		"command",
		"state",
		"builder",
		"singleton",
	]);
	expect(lines).toContain('  before: throws "unknown shipping kind: drone"');
	expect(lines).toContain("  before: after 3 logins, the first search is allowed: false");
	expect(lines).toContain("  after:  after 3 logins, the first search is allowed: true");
	expect(lines).toContain('  after:  POST with no body: throws "a POST request needs a body"');
});
