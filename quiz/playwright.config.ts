import { defineConfig, devices } from "@playwright/test";

// EN: The tests run against a static build served by a plain file server. BASE_URL points at
//     it: inside docker-compose it is the `quiz-fixture` service.
// PT: Os testes rodam contra um build estático servido por um servidor de arquivos simples.
//     BASE_URL aponta para ele: dentro do docker-compose é o serviço `quiz-fixture`.
export default defineConfig({
	testDir: "tests/e2e",
	fullyParallel: true,
	forbidOnly: true,
	retries: 0,
	reporter: [["list"]],
	use: {
		baseURL: process.env.BASE_URL ?? "http://localhost:3000",
		locale: "en-US",
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
