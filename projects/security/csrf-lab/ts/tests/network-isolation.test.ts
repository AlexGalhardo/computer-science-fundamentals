import { expect, test } from "bun:test";

// EN: The lab network is `internal: true`, so no container can reach the internet. This test
//     proves it from the inside: `example.com` is the domain reserved by IANA for documentation,
//     and the request must fail. If this test ever passes a request through, the lab is no
//     longer isolated and nothing else in it should be run.
//     Outside Docker (for example `bun test` on a developer machine) the check does not apply.
// PT: A rede do laboratório é `internal: true`, então nenhum contêiner alcança a internet. Este
//     teste prova isso por dentro: `example.com` é o domínio reservado pela IANA para
//     documentação, e a requisição precisa falhar. Se algum dia este teste deixar uma requisição
//     passar, o laboratório não está mais isolado e nada mais nele deve ser executado.
//     Fora do Docker (por exemplo `bun test` na máquina de quem desenvolve) a checagem não se aplica.
test.skipIf(process.env.LAB_NETWORK !== "internal")("the container has no access to the outside world", async () => {
	let reached = false;
	try {
		await fetch("http://example.com", { signal: AbortSignal.timeout(3000) });
		reached = true;
	} catch {
		reached = false;
	}

	expect(reached).toBe(false);
});
