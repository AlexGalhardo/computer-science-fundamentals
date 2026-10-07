// EN: MP-SEC-6.2. The same scenario functions run against both versions. Against the vulnerable
//     API the tests assert that each flaw is observable. Against the fixed API they assert that
//     the same attempt is blocked and that legitimate use still works. The last blocks cover
//     what only the fixed API has: lockout expiry, timeouts, validation and the hash upgrade.
// PT: MP-SEC-6.2. As mesmas funções de cenário rodam contra as duas versões. Contra a API
//     vulnerável os testes afirmam que cada falha é observável. Contra a corrigida, afirmam que
//     a mesma tentativa é bloqueada e que o uso legítimo continua funcionando. Os últimos blocos
//     cobrem o que só a API corrigida tem: fim do bloqueio, expirações, validação e a
//     atualização do hash.

import { describe, expect, test } from "bun:test";
import { ALICE, BOB, CAROL, UNKNOWN_USERNAMES, WRONG_PASSWORDS } from "../src/data";
import { ACCOUNT_RULE, SESSION_TIMEOUTS } from "../src/fixed/fixed-app";
import { schemeOf } from "../src/fixed/fixed-password-storage";
import {
	call,
	compareErrorMessages,
	createLab,
	login,
	loginOverExistingSession,
	normalUse,
	repeatWrongPassword,
	reuseSessionAfterLogout,
	sessionCookieAfterLogin,
	spreadFailuresAcrossAccounts,
	type Version,
} from "../src/scenario";

const MINUTE = 60_000;
const GENERIC = { error: "invalid_credentials" };
const TOO_MANY = { error: "too_many_attempts" };

describe("vulnerable API: the flaws are observable", () => {
	test("cookie flags: the session cookie has no HttpOnly, no Secure and no SameSite", async () => {
		const cookie = await sessionCookieAfterLogin(await createLab("vulnerable"));
		expect(cookie?.name).toBe("sid");
		expect([...(cookie?.attributes.keys() ?? [])]).toEqual(["path"]);
	});

	test("session fixation: the id that existed before the login is logged in as alice-fake after it", async () => {
		const fixation = await loginOverExistingSession(await createLab("vulnerable"));
		expect(fixation.preLoginId).toBeDefined();
		expect(fixation.postLoginId).toBe(fixation.preLoginId);
		expect(fixation.oldIdAfterLogin.status).toBe(200);
		expect(fixation.oldIdAfterLogin.body).toEqual({ user: ALICE.username });
	});

	test("logout: the same session id still works after logout", async () => {
		const attempt = await reuseSessionAfterLogout(await createLab("vulnerable"));
		expect(attempt.logout.status).toBe(200);
		expect(attempt.sameIdAfterLogout.status).toBe(200);
		expect(attempt.sameIdAfterLogout.body).toEqual({ user: ALICE.username });
	});

	test("error messages: the answer tells an unknown user from a wrong password", async () => {
		const errors = await compareErrorMessages(await createLab("vulnerable"));
		expect(errors.unknownUser.body).toEqual({ error: "unknown_user" });
		expect(errors.wrongPassword.body).toEqual({ error: "wrong_password" });
	});

	test("no attempt limit: the sixth wrong password is still evaluated, and the right one works next", async () => {
		const repeated = await repeatWrongPassword(await createLab("vulnerable"));
		expect(repeated.wrongAttempts.map((attempt) => attempt.status)).toEqual([401, 401, 401, 401, 401, 401]);
		expect(repeated.wrongAttempts[5]?.body).toEqual({ error: "wrong_password" });
		expect(repeated.correctPasswordAfterwards.status).toBe(200);
	});

	test("no per-client limit: ten failures spread over five names change nothing", async () => {
		const spread = await spreadFailuresAcrossAccounts(await createLab("vulnerable"));
		expect(spread.failures.every((attempt) => attempt.status === 401)).toBe(true);
		expect(spread.sameClientAfterwards.status).toBe(200);
	});
});

