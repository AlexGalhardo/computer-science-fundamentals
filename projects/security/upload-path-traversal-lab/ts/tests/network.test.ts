// EN: Safety checks of the lab itself. They only make sense inside the lab container, so they are
//     skipped elsewhere (the Dockerfile sets LAB_IN_DOCKER).
// PT: Verificações de segurança do próprio laboratório. Elas só fazem sentido dentro do contêiner
//     do laboratório, então são puladas fora dele (o Dockerfile define LAB_IN_DOCKER).

import { expect, test } from "bun:test";

const OUTSIDE_THE_LAB = process.env.LAB_IN_DOCKER !== "1";

// EN: The compose network is `internal: true`, so a container has no route to the internet.
//     example.com is the domain reserved by IANA for documentation; the request must fail.
// PT: A rede do compose é `internal: true`, então um contêiner não tem rota para a internet.
//     example.com é o domínio reservado pela IANA para documentação; a requisição precisa falhar.
test.skipIf(OUTSIDE_THE_LAB)("the lab container has no outside network access", async () => {
	const attempt = fetch("http://example.com", { signal: AbortSignal.timeout(3000) });
	await expect(attempt).rejects.toBeDefined();
});

// EN: Least privilege: the process runs as the unprivileged `bun` user of the image, never as
//     root (user id 0). If a path check ever fails, the operating system still refuses to read
//     or write what this user may not touch.
// PT: Menor privilégio: o processo roda como o usuário sem privilégios `bun` da imagem, nunca
//     como root (id de usuário 0). Se uma verificação de caminho falhar um dia, o sistema
//     operacional ainda recusa ler ou escrever o que este usuário não pode tocar.
test.skipIf(OUTSIDE_THE_LAB)("the lab process does not run as root", () => {
	expect(process.getuid?.()).toBeGreaterThan(0);
});
