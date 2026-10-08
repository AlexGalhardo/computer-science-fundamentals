import { describe, expect, test } from "bun:test";
import { runLoad } from "../src/load";
import { isLocalTarget, requireLocalTarget } from "../src/target";

describe("local targets only", () => {
	test("accepts loopback and the services of this docker-compose file", () => {
		for (const target of [
			"http://localhost:8080",
			"http://127.0.0.1:8080/before/report",
			"http://[::1]:8080",
			"http://go-server:8080/after/report",
			"http://ts-server:8080/before/quote",
		]) {
			expect(isLocalTarget(target)).toBe(true);
		}
	});

	test("refuses everything else, including look-alikes", () => {
		for (const target of [
			"http://example.com",
			"https://example.com",
			"http://localhost.example.com",
			"http://localhost@example.com",
			"http://go-server.example.com",
			"http://10.0.0.5:8080",
			"ftp://localhost",
			"localhost:8080",
			"",
		]) {
			expect(isLocalTarget(target)).toBe(false);
			expect(() => requireLocalTarget(target)).toThrow(/refusing to run/);
		}
	});

	// EN: The guard is inside the load generator itself, so no caller can forget it. The
	//     tests run with no network: if a request were sent, it would fail differently.
	// PT: A proteção fica dentro do próprio gerador de carga, então nenhum chamador consegue
	//     esquecê-la. Os testes rodam sem rede: se uma requisição fosse enviada, a falha
	//     seria outra.
	test("the load generator refuses a target that is not local before sending anything", async () => {
		await expect(runLoad("http://example.com/", 4, 1000)).rejects.toThrow(/refusing to run/);
	});
});
