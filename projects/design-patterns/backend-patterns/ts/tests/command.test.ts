import { describe, expect, test } from "bun:test";
import { AddItem, Cart, type Command, History, RemoveItem } from "../src/command/after";
import { Cart as SwitchCart } from "../src/command/before";

describe("command: before", () => {
	test("undo works for the operations the switch knows", () => {
		const cart = new SwitchCart();
		cart.add("book", 2);
		cart.add("pen", 1);
		cart.remove("book");
		cart.undo();
		expect(cart.quantity("book")).toBe(2);
		cart.undo();
		expect(cart.quantity("pen")).toBe(0);
	});

	// EN: The flaw: there is no redo and no way to add an operation from outside. Both would
	//     mean editing the cart, because the operations are not objects.
	// PT: O defeito: não existe refazer nem como acrescentar uma operação de fora. As duas coisas
	//     exigiriam editar o carrinho, porque as operações não são objetos.
	// ES: El defecto: no existe rehacer ni forma de añadir una operación desde fuera. Ambas cosas
	//     exigirían editar el carrito, porque las operaciones no son objetos.
	test("the cart offers nothing to redo and nothing to extend", () => {
		expect(Object.getOwnPropertyNames(SwitchCart.prototype).sort()).toEqual([
			"add",
			"constructor",
			"quantity",
			"remove",
			"undo",
		]);
	});
});

describe("command: after", () => {
	test("undo reverses the commands from the most recent to the oldest", () => {
		const cart = new Cart();
		const history = new History();
		history.run(new AddItem(cart, "book", 2));
		history.run(new AddItem(cart, "pen", 1));
		history.run(new RemoveItem(cart, "book"));
		expect(cart.quantity("book")).toBe(0);

		history.undo();
		expect(cart.quantity("book")).toBe(2);
		history.undo();
		expect(cart.quantity("pen")).toBe(0);
		expect(cart.quantity("book")).toBe(2);
	});

	test("redo runs the undone command again, and a new command clears the redo stack", () => {
		const cart = new Cart();
		const history = new History();
		history.run(new AddItem(cart, "book", 2));
		history.undo();
		expect(history.redo()).toBe(true);
		expect(cart.quantity("book")).toBe(2);

		history.undo();
		history.run(new AddItem(cart, "pen", 1));
		expect(history.redo()).toBe(false);
		expect(cart.quantity("book")).toBe(0);
	});

	test("undo on an empty history does nothing", () => {
		expect(new History().undo()).toBe(false);
	});

	test("a new operation is a new class, and neither the cart nor the history is edited", () => {
		class DoubleQuantity implements Command {
			private previous = 0;
			constructor(
				private readonly cart: Cart,
				private readonly sku: string,
			) {}
			execute(): void {
				this.previous = this.cart.quantity(this.sku);
				this.cart.set(this.sku, this.previous * 2);
			}
			undo(): void {
				this.cart.set(this.sku, this.previous);
			}
		}

		const cart = new Cart();
		const history = new History();
		history.run(new AddItem(cart, "book", 3));
		history.run(new DoubleQuantity(cart, "book"));
		expect(cart.quantity("book")).toBe(6);
		history.undo();
		expect(cart.quantity("book")).toBe(3);
	});
});
