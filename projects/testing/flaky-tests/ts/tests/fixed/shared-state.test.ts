import { beforeEach, expect, test } from "bun:test";
import { createInvoiceRegistry, type InvoiceRegistry } from "../../src/invoices";

// EN: FIXED (isolation). `beforeEach` gives every test a brand-new registry, a fresh fixture.
//     Each test now builds everything it needs and leaves nothing behind, so the tests pass in
//     any order, alone or together. They are run with `--randomize` too, to prove it.
// PT: CORRIGIDO (isolamento). O `beforeEach` dá a cada teste um registro novinho, uma fixture
//     nova. Cada teste agora monta tudo de que precisa e não deixa nada para trás, então os
//     testes passam em qualquer ordem, sozinhos ou juntos. Eles também são rodados com
//     `--randomize`, para provar isso.
// ES: CORREGIDO (aislamiento). El `beforeEach` le da a cada prueba un registro nuevecito, un fixture
//     nuevo. Cada prueba ahora arma todo lo que necesita y no deja nada atrás, así que las
//     pruebas pasan en cualquier orden, solas o juntas. También se ejecutan con
//     `--randomize`, para demostrarlo.
let registry: InvoiceRegistry;

beforeEach(() => {
	registry = createInvoiceRegistry();
});

test("a new registry has no invoices", () => {
	expect(registry.list()).toHaveLength(0);
});

test("the first invoice is number 1", () => {
	expect(registry.issue("Ana").number).toBe(1);
});

test("the second invoice is number 2", () => {
	registry.issue("Ana");
	expect(registry.issue("Bruno").number).toBe(2);
});
