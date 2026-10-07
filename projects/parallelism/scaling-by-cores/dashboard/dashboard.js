// EN: Static dashboard of the scaling-by-cores mini-project. It reads `window.BENCH_RESULTS`,
//     written by the benchmark runner in `../results/results.js`, and draws speed-up or
//     efficiency against the number of workers, one line per language, next to the ideal line.
//     There is no build step and no network request: the page works when opened from disk.
// PT: Dashboard estático do mini-projeto scaling-by-cores. Ele lê `window.BENCH_RESULTS`,
//     escrito pelo runner de benchmark em `../results/results.js`, e desenha speed-up ou
//     eficiência contra o número de trabalhadores, uma linha por linguagem, ao lado da linha
//     ideal. Não há etapa de build nem requisição de rede: a página funciona aberta do disco.

const SVG = "http://www.w3.org/2000/svg";
const COLOURS = ["#2563eb", "#dc2626", "#16a34a", "#d97706"];
const IDEAL = "#4b5563";
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

function splitImplementation(implementation) {
	const dash = implementation.lastIndexOf("-");
	return { workload: implementation.slice(0, dash), mode: implementation.slice(dash + 1) };
}

// EN: Speed-up is the sequential time divided by the parallel time, and efficiency is the
//     speed-up per worker. The sequential program was measured once per worker count, so the
//     baseline is the mean of those rows.
// PT: Speed-up é o tempo sequencial dividido pelo tempo paralelo, e eficiência é o speed-up
//     por trabalhador. O programa sequencial foi medido uma vez por quantidade de
//     trabalhadores, então a base é a média dessas linhas.
function seriesOf(rows, workload, schedule) {
	const selected = rows.filter((row) => splitImplementation(row.implementation).workload === workload);
	return unique(selected.map((row) => row.language)).map((language) => {
		const mine = selected.filter((row) => row.language === language);
		const sequential = mine.filter((row) => splitImplementation(row.implementation).mode === "seq");
		const baseline = sequential.reduce((sum, row) => sum + row.meanMs, 0) / sequential.length;
		const points = mine
			.filter((row) => splitImplementation(row.implementation).mode === schedule)
			.map((row) => {
				const workers = Number(row.variant);
				const speedup = baseline / row.meanMs;
				return { workers, meanMs: row.meanMs, stddevMs: row.stddevMs, speedup, efficiency: speedup / workers };
			})
			.sort((a, b) => a.workers - b.workers);
		return { language, baseline, points };
	});
}

