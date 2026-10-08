import { defineConfig } from "@playwright/test";

// EN: The tests run inside docker-compose against the `caddy` service. One worker and no
//     parallelism: two page loads at the same time would compete for the same shaped link.
//     The browser is launched by the tests themselves, because its flags depend on the
//     certificate the lab server presents.
// PT: Os testes rodam dentro do docker-compose contra o serviço `caddy`. Um worker e nenhum
//     paralelismo: duas cargas de página ao mesmo tempo disputariam o mesmo enlace moldado.
//     O navegador é iniciado pelos próprios testes, porque as flags dele dependem do certificado
//     que o servidor do laboratório apresenta.
export default defineConfig({
	testDir: "tests",
	testMatch: "**/*.spec.ts",
	fullyParallel: false,
	workers: 1,
	forbidOnly: true,
	retries: 0,
	timeout: 120_000,
	reporter: [["list"]],
});
