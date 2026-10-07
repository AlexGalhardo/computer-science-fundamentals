import { describe, expect, test } from "bun:test";
import { createMachine } from "../src/machine";
import { EVENTS, loadTable, type OrderState, STATES } from "../src/table";

const table = loadTable();
const machine = createMachine(table);

// EN: The test is generated from the table, not written case by case. It walks through every
//     (state, event) pair: the pairs listed in the table must succeed with the listed target,
//     and all the others must be rejected. A new state or event adds its cases by itself.
// PT: O teste é gerado a partir da tabela, e não escrito caso a caso. Ele percorre todos os
//     pares (estado, evento): os pares listados na tabela devem dar certo com o destino
//     listado, e todos os outros devem ser rejeitados. Um estado ou evento novo acrescenta
//     seus casos sozinho.
const expected = new Map<string, OrderState>(table.transitions.map(({ from, event, to }) => [`${from}:${event}`, to]));
const pairs = STATES.flatMap((state) => EVENTS.map((event) => ({ state, event })));
const valid = pairs.filter(({ state, event }) => expected.has(`${state}:${event}`));
const invalid = pairs.filter(({ state, event }) => !expected.has(`${state}:${event}`));

describe("every (state, event) pair, generated from machine.json", () => {
	test.each(valid)("$state --$event--> succeeds", ({ state, event }) => {
		const target = expected.get(`${state}:${event}`);
		expect(target).toBeDefined();
		expect(machine.transition(state, event)).toEqual({ ok: true, state: target as OrderState });
	});

	test.each(invalid)("$event is rejected in $state", ({ state, event }) => {
		const result = machine.transition(state, event);
		expect(result.ok).toBe(false);
		// EN: A rejected event must leave the order where it was.
		// PT: Um evento rejeitado deve deixar o pedido onde estava.
		expect(machine.run([event], state)).toEqual({
			state,
			steps: [{ event, from: state, to: state, accepted: false }],
		});
	});

	// EN: 6 states x 5 events = 30 pairs. Pinning the split makes an accidental change of the
	//     table visible in review: 6 valid transitions and 24 rejections.
	// PT: 6 estados x 5 eventos = 30 pares. Fixar a divisão torna visível na revisão uma mudança
	//     acidental da tabela: 6 transições válidas e 24 rejeições.
	test("the table has 6 valid transitions and 24 rejected pairs", () => {
		expect(pairs).toHaveLength(30);
		expect(valid).toHaveLength(6);
		expect(invalid).toHaveLength(24);
	});
});

describe("shape of the machine", () => {
	test("cancelled and refunded are the terminal states", () => {
		expect(STATES.filter((state) => machine.isTerminal(state))).toEqual(["cancelled", "refunded"]);
	});

	test("every state is reachable from the initial state", () => {
		const reached = new Set<OrderState>([machine.initial]);
		const queue: OrderState[] = [machine.initial];
		for (let state = queue.pop(); state !== undefined; state = queue.pop()) {
			for (const event of EVENTS) {
				const result = machine.transition(state, event);
				if (result.ok && !reached.has(result.state)) {
					reached.add(result.state);
					queue.push(result.state);
				}
			}
		}
		expect([...reached].sort()).toEqual([...STATES].sort());
	});
});

describe("walking an order", () => {
	test("a full order ends in delivered", () => {
		const walk = machine.run(["pay", "ship", "deliver"]);
		expect(walk.state).toBe("delivered");
		expect(walk.steps.every((step) => step.accepted)).toBe(true);
	});

	test("a rejected event changes nothing and the order can go on", () => {
		const walk = machine.run(["pay", "deliver", "ship", "deliver"]);
		expect(walk.steps.map((step) => step.accepted)).toEqual([true, false, true, true]);
		expect(walk.steps[1]).toEqual({ event: "deliver", from: "paid", to: "paid", accepted: false });
		expect(walk.state).toBe("delivered");
	});

	test("a duplicated pay is rejected instead of paying twice", () => {
		expect(machine.run(["pay", "pay"]).steps.map((step) => step.accepted)).toEqual([true, false]);
	});
});
