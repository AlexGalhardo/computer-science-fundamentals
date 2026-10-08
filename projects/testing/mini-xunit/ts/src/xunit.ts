import { relative, sep } from "node:path";

// EN: A whole xUnit framework in one file. It uses no test library: only classes, exceptions
//     and a loop. Four ideas carry everything:
//       TestCase    one test: a name, a method with that name, and a fixture around it
//       TestResult  the collector: how many ran, which failed and why
//       TestSuite   a list of things that can run (tests or other suites)
//       assertions  methods that throw when an expectation is not met
// PT: Um framework xUnit inteiro em um arquivo. Ele não usa nenhuma biblioteca de testes: só
//     classes, exceções e um laço. Quatro ideias carregam tudo:
//       TestCase    um teste: um nome, um método com esse nome e uma fixture em volta
//       TestResult  o coletor: quantos rodaram, quais falharam e por quê
//       TestSuite   uma lista de coisas que sabem rodar (testes ou outras suítes)
//       asserções   métodos que lançam quando uma expectativa não é atendida

const FRAMEWORK_DIR = import.meta.dir;

export class AssertionFailure extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AssertionFailure";
	}
}

export interface Failure {
	test: string;
	message: string;
	location: string;
}

// EN: The location of a failure is the first line of the stack trace that is NOT inside the
//     framework. An assertion throws from `assertEqual`, in this file, but what the reader needs
//     is the line of the test that called it.
// PT: O local de uma falha é a primeira linha do stack trace que NÃO está dentro do framework.
//     Uma asserção lança de dentro do `assertEqual`, neste arquivo, mas o que o leitor precisa é
//     da linha do teste que a chamou.
export function locationOf(error: unknown): string {
	if (!(error instanceof Error) || error.stack === undefined) {
		return "unknown location";
	}
	for (const line of error.stack.split("\n")) {
		const frame = line.trim().match(/\(?((?:\/|[A-Za-z]:[\\/])[^()]+?):(\d+):\d+\)?$/);
		const file = frame?.[1];
		if (frame === null || file === undefined || file.startsWith(FRAMEWORK_DIR)) {
			continue;
		}
		return `${relative(process.cwd(), file).split(sep).join("/")}:${frame[2]}`;
	}
	return "unknown location";
}

export class TestResult {
	runCount = 0;
	readonly failures: Failure[] = [];

	testStarted(): void {
		this.runCount++;
	}

	testFailed(test: string, error: unknown): void {
		const message = error instanceof Error ? error.message : String(error);
		this.failures.push({ test, message, location: locationOf(error) });
	}

	wasSuccessful(): boolean {
		return this.failures.length === 0;
	}

	summary(): string {
		return `${this.runCount} run, ${this.failures.length} failed`;
	}
}

// EN: Anything with `run(result)` can be put in a suite. A single test and a suite of a thousand
//     tests look the same from outside (the Composite pattern).
// PT: Qualquer coisa com `run(result)` pode entrar em uma suíte. Um teste sozinho e uma suíte de
//     mil testes têm a mesma cara por fora (o padrão Composite).
export interface Runnable {
	run(result: TestResult): Promise<void>;
}

export type TestClass = new (name: string) => TestCase;

export class TestCase implements Runnable {
	readonly name: string;

	constructor(name: string) {
		this.name = name;
	}

	// EN: The fixture: `setUp` builds what the test needs, `tearDown` cleans it up. Subclasses
	//     override them. The defaults do nothing.
	// PT: A fixture: o `setUp` monta o que o teste precisa, o `tearDown` limpa. As subclasses os
	//     sobrescrevem. Os padrões não fazem nada.
	setUp(): void | Promise<void> {}

	tearDown(): void | Promise<void> {}

	label(): string {
		return `${this.constructor.name}.${this.name}`;
	}

