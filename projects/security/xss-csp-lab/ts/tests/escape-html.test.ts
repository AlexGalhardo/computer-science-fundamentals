import { expect, test } from "bun:test";
import { escapeHtml } from "../src/fixed/fixed-escape-html";
import { NORMAL_INPUT, SCRIPT_INPUT } from "../src/lab-inputs";

// EN: Unit tests of the encoding function: the five special characters become entities, and
//     nothing else changes.
// PT: Testes unitários da função de codificação: os cinco caracteres especiais viram entidades,
//     e nada mais muda.

test("each special character becomes its entity", () => {
	expect(escapeHtml(`<>&"'`)).toBe("&lt;&gt;&amp;&quot;&#39;");
});

test("the lab input leaves no tag behind", () => {
	const escaped = escapeHtml(SCRIPT_INPUT);
	expect(escaped).not.toContain("<");
	expect(escaped).not.toContain(">");
	expect(escaped).toStartWith("&lt;script&gt;");
});

test("an ampersand is escaped first, so an entity typed by the user is shown as typed", () => {
	expect(escapeHtml("&lt;")).toBe("&amp;lt;");
});

test("ordinary text is kept, including accents", () => {
	expect(escapeHtml("Olá, laboratório")).toBe("Olá, laboratório");
	expect(escapeHtml(NORMAL_INPUT)).toBe("Tom &amp; Jerry &lt;3 the lab");
});
