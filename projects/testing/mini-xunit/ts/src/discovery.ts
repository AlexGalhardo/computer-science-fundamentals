import { resolve } from "node:path";
import { TestCase, type TestClass, TestSuite } from "./xunit";

// EN: Discovery across files: every file named `*.xunit.ts` under a folder is imported, and
//     every class it exports that extends TestCase becomes a suite. Nobody keeps a list of
//     tests by hand, so a new test cannot be forgotten. A naming convention is all a framework
//     needs to find the tests.
// PT: Descoberta entre arquivos: todo arquivo chamado `*.xunit.ts` dentro de uma pasta é
//     importado, e toda classe exportada por ele que estende TestCase vira uma suíte. Ninguém
//     mantém uma lista de testes à mão, então um teste novo não pode ser esquecido. Uma convenção
//     de nomes é tudo de que um framework precisa para achar os testes.
// ES: Descubrimiento entre archivos: todo archivo llamado `*.xunit.ts` dentro de una carpeta se
//     importa, y toda clase que exporta y extiende TestCase se convierte en una suite. Nadie
//     mantiene una lista de pruebas a mano, así que una prueba nueva no se puede olvidar. Una
//     convención de nombres es todo lo que un framework necesita para encontrar las pruebas.
export const TEST_FILE_PATTERN = "**/*.xunit.ts";

function isTestClass(value: unknown): value is TestClass {
	return typeof value === "function" && value.prototype instanceof TestCase;
}

export async function discover(directory: string): Promise<TestSuite> {
	const root = resolve(directory);
	const files = await Array.fromAsync(new Bun.Glob(TEST_FILE_PATTERN).scan({ cwd: root, absolute: true }));
	const suite = new TestSuite();
	// EN: Sorted, so the tests run in the same order on every machine.
	// PT: Ordenado, para os testes rodarem na mesma ordem em qualquer máquina.
	// ES: Ordenado, para que las pruebas se ejecuten en el mismo orden en cualquier máquina.
	for (const file of files.sort()) {
		const exported: Record<string, unknown> = await import(file);
		for (const value of Object.values(exported)) {
			if (isTestClass(value)) {
				suite.add(TestSuite.fromClass(value));
			}
		}
	}
	return suite;
}
