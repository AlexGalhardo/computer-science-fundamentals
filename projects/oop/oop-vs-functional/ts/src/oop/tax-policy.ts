import { CartError } from "./cart-error";

// EN: The second point of variation, independent of the discounts. The cart holds one TaxPolicy
//     object and can swap it at run time (composition), which a `TaxedCart` subclass could not.
// PT: O segundo ponto de variação, independente dos descontos. O carrinho guarda um objeto
//     TaxPolicy e pode trocá-lo em tempo de execução (composição), o que uma subclasse
//     `TaxedCart` não permitiria.
// ES: El segundo punto de variación, independiente de los descuentos. El carrito guarda un objeto
//     TaxPolicy y puede cambiarlo en tiempo de ejecución (composición), lo que una subclase
//     `TaxedCart` no permitiría.
export interface TaxPolicy {
	taxCents(amountCents: number): number;
}

export class NoTax implements TaxPolicy {
	taxCents(_amountCents: number): number {
		return 0;
	}
}

// EN: The rate is in basis points (825 = 8.25%) so that every number stays an integer. Adding
//     half a unit before the integer division rounds half a cent up.
// PT: A alíquota vem em pontos-base (825 = 8,25%) para que todo número continue inteiro. Somar
//     meia unidade antes da divisão inteira arredonda meio centavo para cima.
// ES: La tasa viene en puntos base (825 = 8,25%) para que todo número siga siendo entero. Sumar
//     media unidad antes de la división entera redondea medio centavo hacia arriba.
export class FlatTax implements TaxPolicy {
	readonly #basisPoints: number;

	constructor(basisPoints: number) {
		if (!Number.isInteger(basisPoints) || basisPoints < 0) {
			throw new CartError("invalid-tax");
		}
		this.#basisPoints = basisPoints;
	}

	taxCents(amountCents: number): number {
		return Math.floor((amountCents * this.#basisPoints + 5000) / 10000);
	}
}
