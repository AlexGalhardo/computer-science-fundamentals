import { expect, test } from "bun:test";
import { createSession, SESSION_TTL_MS } from "../../src/session";

// EN: FLAKY ON PURPOSE (cause: time). The test reads the real clock a second time and expects
//     the same millisecond that `createSession` saw. Usually both reads fall in the same
//     millisecond and the test passes. When the clock ticks between them, the two values differ
//     by 1 and the test fails, with no change in the code.
// PT: INTERMITENTE DE PROPÓSITO (causa: tempo). O teste lê o relógio real uma segunda vez e
//     espera o mesmo milissegundo que o `createSession` viu. Normalmente as duas leituras caem
//     no mesmo milissegundo e o teste passa. Quando o relógio avança entre elas, os dois valores
//     diferem em 1 e o teste falha, sem nenhuma mudança no código.
// ES: INTERMITENTE A PROPÓSITO (causa: tiempo). La prueba lee el reloj real por segunda vez y
//     espera el mismo milisegundo que vio `createSession`. Normalmente las dos lecturas caen
//     en el mismo milisegundo y la prueba pasa. Cuando el reloj avanza entre ellas, los dos valores
//     difieren en 1 y la prueba falla, sin ningún cambio en el código.
test("a new session expires 30 minutes from now", () => {
	const session = createSession("ana");
	expect(session.expiresAt).toBe(Date.now() + SESSION_TTL_MS);
});
