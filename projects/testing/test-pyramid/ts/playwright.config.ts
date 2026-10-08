import { defineConfig, devices } from "@playwright/test";
import { baseUrl } from "./tests/base-url";

// EN: One worker, because the shop keeps a single cart on the server and the tests must not
//     interleave. No retries: a test that only passes on the second try is a flaky test, and
//     hiding it would defeat the lesson. The output folder is in /tmp so the suite also runs as
//     a user that cannot write into /app.
// PT: Um worker, porque a loja guarda um único carrinho no servidor e os testes não podem se
//     intercalar. Sem retentativas: um teste que só passa na segunda tentativa é um teste
//     intermitente, e escondê-lo anularia a lição. A pasta de saída fica em /tmp para que a
//     suíte também rode como um usuário que não pode escrever em /app.
export default defineConfig({
	testDir: "tests/e2e",
	testMatch: "**/*.e2e.ts",
	outputDir: "/tmp/test-pyramid-playwright",
	fullyParallel: false,
	workers: 1,
	forbidOnly: true,
	retries: 0,
	reporter: [["list"]],
	use: {
		baseURL: baseUrl(),
		locale: "en-US",
		trace: "off",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
