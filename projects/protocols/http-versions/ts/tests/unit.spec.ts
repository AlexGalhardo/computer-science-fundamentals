// EN: Tests of the pieces that need no server: the generated site, the port grid, the refusal
//     of non-local targets and the report functions.
// PT: Testes das peças que não precisam de servidor: o site gerado, a grade de portas, a recusa
//     de alvos não locais e as funções do relatório.
// ES: Pruebas de las piezas que no necesitan servidor: el sitio generado, la cuadrícula de
//     puertos, el rechazo de destinos no locales y las funciones del informe.

import { expect, test } from "@playwright/test";
import { mean, median, renderTable, stddev, summariseCell, toWaterfall, typicalIndex } from "../src/report";
import { IMAGE_COUNT, imageName, imagePng, indexHtml } from "../src/site";
import { conditions, isLocalHost, loadSettings, PROTOCOLS, portOf, quicOrigins } from "../src/targets";

test("the page references 200 distinct images of about 2 kB", () => {
	const html = indexHtml();
	const sources = [...html.matchAll(/<img src="([^"]+)"/g)].map((match) => match[1]);
	expect(sources).toHaveLength(IMAGE_COUNT);
	expect(new Set(sources).size).toBe(IMAGE_COUNT);
	expect(sources[7]).toBe(`img/${imageName(7)}`);
	const png = imagePng(7);
	expect(png.length).toBeGreaterThan(1500);
	expect(png.length).toBeLessThan(3000);
	expect([...png.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
	expect(imagePng(7).equals(png)).toBe(true);
	expect(imagePng(8).equals(png)).toBe(false);
});

test("the port grid: last digit is the protocol, hundreds digit is the condition", () => {
	const all = conditions({ NETEM_LATENCY: "delay 50ms", NETEM_LATENCY_LOSS: "delay 50ms loss 2%" });
	const ports = all.flatMap((condition) => PROTOCOLS.map((protocol) => portOf(condition, protocol)));
	expect(ports).toEqual([8001, 8002, 8003, 8101, 8102, 8103, 8201, 8202, 8203]);
	expect(quicOrigins("site.test", all)).toEqual(["site.test:8003", "site.test:8103", "site.test:8203"]);
	// EN: The tc filter of entrypoint.sh matches `port & 0xfffc`, so each shaped group of ports
	//     must fall in one block of four.
	// PT: O filtro tc do entrypoint.sh casa `porta & 0xfffc`, então cada grupo de portas moldado
	//     precisa cair em um único bloco de quatro.
	// ES: El filtro tc de entrypoint.sh coincide con `puerto & 0xfffc`, así que cada grupo de
	//     puertos modelado debe caer en un único bloque de cuatro.
	expect(ports.slice(3, 6).map((port) => port & 0xfffc)).toEqual([8100, 8100, 8100]);
	expect(ports.slice(6, 9).map((port) => port & 0xfffc)).toEqual([8200, 8200, 8200]);
	expect(ports.slice(0, 3).some((port) => (port & 0xfffc) === 8100 || (port & 0xfffc) === 8200)).toBe(false);
});

test("only local targets are accepted", () => {
	expect(isLocalHost("site.http-versions.test")).toBe(true);
	expect(isLocalHost("localhost")).toBe(true);
	expect(isLocalHost("example.com")).toBe(false);
	expect(() => loadSettings({ SITE_HOST: "example.com" })).toThrow(/refusing/);
});

test("statistics", () => {
	expect(mean([1, 2, 3, 4])).toBe(2.5);
	expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 3);
	expect(median([5, 1, 3])).toBe(3);
	expect(median([4, 1, 3, 2])).toBe(2.5);
	expect(typicalIndex([900, 100, 110, 120, 105])).toBe(2);
});

test("a cell keeps the waterfall of the typical run, sorted by start time", () => {
	const resource = (startMs: number, endMs: number) => ({ name: "/x", protocol: "h2", startMs, endMs, bytes: 1 });
	const cell = summariseCell(
		{ protocol: "h2", protocolLabel: "HTTP/2", condition: "latency", netem: "delay 50ms", port: 8102 },
		[
			{ loadMs: 300, connectMs: 30, resources: [resource(1, 2)] },
			{ loadMs: 200, connectMs: 20, resources: [resource(30.04, 40.06), resource(10, 20)] },
			{ loadMs: 100, connectMs: 10, resources: [resource(5, 6)] },
		],
	);
	expect(cell.meanMs).toBe(200);
	expect(cell.medianMs).toBe(200);
	expect(cell.waterfallLoadMs).toBe(200);
	expect(cell.waterfall).toEqual([
		[10, 20],
		[30, 40.1],
	]);
	expect(toWaterfall([])).toEqual([]);
	expect(renderTable([cell]).split("\n").at(-1)).toBe(
		"| latency (`netem delay 50ms`) | HTTP/2 | 8102 | 200 | 100 | 200 | 100 | 300 | 20 | 13 |",
	);
});
