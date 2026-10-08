// EN: Takes the picture of the README: the trace found by the demo, drawn by Grafana. The
//     browser runs inside the compose network and opens only the local Grafana.
// PT: Tira a foto do README: o trace encontrado pela demo, desenhado pelo Grafana. O navegador
//     roda dentro da rede do compose e abre apenas o Grafana local.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import { z } from "zod";

const env = z
	.object({
		GRAFANA_URL: z.url().default("http://grafana:3000"),
		PROJECT_DIR: z.string().min(1).default("/project"),
	})
	.parse(process.env);

// EN: The same refusal as the load tests of this repository: this browser never leaves the lab.
// PT: A mesma recusa dos testes de carga deste repositório: este navegador nunca sai do laboratório.
const host = new URL(env.GRAFANA_URL).hostname;
if (!["grafana", "localhost", "127.0.0.1"].includes(host)) {
	throw new Error(`refusing to run: "${env.GRAFANA_URL}" is not the local Grafana`);
}

const resultsDir = join(env.PROJECT_DIR, "results");
const { traceId } = z
	.object({ traceId: z.string().regex(/^[0-9a-f]{32}$/) })
	.parse(JSON.parse(readFileSync(join(resultsDir, "slow-trace.json"), "utf8")));

// EN: Grafana needs a minute or two on its first start (database migrations).
// PT: O Grafana precisa de um ou dois minutos na primeira inicialização (migrações do banco).
const deadline = Date.now() + 280_000;
for (;;) {
	const ready = await fetch(`${env.GRAFANA_URL}/api/health`).then(
		(response) => response.ok,
		() => false,
	);
	if (ready) {
		break;
	}
	if (Date.now() > deadline) {
		throw new Error("Grafana did not become ready");
	}
	await Bun.sleep(2000);
}

const browser = await chromium.launch();
try {
	const page = await browser.newPage({ viewport: { width: 1500, height: 820 }, deviceScaleFactor: 1 });
	// EN: `viewPanel` shows one panel in full size; the variable carries the trace id.
	// PT: `viewPanel` mostra um painel em tamanho cheio; a variável carrega o trace id.
	const url = `${env.GRAFANA_URL}/d/three-signals?orgId=1&from=now-1h&to=now&var-trace_id=${traceId}&viewPanel=panel-6&kiosk`;
	await page.goto(url, { waitUntil: "domcontentloaded" });
	await page.getByText("warehouse.lookup").first().waitFor({ state: "visible", timeout: 120_000 });
	await page.waitForTimeout(1500);
	const file = join(resultsDir, "slow-span.png");
	await page.screenshot({ path: file });
	console.log(`written: results/slow-span.png (trace ${traceId})`);
} finally {
	await browser.close();
}
