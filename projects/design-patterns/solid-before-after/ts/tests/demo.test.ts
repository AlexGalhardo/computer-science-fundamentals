import { expect, test } from "bun:test";
import { runDemo } from "../src/demo";

// EN: The demo claims that both versions answer the same. The claim is checked here.
// PT: A demo afirma que as duas versões respondem o mesmo. A afirmação é conferida aqui.
test("the demo shows the same behaviour before and after, for the five principles", () => {
	const lines = runDemo();
	expect(lines.filter((line) => line.startsWith("  same behaviour:"))).toEqual(
		Array(5).fill("  same behaviour: yes"),
	);
	expect(lines).toContain("  after:  8800, 50000");
});