// EN: The worker axis is logarithmic in base 2, because the counts double (1, 2, 4, 8): equal
//     distances on the axis then mean "twice the hardware".
// PT: O eixo de trabalhadores é logarítmico na base 2, porque as quantidades dobram
//     (1, 2, 4, 8): distâncias iguais no eixo passam a significar "o dobro de hardware".
function drawChart(container, series, metric) {
	container.replaceChildren();
	const workers = unique(series.flatMap((item) => item.points.map((point) => point.workers))).sort((a, b) => a - b);
	if (workers.length === 0) {
		container.append(element("p", "text-slate-600 dark:text-slate-300", "No rows for this selection."));
		return;
	}
	const maxWorkers = workers.at(-1);
	const top = metric === "speedup" ? maxWorkers : 1.1;
	const x = (value) => PAD.left + (Math.log2(value) / (Math.log2(maxWorkers) || 1)) * (WIDTH - PAD.left - PAD.right);
	const y = (value) => HEIGHT - PAD.bottom - (Math.min(value, top) / top) * (HEIGHT - PAD.top - PAD.bottom);
	const ideal = (count) => (metric === "speedup" ? count : 1);

	const chart = svg("svg", { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", class: "w-full h-auto" });
	chart.append(svg("title", {}, `${metric} against workers`));
	for (const count of workers) {
		chart.append(
			svg("line", {
				x1: x(count),
				x2: x(count),
				y1: PAD.top,
				y2: HEIGHT - PAD.bottom,
				stroke: "currentColor",
				"stroke-opacity": 0.15,
			}),
			svg(
				"text",
				{
					x: x(count),
					y: HEIGHT - PAD.bottom + 18,
					"text-anchor": "middle",
					"font-size": 12,
					fill: "currentColor",
				},
				String(count),
			),
		);
	}
	for (const value of [0, top / 2, top]) {
		chart.append(
			svg(
				"text",
				{ x: PAD.left - 8, y: y(value) + 4, "text-anchor": "end", "font-size": 12, fill: "currentColor" },
				metric === "speedup" ? value.toFixed(1) : `${Math.round(value * 100)}%`,
			),
		);
	}
	chart.append(
		svg(
			"text",
			{ x: WIDTH / 2, y: HEIGHT - 6, "text-anchor": "middle", "font-size": 12, fill: "currentColor" },
			"workers (log scale)",
		),
		svg("path", {
			d: workers
				.map((count, i) => `${i === 0 ? "M" : "L"}${x(count).toFixed(1)},${y(ideal(count)).toFixed(1)}`)
				.join(" "),
			fill: "none",
			stroke: IDEAL,
			"stroke-width": 2,
			"stroke-dasharray": "6 4",
		}),
	);

	const legend = element("ul", "mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm");
	const entries = [
		{ label: "ideal (linear)", colour: IDEAL },
		...series.map((item, index) => ({ label: item.language, colour: COLOURS[index % COLOURS.length] })),
	];
	series.forEach((item, index) => {
		const colour = COLOURS[index % COLOURS.length];
		const path = item.points
			.map((point, i) => `${i === 0 ? "M" : "L"}${x(point.workers).toFixed(1)},${y(point[metric]).toFixed(1)}`)
			.join(" ");
		chart.append(svg("path", { d: path, fill: "none", stroke: colour, "stroke-width": 2 }));
		for (const point of item.points) {
			const dot = svg("circle", { cx: x(point.workers), cy: y(point[metric]), r: 3.5, fill: colour });
			dot.append(svg("title", {}, `${item.language}, ${point.workers} workers: ${point[metric].toFixed(2)}`));
			chart.append(dot);
		}
	});
	for (const entry of entries) {
		const line = element("li", "flex items-center gap-2");
		const swatch = element("span", "inline-block h-3 w-3 rounded-full");
		swatch.style.backgroundColor = entry.colour;
		line.append(swatch, element("span", "", entry.label));
		legend.append(line);
	}
	container.append(chart, legend);
}

function drawTable(container, series) {
	const table = element("table", "w-full border-collapse text-sm");
	const head = element("tr", "border-b border-slate-300 text-left dark:border-slate-600");
	for (const title of ["language", "workers", "process (ms)", "± (ms)", "speed-up", "efficiency"]) {
		head.append(element("th", "px-2 py-2 font-semibold", title));
	}
	table.append(head);
	for (const item of series) {
		const rows = [
			["sequential", item.baseline.toFixed(0), "", "1.00", "100%"],
			...item.points.map((point) => [
				String(point.workers),
				point.meanMs.toFixed(0),
				point.stddevMs.toFixed(1),
				point.speedup.toFixed(2),
				`${Math.round(point.efficiency * 100)}%`,
			]),
		];
		for (const cells of rows) {
			const line = element("tr", "border-b border-slate-200 dark:border-slate-700");
			for (const cell of [item.language, ...cells]) {
				line.append(element("td", "px-2 py-1.5 tabular-nums", cell));
			}
			table.append(line);
		}
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
		status.textContent = "No results yet. Run the benchmark first: bun run bench -- --project scaling-by-cores";
		return;
	}
	document.getElementById("project").textContent = report.project;
	status.textContent = `Generated at ${report.generatedAt}, ${report.runs} runs per row after ${report.warmup} warm-up.`;

	const workload = document.getElementById("workload");
	const schedule = document.getElementById("schedule");
	const metric = document.getElementById("metric");
	const parts = report.rows.map((row) => splitImplementation(row.implementation));
	fillSelect(workload, unique(parts.map((part) => part.workload)));
	fillSelect(schedule, unique(parts.map((part) => part.mode).filter((mode) => mode !== "seq")));

	const machine = document.getElementById("machine");
	for (const [key, value] of [...Object.entries(report.machine), ...Object.entries(report.runtimes)]) {
		machine.append(
			element("dt", "font-semibold", key),
			element("dd", "mb-1 text-slate-600 dark:text-slate-300", value),
		);
	}

	function render() {
		const series = seriesOf(report.rows, workload.value, schedule.value);
		drawChart(document.getElementById("chart"), series, metric.value);
		drawTable(document.getElementById("table"), series);
	}
	for (const select of [workload, schedule, metric]) {
		select.addEventListener("change", render);
	}
	render();
}

main();