	// EN: The Template Method at the heart of xUnit: setUp, the test method, tearDown, always in
	//     that order. Two details matter:
	//       - `tearDown` is in a `finally`, so it runs even when the test fails
	//       - an exception is CAUGHT and recorded, never rethrown, so one failing test cannot
	//         stop the tests that come after it
	//     The method to call is looked up by name at run time (Pluggable Selector): that is how
	//     one class holds many tests.
	// PT: O Template Method no coração do xUnit: setUp, o método de teste, tearDown, sempre nessa
	//     ordem. Dois detalhes importam:
	//       - o `tearDown` fica em um `finally`, então roda mesmo quando o teste falha
	//       - uma exceção é CAPTURADA e registrada, nunca relançada, então um teste que falha
	//         não consegue parar os testes que vêm depois
	//     O método a chamar é procurado pelo nome em tempo de execução (Pluggable Selector): é
	//     assim que uma classe guarda vários testes.
	async run(result: TestResult): Promise<void> {
		result.testStarted();
		try {
			await this.setUp();
			try {
				const method: unknown = Reflect.get(this, this.name);
				if (typeof method !== "function") {
					throw new Error(`no test method named ${this.name}`);
				}
				await method.call(this);
			} finally {
				await this.tearDown();
			}
		} catch (error) {
			result.testFailed(this.label(), error);
		}
	}

	// EN: An assertion is just an `if` that throws. The message says what was expected and what
	//     arrived, because that is the first thing the reader of a red test wants to know.
	// PT: Uma asserção é só um `if` que lança. A mensagem diz o que era esperado e o que chegou,
	//     porque é a primeira coisa que o leitor de um teste vermelho quer saber.
	assertEqual(actual: unknown, expected: unknown): void {
		if (!Bun.deepEquals(actual, expected, true)) {
			throw new AssertionFailure(`expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
		}
	}

	assertTrue(condition: boolean, message = "expected the condition to be true"): void {
		if (!condition) {
			throw new AssertionFailure(message);
		}
	}

	async assertThrows(action: () => unknown, expectedMessage: string): Promise<void> {
		let thrown: unknown;
		try {
			await action();
		} catch (error) {
			thrown = error;
		}
		if (thrown === undefined) {
			throw new AssertionFailure("expected an error but none was thrown");
		}
		const message = thrown instanceof Error ? thrown.message : String(thrown);
		if (!message.includes(expectedMessage)) {
			throw new AssertionFailure(`expected an error containing "${expectedMessage}" but got "${message}"`);
		}
	}
}

// EN: Discovery inside a class: every method whose name starts with "test" is a test. The suite
//     creates ONE NEW INSTANCE PER TEST METHOD, so each test starts from a fresh fixture and
//     cannot see fields changed by another test.
// PT: Descoberta dentro de uma classe: todo método cujo nome começa com "test" é um teste. A
//     suíte cria UMA INSTÂNCIA NOVA POR MÉTODO DE TESTE, então cada teste parte de uma fixture
//     nova e não enxerga campos alterados por outro teste.
export function testMethodNames(testClass: TestClass): string[] {
	const names = new Set<string>();
	// EN: Walk up the inheritance chain, so test methods inherited from a parent class count too.
	// PT: Sobe a cadeia de herança, para que métodos de teste herdados de uma classe mãe também contem.
	let proto: object | null = testClass.prototype;
	while (proto !== null && proto !== Object.prototype) {
		for (const name of Object.getOwnPropertyNames(proto)) {
			if (name.startsWith("test") && typeof Reflect.get(testClass.prototype, name) === "function") {
				names.add(name);
			}
		}
		proto = Object.getPrototypeOf(proto);
	}
	return [...names].sort();
}

export class TestSuite implements Runnable {
	private readonly tests: Runnable[] = [];

	static fromClass(testClass: TestClass): TestSuite {
		const suite = new TestSuite();
		for (const name of testMethodNames(testClass)) {
			suite.add(new testClass(name));
		}
		return suite;
	}

	add(test: Runnable): void {
		this.tests.push(test);
	}

	async run(result: TestResult): Promise<void> {
		for (const test of this.tests) {
			await test.run(result);
		}
	}
}
