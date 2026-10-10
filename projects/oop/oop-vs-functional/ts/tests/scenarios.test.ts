import { describe, expect, test } from "bun:test";
import { runWithFunctions, runWithObjects } from "../src/run";
import { loadScenarios, parseScenarios } from "../src/scenarios";

const scenarios = loadScenarios();

// EN: The acceptance test of the mini-project: the same scenarios, read from the shared file,
//     must give the same receipt in the version with objects and in the version with functions.
// PT: O teste de aceitação do mini-projeto: os mesmos cenários, lidos do arquivo compartilhado,
//     precisam dar o mesmo recibo na versão com objetos e na versão com funções.
// ES: La prueba de aceptación del miniproyecto: los mismos escenarios, leídos del archivo
//     compartido, deben dar el mismo recibo en la versión con objetos y en la versión con funciones.
describe("shared acceptance scenarios", () => {
	test("the file has receipts and rejections", () => {
		expect(scenarios.length).toBeGreaterThanOrEqual(15);
		expect(scenarios.some((scenario) => scenario.expected.kind === "error")).toBe(true);
		expect(scenarios.some((scenario) => scenario.expected.kind === "receipt")).toBe(true);
	});

	for (const scenario of scenarios) {
		test(`objects: ${scenario.name}`, () => {
			expect(runWithObjects(scenario)).toEqual(scenario.expected);
		});
		test(`functions: ${scenario.name}`, () => {
			expect(runWithFunctions(scenario)).toEqual(scenario.expected);
		});
	}
});

describe("scenario reader", () => {
	test("a line outside the format stops the run with its number", () => {
		expect(() => parseScenarios("scenario broken\nitem PEN two 1")).toThrow("line 2");
		expect(() => parseScenarios("item PEN 250 1")).toThrow("line 1");
	});
});
