// EN: A tiny piece of "application code" for the example tests: a cart with a 10% discount from
//     100 upwards.
// PT: Um pedacinho de "código de aplicação" para os testes de exemplo: um carrinho com 10% de
//     desconto a partir de 100.
// ES: Un pedacito de "código de aplicación" para las pruebas de ejemplo: un carrito con 10% de
//     descuento a partir de 100.
export class Cart {
	private readonly prices: number[] = [];

	add(price: number): void {
		if (price <= 0) {
			throw new RangeError("a price must be positive");
		}
		this.prices.push(price);
	}

	total(): number {
		const sum = this.prices.reduce((total, price) => total + price, 0);
		return sum >= 100 ? sum * 0.9 : sum;
	}
}
