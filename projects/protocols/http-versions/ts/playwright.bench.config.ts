import { defineConfig } from "@playwright/test";

// EN: Configuration of the measurement (`bun run bench`). It is one long "test", so the timeout
//     is generous: 9 ports, several cold loads each, some of them on a slow and lossy link.
// PT: Configuração da medição (`bun run bench`). É um único "teste" longo, então o tempo limite é
//     generoso: 9 portas, várias cargas a frio em cada uma, algumas em um enlace lento e com perda.
// ES: Configuración de la medición (`bun run bench`). Es una única "prueba" larga, así que el
//     tiempo límite es generoso: 9 puertos, varias cargas en frío en cada uno, algunas en un
//     enlace lento y con pérdida.
export default defineConfig({
	testDir: "bench",
	testMatch: "**/*.spec.ts",
	workers: 1,
	forbidOnly: true,
	retries: 0,
	timeout: 30 * 60_000,
	reporter: [["list"]],
});
