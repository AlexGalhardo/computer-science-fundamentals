import { expect, test } from "bun:test";

// EN: The lab network is `internal: true`, so a container has no route to the internet.
//     `example.com` is a domain reserved by IANA for documentation; the request must fail,
//     which proves that nothing in this lab can reach a real system.
// PT: A rede do laboratório é `internal: true`, então um contêiner não tem rota para a internet.
//     `example.com` é um domínio reservado pela IANA para documentação; a requisição precisa
//     falhar, o que prova que nada neste laboratório alcança um sistema real.
// ES: La red del laboratorio es `internal: true`, así que un contenedor no tiene ruta hacia internet.
//     `example.com` es un dominio reservado por IANA para documentación; la solicitud debe
//     fallar, lo que prueba que nada en este laboratorio alcanza un sistema real.
test("the container has no access to the outside network", async () => {
	const attempt = fetch("http://example.com", { signal: AbortSignal.timeout(3000) });
	await expect(attempt).rejects.toThrow();
}, 10_000);
