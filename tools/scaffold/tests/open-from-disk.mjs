// EN: Opens static pages straight from disk (file://) in a real browser and fails when a page
//     logs an error, requests anything that is not a local file, or draws no chart. It is run
//     inside the Playwright image with `--network none`, which proves the page needs no network.
//     usage: node open-from-disk.mjs <index.html> [<index.html> ...]
// PT: Abre páginas estáticas direto do disco (file://) em um navegador de verdade e falha
//     quando a página registra um erro, pede algo que não seja arquivo local, ou não desenha
//     nenhum gráfico. Roda dentro da imagem do Playwright com `--network none`, o que prova que
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
	const drawings = await page.locator("svg, canvas").count();
	if (drawings === 0) {
		problems.push("no chart (svg or canvas) on the page");
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
