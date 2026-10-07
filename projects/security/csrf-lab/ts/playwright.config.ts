import { defineConfig, devices } from "@playwright/test";

// EN: The tests run inside docker-compose against the app containers, by service name. All
//     apps keep their state in memory and are shared by every test, so the tests run one at a
//     time (`workers: 1`) and each one resets the app it uses.
//     The files end in `.e2e.ts` so that `bun test` (which collects `.test.ts` and `.spec.ts`)
//     does not try to run them without a browser.
// PT: Os testes rodam dentro do docker-compose contra os contêineres dos apps, pelo nome do
//     serviço. Todos os apps guardam o estado em memória e são compartilhados por todos os
//     testes, então os testes rodam um por vez (`workers: 1`) e cada um reinicia o app que usa.
//     Os arquivos terminam em `.e2e.ts` para que o `bun test` (que coleta `.test.ts` e
//     `.spec.ts`) não tente rodá-los sem navegador.
export default defineConfig({
	testDir: "e2e",
	testMatch: "**/*.e2e.ts",
	fullyParallel: false,
	workers: 1,
	forbidOnly: true,
	retries: 0,
	// EN: Three browsers start inside one container, often on a busy machine, so the limits are
	//     more generous than the defaults (30 s per test, 5 s per assertion).
	// PT: Três navegadores sobem dentro de um contêiner, muitas vezes em uma máquina ocupada,
	//     então os limites são mais folgados que os padrões (30 s por teste, 5 s por asserção).
	timeout: 60_000,
	expect: { timeout: 15_000 },
	reporter: [["list"]],
	use: { locale: "en-US" },
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
		{ name: "firefox", use: { ...devices["Desktop Firefox"] } },
		{ name: "webkit", use: { ...devices["Desktop Safari"] } },
	],
});
