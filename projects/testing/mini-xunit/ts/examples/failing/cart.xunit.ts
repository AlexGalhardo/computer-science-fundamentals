import { TestCase } from "../../src/xunit";
import { Cart } from "../cart";

// EN: FAILS ON PURPOSE. This folder is the demo of a red run: one test has a wrong expectation,
//     so the framework must print its name, the message and the file and line, and the process
//     must exit with a non-zero code. It is never part of the self-test folder.
// PT: FALHA DE PROPÓSITO. Esta pasta é a demo de uma execução vermelha: um teste tem uma
//     expectativa errada, então o framework precisa imprimir o nome, a mensagem e o arquivo com
//     a linha, e o processo precisa sair com um código diferente de zero. Ela nunca faz parte da
//     pasta de autotestes.
export class CartTest extends TestCase {
	private cart = new Cart();

	override setUp(): void {
		this.cart = new Cart();
	}

	testEmptyCartCostsNothing(): void {
		this.assertEqual(this.cart.total(), 0);
	}

	testTotalWithDiscount(): void {
		this.cart.add(100);
		this.assertEqual(this.cart.total(), 100); // marker: wrong expectation (the discount is forgotten)
	}
}
