// EN: `bun run order <event> [event...]` walks one order through the given events.
//     `bun run demo` shows a full order and an order with a rejected transition.
//     Exit code: 0 when every event was accepted, 1 when one was rejected, 2 on bad usage.
// PT: `bun run order <evento> [evento...]` conduz um pedido pelos eventos informados.
//     `bun run demo` mostra um pedido completo e um pedido com uma transição rejeitada.
//     Código de saída: 0 quando todo evento foi aceito, 1 quando algum foi rejeitado, 2 em uso
//     incorreto.
// ES: `bun run order <evento> [evento...]` recorre un pedido por los eventos indicados.
//     `bun run demo` muestra un pedido completo y un pedido con una transición rechazada.
//     Código de salida: 0 cuando todo evento fue aceptado, 1 cuando alguno fue rechazado, 2 en
//     uso incorrecto.

import { z } from "zod";
import { describeState } from "./labels";
import { createMachine, type Machine } from "./machine";
import { EVENTS, loadTable, type OrderEvent } from "./table";

// EN: Command-line arguments are text typed by a person. They are checked against the closed
//     list of events here, at the border, so the machine only ever receives known events.
// PT: Argumentos de linha de comando são texto digitado por uma pessoa. Eles são conferidos
//     contra a lista fechada de eventos aqui, na borda, para que a máquina só receba eventos
//     conhecidos.
// ES: Los argumentos de la línea de comandos son texto escrito por una persona. Se comprueban
//     contra la lista cerrada de eventos aquí, en el borde, para que la máquina solo reciba
//     eventos conocidos.
const eventsSchema = z.array(z.enum(EVENTS)).min(1);

export interface CliResult {
	output: string;
	exitCode: number;
}

export function walk(machine: Machine, events: readonly OrderEvent[]): CliResult {
	const { state, steps } = machine.run(events);
	const lines = [`start: ${machine.initial}`];
	for (const step of steps) {
		lines.push(
			step.accepted
				? `  ${step.event.padEnd(8)} ${step.from} -> ${step.to}`
				: `  ${step.event.padEnd(8)} REJECTED: not allowed in ${step.from}, the order stays in ${step.from}`,
		);
	}
	const label = describeState(state);
	lines.push(`end: ${state}${machine.isTerminal(state) ? " (terminal)" : ""}`);
	lines.push(`  EN: ${label.en}`, `  PT: ${label.pt}`, `  ES: ${label.es}`);
	return { output: lines.join("\n"), exitCode: steps.every((step) => step.accepted) ? 0 : 1 };
}

export function demo(machine: Machine): CliResult {
	const full = walk(machine, ["pay", "ship", "deliver"]);
	// EN: `deliver` arrives before `ship`: it is refused, nothing changes, and the order can
	//     still follow the valid path afterwards.
	// PT: `deliver` chega antes de `ship`: é recusado, nada muda, e o pedido ainda pode seguir o
	//     caminho válido depois.
	// ES: `deliver` llega antes que `ship`: se rechaza, nada cambia, y el pedido aún puede seguir
	//     el camino válido después.
	const rejected = walk(machine, ["pay", "deliver", "ship", "deliver"]);
	const output = [
		"== A full order / Um pedido completo / Un pedido completo ==",
		full.output,
		"",
		"== A rejected transition / Uma transição rejeitada / Una transición rechazada ==",
		rejected.output,
	].join("\n");
	return { output, exitCode: 0 };
}

export function main(args: readonly string[]): CliResult {
	const machine = createMachine(loadTable());
	if (args.length === 1 && args[0] === "demo") {
		return demo(machine);
	}
	const parsed = eventsSchema.safeParse(args);
	if (!parsed.success) {
		return { output: `usage: bun run order <event> [event...]\nevents: ${EVENTS.join(", ")}`, exitCode: 2 };
	}
	return walk(machine, parsed.data);
}

if (import.meta.main) {
	const result = main(process.argv.slice(2));
	console.log(result.output);
	process.exit(result.exitCode);
}
