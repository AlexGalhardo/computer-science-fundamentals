import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { type CartView, createApp, type Handler } from "../../src/app";
import { CartRepository, migrate } from "../../src/cart-repository";

// EN: INTEGRATION LEVEL. The HTTP handler, the repository and a real SQLite engine run together.
//     Nothing is replaced by a double, because the point is the seams: does the SQL do what the
//     TypeScript expects, does the handler turn a body into the right rows. Each test gets a
//     brand-new in-memory database, so no test can see what another one wrote.
// PT: NÍVEL DE INTEGRAÇÃO. O handler HTTP, o repositório e um SQLite de verdade rodam juntos.
//     Nada é trocado por um dublê, porque o que importa são as emendas: o SQL faz o que o
//     TypeScript espera, o handler transforma um corpo nas linhas certas. Cada teste recebe um
//     banco em memória novo, então nenhum teste enxerga o que outro gravou.
let repository: CartRepository;
let app: Handler;

beforeEach(() => {
	const db = new Database(":memory:");
	migrate(db);
	repository = new CartRepository(db);
	app = createApp(repository);
});

function post(body: unknown): Promise<Response> {
	return app(
		new Request("http://shop.test/api/cart", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

async function cart(): Promise<CartView> {
	const response = await app(new Request("http://shop.test/api/cart"));
	return (await response.json()) as CartView;
}

describe("CartRepository with SQLite", () => {
	test("stores a line", () => {
		repository.add("mouse", 1);
		expect(repository.list()).toEqual([{ productId: "mouse", quantity: 1 }]);
	});

	// EN: This is the test that catches the seeded "integration" bug: the upsert must add.
	// PT: Este é o teste que pega o bug semeado "integration": o upsert precisa somar.
	test("adding the same product again sums the quantities", () => {
		repository.add("mouse", 1);
		repository.add("mouse", 2);
		expect(repository.list()).toEqual([{ productId: "mouse", quantity: 3 }]);
	});

	test("clear empties the cart", () => {
		repository.add("cable", 1);
		repository.clear();
		expect(repository.list()).toEqual([]);
	});
});

describe("HTTP handler with the repository", () => {
	test("POST then GET returns the lines and the total", async () => {
		expect((await post({ productId: "mouse", quantity: 1 })).status).toBe(201);
		expect((await post({ productId: "cable", quantity: 2 })).status).toBe(201);
		const view = await cart();
		expect(view.lines.map((item) => [item.productId, item.quantity])).toEqual([
			["cable", 2],
			["mouse", 1],
		]);
		expect(view.total).toBe("40.00");
	});

	test("the discount shows up in the response", async () => {
		await post({ productId: "keyboard", quantity: 3 });
		const view = await cart();
		expect(view.subtotal).toBe("150.00");
		expect(view.discount).toBe("15.00");
		expect(view.total).toBe("135.00");
	});

	test("an unknown product is a 404 and changes nothing", async () => {
		expect((await post({ productId: "spaceship", quantity: 1 })).status).toBe(404);
		expect((await cart()).lines).toEqual([]);
	});

	test("a body without quantity is a 400", async () => {
		expect((await post({ productId: "mouse" })).status).toBe(400);
	});

	test("DELETE empties the cart", async () => {
		await post({ productId: "mouse", quantity: 1 });
		const response = await app(new Request("http://shop.test/api/cart", { method: "DELETE" }));
		expect(response.status).toBe(204);
		expect((await cart()).total).toBe("0.00");
	});
});
