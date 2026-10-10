import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { printTree, toSExpression } from "../src/ast";
import { parse } from "../src/parser";
import { report } from "../src/repl";
import { formatProblem } from "../src/token";

// EN: The tree of a program as one line of text. Comparing trees as text keeps each test readable:
//     the expected value shows the grouping the parser must find.
// PT: A árvore de um programa como uma linha de texto. Comparar árvores como texto mantém cada
//     teste legível: o valor esperado mostra o agrupamento que o parser precisa encontrar.
// ES: El árbol de un programa como una línea de texto. Comparar árboles como texto mantiene cada
//     prueba legible: el valor esperado muestra la agrupación que el parser debe encontrar.
function tree(source: string): string {
	const result = parse(source);
	expect(result.errors).toEqual([]);
	return result.program.map(toSExpression).join(" ");
}

test("precedence: 1 + 2 * 3 and (1 + 2) * 3 give different trees", () => {
	expect(tree("1 + 2 * 3;")).toBe("(expr (+ 1 (* 2 3)))");
	expect(tree("(1 + 2) * 3;")).toBe("(expr (* (+ 1 2) 3))");
	expect(tree("1 + 2 * 3;")).not.toBe(tree("(1 + 2) * 3;"));
});

test("precedence: every level, from the loosest to the tightest", () => {
	expect(tree("a = b or c and d == e < f + g * -h(1);")).toBe(
		"(expr (= a (or b (and c (== d (< e (+ f (* g (- (call h 1))))))))))",
	);
	expect(tree("1 * 2 + 3 < 4 == true and x or y;")).toBe("(expr (or (and (== (< (+ (* 1 2) 3) 4) true) x) y))");
});

test("associativity: binary operators group to the left, assignment to the right", () => {
	expect(tree("8 - 3 - 2;")).toBe("(expr (- (- 8 3) 2))");
	expect(tree("8 / 4 / 2;")).toBe("(expr (/ (/ 8 4) 2))");
	expect(tree("a = b = 1;")).toBe("(expr (= a (= b 1)))");
});

test("unary operators and calls", () => {
	expect(tree("-a * b;")).toBe("(expr (* (- a) b))");
	expect(tree("!!ok;")).toBe("(expr (! (! ok)))");
	expect(tree("-f(1, 2)(3);")).toBe("(expr (- (call (call f 1 2) 3)))");
	expect(tree("f();")).toBe("(expr (call f))");
});

test("statements", () => {
	expect(tree('let s = "hi";')).toBe('(let s "hi")');
	expect(tree("print nil;")).toBe("(print nil)");
	expect(tree("while i < 3 { i = i + 1; }")).toBe("(while (< i 3) (block (expr (= i (+ i 1)))))");
	expect(tree("fn add(a, b) { return a + b; }")).toBe("(fn add(a, b) (return (+ a b)))");
	expect(tree("fn noop() { return; }")).toBe("(fn noop() (return))");
	expect(tree("{ let a = 1; { print a; } }")).toBe("(block (let a 1) (block (print a)))");
});

test("else belongs to the nearest if, and else if chains nest", () => {
	expect(tree("if a { print 1; } else if b { print 2; } else { print 3; }")).toBe(
		"(if a (block (print 1)) (block (if b (block (print 2)) (block (print 3)))))",
	);
});

test("nodes keep the position of their defining token", () => {
	const [statement] = parse("print 1 +\n  x;").program;
	expect(statement).toMatchObject({
		kind: "Print",
		line: 1,
		column: 1,
		value: { kind: "Binary", line: 1, column: 9, right: { kind: "Variable", line: 2, column: 3 } },
	});
});

test("a file with two errors reports both, and keeps the good statements", () => {
	const source = ["let a = ;", "print 1;", "print (2 + ;", "print 3;"].join("\n");
	const result = parse(source);
	expect(result.errors.map(formatProblem)).toEqual([
		"[line 1, column 9] syntax error: expected an expression, found ';'",
		"[line 3, column 12] syntax error: expected an expression, found ';'",
	]);
	expect(result.program.map(toSExpression)).toEqual(["(print 1)", "(print 3)"]);
});

