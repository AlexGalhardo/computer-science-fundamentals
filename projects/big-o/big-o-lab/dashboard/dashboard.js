// EN: Static dashboard of the Big O lab. It reads `window.BIG_O_LAB_RESULTS`, written by
//     `bun run demo` in `../results/results.js`, and draws a chart and two tables. There is no
//     build step and no network request: the page works when opened straight from disk.
// PT: Dashboard estático do laboratório de Big O. Ele lê `window.BIG_O_LAB_RESULTS`, escrito por
//     `bun run demo` em `../results/results.js`, e desenha um gráfico e duas tabelas. Não há
//     etapa de build nem requisição de rede: a página funciona aberta direto do disco.

const SVG = "http://www.w3.org/2000/svg";
const WIDTH = 720;
const HEIGHT = 360;
const PAD = { top: 16, right: 16, bottom: 44, left: 84 };
const MEASURED = "#2563eb";
const FORMULA = "#d97706";

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

function formatValue(value) {
	if (Number.isInteger(value)) {
		return value.toLocaleString("en-US");
	}
	return value >= 100 ? value.toFixed(0) : value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function formatError(value) {
	return value === null ? "does not fit / não se ajusta" : value.toExponential(2);
}

// EN: Both axes are logarithmic. On a log-log chart a polynomial O(n^k) is a straight line whose
//     slope is k, a logarithm bends down towards flat, and an exponential bends up. The shape of
//     the line is the growth class.
// PT: Os dois eixos são logarítmicos. Em um gráfico log-log, um polinômio O(n^k) é uma reta de
//     inclinação k, um logaritmo se curva para baixo até ficar plano, e uma exponencial se curva
//     para cima. O formato da linha é a classe de crescimento.
function logScale(min, max, from, to) {
	const low = Math.log10(Math.max(min, 1e-6));
	const high = Math.log10(Math.max(max, 1e-6));
	const span = high - low;
	// EN: Flat data (the O(1) sample) has no span, so it is drawn as a line at mid-height.
	// PT: Dados planos (a amostra O(1)) não têm amplitude, então viram uma linha a meia altura.
	if (span === 0) {
		return () => (from + to) / 2;
	}
	return (value) => from + ((Math.log10(Math.max(value, 1e-6)) - low) / span) * (to - from);
}

function linePath(points, x, y, key) {
	return points
		.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.n).toFixed(1)},${y(point[key]).toFixed(1)}`)
		.join(" ");
}

function drawChart(container, sample, metric) {
	const chart = svg("svg", { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", class: "w-full h-auto" });
	chart.append(svg("title", {}, `${metric} against n for ${sample.id}`));
	const sizes = sample.points.map((point) => point.n);
	const values = sample.points.map((point) => point[metric]);
	const x = logScale(Math.min(...sizes), Math.max(...sizes), PAD.left, WIDTH - PAD.right);
	const y = logScale(Math.min(...values), Math.max(...values), HEIGHT - PAD.bottom, PAD.top);

	for (const n of sizes) {
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
					"font-size": 11,
					fill: "currentColor",
				},
				n.toLocaleString("en-US"),
			),
		);
	}
	for (const value of new Set([Math.min(...values), Math.max(...values)])) {
		chart.append(
			svg(
				"text",
				{ x: PAD.left - 8, y: y(value) + 4, "text-anchor": "end", "font-size": 11, fill: "currentColor" },
				formatValue(value),
			),
		);
	}
	chart.append(
		svg(
			"text",
			{ x: WIDTH / 2, y: HEIGHT - 6, "text-anchor": "middle", "font-size": 12, fill: "currentColor" },
			"n (log scale / escala log)",
		),
	);

	// EN: The dashed line is the closed formula. For operation counts it lies exactly under the
	//     measured line, which is the point of the lab: the count is predictable.
	// PT: A linha tracejada é a fórmula fechada. Para contagens de operações ela fica exatamente
	//     sob a linha medida, e esse é o ponto do laboratório: a contagem é previsível.
	if (metric === "operations") {
		chart.append(
			svg("path", {
				d: linePath(sample.points, x, y, "expected"),
				fill: "none",
				stroke: FORMULA,
				"stroke-width": 5,
				"stroke-opacity": 0.5,
				"stroke-dasharray": "2 8",
				"stroke-linecap": "round",
			}),
		);
	}
	chart.append(
		svg("path", { d: linePath(sample.points, x, y, metric), fill: "none", stroke: MEASURED, "stroke-width": 2 }),
	);
	for (const point of sample.points) {
		const dot = svg("circle", { cx: x(point.n), cy: y(point[metric]), r: 3.5, fill: MEASURED });
		dot.append(svg("title", {}, `n=${point.n}: ${formatValue(point[metric])}`));
		chart.append(dot);
	}
	container.replaceChildren(chart);
}

function drawTable(container, titles, rows) {
	const table = element("table", "w-full border-collapse text-sm");
	const head = element("tr", "border-b border-slate-300 text-left dark:border-slate-600");
	for (const title of titles) {
		head.append(element("th", "px-2 py-2 font-semibold", title));
	}
	table.append(head);
	for (const cells of rows) {
		const line = element("tr", "border-b border-slate-200 dark:border-slate-700");
		for (const cell of cells) {
			line.append(element("td", "px-2 py-1.5 tabular-nums", String(cell)));
		}
		table.append(line);
	}
	container.replaceChildren(table);
}

function main() {
	const results = window.BIG_O_LAB_RESULTS;
	const status = document.getElementById("status");
	if (!results) {
		status.textContent = "No results yet. Run: docker compose run --rm ts-demo";
		return;
	}
	status.textContent = `Generated at ${results.generatedAt} with "${results.command}". Time is the median of ${results.repetitions} runs.`;

	const sampleSelect = document.getElementById("sample");
	const metricSelect = document.getElementById("metric");
	sampleSelect.replaceChildren(...results.samples.map((sample) => new Option(sample.id, sample.id)));

	const machine = document.getElementById("machine");
	for (const [key, value] of Object.entries(results.machine)) {
		machine.append(
			element("dt", "font-semibold", key),
			element("dd", "mb-1 text-slate-600 dark:text-slate-300", value),
		);
	}

	function render() {
		const sample = results.samples.find((item) => item.id === sampleSelect.value);
		if (!sample) {
			return;
		}
		document.getElementById("title").textContent = `${sample.id}: ${sample.title}`;
		document.getElementById("verdict").textContent =
			`Counted: ${sample.operation}. Formula: ${sample.formula}. Best fit / melhor ajuste: ${sample.fit.best.label} (relative error / erro relativo ${formatError(sample.fit.best.error)}).`;
		drawChart(document.getElementById("chart"), sample, metricSelect.value);
		drawTable(
			document.getElementById("table"),
			["n", sample.operation, "formula / fórmula", "time (ms) / tempo (ms)"],
			sample.points.map((point) => [
				point.n.toLocaleString("en-US"),
				point.operations.toLocaleString("en-US"),
				point.expected.toLocaleString("en-US"),
				point.timeMs.toFixed(4),
			]),
		);
		drawTable(
			document.getElementById("fit"),
			["candidate / candidata", "relative error / erro relativo", "y = a + c · g(n)"],
			sample.fit.candidates.map((fit) => [
				fit.id === sample.fit.best.id ? `${fit.label} ✓` : fit.label,
				formatError(fit.error),
				fit.error === null ? "" : `a = ${fit.intercept.toPrecision(4)}, c = ${fit.scale.toPrecision(4)}`,
			]),
		);
	}
	for (const select of [sampleSelect, metricSelect]) {
		select.addEventListener("change", render);
	}
	render();
}

main();
