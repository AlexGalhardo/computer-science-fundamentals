import { defineConfig, devices } from "@playwright/test";

// EN: The browser tests run inside docker-compose against the `vulnerable` and `fixed`
//     services. One worker and no parallelism: the guestbook keeps its entries in memory, so
//     the tests of one app must not interleave.
// PT: Os testes de navegador rodam dentro do docker-compose contra os serviços `vulnerable` e
//     `fixed`. Um worker e nenhum paralelismo: o livro de visitas guarda as entradas em memória,
//     então os testes de um mesmo app não podem se intercalar.
export default defineConfig({
	testDir: "tests/e2e",
	testMatch: "**/*.e2e.ts",
	fullyParallel: false,
	workers: 1,
	forbidOnly: true,
	retries: 0,
	reporter: [["list"]],
	use: {
		locale: "en-US",
		trace: "off",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
