import { parse } from "./frontend/parser";
import { formatProblem } from "./frontend/token";
import { formatValue, Interpreter, RuntimeError } from "./interpreter";

export interface RunResult {
	/** Lines written by `print`, plus the echoed value in REPL mode. */
	output: string[];
	/** Syntax errors or the run-time error, already formatted. Empty when the run succeeded. */
	errors: string[];
}

// EN: A session owns one interpreter, so everything a piece of source defines (variables,
//     functions) is still there when the next piece runs. A file is a session with one piece; the
//     REPL is a session with one piece per line.
// PT: Uma sessão é dona de um interpretador, então tudo o que um trecho de código define
//     (variáveis, funções) continua lá quando o próximo trecho roda. Um arquivo é uma sessão com
//     um trecho; o REPL é uma sessão com um trecho por linha.
// ES: Una sesión es dueña de un intérprete, así que todo lo que un fragmento de código define
//     (variables, funciones) sigue ahí cuando corre el siguiente fragmento. Un archivo es una
//     sesión con un fragmento; el REPL es una sesión con un fragmento por línea.
export class Session {
	private output: string[] = [];
	private readonly interpreter = new Interpreter((line) => {
		this.output.push(line);
	});

	/**
	 * Runs `source`. With `echo`, a lone expression statement such as `square(3);` also shows its
	 * value, as a calculator would.
	 */
	run(source: string, options: { echo?: boolean } = {}): RunResult {
		this.output = [];
		const { program, errors } = parse(source);
		// EN: Nothing runs when the source has a syntax error: half a program is not a program.
		// PT: Nada roda quando o código tem erro de sintaxe: meio programa não é um programa.
		// ES: Nada corre cuando el código tiene un error de sintaxis: medio programa no es un programa.
		if (errors.length > 0) {
			return { output: [], errors: errors.map(formatProblem) };
		}
		try {
			const only = program.length === 1 ? program[0] : undefined;
			if (options.echo === true && only?.kind === "Expression") {
				const value = this.interpreter.evaluateGlobal(only.expression);
				if (value !== null) {
					this.output.push(formatValue(value));
				}
			} else {
				this.interpreter.run(program);
			}
			return { output: this.output, errors: [] };
		} catch (error) {
			if (error instanceof RuntimeError) {
				// Output printed before the error is kept: it did happen.
				return { output: this.output, errors: [error.format()] };
			}
			throw error;
		}
	}
}
