import { expect, test } from "bun:test";
import { hostOf, isLocalTarget, requireLocalTarget } from "../../load/target.js";

test("loopback and docker-compose service names are local", () => {
	for (const target of [
		"http://localhost:8080",
		"http://127.0.0.1:8080/",
		"http://[::1]:8080",
		"http://ts-server:8080",
		"http://go-server:8080",
		"http://elixir-server:8080",
		"http://LOCALHOST:8080",
	]) {
		expect(isLocalTarget(target)).toBe(true);
	}
});

// EN: Each of these is a way a non-local host could slip past a careless check.
// PT: Cada um destes é um jeito de um host não local passar por uma verificação descuidada.
// ES: Cada uno de estos es una forma en que un host no local podría colarse por una verificación descuidada.
test("everything else is refused", () => {
	for (const target of [
		"https://example.com",
		"http://example.com:8080/delay",
		"http://localhost.example.com",
		"http://localhost@example.com",
		"http://localhost:8080@example.com",
		"http://example.com/?host=localhost",
		"http://192.168.0.10:8080",
		"http://10.0.0.1",
		"ftp://localhost",
		"localhost:8080",
		"",
	]) {
		expect(isLocalTarget(target)).toBe(false);
		expect(() => requireLocalTarget(target)).toThrow("refusing to run");
	}
});

test("hostOf extracts the host and requireLocalTarget trims the final slash", () => {
	expect(hostOf("http://go-server:8080/stats")).toBe("go-server");
	expect(requireLocalTarget("http://go-server:8080/")).toBe("http://go-server:8080");
});
