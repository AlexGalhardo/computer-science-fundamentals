import { TestCase } from "../../src/xunit";
import { Cart } from "../cart";

// EN: What using the framework looks like: extend TestCase, build the fixture in `setUp`, write
//     methods whose names start with "test". Each method gets its own new Cart.
// PT: Como é usar o framework: estender TestCase, montar a fixture no `setUp`, escrever métodos
//     cujos nomes começam com "test". Cada método recebe um Cart novo só dele.
// ES: Cómo se ve usar el framework: extender TestCase, armar el fixture en `setUp`, escribir métodos
//     cuyos nombres empiezan con "test". Cada método recibe un Cart nuevo solo para él.
export class CartTest extends TestCase {
	private cart = new Cart();

	override setUp(): void {
		this.cart = new Cart();
	}

	testEmptyCartCostsNothing(): void {
		this.assertEqual(this.cart.total(), 0);
	}

	testTotalBelowTheDiscount(): void {
		this.cart.add(40);
		this.cart.add(59);
		this.assertEqual(this.cart.total(), 99);
	}

	testTotalWithDiscount(): void {
		this.cart.add(100);
		this.assertEqual(this.cart.total(), 90);
	}

	async testRejectsANegativePrice(): Promise<void> {
		await this.assertThrows(() => this.cart.add(-1), "must be positive");
	}
}
