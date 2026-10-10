// EN: Static dashboard of a mini-project. It reads `window.BENCH_RESULTS`, written by the
//     benchmark runner in `../results/results.js`, and draws a chart and a table. There is no
//     build step and no network request: the page works when opened straight from disk.
// PT: Dashboard estático de um mini-projeto. Ele lê `window.BENCH_RESULTS`, escrito pelo runner
//     de benchmark em `../results/results.js`, e desenha um gráfico e uma tabela. Não há etapa
//     de build nem requisição de rede: a página funciona aberta direto do disco.
// ES: Dashboard estático de un mini-proyecto. Lee `window.BENCH_RESULTS`, escrito por el runner
//     de benchmark en `../results/results.js`, y dibuja un gráfico y una tabla. No hay paso
//     de build ni petición de red: la página funciona abierta directo desde el disco.

const SVG = "http://www.w3.org/2000/svg";
const COLOURS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#4b5563"];
const WIDTH = 720;
const HEIGHT = 360;
const PAD = { top: 16, right: 16, bottom: 44, left: 64 };

function svg(name, attributes, text) {
	const node = document.createElementNS(SVG, name);
	for (const [key, value] of Object.entries(attributes)) {
		node.setAttribute(key, String(value));
	}
	if (text !== undefined) {
		node.textContent = text;
	}
	return node;
}

function element(name, className, text) {
	const node = document.createElement(name);
	if (className) {
		node.className = className;
	}
	if (text !== undefined) {
		node.textContent = text;
	}
	return node;
}

function unique(values) {
	return [...new Set(values)];
}

function formatMs(value) {
	return value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
}

// EN: Both axes are logarithmic. Input sizes grow by powers of ten and times span several
//     orders of magnitude, so on a linear axis every small value would be squeezed into a corner.
//     On a log-log chart a polynomial O(n^k) is a straight line whose slope is k.
// PT: Os dois eixos são logarítmicos. Os tamanhos crescem em potências de dez e os tempos cobrem
//     várias ordens de grandeza, então em um eixo linear os valores pequenos ficariam espremidos
//     em um canto. Em um gráfico log-log, um polinômio O(n^k) é uma reta de inclinação k.
// ES: Los dos ejes son logarítmicos. Los tamaños crecen en potencias de diez y los tiempos cubren
//     varios órdenes de magnitud, así que en un eje lineal los valores pequeños quedarían apretados
//     en una esquina. En un gráfico log-log, un polinomio O(n^k) es una recta de pendiente k.
function logScale(min, max, from, to) {
	const low = Math.log10(Math.max(min, 1e-6));
	const high = Math.log10(Math.max(max, 1e-6));
	const span = high - low || 1;
	return (value) => from + ((Math.log10(Math.max(value, 1e-6)) - low) / span) * (to - from);
}