describe("fixed API: the same attempts are blocked", () => {
	test("cookie flags: __Host- prefix, HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age and no Domain", async () => {
		const cookie = await sessionCookieAfterLogin(await createLab("fixed"));
		expect(cookie?.name).toBe("__Host-sid");
		expect(cookie?.attributes.has("httponly")).toBe(true);
		expect(cookie?.attributes.has("secure")).toBe(true);
		expect(cookie?.attributes.get("samesite")).toBe("Lax");
		expect(cookie?.attributes.get("path")).toBe("/");
		expect(cookie?.attributes.get("max-age")).toBe(String(SESSION_TIMEOUTS.absoluteMs / 1000));
		expect(cookie?.attributes.has("domain")).toBe(false);
		// EN: 32 random bytes in base64url are 43 characters.
		// PT: 32 bytes aleatórios em base64url são 43 caracteres.
		expect(cookie?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
	});

	test("session rotation: login issues a new id and the id from before the login is dead", async () => {
		const fixation = await loginOverExistingSession(await createLab("fixed"));
		expect(fixation.preLoginId).toBeDefined();
		expect(fixation.postLoginId).toBeDefined();
		expect(fixation.postLoginId).not.toBe(fixation.preLoginId);
		expect(fixation.oldIdAfterLogin.status).toBe(401);
		expect(fixation.currentIdAfterLogin.status).toBe(200);
		expect(fixation.currentIdAfterLogin.body).toEqual({ user: ALICE.username });
	});

	test("session rotation: two logins of the same user never share an id", async () => {
		const lab = await createLab("fixed");
		const first = (await login(lab, ALICE)).cookie?.value;
		const second = (await login(lab, ALICE, { sessionId: first })).cookie?.value;
		expect(second).toBeDefined();
		expect(second).not.toBe(first);
		expect((await call(lab, "/me", { sessionId: first })).status).toBe(401);
		expect((await call(lab, "/me", { sessionId: second })).status).toBe(200);
	});

	test("logout: the session is destroyed on the server and the cookie is cleared", async () => {
		const attempt = await reuseSessionAfterLogout(await createLab("fixed"));
		expect(attempt.logout.status).toBe(200);
		expect(attempt.logout.cookie?.value).toBe("");
		expect(attempt.logout.cookie?.attributes.get("max-age")).toBe("0");
		expect(attempt.sameIdAfterLogout.status).toBe(401);
	});

	test("error messages: unknown user and wrong password get the very same answer", async () => {
		const errors = await compareErrorMessages(await createLab("fixed"));
		expect(errors.unknownUser).toEqual(errors.wrongPassword);
		expect(errors.unknownUser.status).toBe(401);
		expect(errors.unknownUser.body).toEqual(GENERIC);
	});

	test("lockout: five failures are answered, the sixth attempt and even the right password get 429", async () => {
		const repeated = await repeatWrongPassword(await createLab("fixed"));
		expect(repeated.wrongAttempts.map((attempt) => attempt.status)).toEqual([401, 401, 401, 401, 401, 429]);
		expect(repeated.wrongAttempts[5]?.body).toEqual(TOO_MANY);
		expect(repeated.correctPasswordAfterwards.status).toBe(429);
		expect(repeated.correctPasswordAfterwards.cookie).toBeUndefined();
		expect(repeated.correctPasswordAfterwards.retryAfter).toBe(String(ACCOUNT_RULE.lockMs / 1000));
	});

	test("per-client throttle: ten failures over five names lock the client, not the accounts", async () => {
		const spread = await spreadFailuresAcrossAccounts(await createLab("fixed"));
		expect(spread.failures.every((attempt) => attempt.status === 401)).toBe(true);
		expect(spread.sameClientAfterwards.status).toBe(429);
		expect(spread.otherClientAfterwards.status).toBe(200);
	});
});

// EN: Normal use must work on both versions: the fix removes the holes, not the login.
// PT: O uso normal precisa funcionar nas duas versões: a correção tira os buracos, não o login.
describe.each<Version>(["vulnerable", "fixed"])("%s API: normal use works", (version) => {
	test("bob-fake logs in and is recognised, a wrong password and a missing session are refused", async () => {
		const normal = await normalUse(await createLab(version));
		expect(normal.login.status).toBe(200);
		expect(normal.login.body).toEqual({ user: BOB.username });
		expect(normal.me.status).toBe(200);
		expect(normal.me.body).toEqual({ user: BOB.username });
		expect(normal.wrongPassword.status).toBe(401);
		expect(normal.anonymous.status).toBe(401);
	});
});

describe("fixed API: lockout details", () => {
	test("the lockout ends by itself: after the lock time the right password works again", async () => {
		const lab = await createLab("fixed");
		await repeatWrongPassword(lab);
		lab.advance(ACCOUNT_RULE.lockMs - 1000);
		expect((await login(lab, ALICE)).status).toBe(429);
		lab.advance(1000);
		expect((await login(lab, ALICE)).status).toBe(200);
	});

	test("the lockout follows the account, not the client: another client is refused too", async () => {
		const lab = await createLab("fixed");
		await repeatWrongPassword(lab);
		expect((await login(lab, ALICE, { client: "client-b-fake" })).status).toBe(429);
		expect((await login(lab, BOB, { client: "client-b-fake" })).status).toBe(200);
	});

	test("a name that does not exist locks the same way, so the lockout does not reveal which names exist", async () => {
		const lab = await createLab("fixed");
		const statuses: number[] = [];
		for (const password of WRONG_PASSWORDS) {
			statuses.push((await login(lab, { username: UNKNOWN_USERNAMES[0], password })).status);
		}
		expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
	});

	test("a successful login clears the count, so honest typos do not add up", async () => {
		const lab = await createLab("fixed");
		const fourWrong = WRONG_PASSWORDS.slice(0, 4);
		for (const password of fourWrong) await login(lab, { username: ALICE.username, password });
		expect((await login(lab, ALICE)).status).toBe(200);
		for (const password of fourWrong) {
			expect((await login(lab, { username: ALICE.username, password }, { client: "client-b-fake" })).status).toBe(
				401,
			);
		}
		expect((await login(lab, ALICE, { client: "client-b-fake" })).status).toBe(200);
	});

	test("failures older than the window are forgotten", async () => {
		const lab = await createLab("fixed");
		for (const password of WRONG_PASSWORDS.slice(0, 4)) await login(lab, { username: ALICE.username, password });
		lab.advance(ACCOUNT_RULE.windowMs);
		for (const password of WRONG_PASSWORDS.slice(0, 4)) {
			expect((await login(lab, { username: ALICE.username, password })).status).toBe(401);
		}
		expect((await login(lab, ALICE)).status).toBe(200);
	});
});

describe("fixed API: session timeouts", () => {
	test("idle timeout: the session lives while it is used and dies after 15 minutes of silence", async () => {
		const lab = await createLab("fixed");
		const sessionId = (await login(lab, ALICE)).cookie?.value;
		lab.advance(14 * MINUTE);
		expect((await call(lab, "/me", { sessionId })).status).toBe(200);
		lab.advance(14 * MINUTE);
		expect((await call(lab, "/me", { sessionId })).status).toBe(200);
		lab.advance(SESSION_TIMEOUTS.idleMs);
		expect((await call(lab, "/me", { sessionId })).status).toBe(401);
	});

	test("absolute timeout: a session kept busy still dies 8 hours after the login", async () => {
		const lab = await createLab("fixed");
		const sessionId = (await login(lab, ALICE)).cookie?.value;
		const step = 10 * MINUTE;
		for (let elapsed = step; elapsed < SESSION_TIMEOUTS.absoluteMs; elapsed += step) {
			lab.advance(step);
			expect((await call(lab, "/me", { sessionId })).status).toBe(200);
		}
		lab.advance(step);
		expect((await call(lab, "/me", { sessionId })).status).toBe(401);
	});

	test("a session id the server never issued is not accepted", async () => {
		const lab = await createLab("fixed");
		const made = "FAKE-SESSION-ID-not-issued-by-the-server";
		expect((await call(lab, "/me", { sessionId: made })).status).toBe(401);
		const loggedIn = await login(lab, ALICE, { sessionId: made });
		expect(loggedIn.cookie?.value).not.toBe(made);
		expect((await call(lab, "/me", { sessionId: made })).status).toBe(401);
	});
});

describe("fixed API: input validation with Zod", () => {
	// EN: A few hand-picked malformed bodies are enough to show the rule. This is not a fuzzer.
	// PT: Alguns corpos malformados escolhidos à mão bastam para mostrar a regra. Isto não é um fuzzer.
	test.each([
		["a missing password", { username: ALICE.username }],
		["an unknown field", { username: ALICE.username, password: ALICE.password, admin: true }],
		["a password that is not text", { username: ALICE.username, password: 12345 }],
		["a username with characters outside a-z, 0-9 and -", { username: "Alice Fake", password: ALICE.password }],
		["a password longer than 128 characters", { username: ALICE.username, password: "x".repeat(129) }],
	])("%s is refused with 400", async (_label, body) => {
		const result = await call(await createLab("fixed"), "/login", { method: "POST", body });
		expect(result.status).toBe(400);
		expect(result.body).toEqual({ error: "invalid_body" });
		expect(result.cookie).toBeUndefined();
	});

	test("a refused body does not count as a failed attempt", async () => {
		const lab = await createLab("fixed");
		for (let i = 0; i < 6; i++) await call(lab, "/login", { method: "POST", body: { username: ALICE.username } });
		expect((await login(lab, ALICE)).status).toBe(200);
	});
});

describe("fixed API: legacy hash upgraded on login", () => {
	test("carol-legacy-fake's MD5 row becomes Argon2id on her first successful login, and she can log in again", async () => {
		const lab = await createLab("fixed");
		expect(schemeOf(lab.users.get(CAROL.username) ?? "")).toBe("md5");
		expect((await login(lab, { username: CAROL.username, password: WRONG_PASSWORDS[0] })).status).toBe(401);
		expect(schemeOf(lab.users.get(CAROL.username) ?? "")).toBe("md5");
		expect((await login(lab, CAROL)).status).toBe(200);
		expect(schemeOf(lab.users.get(CAROL.username) ?? "")).toBe("argon2id");
		expect((await login(lab, CAROL)).status).toBe(200);
	});
});
