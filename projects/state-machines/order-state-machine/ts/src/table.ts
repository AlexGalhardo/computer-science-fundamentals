// EN: The vocabulary of the machine (states and events) and the loader of the transition table.
//     The table lives in `machine.json`, one level above, so that the TypeScript and the Elixir
//     implementations read the very same rules.
// PT: O vocabulário da máquina (estados e eventos) e o carregador da tabela de transições.
//     A tabela fica em `machine.json`, um nível acima, para que as implementações em TypeScript
//     e em Elixir leiam exatamente as mesmas regras.
// ES: El vocabulario de la máquina (estados y eventos) y el cargador de la tabla de transiciones.
//     La tabla está en `machine.json`, un nivel más arriba, para que las implementaciones en
//     TypeScript y en Elixir lean exactamente las mismas reglas.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

// EN: A closed list of states, written once. `as const` keeps the literal names, so the type
//     `OrderState` is the union "created" | "paid" | ... and a typo such as "payed" does not
//     compile. An order is always in exactly one of these: combinations like "cancelled and
//     delivered", which five independent booleans would allow, cannot even be written.
// PT: Uma lista fechada de estados, escrita uma única vez. `as const` preserva os nomes
//     literais, então o tipo `OrderState` é a união "created" | "paid" | ... e um erro de
//     digitação como "payed" não compila. Um pedido está sempre em exatamente um deles:
//     combinações como "cancelado e entregue", que cinco booleanos independentes permitiriam,
//     nem sequer podem ser escritas.
// ES: Una lista cerrada de estados, escrita una sola vez. `as const` conserva los nombres
//     literales, así que el tipo `OrderState` es la unión "created" | "paid" | ... y un error
//     de escritura como "payed" no compila. Un pedido está siempre en exactamente uno de ellos:
//     combinaciones como "cancelado y entregado", que cinco booleanos independientes
//     permitirían, ni siquiera se pueden escribir.
export const STATES = ["created", "paid", "shipped", "delivered", "cancelled", "refunded"] as const;
export const EVENTS = ["pay", "ship", "deliver", "cancel", "refund"] as const;

export type OrderState = (typeof STATES)[number];
export type OrderEvent = (typeof EVENTS)[number];

const stateSchema = z.enum(STATES);
const eventSchema = z.enum(EVENTS);
const transitionSchema = z.object({ from: stateSchema, event: eventSchema, to: stateSchema });

// EN: `machine.json` is external input: a person edits it by hand. It is validated at the
//     border, and the checks are the ones that make the table a deterministic machine:
//     known states and events only, and at most one target for each (state, event) pair.
// PT: `machine.json` é entrada externa: uma pessoa o edita à mão. Ele é validado na borda, e
//     as verificações são as que fazem da tabela uma máquina determinística: apenas estados e
//     eventos conhecidos, e no máximo um destino para cada par (estado, evento).
// ES: `machine.json` es una entrada externa: una persona lo edita a mano. Se valida en el borde,
//     y las verificaciones son las que hacen de la tabla una máquina determinista: solo estados
//     y eventos conocidos, y como máximo un destino para cada par (estado, evento).
export const tableSchema = z
	.object({
		initial: stateSchema,
		states: z.array(stateSchema),
		events: z.array(eventSchema),
		transitions: z.array(transitionSchema),
	})
	.superRefine((table, context) => {
		if (table.states.join(",") !== STATES.join(",")) {
			context.addIssue({ code: "custom", path: ["states"], message: `must be exactly ${STATES.join(", ")}` });
		}
		if (table.events.join(",") !== EVENTS.join(",")) {
			context.addIssue({ code: "custom", path: ["events"], message: `must be exactly ${EVENTS.join(", ")}` });
		}
		const seen = new Set<string>();
		table.transitions.forEach((transition, index) => {
			const key = `${transition.from}:${transition.event}`;
			if (seen.has(key)) {
				context.addIssue({
					code: "custom",
					path: ["transitions", index],
					message: `second transition for (${transition.from}, ${transition.event}): the machine would not be deterministic`,
				});
			}
			seen.add(key);
		});
	});

export type Transition = z.infer<typeof transitionSchema>;
export type MachineTable = z.infer<typeof tableSchema>;

export const TABLE_PATH = join(import.meta.dir, "..", "..", "machine.json");

export function parseTable(value: unknown): MachineTable {
	return tableSchema.parse(value);
}

export function loadTable(path: string = TABLE_PATH): MachineTable {
	return parseTable(JSON.parse(readFileSync(path, "utf8")));
}
