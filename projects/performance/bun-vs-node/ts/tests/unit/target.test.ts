import { expect, test } from "bun:test";
import { hostOf, isLocalTarget, requireLocalTarget } from "../../../load/target.js";

test("loopback and docker-compose service names are local", () => {
	for (const target of [
		"http://localhost:3000",
		"http://127.0.0.1:3000/",
		"http://[::1]:3000",
		"http://bun-server:3000",
		"http://node-server:3000",
		"http://node-pm2-server:3000",
		"http://LOCALHOST:3000",
	]) {
		expect(isLocalTarget(target)).toBe(true);
	}
});

// EN: Each of these is a way a host that is not local could slip past a careless check.
// PT: Cada um destes é um jeito de um host não local passar por uma verificação descuidada.
// ES: Cada uno de estos es una forma en que un host no local pasa una verificación descuidada.
test("everything else is refused", () => {
	for (const target of [
		"https://example.com",
		"http://example.com:3000/cpu",
		"http://localhost.example.com",
		"http://localhost@example.com",
		"http://localhost:3000@example.com",
		"http://example.com/?host=localhost",
		"http://192.168.0.10:3000",
		"http://10.0.0.1",
		"ftp://localhost",
		"localhost:3000",
		"",
	]) {
		expect(isLocalTarget(target)).toBe(false);
		expect(() => requireLocalTarget(target)).toThrow("refusing to run");
	}
});

test("hostOf extracts the host and requireLocalTarget trims the final slash", () => {
	expect(hostOf("http://node-server:3000/health")).toBe("node-server");
	expect(requireLocalTarget("http://bun-server:3000/")).toBe("http://bun-server:3000");
});
