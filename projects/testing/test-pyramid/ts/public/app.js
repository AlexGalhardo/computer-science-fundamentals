// EN: The browser half of the shop. It is plain JavaScript that only exists inside a page: it
//     needs a DOM, a click and a network call. No unit or integration test of the server runs
//     this file, which is why a mistake here is found only by the end-to-end suite.
// PT: A metade do navegador da loja. É JavaScript puro que só existe dentro de uma página:
//     precisa de DOM, de um clique e de uma chamada de rede. Nenhum teste unitário ou de
//     integração do servidor roda este arquivo, e por isso um erro aqui só é achado pela suíte
//     de ponta a ponta.
const config = window.SHOP_CONFIG ?? { refreshAfterAdd: true };

function setText(testId, text) {
	document.querySelector(`[data-testid="${testId}"]`).textContent = text;
}

async function renderCart() {
	const cart = await (await fetch("/api/cart")).json();
	const list = document.getElementById("cart-lines");
	list.replaceChildren(
		...cart.lines.map((line) => {
			const item = document.createElement("li");
			item.textContent = `${line.name} x ${line.quantity}`;
			return item;
		}),
	);
	setText("cart-subtotal", cart.subtotal);
	setText("cart-discount", cart.discount);
	setText("cart-total", cart.total);
}

async function addToCart(productId) {
	await fetch("/api/cart", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ productId, quantity: 1 }),
	});
	// EN: With the seeded "e2e" bug this flag is false: the server saved the item, but the page
	//     keeps showing the old cart until it is reloaded.
	// PT: Com o bug semeado "e2e" esta opção é falsa: o servidor gravou o item, mas a página
	//     continua mostrando o carrinho antigo até ser recarregada.
	if (config.refreshAfterAdd) {
		await renderCart();
	}
}

async function renderProducts() {
	const products = await (await fetch("/api/products")).json();
	const list = document.getElementById("products");
	for (const product of products) {
		const item = document.createElement("li");
		item.textContent = `${product.name} (${(product.unitPriceCents / 100).toFixed(2)})`;
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = "Add";
		button.setAttribute("aria-label", `Add ${product.name} to cart`);
		button.addEventListener("click", () => addToCart(product.id));
		item.append(button);
		list.append(item);
	}
}

await Promise.all([renderProducts(), renderCart()]);
