import { expect, test } from "bun:test";
import { createSession, FakeClock, isExpired, SESSION_TTL_MS } from "../../src/session";

// EN: FIXED (fake clock). The test owns the time. There is one "now", chosen by the test, so the
//     expected value is a constant. The boundary of the rule (expired exactly at 30 minutes, not
//     one millisecond earlier) can be checked precisely, which no test on the real clock can do.
// PT: CORRIGIDO (relógio falso). O teste é dono do tempo. Existe um único "agora", escolhido pelo
//     teste, então o valor esperado é uma constante. O limite da regra (expirada exatamente aos
//     30 minutos, nem um milissegundo antes) pode ser conferido com precisão, o que nenhum teste
//     no relógio real consegue fazer.
const START = Date.UTC(2026, 0, 15, 12, 0, 0);

test("a new session expires 30 minutes from now", () => {
	const clock = new FakeClock(START);
	const session = createSession("ana", clock.now);
	expect(session.expiresAt).toBe(START + SESSION_TTL_MS);
});

test("a session is valid until the last millisecond and expired from then on", () => {
	const clock = new FakeClock(START);
	const session = createSession("ana", clock.now);

	clock.advance(SESSION_TTL_MS - 1);
	expect(isExpired(session, clock.now)).toBe(false);

	clock.advance(1);
	expect(isExpired(session, clock.now)).toBe(true);
});

test("the id depends only on the user and on the creation time", () => {
	const first = createSession("ana", new FakeClock(START).now);
	const second = createSession("ana", new FakeClock(START).now);
	expect(second.id).toBe(first.id);
});
