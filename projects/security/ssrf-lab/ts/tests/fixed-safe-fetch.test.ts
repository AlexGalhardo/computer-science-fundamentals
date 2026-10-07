// EN: One test per layer of `safeFetch`, each with the other layers out of the way, to show what
//     every check is responsible for. The only hosts involved are the two fake services of the
//     lab; where a test needs a DNS answer that the lab does not have, it passes a stub resolver
//     instead of touching any real DNS.
// PT: Um teste por camada do `safeFetch`, cada um com as outras camadas fora do caminho, para
//     mostrar pelo que cada checagem é responsável. Os únicos hosts envolvidos são os dois
//     serviços falsos do laboratório; quando um teste precisa de uma resposta de DNS que o
//     laboratório não tem, ele passa um resolvedor de mentira em vez de tocar em DNS real.

import { describe, expect, test } from "bun:test";
import { loadConfig } from "../src/config";
import { isAddressAllowed } from "../src/fixed/fixed-address-classifier";
import { buildPolicy, createFixedApp } from "../src/fixed/fixed-app";
import { type FetchPolicy, type Resolver, safeFetch, systemResolver } from "../src/fixed/fixed-safe-fetch";
import { requestPreview } from "../src/scenario";

const config = loadConfig();
const policy = buildPolicy(config);
const publicOrigin = config.PUBLIC_SITE_ORIGIN;
const publicHost = new URL(publicOrigin).hostname;

function withPolicy(changes: Partial<FetchPolicy>): FetchPolicy {
	return { ...policy, ...changes };
}

async function reasonFor(url: string, usedPolicy: FetchPolicy = policy, resolve?: Resolver): Promise<string> {
	const result = await safeFetch(url, usedPolicy, resolve);
	return result.ok ? "fetched" : result.reason;
}

describe("the lab network is what the address rule expects", () => {
	test("the public site has a public address and the internal service a private one", async () => {
		const publicAddresses = await systemResolver(publicHost);
		const internalAddresses = await systemResolver(new URL(config.INTERNAL_ADMIN_ORIGIN).hostname);
		expect(publicAddresses.length).toBeGreaterThan(0);
		expect(publicAddresses.every(isAddressAllowed)).toBe(true);
		expect(internalAddresses.length).toBeGreaterThan(0);
		expect(internalAddresses.some(isAddressAllowed)).toBe(false);
	});
});

describe("checks on the text of the URL", () => {
	test("only http and https are accepted", async () => {
		expect(await reasonFor("file:///etc/hostname")).toBe("scheme-not-allowed");
		expect(await reasonFor(`ftp://${publicHost}/article`)).toBe("scheme-not-allowed");
	});

	test("text that is not an absolute URL is refused", async () => {
		expect(await reasonFor("/article")).toBe("invalid-url");
	});

	test("a URL with credentials is refused", async () => {
		expect(await reasonFor(`http://lab-fake-user@${new URL(publicOrigin).host}/article`)).toBe(
			"credentials-in-url",
		);
	});

	test("a host or a port outside the allow-list is refused", async () => {
		expect(await reasonFor("http://not-on-the-list.test/")).toBe("host-not-allowed");
		expect(await reasonFor(`http://${publicHost}:9999/article`)).toBe("port-not-allowed");
	});

	test("the host name comparison ignores case and still fetches", async () => {
		expect(await reasonFor(`${publicOrigin.replace(publicHost, publicHost.toUpperCase())}/article`)).toBe(
			"fetched",
		);
	});
});

describe("checks on the resolved address", () => {
	// EN: IP literals need no DNS. They are put on the allow-list here only to reach the address
	//     check, which must refuse them by itself.
	// PT: Literais de IP não precisam de DNS. Eles entram na lista de permissão aqui só para
	//     chegar à checagem de endereço, que precisa recusá-los sozinha.
	test("loopback literals are refused even when allow-listed, IPv4 and IPv6", async () => {
		const loose = withPolicy({ allowedHosts: ["127.0.0.1", "[::1]"] });
		expect(await reasonFor("http://127.0.0.1:8080/secret", loose)).toBe("address-not-allowed");
		expect(await reasonFor("http://[::1]:8080/secret", loose)).toBe("address-not-allowed");
	});

	test("an allowed name that resolves to an internal address is refused", async () => {
		const resolve: Resolver = async () => ["10.0.0.5"];
		expect(await reasonFor(`${publicOrigin}/article`, policy, resolve)).toBe("address-not-allowed");
	});

	test("one internal address among several is enough to refuse", async () => {
		const resolve: Resolver = async () => ["203.0.113.10", "169.254.169.254"];
		expect(await reasonFor(`${publicOrigin}/article`, policy, resolve)).toBe("address-not-allowed");
	});

	test("a name that does not resolve is refused", async () => {
		const resolve: Resolver = async () => {
			throw new Error("stub: no such host");
		};
		expect(await reasonFor(`${publicOrigin}/article`, policy, resolve)).toBe("dns-failed");
	});
});

describe("the connection goes to the address that was validated", () => {
	// EN: `pinned-name.test` does not exist in any DNS. The stub resolver answers with the real
	//     address of the fake public site. The fetch can only work if the connection was made to
	//     the address the resolver gave, without asking the DNS a second time.
	// PT: `pinned-name.test` não existe em DNS nenhum. O resolvedor de mentira responde com o
	//     endereço real do site público falso. A busca só funciona se a conexão foi feita para o
	//     endereço que o resolvedor deu, sem perguntar ao DNS uma segunda vez.
	test("a name known only to the resolver is fetched, with one lookup per hop", async () => {
		const realAddresses = await systemResolver(publicHost);
		const asked: string[] = [];
		const resolve: Resolver = async (hostname) => {
			asked.push(hostname);
			return realAddresses;
		};
		const pinned = withPolicy({ allowedHosts: ["pinned-name.test"] });

		const direct = await safeFetch("http://pinned-name.test:8080/article", pinned, resolve);
		expect(direct.ok && direct.body.includes("Fake public article")).toBe(true);
		expect(asked).toEqual(["pinned-name.test"]);

		const redirected = await safeFetch("http://pinned-name.test:8080/redirect-to-article", pinned, resolve);
		expect(redirected.ok && redirected.finalUrl).toBe("http://pinned-name.test:8080/article");
		expect(asked).toEqual(["pinned-name.test", "pinned-name.test", "pinned-name.test"]);
	});
});

describe("limits", () => {
	test("a redirect loop stops at the redirect limit", async () => {
		expect(await reasonFor(`${publicOrigin}/redirect-loop`)).toBe("too-many-redirects");
	});

	test("a body larger than the limit is refused while it is being read", async () => {
		expect(await reasonFor(`${publicOrigin}/big`)).toBe("response-too-large");
	});

	test("a slow answer hits the deadline", async () => {
		const started = performance.now();
		expect(await reasonFor(`${publicOrigin}/slow`, withPolicy({ timeoutMs: 300 }))).toBe("timeout");
		expect(performance.now() - started).toBeLessThan(2000);
	});
});

describe("input validation of the route (Zod)", () => {
	const app = createFixedApp(policy);

	test("a body without a valid URL is refused with 422 before any fetch", async () => {
		expect((await requestPreview(app, "not a url")).status).toBe(422);
		expect((await requestPreview(app, "")).status).toBe(422);
		expect((await requestPreview(app, `${publicOrigin}/${"a".repeat(3000)}`)).status).toBe(422);
	});

	test("a non-web scheme is refused with 422", async () => {
		const observation = await requestPreview(app, "file:///etc/hostname");
		expect(observation.status).toBe(422);
		expect(observation.title).toBeNull();
	});
});
