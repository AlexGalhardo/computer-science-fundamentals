import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MAX_CALL_DEPTH } from "../src/interpreter";
import { type RunResult, Session } from "../src/session";

const run = (source: string): RunResult => new Session().run(source);
const output = (source: string): string[] => {
	const result = run(source);
	expect(result.errors).toEqual([]);
	return result.output;
};

// EN: The example suite. Every `examples/<name>.mini` has an `examples/<name>.out` with the exact
//     text it must print. The bytecode virtual machine of MP-COMP-3 is tested against the same
//     pairs, which is how the two implementations are kept in agreement.
// PT: A suíte de exemplos. Todo `examples/<nome>.mini` tem um `examples/<nome>.out` com o texto
//     exato que deve imprimir. A máquina virtual de bytecode do MP-COMP-3 é testada contra os
//     mesmos pares, e é assim que as duas implementações são mantidas de acordo.
// ES: La suite de ejemplos. Todo `examples/<nombre>.mini` tiene un `examples/<nombre>.out` con el
//     texto exacto que debe imprimir. La máquina virtual de bytecode del MP-COMP-3 se prueba
//     contra los mismos pares, y así se mantiene de acuerdo a las dos implementaciones.
const examples = join(import.meta.dir, "..", "..", "examples");
const programs = readdirSync(examples).filter((name) => name.endsWith(".mini"));

test("the example suite has one program per construct", () => {
	expect(programs.length).toBeGreaterThanOrEqual(11);
});

for (const file of programs) {
	test(`example ${file} prints the expected output`, () => {
		const expected = readFileSync(join(examples, file.replace(/\.mini$/, ".out")), "utf8");
		const result = run(readFileSync(join(examples, file), "utf8"));
		expect(result.errors).toEqual([]);
		expect(`${result.output.join("\n")}\n`).toBe(expected);
	});
}

test("variables and scopes: the innermost declaration wins and disappears with its block", () => {
	expect(output('let a = "outer"; { let a = "inner"; print a; } print a;')).toEqual(["inner", "outer"]);
	expect(output("let a = 1; { a = 2; } print a;")).toEqual(["2"]);
	expect(run("{ let hidden = 1; } print hidden;").errors).toEqual([
		"[line 1, column 27] runtime error: undefined variable 'hidden'",
	]);
});

test("static scope: a function sees the variables of where it was written, not of its caller", () => {
	const source = 'let x = "global"; fn show() { print x; } fn caller() { let x = "local"; show(); } caller();';
	expect(output(source)).toEqual(["global"]);
});

test("functions: arguments, return value, recursion, implicit nil", () => {
	expect(output("fn fact(n) { if n <= 1 { return 1; } return n * fact(n - 1); } print fact(10);")).toEqual([
		"3628800",
	]);
	expect(output("fn nothing() { } print nothing();")).toEqual(["nil"]);
	expect(output("fn early(n) { while true { if n > 2 { return n; } n = n + 1; } } print early(0);")).toEqual(["3"]);
});

test("closures: each call of the outer function creates an independent captured variable", () => {
	const source = [
		"fn makeCounter() { let n = 0; fn next() { n = n + 1; return n; } return next; }",
		"let a = makeCounter(); let b = makeCounter();",
		"a(); a(); print a(); print b();",
	].join("\n");
	expect(output(source)).toEqual(["3", "1"]);
});

test("closures capture the variable, not a copy of its value", () => {
	expect(output("let n = 1; fn get() { return n; } n = 2; print get();")).toEqual(["2"]);
});

test("if and while", () => {
	expect(output('if 1 < 2 { print "yes"; } else { print "no"; }')).toEqual(["yes"]);
	expect(output('if 0 { print "zero is true"; }')).toEqual(["zero is true"]);
	expect(output("let i = 0; while i < 3 { print i; i = i + 1; }")).toEqual(["0", "1", "2"]);
	expect(output("while false { print 1; }")).toEqual([]);
});

