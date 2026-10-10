import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderChart } from "../../src/chart";
import { buildTraffic, peakPerWindow, runExperiment, type Series } from "../../src/experiment";
import { renderTable } from "../../src/report";

const result = runExperiment();
const { limit } = result.config;

function series(id: string): Series {
	const found = result.series.find((item) => item.id === id);
	if (found === undefined) {
		throw new Error(`no series ${id}`);
	}
	return found;
}

describe("burst experiment", () => {
	test("the traffic is the same list for everyone: 80 requests in order", () => {
		const traffic = buildTraffic();
		expect(traffic.length).toBe(80);
		expect([...traffic].sort((a, b) => a - b)).toEqual(traffic);
		expect(result.offered.perPhase).toEqual([5, 20, 40, 15]);
	});

	test("under the limit, every algorithm admits everything", () => {
		for (const item of result.series) {
			expect(item.perPhase[0]).toBe(5);
		}
	});

	// EN: The lesson of the mini-project in four assertions: what is the worst burst each
	//     algorithm lets through in ANY interval of one second?
	// PT: A lição do mini-projeto em quatro asserções: qual é a pior rajada que cada algoritmo
	//     deixa passar em QUALQUER intervalo de um segundo?
	// ES: La lección del miniproyecto en cuatro aserciones: ¿cuál es la peor ráfaga que cada
	//     algoritmo deja pasar en CUALQUIER intervalo de un segundo?
	test("fixed window lets twice the limit through around a boundary", () => {
		expect(series("fixed-window").perPhase[1]).toBe(20);
		expect(series("fixed-window").peakPerWindow).toBe(2 * limit);
	});

	test("sliding log never exceeds the limit in any window", () => {
		expect(series("sliding-log").perPhase[1]).toBe(limit);
		expect(series("sliding-log").peakPerWindow).toBe(limit);
	});

	test("sliding counter is close to the limit, but only approximately", () => {
		const peak = series("sliding-counter").peakPerWindow;
		expect(peak).toBeGreaterThanOrEqual(limit);
		expect(peak).toBeLessThan(2 * limit);
	});

	test("token bucket passes a burst of its capacity at once, plus the refill", () => {
		// EN: 15 requests in one millisecond, bucket full: exactly the capacity passes.
		// PT: 15 requisições em um milissegundo, balde cheio: passa exatamente a capacidade.
		// ES: 15 solicitudes en un milisegundo, balde lleno: pasa exactamente la capacidad.
		expect(series("token-bucket").perPhase[3]).toBe(limit);
		expect(series("token-bucket").perBin[70]).toBe(limit);
		expect(series("token-bucket").peakPerWindow).toBeGreaterThan(limit);
		expect(series("token-bucket").peakPerWindow).toBeLessThanOrEqual(2 * limit);
	});

	test("leaky bucket admits like the token bucket but releases at a constant pace", () => {
		expect(series("leaky-bucket").perBin).toEqual(series("token-bucket").perBin);
		const output = series("leaky-bucket-output");
		expect(output.total).toBe(series("leaky-bucket").total);
		expect(output.peakPerWindow).toBe(limit);
		expect(Math.max(...output.perBin)).toBe(1);
	});

	test("nobody admits more than was offered", () => {
		for (const item of result.series) {
			item.perBin.forEach((count, bin) => {
				if (item.id !== "leaky-bucket-output") {
					expect(count).toBeLessThanOrEqual(result.offered.perBin[bin] ?? 0);
				}
			});
			expect(item.perPhase.reduce((sum, count) => sum + count, 0)).toBe(item.total);
		}
	});

	test("peakPerWindow counts the busiest interval, wherever it starts", () => {
		expect(peakPerWindow([], 1000)).toBe(0);
		expect(peakPerWindow([0, 999, 1000], 1000)).toBe(2);
		expect(peakPerWindow([900, 950, 990, 1000, 1010, 1899, 1900], 1000)).toBe(6);
	});
});

describe("outputs", () => {
	// EN: The committed results must be the ones the code produces today. The comparison is on
	//     parsed JSON, so line endings do not matter.
	// PT: Os resultados versionados precisam ser os que o código produz hoje. A comparação é
	//     sobre o JSON interpretado, então as quebras de linha não importam.
	// ES: Los resultados versionados deben ser los que el código produce hoy. La comparación es
	//     sobre el JSON interpretado, así que los saltos de línea no importan.
	test("results/burst.json is up to date", () => {
		const path = join(import.meta.dir, "..", "..", "..", "results", "burst.json");
		const committed: unknown = JSON.parse(readFileSync(path, "utf8"));
		expect(committed).toEqual(JSON.parse(JSON.stringify(result)));
	});

	test("the chart is self-contained SVG with one panel per series", () => {
		for (const language of ["en", "pt", "es"] as const) {
			const svg = renderChart(result, language);
			expect(svg.startsWith("<svg ")).toBe(true);
			expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
			// EN: Nothing may be fetched: no script, no external reference of any kind.
			// PT: Nada pode ser buscado: nenhum script, nenhuma referência externa de qualquer tipo.
			// ES: Nada puede traerse de fuera: ningún script, ninguna referencia externa de ningún tipo.
			expect(svg).not.toMatch(/<script|href=|url\(|@import|<image/);
			expect(svg.match(/font-weight="600" fill="#1f2937"/g)?.length).toBe(1 + 1 + result.series.length);
		}
	});

	test("the table has one row per series and the offered traffic first", () => {
		const lines = renderTable(result, "en").split("\n");
		expect(lines.length).toBe(2 + 1 + result.series.length);
		expect(lines[2]).toBe("| Offered traffic | 5 | 20 | 40 | 15 | 80 | 20 |");
		expect(renderTable(result, "es").split("\n")[2]).toBe("| Tráfico ofrecido | 5 | 20 | 40 | 15 | 80 | 20 |");
	});
});
