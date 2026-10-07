// EN: Safety check of the lab itself. The compose network is `internal: true`, so a container
//     has no route to the internet. example.com is the domain reserved by IANA for documentation;
//     the request must fail. The test only makes sense inside the lab container, so it is
//     skipped elsewhere (the Dockerfile sets LAB_IN_DOCKER).
// PT: Verificação de segurança do próprio laboratório. A rede do compose é `internal: true`,
//     então um contêiner não tem rota para a internet. example.com é o domínio reservado pela
//     IANA para documentação; a requisição precisa falhar. O teste só faz sentido dentro do
//     contêiner do laboratório, então é pulado fora dele (o Dockerfile define LAB_IN_DOCKER).

import { expect, test } from "bun:test";

test.skipIf(process.env.LAB_IN_DOCKER !== "1")("the lab container has no outside network access", async () => {
	const attempt = fetch("http://example.com", { signal: AbortSignal.timeout(3000) });
	await expect(attempt).rejects.toBeDefined();
});
