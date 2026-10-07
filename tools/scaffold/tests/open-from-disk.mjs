// EN: Opens static pages straight from disk (file://) in a real browser and fails when a page
//     logs an error, requests anything that is not a local file, or renders nothing. It is run
//     inside the Playwright image with `--network none`, which proves the page needs no network.
//     usage: node open-from-disk.mjs <index.html> [<index.html> ...]
// PT: Abre páginas estáticas direto do disco (file://) em um navegador de verdade e falha
//     quando a página registra um erro, pede algo que não seja arquivo local, ou não renderiza
//     nada. Roda dentro da imagem do Playwright com `--network none`, o que prova que
//     a página não precisa de rede.

import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
let failed = false;
for (const file of process.argv.slice(2)) {
	const page = await browser.newPage();
	const problems = [];
	page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
	page.on("console", (message) => {
		if (message.type() === "error") {
			problems.push(`console error: ${message.text()}`);
		}
	});
	page.on("request", (request) => {
		if (!request.url().startsWith("file://") && !request.url().startsWith("data:")) {
			problems.push(`network request: ${request.url()}`);
		}
	});
	await page.goto(pathToFileURL(file).href);
	await page.waitForTimeout(500);
	// EN: The number of drawings is only reported: a step-by-step page may start with an empty
	//     first frame. What must hold is that the page rendered something and reported no error.
	// PT: O número de desenhos é só informado: uma página passo a passo pode começar com o
	//     primeiro quadro vazio. O que precisa valer é a página renderizar algo e não dar erro.
	const drawings = await page.locator("svg, canvas").count();
	if ((await page.locator("body").innerText()).trim().length === 0) {
		problems.push("the page rendered no text");
	}
	console.log(`${problems.length === 0 ? "ok  " : "FAIL"} ${file} (${drawings} drawings)`);
	for (const problem of problems) {
		console.log(`     ${problem}`);
	}
	failed ||= problems.length > 0;
	await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
