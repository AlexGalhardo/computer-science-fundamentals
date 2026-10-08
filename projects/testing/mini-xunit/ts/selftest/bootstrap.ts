import { TestCase, TestResult, TestSuite } from "../src/xunit";

// EN: THE BOOTSTRAP PROBLEM. The framework is tested with itself, and a broken framework could
//     report its own tests as passing: if failures were silently swallowed, every self-test
//     would be "green". So before trusting it, this file checks the most basic promises with
//     nothing but `if` and `throw`: a failing test is counted as failed, a passing test is not,
//     and every test is counted. Only after this does the self-test run mean anything.
// PT: O PROBLEMA DO BOOTSTRAP. O framework é testado com ele mesmo, e um framework quebrado
//     poderia relatar os próprios testes como aprovados: se as falhas fossem engolidas em
//     silêncio, todo autoteste ficaria "verde". Então, antes de confiar nele, este arquivo
//     confere as promessas mais básicas só com `if` e `throw`: um teste que falha é contado como
//     falha, um que passa não é, e todo teste é contado. Só depois disso a execução dos
//     autotestes significa alguma coisa.
class Probe extends TestCase {
	testPasses(): void {}

	testFails(): void {
		throw new Error("on purpose");
	}
}

function check(condition: boolean, message: string): void {
	if (!condition) {
		console.error(`bootstrap: FAILED - ${message}`);
		process.exit(1);
	}
}

const passing = new TestResult();
await new Probe("testPasses").run(passing);
check(passing.runCount === 1, "a test that ran must be counted");
check(passing.wasSuccessful(), "a passing test must not be reported as a failure");

const failing = new TestResult();
await new Probe("testFails").run(failing);
check(failing.runCount === 1, "a failing test must still be counted");
check(!failing.wasSuccessful(), "a failing test must be reported as a failure");
check(failing.failures[0]?.message === "on purpose", "the failure must keep the message");

const both = new TestResult();
await TestSuite.fromClass(Probe).run(both);
check(both.summary() === "2 run, 1 failed", `a suite must run every test, got "${both.summary()}"`);

console.log("bootstrap: ok");
