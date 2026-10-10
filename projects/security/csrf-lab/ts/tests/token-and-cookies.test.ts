import { describe, expect, test } from "bun:test";
import { createFixedApp } from "../src/fixed/fixed-app";
import { generateCsrfToken, verifyCsrfToken } from "../src/fixed/fixed-csrf-token";
import { defencesFromEnv } from "../src/server";
import { SESSION_COOKIE } from "../src/shared/config";
import { buildSessionCookie, constantTimeEqual, readCookie } from "../src/shared/http";
import { createVulnerableApp } from "../src/vulnerable/vulnerable-app";
import { logIn } from "./scenarios";

describe("anti-CSRF token", () => {
	test("is long, URL-safe and different every time", () => {
		const tokens = new Set(Array.from({ length: 50 }, () => generateCsrfToken()));

		expect(tokens.size).toBe(50);
		for (const token of tokens) {
			// EN: 32 random bytes in base64url are 43 characters.
			// PT: 32 bytes aleatórios em base64url são 43 caracteres.
			// ES: 32 bytes aleatorios en base64url son 43 caracteres.
			expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
		}
	});

	test("verifies only the exact token of the session", () => {
		const token = generateCsrfToken();

		expect(verifyCsrfToken(token, token)).toBe(true);
		expect(verifyCsrfToken(token, generateCsrfToken())).toBe(false);
		expect(verifyCsrfToken(token, token.slice(0, -1))).toBe(false);
		expect(verifyCsrfToken(token, `${token}x`)).toBe(false);
	});

	test("refuses anything that is not a reasonable string", () => {
		const token = generateCsrfToken();

		expect(verifyCsrfToken(token, undefined)).toBe(false);
		expect(verifyCsrfToken(token, "")).toBe(false);
		expect(verifyCsrfToken(token, 42)).toBe(false);
		expect(verifyCsrfToken(token, [token])).toBe(false);
		expect(verifyCsrfToken(token, "x".repeat(129))).toBe(false);
	});

	test("refuses everything when the session has no token", () => {
		expect(verifyCsrfToken(null, "FAKE-TOKEN-not-real")).toBe(false);
	});

	test("constantTimeEqual compares strings of different lengths without throwing", () => {
		expect(constantTimeEqual("same", "same")).toBe(true);
		expect(constantTimeEqual("short", "a much longer value")).toBe(false);
	});
});

describe("session cookie attributes", () => {
	test("buildSessionCookie writes SameSite only when asked", () => {
		expect(buildSessionCookie("FAKE-ID", null)).toBe(`${SESSION_COOKIE}=FAKE-ID; Path=/; HttpOnly`);
		expect(buildSessionCookie("FAKE-ID", "Strict")).toBe(
			`${SESSION_COOKIE}=FAKE-ID; Path=/; HttpOnly; SameSite=Strict`,
		);
		expect(buildSessionCookie("FAKE-ID", "Lax")).toBe(`${SESSION_COOKIE}=FAKE-ID; Path=/; HttpOnly; SameSite=Lax`);
	});

	test("the vulnerable app sets a cookie with no SameSite attribute", async () => {
		const { setCookie } = await logIn(createVulnerableApp().app);

		expect(setCookie).toContain("HttpOnly");
		expect(setCookie).not.toContain("SameSite");
	});

	test("the fixed app sets SameSite=Strict explicitly", async () => {
		const { setCookie } = await logIn(createFixedApp().app);

		expect(setCookie).toContain("HttpOnly");
		expect(setCookie).toContain("SameSite=Strict");
	});

	test("readCookie finds one cookie among several", () => {
		const request = new Request("http://app-under-test:3000/", {
			headers: { cookie: `theme=dark; ${SESSION_COOKIE}=FAKE-ID; other=1` },
		});

		expect(readCookie(request, SESSION_COOKIE)).toBe("FAKE-ID");
		expect(readCookie(request, "missing")).toBeNull();
		expect(readCookie(new Request("http://app-under-test:3000/"), SESSION_COOKIE)).toBeNull();
	});

	test("LAB_DEFENCES maps to the options of the fixed app", () => {
		expect(defencesFromEnv("token+samesite")).toEqual({ requireToken: true, sameSite: "Strict" });
		expect(defencesFromEnv("token")).toEqual({ requireToken: true, sameSite: null });
		expect(defencesFromEnv("samesite")).toEqual({ requireToken: false, sameSite: "Strict" });
	});
});
