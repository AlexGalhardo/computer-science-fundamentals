import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Order as StateOrder } from "../src/state/after";
import { Order as ConditionalOrder, type Status } from "../src/state/before";

interface OrderLike {
	readonly status: Status;
	pay(): void;
	ship(): void;
	cancel(): void;
}

type Action = "pay" | "ship" | "cancel";

// EN: The transition table of the order, written once. Both designs must obey it: the refactor
//     to the State pattern changes where the rules live, not what they are.
// PT: A tabela de transições do pedido, escrita uma única vez. Os dois desenhos precisam
//     obedecê-la: a refatoração para o padrão State muda onde as regras ficam, não o que são.
const TABLE: Record<Status, Record<Action, Status | null>> = {
	pending: { pay: "paid", ship: null, cancel: "cancelled" },
	paid: { pay: null, ship: "shipped", cancel: "cancelled" },
	shipped: { pay: null, ship: null, cancel: null },
	cancelled: { pay: null, ship: null, cancel: null },
};

const ROUTES: Record<Status, Action[]> = {
	pending: [],
	paid: ["pay"],
	shipped: ["pay", "ship"],
	cancelled: ["cancel"],
};

function contract(name: string, create: () => OrderLike): void {
	describe(name, () => {
		for (const status of Object.keys(TABLE) as Status[]) {
			for (const action of ["pay", "ship", "cancel"] as const) {
				const next = TABLE[status][action];
				test(`${action} on ${status}: ${next ?? "refused"}`, () => {
					const order = create();
					for (const step of ROUTES[status]) {
						order[step]();
					}
					expect(order.status).toBe(status);
					if (next === null) {
						expect(() => order[action]()).toThrow(`cannot ${action} a ${status} order`);
						expect(order.status).toBe(status);
					} else {
						order[action]();
						expect(order.status).toBe(next);
					}
				});
			}
		}
	});
}

contract("state: before", () => new ConditionalOrder());
contract("state: after", () => new StateOrder());

describe("state: where the rules live", () => {
	const source = (file: string): string => readFileSync(join(import.meta.dir, "..", "src", "state", file), "utf8");
	const code = (file: string): string =>
		source(file)
			.split("\n")
			.filter((line) => !line.trim().startsWith("//"))
			.join("\n");

	// EN: The flaw of the first design and what the second one removes, measured on the code:
	//     conditionals on the status inside the methods.
	// PT: O defeito do primeiro desenho e o que o segundo remove, medido no código:
	//     condicionais sobre o status dentro dos métodos.
	test("the conditional design tests the status in every method, the State design in none", () => {
		expect(code("before.ts").match(/if \(this\.current ===/g)?.length).toBe(3);
		expect(code("after.ts").match(/\bif\b|\bswitch\b/g)).toBeNull();
	});
});
