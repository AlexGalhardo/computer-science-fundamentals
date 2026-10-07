// EN: Static page of the CPU scheduling simulator. It reads `window.SCHED_RESULTS`, written by
//     the demo in `../results/results.js`, and draws one Gantt chart per policy plus the
//     comparison table. There is no build step and no network request: the page works when
//     opened straight from disk.
// PT: Página estática do simulador de escalonamento de CPU. Ela lê `window.SCHED_RESULTS`,
//     escrito pela demo em `../results/results.js`, e desenha um gráfico de Gantt por política
//     e a tabela de comparação. Não há etapa de build nem requisição de rede: a página funciona
//     aberta direto do disco.

const SVG = "http://www.w3.org/2000/svg";
const COLOURS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#4b5563"];
const WIDTH = 720;
const BAR_HEIGHT = 36;
const PAD = 12;

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

// EN: Every process keeps the same colour in every chart, so the eye can follow one process
//     across the policies and see where it was moved to.
// PT: Cada processo mantém a mesma cor em todos os gráficos, então o olho consegue acompanhar um
//     processo entre as políticas e ver para onde ele foi movido.
function drawGantt(schedule, colourOf) {
	const end = schedule.slices.reduce((latest, slice) => Math.max(latest, slice.end), 1);
	const scale = (WIDTH - 2 * PAD) / end;
	const chart = svg("svg", { viewBox: `0 0 ${WIDTH} ${BAR_HEIGHT + 34}`, role: "img", class: "w-full h-auto" });
	chart.append(svg("title", {}, `Gantt chart of ${schedule.policy}`));
	for (const slice of schedule.slices) {
		const x = PAD + slice.start * scale;
		const width = (slice.end - slice.start) * scale;
		const bar = svg("rect", {
			x,
			y: 4,
			width,
			height: BAR_HEIGHT,
			fill: colourOf(slice.id),
			stroke: "#ffffff",
			"stroke-width": 1,
		});
		bar.append(svg("title", {}, `${slice.id}: ${slice.start} to ${slice.end}`));
		chart.append(
			bar,
			svg(
				"text",
				{
					x: x + width / 2,
					y: 4 + BAR_HEIGHT / 2 + 5,
					"text-anchor": "middle",
					"font-size": 14,
					"font-weight": 600,
					fill: "#ffffff",
				},
				slice.id,
			),
		);
	}
	const ticks = new Set([0, ...schedule.slices.map((slice) => slice.end)]);
	for (const tick of ticks) {
		chart.append(
			svg(
				"text",
				{
					x: PAD + tick * scale,
					y: BAR_HEIGHT + 24,
					"text-anchor": "middle",
					"font-size": 12,
					fill: "currentColor",
				},
				String(tick),
			),
		);
	}
	return chart;
}

function drawCharts(report) {
	const ids = report.example.processes.map((process) => process.id);
	const colourOf = (id) => COLOURS[Math.max(ids.indexOf(id), 0) % COLOURS.length];
	const container = document.getElementById("charts");
	for (const schedule of report.example.schedules) {
		const card = element(
			"article",
			"rounded-lg border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900",
		);
		const a = schedule.averages;
		card.append(
			element("h3", "font-semibold", schedule.policy),
			drawGantt(schedule, colourOf),
			element(
				"p",
				"mt-1 text-sm text-slate-600 dark:text-slate-300",
				`average waiting ${a.waiting.toFixed(2)}, turnaround ${a.turnaround.toFixed(2)}, response ${a.response.toFixed(2)}, longest wait ${a.maxWaiting}`,
			),
		);
		container.append(card);
	}
}

function drawTable(container, result) {
	const columns = [
		["waiting", "avg waiting"],
		["turnaround", "avg turnaround"],
		["response", "avg response"],
		["maxWaiting", "max waiting"],
	];
	const table = element("table", "w-full border-collapse text-sm");
	const head = element("tr", "border-b border-slate-300 text-left dark:border-slate-600");
	head.append(element("th", "px-2 py-2 font-semibold", "policy"));
	for (const [, title] of columns) {
		head.append(element("th", "px-2 py-2 font-semibold", title));
	}
	table.append(head);
	for (const row of result.rows) {
		const line = element("tr", "border-b border-slate-200 dark:border-slate-700");
		line.append(element("td", "px-2 py-1.5 font-semibold", row.policy));
		for (const [key] of columns) {
			const worst = Math.max(...result.rows.map((other) => other[key]), 1);
			const cell = element("td", "px-2 py-1.5 tabular-nums");
			const bar = element("div", "mt-1 h-1.5 rounded bg-blue-600");
			bar.style.width = `${Math.max((row[key] / worst) * 100, 1)}%`;
			cell.append(element("span", "", row[key].toFixed(2)), bar);
			line.append(cell);
		}
		table.append(line);
	}
	container.replaceChildren(table);
}

function main() {
	const report = window.SCHED_RESULTS;
	const status = document.getElementById("status");
	if (!report) {
		status.textContent = "No results yet. Run the demo first: docker compose run --rm demo";
		return;
	}
	status.textContent = `Deterministic simulation, seed ${report.seed}. Generated by: ${report.command}`;
	document.getElementById("example").textContent =
		`Processes as id(arrival, burst, priority): ${report.example.processes
			.map((process) => `${process.id}(${process.arrival}, ${process.burst}, ${process.priority})`)
			.join(" ")}`;
	drawCharts(report);

	const select = document.getElementById("workload");
	select.replaceChildren(
		...report.workloads.map(
			(result) => new Option(`${result.workload} (${result.processes} processes)`, result.workload),
		),
	);
	const render = () => {
		const result = report.workloads.find((item) => item.workload === select.value);
		if (result) {
			drawTable(document.getElementById("table"), result);
		}
	};
	select.addEventListener("change", render);
	render();
}

main();
