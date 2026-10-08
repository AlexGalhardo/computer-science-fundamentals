import { randomUUID } from "node:crypto";
import type { CliResult } from "../adapters/note-cli-controller";
import type { Clock, IdGenerator } from "../use-cases/ports";

// EN: The real clock and the real random ids. They are one line each, and they are out here
//     because they are the part that cannot be predicted. Tests plug a fixed clock and a
//     counter into the same ports.
// PT: O relógio de verdade e os ids aleatórios de verdade. Têm uma linha cada, e estão aqui
//     fora porque são a parte que não dá para prever. Os testes plugam um relógio fixo e um
//     contador nas mesmas portas.
export class SystemClock implements Clock {
	now(): Date {
		return new Date();
	}
}

export class UuidIdGenerator implements IdGenerator {
	next(): string {
		return randomUUID();
	}
}

// EN: The terminal driver: the only place that writes to the real standard output.
// PT: O driver de terminal: o único lugar que escreve na saída padrão de verdade.
export function printToTerminal(result: CliResult): void {
	for (const line of result.stdout) {
		console.log(line);
	}
	for (const line of result.stderr) {
		console.error(line);
	}
}
