import { describe, expect, test } from "bun:test";
import { RequestBuilder } from "../src/builder/after";
import { HttpRequest } from "../src/builder/before";

describe("builder: before", () => {
	// EN: The flaw, twice. An invalid object is created without complaint, and two arguments of
	//     the same type change places without the compiler noticing.
	// PT: O defeito, duas vezes. Um objeto inválido é criado sem reclamação, e dois argumentos
	//     do mesmo tipo trocam de lugar sem o compilador perceber.
	// ES: El defecto, dos veces. Un objeto inválido se crea sin quejas, y dos argumentos del mismo
	//     tipo intercambian lugar sin que el compilador lo note.
	test("a POST with no body is accepted", () => {
		const request = new HttpRequest("POST", "/orders", undefined, undefined, 30, true, false);
		expect(request.method).toBe("POST");
		expect(request.body).toBeUndefined();
	});

	test("swapping two booleans compiles and silently changes the meaning", () => {
		const intended = new HttpRequest("GET", "/orders", undefined, undefined, 30, true, false);
		const swapped = new HttpRequest("GET", "/orders", undefined, undefined, 30, false, true);
		expect(intended.retry).toBe(true);
		expect(swapped.retry).toBe(false);
		expect(swapped.followRedirects).toBe(true);
	});
});

describe("builder: after", () => {
	test("each value has a name, and what is not said keeps its default", () => {
		const request = RequestBuilder.post("/orders").withBody("{}").withRetry().build();
		expect(request).toEqual({
			method: "POST",
			url: "/orders",
			body: "{}",
			headers: [],
			timeoutSeconds: 30,
			retry: true,
			followRedirects: true,
		});
	});

	test("rules that cross fields are checked in build, so no invalid request exists", () => {
		expect(() => RequestBuilder.post("/orders").build()).toThrow("a POST request needs a body");
		expect(() => RequestBuilder.get("/orders").withBody("{}").build()).toThrow("a GET request has no body");
		expect(() => RequestBuilder.get("/orders").withTimeout(0).build()).toThrow("the timeout must be positive");
	});

	test("the product is independent of the builder that made it", () => {
		const builder = RequestBuilder.get("/orders").withHeader("A");
		const first = builder.build();
		const second = builder.withHeader("B").build();
		expect(first.headers).toEqual(["A"]);
		expect(second.headers).toEqual(["A", "B"]);
	});

	test("the product cannot be changed after it is built", () => {
		const request = RequestBuilder.get("/orders").build();
		expect(Object.isFrozen(request)).toBe(true);
		expect(Object.isFrozen(request.headers)).toBe(true);
	});
});