function drawChart(container, rows, metric) {
	container.replaceChildren();
	if (rows.length === 0) {
		container.append(element("p", "text-slate-600 dark:text-slate-300", "No rows for this selection."));
		return;
	}
	const chart = svg("svg", { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", class: "w-full h-auto" });
	chart.append(svg("title", {}, `${metric} against n`));
	const sizes = rows.map((row) => row.n);
	const values = rows.map((row) => row[metric]);
	const x = logScale(Math.min(...sizes), Math.max(...sizes), PAD.left, WIDTH - PAD.right);
	const y = logScale(Math.min(...values), Math.max(...values), HEIGHT - PAD.bottom, PAD.top);

	for (const n of unique(sizes)) {
		chart.append(
			svg("line", {
				x1: x(n),
				x2: x(n),
				y1: PAD.top,
				y2: HEIGHT - PAD.bottom,
				stroke: "currentColor",
				"stroke-opacity": 0.15,
			}),
			svg(
				"text",
				{
					x: x(n),
					y: HEIGHT - PAD.bottom + 18,
					"text-anchor": "middle",
					"font-size": 12,
					fill: "currentColor",
				},
				n.toLocaleString("en-US"),
			),
		);
	}
	for (const value of [Math.min(...values), Math.max(...values)]) {
		chart.append(
			svg(
				"text",
				{ x: PAD.left - 8, y: y(value) + 4, "text-anchor": "end", "font-size": 12, fill: "currentColor" },
				formatMs(value),
			),
		);
	}
	chart.append(
		svg(
			"text",
			{ x: WIDTH / 2, y: HEIGHT - 6, "text-anchor": "middle", "font-size": 12, fill: "currentColor" },
			"n (log scale)",
		),
	);

	const legend = element("ul", "mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm");
	unique(rows.map((row) => row.implementation)).forEach((implementation, index) => {
		const colour = COLOURS[index % COLOURS.length];
		const points = rows.filter((row) => row.implementation === implementation).sort((a, b) => a.n - b.n);
		const path = points
			.map((row, i) => `${i === 0 ? "M" : "L"}${x(row.n).toFixed(1)},${y(row[metric]).toFixed(1)}`)
			.join(" ");
		chart.append(svg("path", { d: path, fill: "none", stroke: colour, "stroke-width": 2 }));
		for (const row of points) {
			const dot = svg("circle", { cx: x(row.n), cy: y(row[metric]), r: 3.5, fill: colour });
			dot.append(svg("title", {}, `${implementation}, n=${row.n}: ${formatMs(row[metric])}`));
			chart.append(dot);
		}
		const item = element("li", "flex items-center gap-2");
		const swatch = element("span", "inline-block h-3 w-3 rounded-full");
		swatch.style.backgroundColor = colour;
		item.append(swatch, element("span", "", implementation));
		legend.append(item);
	});
	container.append(chart, legend);
}

function drawTable(container, rows) {
	const table = element("table", "w-full border-collapse text-sm");
	const head = element("tr", "border-b border-slate-300 text-left dark:border-slate-600");
	for (const title of [
		"implementation",
		"variant",
		"n",
		"process (ms)",
		"± (ms)",
		"CPU (ms)",
		"section (ms)",
		"peak memory (KiB)",
	]) {
		head.append(element("th", "px-2 py-2 font-semibold", title));
	}
	table.append(head);
	for (const row of rows) {
		const line = element("tr", "border-b border-slate-200 dark:border-slate-700");
		const cells = [
			row.implementation,
			row.variant,
			row.n.toLocaleString("en-US"),
			formatMs(row.meanMs),
			formatMs(row.stddevMs),
			formatMs(row.cpuMs),
			formatMs(row.elapsedMs),
			Math.round(row.peakMemoryKb).toLocaleString("en-US"),
		];
		for (const cell of cells) {
			line.append(element("td", "px-2 py-1.5 tabular-nums", String(cell)));
		}
		table.append(line);
	}
	container.replaceChildren(table);
}

function fillSelect(select, values) {
	select.replaceChildren(...values.map((value) => new Option(value, value)));
}

function main() {
	const report = window.BENCH_RESULTS;
	const status = document.getElementById("status");
	if (!report) {
		status.textContent = "No results yet. Run the benchmark first: bun run bench -- --project <name>";
		return;
	}
	document.getElementById("project").textContent = report.project;
	status.textContent = `Generated at ${report.generatedAt}, ${report.runs} runs per row after ${report.warmup} warm-up.`;

	const language = document.getElementById("language");
	const variant = document.getElementById("variant");
	const metric = document.getElementById("metric");
	fillSelect(language, unique(report.rows.map((row) => row.language)));
	fillSelect(variant, unique(report.rows.map((row) => row.variant)));

	const machine = document.getElementById("machine");
	for (const [key, value] of [...Object.entries(report.machine), ...Object.entries(report.runtimes)]) {
		machine.append(
			element("dt", "font-semibold", key),
			element("dd", "mb-1 text-slate-600 dark:text-slate-300", value),
		);
	}

	function render() {
		const rows = report.rows.filter((row) => row.language === language.value && row.variant === variant.value);
		drawChart(document.getElementById("chart"), rows, metric.value);
		drawTable(document.getElementById("table"), rows);
	}
	for (const select of [language, variant, metric]) {
		select.addEventListener("change", render);
	}
	render();
}

main();
