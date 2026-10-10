import { expect, test } from "bun:test";
import { assertLabUrl, loadLabTargets } from "../src/lab-targets";
import { buildContentSecurityPolicy, CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from "../src/security-headers";

// EN: The policy is only as strong as its weakest directive, so the exact header value is
//     pinned by a test: loosening it has to be a visible, deliberate change.
// PT: A política é tão forte quanto a sua diretiva mais fraca, então o valor exato do cabeçalho
//     é fixado por um teste: afrouxá-la precisa ser uma mudança visível e deliberada.
// ES: La política es tan fuerte como su directiva más débil, así que el valor exacto de la cabecera
//     lo fija una prueba: aflojarla debe ser un cambio visible y deliberado.

test("the Content-Security-Policy header has exactly the expected value", () => {
	expect(CONTENT_SECURITY_POLICY).toBe(
		"default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
	);
});

test("the policy never allows inline script, eval or any origin", () => {
	expect(CONTENT_SECURITY_POLICY).not.toContain("unsafe-inline");
	expect(CONTENT_SECURITY_POLICY).not.toContain("unsafe-eval");
	expect(CONTENT_SECURITY_POLICY).not.toContain("*");
});

test("directives are joined with a semicolon", () => {
	expect(buildContentSecurityPolicy({ "script-src": "'self'", "object-src": "'none'" })).toBe(
		"script-src 'self'; object-src 'none'",
	);
});

test("the security headers include the policy and nosniff", () => {
	expect(SECURITY_HEADERS["content-security-policy"]).toBe(CONTENT_SECURITY_POLICY);
	expect(SECURITY_HEADERS["x-content-type-options"]).toBe("nosniff");
});

// EN: The demo and the browser tests refuse any address that is not one of the lab hosts.
// PT: A demo e os testes de navegador recusam qualquer endereço que não seja um host do
//     laboratório.
// ES: La demo y las pruebas de navegador rechazan cualquier dirección que no sea un host del
//     laboratorio.
test("only lab hosts are accepted as targets", () => {
	expect(assertLabUrl("http://vulnerable:3000")).toBe("http://vulnerable:3000");
	expect(loadLabTargets({})).toEqual({ vulnerable: "http://vulnerable:3000", fixed: "http://fixed:3000" });
	expect(() => assertLabUrl("http://example.com")).toThrow();
	expect(() => assertLabUrl("https://fixed:3000")).toThrow();
	expect(() => loadLabTargets({ FIXED_URL: "http://example.com" })).toThrow();
});
