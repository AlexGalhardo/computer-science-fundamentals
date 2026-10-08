import { TestCase } from "../src/xunit";

// EN: Test cases used as SUBJECTS by the self-tests. They are not tests of the framework
//     themselves, so they live in a file that discovery does not pick up (it is not named
//     `*.xunit.ts`). Each one records what happened to it in `log`.
// PT: Casos de teste usados como OBJETOS de estudo pelos autotestes. Eles não são testes do
//     framework, então moram em um arquivo que a descoberta não pega (não se chama `*.xunit.ts`).
//     Cada um registra em `log` o que aconteceu com ele.
export class WasRun extends TestCase {
	log = "";

	override setUp(): void {
		this.log += "setUp ";
	}

	override tearDown(): void {
		this.log += "tearDown ";
	}

	testMethod(): void {
		this.log += "testMethod ";
	}

	testBrokenMethod(): void {
		this.log += "testBrokenMethod ";
		throw new Error("boom"); // marker: boom
	}

	testFailedAssertion(): void {
		this.assertEqual(2 + 2, 5); // marker: assertion
	}

	async testAsyncMethod(): Promise<void> {
		await Bun.sleep(1);
		this.log += "testAsyncMethod ";
	}

	helper(): void {}
}

export class BrokenSetUp extends TestCase {
	log = "";

	override setUp(): void {
		throw new Error("setUp failed");
	}

	override tearDown(): void {
		this.log += "tearDown ";
	}

	testMethod(): void {
		this.log += "testMethod ";
	}
}

// EN: Every instance gets a number. If two tests shared one instance, they would share it.
// PT: Cada instância recebe um número. Se dois testes dividissem uma instância, dividiriam o número.
export class Counted extends TestCase {
	static created = 0;
	static seen: number[] = [];
	private readonly serial = ++Counted.created;
	private touched = false;

	private record(): void {
		this.assertTrue(!this.touched, "the fixture was already used by another test");
		this.touched = true;
		Counted.seen.push(this.serial);
	}

	testFirst(): void {
		this.record();
	}

	testSecond(): void {
		this.record();
	}
}
