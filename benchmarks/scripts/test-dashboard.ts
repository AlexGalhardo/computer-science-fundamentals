// EN: `bun run test:dashboard` runs the Playwright tests of the dashboard in two containers of
//     the pinned Playwright image. The first one, with network, installs the exact
//     `@playwright/test` of the lockfile into a Docker volume. The second one runs the tests
//     with `--network none`: if the page needed anything from the internet, it could not get it.
//     Both containers mount the repository read-only and write only to the volume, so no file
//     owned by another user ever appears in the working tree (on Linux a container that writes
//     into a mounted folder needs the uid of the host user).
//     The image ships Node.js and npm (not Bun), which is why npm is used here.
// PT: `bun run test:dashboard` roda os testes Playwright do dashboard em dois contêineres da
//     imagem fixada do Playwright. O primeiro, com rede, instala o `@playwright/test` exato do
//     lockfile em um volume do Docker. O segundo roda os testes com `--network none`: se a
//     página precisasse de qualquer coisa da internet, não teria como conseguir.
//     Os dois contêineres montam o repositório como somente leitura e escrevem só no volume,
//     então nenhum arquivo de outro usuário aparece na árvore de trabalho (no Linux, um
//     contêiner que escreve em uma pasta montada precisa do uid do usuário do host).
//     A imagem traz Node.js e npm (não o Bun), por isso o npm é usado aqui.

import { join } from "node:path";
import { benchmarksDir } from "./lib";

// EN: The image and the npm package must have the same version: the browsers inside the image
//     only work with the Playwright release they were built for.
// PT: A imagem e o pacote npm precisam ter a mesma versão: os navegadores dentro da imagem só
//     funcionam com a versão do Playwright para a qual foram construídos.
const IMAGE = "mcr.microsoft.com/playwright:v1.63.0-noble";
const WORK = "sef-bd-playwright-work:/work";
const tests = join(benchmarksDir, "dashboard", "tests");
const site = join(benchmarksDir, "dashboard");

function docker(args: string[]): void {
	const result = Bun.spawnSync(["docker", "run", "--rm", "--ipc=host", ...args], {
		stdout: "inherit",
		stderr: "inherit",
	});
	if (result.exitCode !== 0) {
		process.exit(result.exitCode);
	}
}

const install = "cp /src/package.json /src/package-lock.json /work/ && npm ci --no-audit --no-fund";
docker(["-v", `${tests}:/src:ro`, "-v", WORK, "-w", "/work", IMAGE, "sh", "-c", install]);
docker([
	"--network",
	"none",
	"-v",
	WORK,
	"-v",
	`${tests}:/work/tests:ro`,
	"-v",
	`${site}:/site:ro`,
	"-w",
	"/work/tests",
	"-e",
	"SITE=/site/index.html",
	"-e",
	"CI=1",
	IMAGE,
	"/work/node_modules/.bin/playwright",
	"test",
]);
