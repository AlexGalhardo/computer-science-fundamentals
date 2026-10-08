import { expect, test } from "bun:test";
import { loadConfig } from "../src/lab/config";
import { hostOf, isLocalTarget, requireLocalTarget } from "../src/lab/target";

test("loopback and docker-compose service names are local", () => {
	for (const target of [
		"http://localhost:8080",
		"http://127.0.0.1:18480/",
		"http://[::1]:8080",
		"http://nginx:8080",
		"http://caddy:8080/rr",
		"http://api-3:3000",
		"http://NGINX:8080",
	]) {
		expect(isLocalTarget(target)).toBe(true);
	}
});

// EN: Each of these is a way a non-local host could slip past a careless check.
// PT: Cada um destes é um jeito de um host não local passar por uma verificação descuidada.
test("everything else is refused", () => {
	for (const target of [
		"https://example.com",
		"http://example.com:8080/rr",
		"http://localhost.example.com",
		"http://localhost@example.com",
		"http://nginx:8080@example.com",
		"http://example.com/?host=localhost",
		"http://192.168.0.10:8080",
		"http://nginx.example.com",
		"https://nginx:8080",
		"nginx:8080",
		"",
	]) {
		expect(isLocalTarget(target)).toBe(false);
		expect(() => requireLocalTarget(target)).toThrow("refusing to run");
	}
});

test("hostOf extracts the host and requireLocalTarget trims the final slash", () => {
	expect(hostOf("http://api-1:3000/stats")).toBe("api-1");
	expect(requireLocalTarget("http://caddy:8080/")).toBe("http://caddy:8080");
});

test("the configuration defaults to the services of the compose file", () => {
	const config = loadConfig({});
	expect(config.proxies).toEqual({ nginx: "http://nginx:8080", caddy: "http://caddy:8080" });
	expect(config.apis).toEqual(["http://api-1:3000", "http://api-2:3000", "http://api-3:3000"]);
	expect(config.repetitions).toBe(3);
});

test("the configuration refuses a proxy or an instance that is not local", () => {
	expect(() => loadConfig({ NGINX_URL: "https://example.com" })).toThrow("refusing to run");
	expect(() => loadConfig({ CADDY_URL: "http://caddy.example.com:8080" })).toThrow("refusing to run");
	expect(() => loadConfig({ API_URLS: "http://api-1:3000,http://api-2:3000,http://example.com" })).toThrow(
		"refusing to run",
	);
});

test("the configuration needs exactly three instances", () => {
	expect(() => loadConfig({ API_URLS: "http://api-1:3000" })).toThrow();
});
