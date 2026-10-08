// EN: STRATEGY. Each way of pricing the shipping is an object with the same interface. The
//     checkout knows only the interface, so a new kind is a new object written anywhere,
//     including in a test, and this file is not edited.
// PT: STRATEGY. Cada forma de calcular o frete é um objeto com a mesma interface. O checkout
//     conhece só a interface, então uma modalidade nova é um objeto novo escrito em qualquer
//     lugar, inclusive em um teste, e este arquivo não é editado.
export interface ShippingStrategy {
	readonly name: string;
	cost(weightKg: number): number;
}

export const express: ShippingStrategy = {
	name: "express",
	cost: (weightKg) => 2000 + weightKg * 400,
};

export const economy: ShippingStrategy = {
	name: "economy",
	cost: (weightKg) => 500 + weightKg * 150,
};

export const pickup: ShippingStrategy = {
	name: "pickup",
	cost: () => 0,
};

// EN: The context. It receives the strategy from outside and delegates the part that varies.
// PT: O contexto. Ele recebe a estratégia de fora e delega a parte que varia.
export class Checkout {
	constructor(private readonly shipping: ShippingStrategy) {}

	total(itemsCents: number, weightKg: number): number {
		return itemsCents + this.shipping.cost(weightKg);
	}
}