test("and / or short-circuit: the right side does not run when the left side decides", () => {
	expect(output('fn boom() { print "ran"; return true; } print false and boom(); print true or boom();')).toEqual([
		"false",
		"true",
	]);
});

test("run-time error: undefined variable, with line and column", () => {
	expect(run("let a = 1;\nprint a + missing;").errors).toEqual([
		"[line 2, column 11] runtime error: undefined variable 'missing'",
	]);
	expect(run("missing = 1;").errors).toEqual(["[line 1, column 9] runtime error: undefined variable 'missing'"]);
});

test("run-time error: wrong argument count, with line and column", () => {
	expect(run("fn add(a, b) { return a + b; }\nprint add(1);").errors).toEqual([
		"[line 2, column 10] runtime error: expected 2 arguments but got 1",
	]);
	expect(run("fn zero() { }\nzero(1, 2);").errors).toEqual([
		"[line 2, column 5] runtime error: expected 0 arguments but got 2",
	]);
});

test("run-time error: division by zero, with line and column", () => {
	expect(run("let d = 0;\nprint 10 /\n  d;").errors).toEqual(["[line 2, column 10] runtime error: division by zero"]);
	expect(run("print 5 % 0;").errors).toEqual(["[line 1, column 9] runtime error: division by zero"]);
});

test("run-time errors: wrong operand types and calling a non-function", () => {
	expect(run('print 1 + "a";').errors).toEqual([
		"[line 1, column 9] runtime error: operands of '+' must be two numbers or two strings",
	]);
	expect(run('print "a" < "b";').errors).toEqual([
		"[line 1, column 11] runtime error: operands of '<' must be numbers",
	]);
	expect(run("print -true;").errors).toEqual(["[line 1, column 7] runtime error: operand of '-' must be a number"]);
	expect(run("let f = 3; f();").errors).toEqual(["[line 1, column 13] runtime error: can only call functions"]);
});

test("output printed before a run-time error is kept", () => {
	const result = run('print "before";\nprint 1 / 0;\nprint "after";');
	expect(result.output).toEqual(["before"]);
	expect(result.errors).toEqual(["[line 2, column 9] runtime error: division by zero"]);
});

test("unbounded recursion is reported, and does not crash the host", () => {
	expect(run("fn forever(n) { return forever(n + 1); }\nforever(0);").errors).toEqual([
		"[line 1, column 31] runtime error: stack overflow",
	]);
	const deepest = `fn down(n) { if n == 0 { return 0; } return down(n - 1); } print down(${MAX_CALL_DEPTH - 1});`;
	expect(output(deepest)).toEqual(["0"]);
});

test("a syntax error stops the program before anything runs", () => {
	const result = run('print "first";\nprint ;');
	expect(result.output).toEqual([]);
	expect(result.errors).toEqual(["[line 2, column 7] syntax error: expected an expression, found ';'"]);
});

// EN: The REPL is a session that receives one line at a time. State must survive between lines,
//     and a line that fails must not destroy what earlier lines defined.
// PT: O REPL é uma sessão que recebe uma linha por vez. O estado precisa sobreviver entre as
//     linhas, e uma linha que falha não pode destruir o que as linhas anteriores definiram.
// ES: El REPL es una sesión que recibe una línea a la vez. El estado debe sobrevivir entre las
//     líneas, y una línea que falla no puede destruir lo que las líneas anteriores definieron.
test("REPL session: a function defined on one line is called on a later one", () => {
	const session = new Session();
	const line = (source: string): string[] => {
		const result = session.run(source, { echo: true });
		return [...result.output, ...result.errors];
	};
	expect(line("fn square(x) { return x * x; }")).toEqual([]);
	expect(line("let side = 7;")).toEqual([]);
	expect(line("square(side);")).toEqual(["49"]);
	expect(line("square(side, 1);")).toEqual(["[line 1, column 7] runtime error: expected 1 arguments but got 2"]);
	expect(line("side = side + 1;")).toEqual(["8"]);
	expect(line("print square(side);")).toEqual(["64"]);
	expect(line("print nil;")).toEqual(["nil"]);
});
