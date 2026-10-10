// EN: The mechanism: one generic function that looks the table up. The rules are data
//     (`machine.json`); this file never mentions "paid" or "ship".
// PT: O mecanismo: uma única função genérica que consulta a tabela. As regras são dados
//     (`machine.json`); este arquivo nunca menciona "paid" nem "ship".
// ES: El mecanismo: una única función genérica que consulta la tabla. Las reglas son datos
//     (`machine.json`); este archivo nunca menciona "paid" ni "ship".

import type { MachineTable, OrderEvent, OrderState } from "./table";

// EN: A transition either succeeds with the new state or fails with a reason. The caller has
//     to check `ok` before reading `state`, so a rejection cannot be ignored by accident, and
//     a rejected event never changes the order.
// PT: Uma transição ou dá certo, com o novo estado, ou falha, com um motivo. Quem chama precisa
//     testar `ok` antes de ler `state`, então uma rejeição não pode ser ignorada por acidente,
//     e um evento rejeitado nunca altera o pedido.
// ES: Una transición o tiene éxito, con el nuevo estado, o falla, con un motivo. Quien llama debe
//     comprobar `ok` antes de leer `state`, así que un rechazo no puede ignorarse por accidente,
//     y un evento rechazado nunca altera el pedido.
export type TransitionResult = { ok: true; state: OrderState } | { ok: false; reason: string };

export interface Step {
	event: OrderEvent;
	from: OrderState;
	to: OrderState;
	accepted: boolean;
}

export interface Walk {
	state: OrderState;
	steps: Step[];
}

export interface Machine {
	readonly initial: OrderState;
	transition(state: OrderState, event: OrderEvent): TransitionResult;
	run(events: readonly OrderEvent[], from?: OrderState): Walk;
	isTerminal(state: OrderState): boolean;
}

export function createMachine(table: MachineTable): Machine {
	// EN: The table is indexed once by the pair (state, event). After that every event costs
	//     one lookup, whatever the number of states: this is how a DFA runs in linear time.
	// PT: A tabela é indexada uma vez pelo par (estado, evento). Depois disso cada evento custa
	//     uma consulta, qualquer que seja o número de estados: é assim que um AFD executa em
	//     tempo linear.
	// ES: La tabla se indexa una vez por el par (estado, evento). Después de eso cada evento cuesta
	//     una consulta, sea cual sea el número de estados: así corre un AFD en tiempo lineal.
	const next = new Map<string, OrderState>();
	for (const { from, event, to } of table.transitions) {
		next.set(`${from}:${event}`, to);
	}
	const withExit = new Set(table.transitions.map((transition) => transition.from));

	function transition(state: OrderState, event: OrderEvent): TransitionResult {
		const target = next.get(`${state}:${event}`);
		// EN: A missing cell is not an error of the program, it is the rule: the pair is not in
		//     the table, so the event is not allowed in that state.
		// PT: Uma célula ausente não é um erro do programa, é a regra: o par não está na tabela,
		//     então o evento não é permitido naquele estado.
		// ES: Una celda ausente no es un error del programa, es la regla: el par no está en la
		//     tabla, así que el evento no se permite en ese estado.
		if (target === undefined) {
			return { ok: false, reason: `event "${event}" is not allowed in state "${state}"` };
		}
		return { ok: true, state: target };
	}

	return {
		initial: table.initial,
		transition,
		run(events: readonly OrderEvent[], from: OrderState = table.initial): Walk {
			let state = from;
			const steps: Step[] = [];
			for (const event of events) {
				const result = transition(state, event);
				const to = result.ok ? result.state : state;
				steps.push({ event, from: state, to, accepted: result.ok });
				state = to;
			}
			return { state, steps };
		},
		// EN: A terminal state has no way out: the life cycle of the order ended there.
		// PT: Um estado terminal não tem saída: o ciclo de vida do pedido terminou ali.
		// ES: Un estado terminal no tiene salida: el ciclo de vida del pedido terminó ahí.
		isTerminal(state: OrderState): boolean {
			return !withExit.has(state);
		},
	};
}
