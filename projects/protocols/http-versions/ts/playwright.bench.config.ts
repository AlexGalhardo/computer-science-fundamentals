import { defineConfig } from "@playwright/test";

// EN: Configuration of the measurement (`bun run bench`). It is one long "test", so the timeout
//     is generous: 9 ports, several cold loads each, some of them on a slow and lossy link.
// PT: Configuração da medição (`bun run bench`). É um único "teste" longo, então o tempo limite é
//     generoso: 9 portas, várias cargas a frio em cada uma, algumas em um enlace lento e com perda.
export default defineConfig({
	testDir: "bench",
	testMatch: "**/*.spec.ts",
	workers: 1,
	forbidOnly: true,
	retries: 0,
	timeout: 30 * 60_000,
	reporter: [["list"]],
});
