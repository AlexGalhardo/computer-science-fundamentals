// EN: Static dashboard. It reads `window.HTTP_VERSIONS_RESULTS`, written by the measurement in
//     `../results/results.js`, and draws one waterfall per HTTP version. There is no build step
//     and no network request: the page works when opened straight from disk.
// PT: Dashboard estático. Ele lê `window.HTTP_VERSIONS_RESULTS`, escrito pela medição em
//     `../results/results.js`, e desenha uma cascata por versão do HTTP. Não há etapa de build
//     nem requisição de rede: a página funciona aberta direto do disco.
// ES: Dashboard estático. Lee `window.HTTP_VERSIONS_RESULTS`, escrito por la medición en
//     `../results/results.js`, y dibuja una cascada por versión de HTTP. No hay paso de build
//     ni petición de red: la página funciona abierta directamente desde el disco.

const SVG = "http://www.w3.org/2000/svg";
const COLOURS = { h1: "#dc2626", h2: "#2563eb", h3: "#16a34a" };
const CONDITION_TITLES = { clean: "No shaping", latency: "Latency", "latency-loss": "Latency and loss" };
const WIDTH = 360;
const ROW = 2;
const PAD = { top: 8, right: 16, bottom: 28, left: 8 };

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

function conditionLabel(cell) {
	const title = CONDITION_TITLES[cell.condition] ?? cell.condition;
	return cell.netem ? `${title} (netem ${cell.netem})` : title;
}

// EN: How to read the shapes. A bar starts when the browser WANTED the image, which is almost
//     the same instant for all of them, and the bars are drawn in the order they finished.
//     HTTP/1.1 draws a triangle: the browser opens about six connections per origin, each one
//     carries a single request at a time, so most of a bar is time spent waiting in the queue
//     for a free connection, and each group of six costs one more round trip. HTTP/2 and HTTP/3
//     multiplex: all the requests leave at once on one connection, so the bars are short and
//     the chart is a narrow block.
// PT: Como ler as formas. Uma barra começa quando o navegador QUIS a imagem, que é quase o mesmo
//     instante para todas, e as barras são desenhadas na ordem em que terminaram. O HTTP/1.1
//     desenha um triângulo: o navegador abre cerca de seis conexões por origem, cada uma carrega
//     uma única requisição por vez, então a maior parte de uma barra é tempo esperando na fila
//     por uma conexão livre, e cada grupo de seis custa mais uma ida e volta. HTTP/2 e HTTP/3
//     multiplexam: todas as requisições saem de uma vez em uma conexão, então as barras são
//     curtas e o gráfico é um bloco estreito.
// ES: Cómo leer las formas. Una barra empieza cuando el navegador QUISO la imagen, que es casi
//     el mismo instante para todas, y las barras se dibujan en el orden en que terminaron.
//     HTTP/1.1 dibuja un triángulo: el navegador abre unas seis conexiones por origen, cada una
//     lleva una única petición a la vez, así que la mayor parte de una barra es tiempo
//     esperando en la cola una conexión libre, y cada grupo de seis cuesta un viaje de ida y
//     vuelta más. HTTP/2 y HTTP/3 multiplexan: todas las peticiones salen a la vez en una
//     conexión, así que las barras son cortas y el gráfico es un bloque estrecho.
function drawWaterfall(cell, maxMs) {
	const height = PAD.top + cell.waterfall.length * ROW + PAD.bottom;
	const scale = (ms) => PAD.left + (ms / maxMs) * (WIDTH - PAD.left - PAD.right);
	const chart = svg("svg", { viewBox: `0 0 ${WIDTH} ${height}`, role: "img", class: "w-full h-auto" });
	chart.append(
		svg("title", {}, `${cell.protocolLabel}: start and end of each of the ${cell.waterfall.length} images`),
	);

	const step = maxMs > 2000 ? 500 : maxMs > 800 ? 200 : 100;
	for (let tick = 0; tick <= maxMs; tick += step) {
		chart.append(
			svg("line", {
				x1: scale(tick),
				x2: scale(tick),
				y1: PAD.top,
				y2: height - PAD.bottom,
				stroke: "currentColor",
				"stroke-opacity": 0.12,
			}),
			svg(
				"text",
				{
					x: scale(tick),
					y: height - PAD.bottom + 14,
					"text-anchor": "middle",
					"font-size": 9,
					fill: "currentColor",
				},
				String(tick),
			),
		);
	}
	chart.append(
		svg(
			"text",
			{ x: WIDTH / 2, y: height - 2, "text-anchor": "middle", "font-size": 9, fill: "currentColor" },
			"milliseconds since the navigation started",
		),
	);

	const bars = [...cell.waterfall].sort((a, b) => a[1] - b[1]);
	bars.forEach(([start, end], index) => {
		chart.append(
			svg("rect", {
				x: scale(start),
				y: PAD.top + index * ROW,
				width: Math.max(scale(end) - scale(start), 0.6),
				height: ROW - 0.4,
				fill: COLOURS[cell.protocol],
			}),
		);
	});
	chart.append(
		svg("line", {
			x1: scale(cell.waterfallLoadMs),
			x2: scale(cell.waterfallLoadMs),
			y1: PAD.top,
			y2: height - PAD.bottom,
			stroke: "currentColor",
			"stroke-dasharray": "3 2",
		}),
	);

	const card = element(
		"section",
		"rounded-lg border border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900",
	);
	card.append(
		element("h2", "text-lg font-semibold", cell.protocolLabel),
		element(
			"p",
			"mb-2 text-sm text-slate-600 dark:text-slate-300",
			`port ${cell.port}, this load: ${cell.waterfallLoadMs.toFixed(0)} ms, mean of ${cell.runsMs.length}: ${cell.meanMs.toFixed(0)} ms`,
		),
		chart,
	);
	return card;
}

