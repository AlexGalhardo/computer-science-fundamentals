export type CartErrorCode = "invalid-quantity" | "invalid-price" | "invalid-percent" | "invalid-rule" | "invalid-tax";

// EN: In the object-oriented version an invalid value is refused by throwing: the constructor
//     that receives it never finishes, so the invalid object is never created.
// PT: Na versão orientada a objetos um valor inválido é recusado com uma exceção: o construtor
//     que o recebe não termina, então o objeto inválido nunca é criado.
export class CartError extends Error {
	readonly code: CartErrorCode;

	constructor(code: CartErrorCode) {
		super(code);
		this.name = "CartError";
		this.code = code;
	}
}

export function requirePercent(percent: number): void {
	if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
		throw new CartError("invalid-percent");
	}
}
