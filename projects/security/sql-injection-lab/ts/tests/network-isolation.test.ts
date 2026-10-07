// EN: The lab must not reach anything outside itself. The compose network is `internal: true`,
//     so a request to an external host has to fail from inside this container. `example.com` is
//     the domain reserved by IANA for documentation, and the request never leaves the machine.
// PT: O laboratório não pode alcançar nada fora de si mesmo. A rede do compose é `internal: true`,
//     então uma requisição a um host externo tem que falhar de dentro deste contêiner.
//     `example.com` é o domínio reservado pela IANA para documentação, e a requisição nunca sai
//     da máquina.

import { expect, test } from "bun:test";

test("a request to an external host fails from inside the container", async () => {
	let reached = false;
	try {
		await fetch("http://example.com", { signal: AbortSignal.timeout(3000) });
		reached = true;
	} catch {
		reached = false;
	}
	expect(reached).toBe(false);
}, 10_000);