function drawTable(container, cells) {
	const table = element("table", "w-full border-collapse text-sm");
	const head = element("tr", "border-b border-slate-300 text-left dark:border-slate-600");
	for (const title of [
		"condition",
		"protocol",
		"mean (ms)",
		"± (ms)",
		"median (ms)",
		"connection setup (ms)",
		"half of the images (ms)",
	]) {
		head.append(element("th", "px-2 py-2 font-semibold", title));
	}
	table.append(head);
	for (const cell of cells) {
		const line = element("tr", "border-b border-slate-200 dark:border-slate-700");
		const values = [
			conditionLabel(cell),
			cell.protocolLabel,
			cell.meanMs.toFixed(0),
			cell.stddevMs.toFixed(0),
			cell.medianMs.toFixed(0),
			cell.connectMeanMs.toFixed(0),
			cell.halfImagesMeanMs.toFixed(0),
		];
		for (const value of values) {
			line.append(element("td", "px-2 py-1.5 tabular-nums", value));
		}
		table.append(line);
	}
	container.replaceChildren(table);
}

function main() {
	const report = window.HTTP_VERSIONS_RESULTS;
	const status = document.getElementById("status");
	if (!report) {
		status.textContent = "No results yet. Run the measurement first: docker compose run --rm bench";
		return;
	}
	status.textContent = `${report.imageCount} images per page. ${report.method}`;

	const select = document.getElementById("condition");
	const seen = new Set();
	for (const cell of report.cells) {
		if (!seen.has(cell.condition)) {
			seen.add(cell.condition);
			select.append(new Option(conditionLabel(cell), cell.condition));
		}
	}
	// EN: Start on the condition where the three versions differ the most.
	// PT: Começa na condição em que as três versões mais diferem.
	// ES: Empieza en la condición en que las tres versiones más difieren.
	select.value = seen.has("latency") ? "latency" : select.value;

	const machine = document.getElementById("machine");
	for (const [key, value] of [...Object.entries(report.machine), ["command", report.command]]) {
		machine.append(
			element("dt", "font-semibold", key),
			element("dd", "mb-1 text-slate-600 dark:text-slate-300", String(value)),
		);
	}

	function render() {
		const cells = report.cells.filter((cell) => cell.condition === select.value);
		const maxMs = Math.max(
			...cells.map((cell) => Math.max(cell.waterfallLoadMs, ...cell.waterfall.map((bar) => bar[1]))),
		);
		document.getElementById("waterfalls").replaceChildren(...cells.map((cell) => drawWaterfall(cell, maxMs)));
	}
	select.addEventListener("change", render);
	render();
	drawTable(document.getElementById("table"), report.cells);
}

main();
