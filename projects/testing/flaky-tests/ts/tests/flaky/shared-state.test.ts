import { expect, test } from "bun:test";
import { sharedRegistry } from "../../src/invoices";

// EN: FLAKY ON PURPOSE (cause: shared state). The three tests use the same registry. Written in
//     this order they pass, because each one silently relies on what the previous one left.
//     The lab runs them with `bun test --randomize`, as many CI set-ups do, and then any other
//     order breaks at least one of them: only 1 of the 6 possible orders is green.
// PT: INTERMITENTE DE PROPÓSITO (causa: estado compartilhado). Os três testes usam o mesmo
//     registro. Escritos nesta ordem eles passam, porque cada um depende em silêncio do que o
//     anterior deixou. O laboratório os roda com `bun test --randomize`, como muitos ambientes
//     de CI fazem, e aí qualquer outra ordem quebra pelo menos um: só 1 das 6 ordens possíveis
//     fica verde.
// ES: INTERMITENTE A PROPÓSITO (causa: estado compartido). Las tres pruebas usan el mismo
//     registro. Escritas en este orden pasan, porque cada una depende en silencio de lo que dejó la
//     anterior. El laboratorio las ejecuta con `bun test --randomize`, como hacen muchos entornos
//     de CI, y entonces cualquier otro orden rompe al menos una: solo 1 de los 6 órdenes posibles
//     queda en verde.
test("a new registry has no invoices", () => {
	expect(sharedRegistry.list()).toHaveLength(0);
});

test("the first invoice is number 1", () => {
	expect(sharedRegistry.issue("Ana").number).toBe(1);
});

test("the second invoice is number 2", () => {
	expect(sharedRegistry.issue("Bruno").number).toBe(2);
});
