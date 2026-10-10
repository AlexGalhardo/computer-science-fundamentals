import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TestCase, TestResult, TestSuite, testMethodNames } from "../src/xunit";
import { BrokenSetUp, Counted, WasRun } from "./fixtures";

// EN: THE FRAMEWORK TESTS ITSELF. These classes extend the TestCase they are testing, and they
//     are found and run by the same discovery and the same loop. The trick that makes it
//     possible: the subject of each test is ANOTHER test case (WasRun), run by hand with its own
//     TestResult, so its failures stay inside that result and do not leak into the real run.
// PT: O FRAMEWORK TESTA A SI MESMO. Estas classes estendem o TestCase que estão testando, e são
//     encontradas e rodadas pela mesma descoberta e pelo mesmo laço. O truque que torna isso
//     possível: o objeto de cada teste é OUTRO caso de teste (WasRun), rodado à mão com o seu
//     próprio TestResult, então as falhas dele ficam dentro daquele resultado e não vazam para a
//     execução de verdade.
// ES: EL FRAMEWORK SE PRUEBA A SÍ MISMO. Estas clases extienden el TestCase que están probando, y
//     las encuentran y ejecutan el mismo descubrimiento y el mismo bucle. El truco que lo hace
//     posible: el objeto de cada prueba es OTRO caso de prueba (WasRun), ejecutado a mano con su
//     propio TestResult, así que sus fallos quedan dentro de ese resultado y no se filtran a la
//     ejecución de verdad.

function lineOf(marker: string): number {
	const lines = readFileSync(join(import.meta.dir, "fixtures.ts"), "utf8").split("\n");
	return lines.findIndex((line) => line.includes(`marker: ${marker}`)) + 1;
}

export class TestCaseTest extends TestCase {
	private result = new TestResult();

	override setUp(): void {
		this.result = new TestResult();
	}

	async testTemplateMethodOrder(): Promise<void> {
		const test = new WasRun("testMethod");
		await test.run(this.result);
		this.assertEqual(test.log, "setUp testMethod tearDown ");
	}

	async testPassingTestIsCounted(): Promise<void> {
		await new WasRun("testMethod").run(this.result);
		this.assertEqual(this.result.summary(), "1 run, 0 failed");
		this.assertTrue(this.result.wasSuccessful());
	}

	async testFailingTestIsCountedAsFailed(): Promise<void> {
		await new WasRun("testBrokenMethod").run(this.result);
		this.assertEqual(this.result.summary(), "1 run, 1 failed");
		this.assertTrue(!this.result.wasSuccessful());
	}

	async testTearDownRunsEvenWhenTheTestFails(): Promise<void> {
		const test = new WasRun("testBrokenMethod");
		await test.run(this.result);
		this.assertEqual(test.log, "setUp testBrokenMethod tearDown ");
	}

	async testFailingSetUpIsReportedAndSkipsTheTest(): Promise<void> {
		const test = new BrokenSetUp("testMethod");
		await test.run(this.result);
		this.assertEqual(this.result.summary(), "1 run, 1 failed");
		this.assertEqual(test.log, "");
		this.assertEqual(this.result.failures[0]?.message, "setUp failed");
	}

	async testAsyncTestIsAwaited(): Promise<void> {
		const test = new WasRun("testAsyncMethod");
		await test.run(this.result);
		this.assertEqual(test.log, "setUp testAsyncMethod tearDown ");
	}

	async testUnknownMethodIsAFailureNotACrash(): Promise<void> {
		await new WasRun("testThatDoesNotExist").run(this.result);
		this.assertEqual(this.result.failures[0]?.message, "no test method named testThatDoesNotExist");
	}

	async testFailureCarriesNameMessageAndLocation(): Promise<void> {
		await new WasRun("testBrokenMethod").run(this.result);
		this.assertEqual(this.result.failures, [
			{ test: "WasRun.testBrokenMethod", message: "boom", location: `selftest/fixtures.ts:${lineOf("boom")}` },
		]);
	}

	async testAssertionFailurePointsAtTheTestNotAtTheFramework(): Promise<void> {
		await new WasRun("testFailedAssertion").run(this.result);
		const failure = this.result.failures[0];
		this.assertEqual(failure?.message, "expected 5 but got 4");
		this.assertEqual(failure?.location, `selftest/fixtures.ts:${lineOf("assertion")}`);
	}
}

export class AssertionTest extends TestCase {
	testAssertEqualComparesStructures(): void {
		this.assertEqual({ a: [1, 2] }, { a: [1, 2] });
	}

	async testAssertEqualThrowsOnDifference(): Promise<void> {
		await this.assertThrows(() => this.assertEqual([1], [2]), "expected [2] but got [1]");
	}

	async testAssertTrueThrowsWithTheGivenMessage(): Promise<void> {
		await this.assertThrows(() => this.assertTrue(false, "custom message"), "custom message");
	}

	async testAssertThrowsFailsWhenNothingIsThrown(): Promise<void> {
		await this.assertThrows(() => this.assertThrows(() => {}, "anything"), "none was thrown");
	}
}

export class TestSuiteTest extends TestCase {
	async testSuiteRunsEveryTestAndKeepsGoingAfterAFailure(): Promise<void> {
		const suite = new TestSuite();
		suite.add(new WasRun("testBrokenMethod"));
		suite.add(new WasRun("testMethod"));
		const result = new TestResult();
		await suite.run(result);
		this.assertEqual(result.summary(), "2 run, 1 failed");
	}

	async testSuitesCanBeNested(): Promise<void> {
		const inner = new TestSuite();
		inner.add(new WasRun("testMethod"));
		const outer = new TestSuite();
		outer.add(inner);
		outer.add(new WasRun("testMethod"));
		const result = new TestResult();
		await outer.run(result);
		this.assertEqual(result.summary(), "2 run, 0 failed");
	}

	testOnlyMethodsStartingWithTestAreDiscovered(): void {
		this.assertEqual(testMethodNames(WasRun), [
			"testAsyncMethod",
			"testBrokenMethod",
			"testFailedAssertion",
			"testMethod",
		]);
	}

	async testEachTestMethodGetsAFreshInstance(): Promise<void> {
		Counted.created = 0;
		Counted.seen = [];
		const result = new TestResult();
		await TestSuite.fromClass(Counted).run(result);
		this.assertEqual(result.summary(), "2 run, 0 failed");
		this.assertEqual(Counted.seen, [1, 2]);
	}
}
