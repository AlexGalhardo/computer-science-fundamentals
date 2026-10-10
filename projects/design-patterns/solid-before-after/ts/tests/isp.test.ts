import { describe, expect, test } from "bun:test";
import * as after from "../src/isp/after";
import * as before from "../src/isp/before";
import type { Product } from "../src/isp/types";

const products: Product[] = [
	{ id: "p1", name: "Keyboard", priceCents: 20000 },
	{ id: "p2", name: "Mouse", priceCents: 7990 },
];
const csv = "s1,Cable,1500\ns2,Adapter,3250\n";

// EN: The two versions give their catalogs different types, so the shared tests describe the
//     module through closures: build, read, write. The assertions are the same for both.
// PT: As duas versões dão tipos diferentes aos seus catálogos, então os testes compartilhados
//     descrevem o módulo por meio de funções: montar, ler, gravar. As asserções são as mesmas
//     para as duas.
// ES: Las dos versiones dan tipos distintos a sus catálogos, así que las pruebas compartidas
//     describen el módulo mediante funciones: montar, leer, escribir. Las aserciones son las
//     mismas para las dos.
interface Scenario {
	memoryReport(): string;
	csvReport(): string;
	reportAfterIncrease(percent: number): string;
	findInCsv(id: string): Product | null;
}

function behaviour(name: string, scenario: Scenario): void {
	describe(`isp: ${name}`, () => {
		test("reports the prices of a catalog kept in memory", () => {
			expect(scenario.memoryReport()).toBe("Keyboard: 200.00\nMouse: 79.90");
		});

		test("reports the prices of a supplier's CSV list", () => {
			expect(scenario.csvReport()).toBe("Cable: 15.00\nAdapter: 32.50");
		});

		test("finds one product of the CSV list", () => {
			expect(scenario.findInCsv("s2")).toEqual({ id: "s2", name: "Adapter", priceCents: 3250 });
			expect(scenario.findInCsv("missing")).toBeNull();
		});

		test("raises the prices of a writable catalog", () => {
			// 20000 * 1.10 = 22000; 7990 * 1.10 = 8789
			expect(scenario.reportAfterIncrease(10)).toBe("Keyboard: 220.00\nMouse: 87.89");
		});
	});
}

behaviour("before", {
	memoryReport: () => before.priceReport(before.createMemoryCatalog(products)),
	csvReport: () => before.priceReport(before.createCsvCatalog(csv)),
	findInCsv: (id) => before.createCsvCatalog(csv).find(id),
	reportAfterIncrease: (percent) => {
		const catalog = before.createMemoryCatalog(products);
		before.increasePrices(catalog, percent);
		return before.priceReport(catalog);
	},
});

behaviour("after", {
	memoryReport: () => after.priceReport(after.createMemoryCatalog(products)),
	csvReport: () => after.priceReport(after.createCsvCatalog(csv)),
	findInCsv: (id) => after.createCsvCatalog(csv).find(id),
	reportAfterIncrease: (percent) => {
		const catalog = after.createMemoryCatalog(products);
		after.increasePrices(catalog, percent);
		return after.priceReport(catalog);
	},
});

describe("isp: what the fat interface costs", () => {
	// EN: With one wide interface the mistake compiles and is found only when the code runs.
	// PT: Com uma interface larga o erro compila e só é descoberto quando o código roda.
	// ES: Con una interfaz ancha el error compila y solo se descubre cuando el código se ejecuta.
	test("before: a read-only catalog is accepted by a writer and fails at run time", () => {
		const catalog = before.createCsvCatalog(csv);
		expect(() => before.increasePrices(catalog, 10)).toThrow("the CSV catalog is read-only");
	});

	// EN: A test double shows who depends on what. The report of `before` demands four methods
	//     and uses one; two of the four exist here only to satisfy the type.
	// PT: Um dublê de teste mostra quem depende de quê. O relatório de `before` exige quatro
	//     métodos e usa um; dois dos quatro existem aqui só para satisfazer o tipo.
	// ES: Un doble de prueba muestra quién depende de qué. El informe de `before` exige cuatro
	//     métodos y usa uno; dos de los cuatro existen aquí solo para satisfacer el tipo.
	test("before: the double for a report must implement writing it never uses", () => {
		const double: before.ProductCatalog = {
			find: () => null,
			list: () => products,
			save: () => {
				throw new Error("never called");
			},
			remove: () => {
				throw new Error("never called");
			},
		};
		expect(before.priceReport(double)).toContain("Keyboard");
	});

	test("after: the double for a report is a reader, and nothing else", () => {
		const double: after.ProductReader = { find: () => null, list: () => products };
		expect(after.priceReport(double)).toContain("Keyboard");
	});

	test("after: the read-only catalog has no write method to call by mistake", () => {
		const catalog = after.createCsvCatalog(csv);
		expect("save" in catalog).toBe(false);
		expect("remove" in catalog).toBe(false);
	});
});
