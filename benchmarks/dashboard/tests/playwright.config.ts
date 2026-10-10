// EN: Playwright configuration. Only Chromium is used: the browsers come with the pinned
//     Docker image, and the page uses nothing engine-specific. Results are written to /tmp so
//     the test never changes the repository.
// PT: Configuração do Playwright. Só o Chromium é usado: os navegadores vêm com a imagem Docker
//     fixada, e a página não usa nada específico de um motor. Os resultados vão para /tmp para
//     que o teste nunca altere o repositório.
// ES: Configuración de Playwright. Solo se usa Chromium: los navegadores vienen con la imagen
//     Docker fijada, y la página no usa nada específico de un motor. Los resultados van a /tmp
//     para que la prueba nunca cambie el repositorio.

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: ".",
	outputDir: "/tmp/playwright-results",
	reporter: [["list"]],
	fullyParallel: true,
	workers: 4,
	retries: 0,
	timeout: 60_000,
	use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
});