test("recovery restarts at the next statement keyword when the semicolon is missing", () => {
	const result = parse("let a = 1\nlet b = 2;\nprint a b;\nprint b;");
	expect(result.errors.map(formatProblem)).toEqual([
		"[line 2, column 1] syntax error: expected ';' after the value, found 'let'",
		"[line 3, column 9] syntax error: expected ';' after the value, found 'b'",
	]);
	expect(result.program.map(toSExpression)).toEqual(["(let b 2)", "(print b)"]);
});

test("errors inside a block do not hide the rest of the block", () => {
	const result = parse("fn f() {\n\tlet = 1;\n\tprint 2;\n}\nprint 3;");
	expect(result.errors.map(formatProblem)).toEqual([
		"[line 2, column 6] syntax error: expected a variable name after 'let', found '='",
	]);
	expect(result.program.map(toSExpression)).toEqual(["(fn f() (print 2))", "(print 3)"]);
});

test("other syntax errors", () => {
	const message = (source: string): string[] => parse(source).errors.map(formatProblem);
	expect(message("1 = 2;")).toEqual([
		"[line 1, column 3] syntax error: the left side of '=' must be a variable name, found '='",
	]);
	expect(message("print 1")).toEqual([
		"[line 1, column 8] syntax error: expected ';' after the value, found end of input",
	]);
	expect(message("if x print 1;")).toEqual(["[line 1, column 6] syntax error: expected '{', found 'print'"]);
	expect(message("{ print 1;")).toEqual([
		"[line 1, column 11] syntax error: expected '}' to close the block, found end of input",
	]);
	expect(message("print 1; }")).toEqual(["[line 1, column 10] syntax error: expected an expression, found '}'"]);
});

test("lexical and syntax errors come back together, in source order", () => {
	const result = parse('print "open;\nprint @;\nprint 1;');
	expect(result.errors.map(formatProblem)).toEqual([
		"[line 1, column 7] syntax error: unterminated string",
		"[line 2, column 1] syntax error: expected an expression, found 'print'",
		"[line 2, column 7] syntax error: unexpected character '@'",
	]);
	expect(result.program.map(toSExpression)).toEqual(["(print 1)"]);
});

test("the tree printer draws one node per line", () => {
	expect(printTree(parse("print 1 + 2 * 3;").program)).toBe(
		["└─ print", "   └─ +", "      ├─ 1", "      └─ *", "         ├─ 2", "         └─ 3"].join("\n"),
	);
});

test("the report shows tokens, then the tree, then the errors", () => {
	expect(report("x = 1;").text).toBe(
		[
			"tokens:",
			"  1:1    IDENTIFIER    x",
			"  1:3    EQUAL         =",
			"  1:5    NUMBER        1",
			"  1:6    SEMICOLON     ;",
			"  1:7    EOF",
			"tree:",
			"└─ expr",
			"   └─ = x",
			"      └─ 1",
		].join("\n"),
	);
	expect(report("x = ;").ok).toBe(false);
});

// EN: The example programs are the shared test bed of the three compiler mini-projects. Here they
//     only have to parse without errors; the interpreter and the virtual machine run them.
// PT: Os programas de exemplo são a bancada de testes compartilhada pelos três mini-projetos de
//     compiladores. Aqui eles só precisam ser analisados sem erros; o interpretador e a máquina
//     virtual os executam.
// ES: Los programas de ejemplo son el banco de pruebas compartido por los tres mini-proyectos de
//     compiladores. Aquí solo deben analizarse sin errores; el intérprete y la máquina virtual
//     los ejecutan.
test("every example program parses without errors", () => {
	const directory = join(import.meta.dir, "..", "..", "examples");
	const files = readdirSync(directory).filter((name) => name.endsWith(".mini"));
	expect(files.length).toBeGreaterThanOrEqual(11);
	for (const file of files) {
		const result = parse(readFileSync(join(directory, file), "utf8"));
		expect({ file, errors: result.errors }).toEqual({ file, errors: [] });
		expect(result.program.length).toBeGreaterThan(0);
	}
});
