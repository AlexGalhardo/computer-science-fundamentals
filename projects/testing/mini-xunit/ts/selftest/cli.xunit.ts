import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exitCodeFor, formatReport } from "../src/cli";
import { discover } from "../src/discovery";
import { TestCase, TestResult } from "../src/xunit";

// EN: Discovery and reporting, checked from the outside: the command line is started as a real
//     process on the example folders, and the test looks at what a user or a CI job would see,
//     the printed report and the exit code.
// PT: Descoberta e relatório, conferidos por fora: a linha de comando é iniciada como um
//     processo de verdade nas pastas de exemplo, e o teste olha o que um usuário ou um job de CI
//     veria, o relatório impresso e o código de saída.
const ROOT = join(import.meta.dir, "..");

async function runCli(directory: string): Promise<{ exitCode: number; output: string }> {
	const child = Bun.spawn(["bun", "run", "src/cli.ts", directory], { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
	const [output, exitCode] = await Promise.all([new Response(child.stdout).text(), child.exited]);
	return { exitCode, output };
}

export class DiscoveryTest extends TestCase {
	async testFindsEveryTestMethodOfEveryTestFile(): Promise<void> {
		const result = new TestResult();
		await (await discover(join(ROOT, "examples", "passing"))).run(result);
		this.assertEqual(result.summary(), "4 run, 0 failed");
	}

	async testFindsNothingInAFolderWithoutTestFiles(): Promise<void> {
		const result = new TestResult();
		await (await discover(join(ROOT, "src"))).run(result);
		this.assertEqual(result.runCount, 0);
	}
}

export class ReportTest extends TestCase {
	testReportListsNameMessageLocationAndSummary(): void {
		const result = new TestResult();
		result.testStarted();
		result.testStarted();
		result.failures.push({
			test: "CartTest.testTotal",
			message: "expected 1 but got 2",
			location: "cart.xunit.ts:7",
		});
		this.assertEqual(
			formatReport(result),
			["FAIL CartTest.testTotal", "     expected 1 but got 2", "     at cart.xunit.ts:7", "2 run, 1 failed"].join(
				"\n",
			),
		);
	}

	testExitCodes(): void {
		const empty = new TestResult();
		this.assertEqual(exitCodeFor(empty), 2);
		const green = new TestResult();
		green.testStarted();
		this.assertEqual(exitCodeFor(green), 0);
		const red = new TestResult();
		red.testStarted();
		red.testFailed("X.testY", new Error("no"));
		this.assertEqual(exitCodeFor(red), 1);
	}
}

export class CommandLineTest extends TestCase {
	async testPassingFolderExitsWithZero(): Promise<void> {
		const run = await runCli("examples/passing");
		this.assertEqual(run.exitCode, 0);
		this.assertEqual(run.output.trim(), "4 run, 0 failed");
	}

	async testFailingTestReportsNameMessageLocationAndExitsNonZero(): Promise<void> {
		const source = readFileSync(join(ROOT, "examples", "failing", "cart.xunit.ts"), "utf8").split("\n");
		const line = source.findIndex((text) => text.includes("marker: wrong expectation")) + 1;

		const run = await runCli("examples/failing");

		this.assertEqual(run.exitCode, 1);
		this.assertEqual(
			run.output.trim(),
			[
				"FAIL CartTest.testTotalWithDiscount",
				"     expected 100 but got 90",
				`     at examples/failing/cart.xunit.ts:${line}`,
				"2 run, 1 failed",
			].join("\n"),
		);
	}

	async testFolderWithNoTestsExitsWithTwo(): Promise<void> {
		const empty = mkdtempSync(join(tmpdir(), "mini-xunit-empty-"));
		try {
			const run = await runCli(empty);
			this.assertEqual(run.exitCode, 2);
			this.assertEqual(run.output.trim(), "0 run, 0 failed");
		} finally {
			rmSync(empty, { recursive: true, force: true });
		}
	}
}
