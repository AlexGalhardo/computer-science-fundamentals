// EN: A fixed catalogue with fake products. The prices are chosen so that the tests can reach
//     the interesting amounts: two keyboards are exactly the discount threshold (100.00).
// PT: Um catálogo fixo com produtos fictícios. Os preços foram escolhidos para que os testes
//     alcancem os valores interessantes: dois teclados dão exatamente o limite do desconto (100,00).
export interface Product {
	id: string;
	name: string;
	unitPriceCents: number;
}

export const PRODUCTS: readonly Product[] = [
	{ id: "keyboard", name: "Keyboard", unitPriceCents: 5000 },
	{ id: "mouse", name: "Mouse", unitPriceCents: 2500 },
	{ id: "cable", name: "USB cable", unitPriceCents: 750 },
];

export function findProduct(id: string): Product | undefined {
	return PRODUCTS.find((product) => product.id === id);
}
