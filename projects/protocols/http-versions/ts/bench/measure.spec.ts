// EN: The measurement: `docker compose run --rm bench`. It loads the page BENCH_RUNS times on
//     each of the nine ports and writes the table and the waterfalls to results/. It runs under
//     the Playwright runner only to reuse its TypeScript loader and its Chromium.
// PT: A medição: `docker compose run --rm bench`. Carrega a página BENCH_RUNS vezes em cada uma
//     das nove portas e grava a tabela e as cascatas em results/. Roda sob o runner do Playwright
//     só para reaproveitar o carregador de TypeScript e o Chromium dele.

import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, totalmem } from "node:os";
import { join } from "node:path";
import { chromium, expect, test } from "@playwright/test";
import { fetchServerKeyHash, launchBrowser, loadPage, type PageLoad, usedOnly } from "../src/browser";
import { type Cell, renderTable, summariseCell } from "../src/report";
import { IMAGE_COUNT } from "../src/site";
import { conditions, loadSettings, originOf, PROTOCOLS, portOf } from "../src/targets";

test("measure the total load time per protocol and condition", async () => {
	const settings = loadSettings();
	const allConditions = conditions(settings);
	const keyHash = await fetchServerKeyHash(settings.SITE_HOST, 8001);
	const launch = { host: settings.SITE_HOST, conditions: allConditions, keyHash };
	const grid = allConditions.flatMap((condition) =>
		PROTOCOLS.map((protocol) => ({ condition, protocol, port: portOf(condition, protocol) })),
	);

	// EN: One warm-up load per port, thrown away: the first launch of the browser and the first
	//     handshakes of the server are slower than the rest.
	// PT: Uma carga de aquecimento por porta, descartada: a primeira abertura do navegador e os
	//     primeiros handshakes do servidor são mais lentos que o resto.
	const browser = await launchBrowser(launch);
	const version = browser.version();
	for (const target of grid) {
		await loadPage(browser, originOf(settings.SITE_HOST, target.port));
	}

	// EN: Like with like. Every measured load uses a NEW browser context, so nothing is cached
	//     and the connection is opened from scratch: the test checks that the browser really
	//     spent time connecting. The nine ports take turns inside each round, so a slow moment
	//     of the machine hits all of them and not only one.
	// PT: Comparar iguais. Toda carga medida usa um contexto NOVO do navegador, então nada está
	//     em cache e a conexão é aberta do zero: o teste confere que o navegador realmente gastou
	//     tempo conectando. As nove portas se revezam dentro de cada rodada, então um momento
	//     lento da máquina atinge todas e não só uma.
	const runs = new Map<number, PageLoad[]>(grid.map((target) => [target.port, []]));
	for (let round = 0; round < settings.BENCH_RUNS; round += 1) {
		for (const target of grid) {
			const load = await loadPage(browser, originOf(settings.SITE_HOST, target.port));
			expect(load.loadedImages).toBe(IMAGE_COUNT);
			expect(usedOnly(load, target.protocol.alpn)).toBe(true);
			expect(load.connectMs).toBeGreaterThan(0);
			runs.get(target.port)?.push(load);
		}
	}

	await browser.close();

	const cells: Cell[] = grid.map((target) =>
		summariseCell(
			{
				protocol: target.protocol.id,
				protocolLabel: target.protocol.label,
				condition: target.condition.id,
				netem: target.condition.netem,
				port: target.port,
			},
			runs.get(target.port) ?? [],
		),
	);

	const machine = {
		cpu: cpus()[0]?.model ?? "unknown",
		cores: cpus().length,
		memoryGb: Math.round(totalmem() / 1024 ** 3),
		platform: `${process.platform} ${process.arch}`,
		browser: `${chromium.name()} ${version}`,
		server: "Caddy 2.11.7",
	};
	const command = "docker compose run --rm bench";
	const method = `1 warm-up load per port discarded, then ${settings.BENCH_RUNS} cold loads per port (new browser context each time: empty cache, new connection), ports interleaved. Load time = navigation start to the load event, as reported by the browser.`;
	const report = [
		"# http-versions: results",
		"",
		`- Command: \`${command}\``,
		`- Machine: ${machine.cpu}, ${machine.cores} cores, ${machine.memoryGb} GB visible to the container, ${machine.platform}`,
		`- Client: ${machine.browser} (Playwright), headless. Server: ${machine.server}, same machine, docker-compose internal network.`,
		`- Page: 1 HTML document and ${IMAGE_COUNT} images of about 2 kB, no cache, no compression, TLS on every port.`,
		`- Method: ${method}`,
		"- Shaping: `tc netem` on the outgoing packets of the server only. `delay 50ms` therefore adds about 50 ms to each round trip.",
		"- Std dev is between the loads of one port. A difference smaller than it is not a difference.",
		"- Connection setup is the mean time the browser spent opening the connection of the document: TCP and TLS handshakes for HTTP/1.1 and HTTP/2, the QUIC handshake for HTTP/3.",
		"- Half of the images is the mean time at which 100 of the 200 images had fully arrived.",
		"",
		"## Total load time per protocol and condition",
		"",
		renderTable(cells),
		"",
	].join("\n");

	const data = { command, method, machine, imageCount: IMAGE_COUNT, cells };
	const resultsDir = join(settings.PROJECT_DIR, "results");
	mkdirSync(resultsDir, { recursive: true });
	writeFileSync(join(resultsDir, "results.md"), report);
	writeFileSync(join(resultsDir, "results.json"), `${JSON.stringify(data)}\n`);
	// EN: The same data as a script, so the static dashboard works when opened from disk.
	// PT: Os mesmos dados como script, para o dashboard estático funcionar aberto direto do disco.
	writeFileSync(join(resultsDir, "results.js"), `window.HTTP_VERSIONS_RESULTS = ${JSON.stringify(data)};\n`);
	console.log(report);
});
