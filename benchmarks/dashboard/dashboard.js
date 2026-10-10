// EN: The language benchmark dashboard. It reads two globals loaded by <script> tags,
//     `BENCH_DATA` (the numbers, written by `bun run data`) and `BENCH_CONTENT` (every text, in
//     English and Portuguese), and builds the whole page from them. There is no framework, no
//     build step and no network request: the page works when opened straight from disk.
// PT: O dashboard de benchmark das linguagens. Ele lê dois globais carregados por tags
//     <script>, `BENCH_DATA` (os números, escritos pelo `bun run data`) e `BENCH_CONTENT` (todos
//     os textos, em inglês e português), e monta a página inteira a partir deles. Não há
//     framework, etapa de build nem requisição de rede: a página funciona aberta direto do disco.
// ES: El dashboard de benchmark de los lenguajes. Lee dos globales cargados por etiquetas
//     <script>, `BENCH_DATA` (los números, escritos por `bun run data`) y `BENCH_CONTENT` (todos
//     los textos, en inglés, portugués y español), y arma la página completa a partir de ellos.
//     No hay framework, paso de build ni petición de red: la página funciona abierta directo
//     desde el disco.

const SVG = "http://www.w3.org/2000/svg";
const data = window.BENCH_DATA;
const content = window.BENCH_CONTENT;
const LANGUAGES = ["cpp", "rust", "go", "java", "ts", "python", "elixir"];

// ---------- state ----------

// EN: Preferences are remembered in the browser. Storage can be blocked (private windows, some
//     file:// setups), so every access is wrapped and the page works without it.
// PT: As preferências ficam guardadas no navegador. O armazenamento pode estar bloqueado
//     (janelas privadas, alguns casos de file://), então todo acesso é protegido e a página
//     funciona sem ele.
// ES: Las preferencias se guardan en el navegador. El almacenamiento puede estar bloqueado
//     (ventanas privadas, algunos casos de file://), así que todo acceso está protegido y la
//     página funciona sin él.
function remember(key, value) {
	try {
		localStorage.setItem(`bench-${key}`, value);
	} catch {
		// EN: Storage is unavailable: the choice simply lasts until the page is closed.
		// PT: Armazenamento indisponível: a escolha simplesmente dura até a página ser fechada.
		// ES: Almacenamiento no disponible: la elección simplemente dura hasta que se cierra la página.
	}
}
function recall(key) {
	try {
		return localStorage.getItem(`bench-${key}`);
	} catch {
		return null;
	}
}

const LOCALES = { en: "en-US", pt: "pt-BR", es: "es-419" };
const HTML_LANGS = { en: "en", pt: "pt-BR", es: "es" };

function browserLanguage() {
	const preferred = navigator.language.toLowerCase();
	return preferred.startsWith("pt") ? "pt" : preferred.startsWith("es") ? "es" : "en";
}

const state = {
	lang: recall("lang") ?? browserLanguage(),
	theme: recall("theme"),
	visible: new Set(LANGUAGES),
	endpoint: "echo",
	phase: "read",
};

const text = () => content[state.lang];
const locale = () => LOCALES[state.lang] ?? LOCALES.en;
const nameOf = (language) => content.languageNames[language] ?? language;

// ---------- small DOM helpers ----------

function el(name, className, ...children) {
	const node = document.createElement(name);
	if (className) {
		node.className = className;
	}
	node.append(...children.filter((child) => child !== null && child !== undefined));
	return node;
}

function svg(name, attributes, textContent) {
	const node = document.createElementNS(SVG, name);
	for (const [key, value] of Object.entries(attributes)) {
		node.setAttribute(key, String(value));
	}
	if (textContent !== undefined) {
		node.textContent = textContent;
	}
	return node;
}

// EN: Texts mark technical words as [[term-id|visible words]]. This turns each mark into a
//     button that opens the explanation of that term, and leaves the rest as plain text.
// PT: Os textos marcam palavras técnicas como [[id-do-termo|palavras visíveis]]. Isto transforma
//     cada marca em um botão que abre a explicação do termo, e deixa o resto como texto comum.
// ES: Los textos marcan palabras técnicas como [[id-del-termino|palabras visibles]]. Esto convierte
//     cada marca en un botón que abre la explicación del término, y deja el resto como texto común.
function rich(source) {
	const fragment = document.createDocumentFragment();
	const pattern = /\[\[([a-z0-9-]+)\|([^\]]+)\]\]/g;
	let last = 0;
	for (const match of source.matchAll(pattern)) {
		fragment.append(source.slice(last, match.index));
		fragment.append(termButton(match[1], match[2]));
		last = match.index + match[0].length;
	}
	fragment.append(source.slice(last));
	return fragment;
}

function termButton(id, label) {
	const button = el("button", "term", label);
	button.type = "button";
	button.dataset.term = id;
	// EN: The glossary entry is always on the page, so a screen reader can read the
	//     explanation even though the floating box is only visual.
	// PT: A entrada do glossário está sempre na página, então um leitor de tela consegue ler a
	//     explicação mesmo que a caixa flutuante seja só visual.
	// ES: La entrada del glosario siempre está en la página, así que un lector de pantalla puede
	//     leer la explicación aunque la caja flotante sea solo visual.
	button.setAttribute("aria-describedby", `def-${id}`);
	return button;
}

function fill(template, values) {
	return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

// ---------- numbers ----------

function number(value, digits) {
	const places = digits ?? (Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 10 ? 1 : 2);
	return value.toLocaleString(locale(), { minimumFractionDigits: places, maximumFractionDigits: places });
}

const UNITS = {
	ms: (value) => `${number(value)} ms`,
	mib: (value) => `${number(value / 1024, value / 1024 >= 100 ? 0 : 1)} MiB`,
	bytes: (value) => `${number(value, 0)} B`,
	rps: (value) => `${number(value, 0)} req/s`,
	percent: (value) => `${number(value, 0)} %`,
	times: (value) => `${number(value, 2)}×`,
	ops: (value) => `${number(value, 0)} ops/s`,
	// EN: Sizes on disk arrive in bytes and are shown in the unit that keeps the number short.
	// PT: Os tamanhos em disco chegam em bytes e são mostrados na unidade que deixa o número curto.
	// ES: Los tamaños en disco llegan en bytes y se muestran en la unidad que deja el número corto.
	size: (value) =>
		value >= 1024 * 1024
			? `${number(value / 1024 / 1024, 1)} MiB`
			: value >= 1024
				? `${number(value / 1024, 1)} KiB`
				: `${number(value, 0)} B`,
};

// EN: "About 12 times": one decimal for small ratios, none for large ones. A caption is a
//     summary, so it should not look more exact than the measurement is.
// PT: "Cerca de 12 vezes": uma casa decimal para razões pequenas, nenhuma para as grandes. Uma
//     legenda é um resumo, então não deve parecer mais exata do que a medição é.
// ES: "Unas 12 veces": un decimal para razones pequeñas, ninguno para las grandes. Una leyenda
//     es un resumen, así que no debe parecer más exacta de lo que es la medición.
function ratio(value) {
	return number(value, value >= 10 ? 0 : 1);
}

// ---------- tooltips ----------

const tip = document.getElementById("tip");
let tipOwner = null;
let tipPinned = null;

function tipTextOf(node) {
	if (node.dataset.term !== undefined) {
		const term = text().glossary.terms[node.dataset.term];
		return term === undefined ? "" : `${term.term}: ${term.text}`;
	}
	return node.dataset.tip ?? "";
}

// EN: The box is placed under the word, then pushed back inside the window on every side, so
//     it can never cause a horizontal scroll on a narrow phone.
// PT: A caixa é posta embaixo da palavra e depois empurrada para dentro da janela em todos os
//     lados, então ela nunca causa rolagem horizontal em um celular estreito.
// ES: La caja se coloca debajo de la palabra y luego se empuja hacia dentro de la ventana por
//     todos los lados, así que nunca causa desplazamiento horizontal en un celular estrecho.
function showTip(node) {
	const message = tipTextOf(node);
	if (message === "") {
		return;
	}
	if (tipOwner !== null && tipOwner !== node) {
		tipOwner.removeAttribute("data-open");
	}
	tipOwner = node;
	node.setAttribute("data-open", "true");
	tip.textContent = message;
	tip.hidden = false;
	const margin = 8;
	const width = Math.min(300, window.innerWidth - 2 * margin);
	tip.style.width = `${width}px`;
	const anchor = node.getBoundingClientRect();
	const left = Math.min(
		Math.max(anchor.left + anchor.width / 2 - width / 2, margin),
		window.innerWidth - width - margin,
	);
	const height = tip.offsetHeight;
	const below = anchor.bottom + 6;
	const top = below + height > window.innerHeight - margin ? Math.max(margin, anchor.top - height - 6) : below;
	tip.style.left = `${left}px`;
	tip.style.top = `${top}px`;
}

function hideTip() {
	if (tipOwner !== null) {
		tipOwner.removeAttribute("data-open");
	}
	tipOwner = null;
	tipPinned = null;
	tip.hidden = true;
}

const tipTarget = (event) => (event.target instanceof Element ? event.target.closest("[data-term], [data-tip]") : null);

// EN: Three ways in, one box: the mouse (hover), the keyboard (focus) and a finger (tap, which
//     the browser reports as a click). A click pins the box open and a second click closes it.
// PT: Três entradas, uma caixa: o mouse (passar por cima), o teclado (foco) e o dedo (toque, que
//     o navegador informa como clique). Um clique fixa a caixa aberta e um segundo clique a fecha.
// ES: Tres entradas, una caja: el mouse (pasar por encima), el teclado (foco) y el dedo (toque,
//     que el navegador informa como clic). Un clic fija la caja abierta y un segundo clic la cierra.
document.addEventListener("mouseover", (event) => {
	const node = tipTarget(event);
	if (node !== null && tipPinned === null) {
		showTip(node);
	}
});
document.addEventListener("mouseout", (event) => {
	const node = tipTarget(event);
	if (node !== null && node === tipOwner && tipPinned === null && document.activeElement !== node) {
		hideTip();
	}
});
document.addEventListener("focusin", (event) => {
	const node = tipTarget(event);
	if (node !== null && tipPinned !== node) {
		showTip(node);
	}
});
document.addEventListener("focusout", (event) => {
	if (tipTarget(event) === tipOwner) {
		hideTip();
	}
});
document.addEventListener("click", (event) => {
	const node = tipTarget(event);
	if (node === null || tipPinned === node) {
		hideTip();
		return;
	}
	showTip(node);
	tipPinned = node;
});
document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		hideTip();
	}
});
window.addEventListener("scroll", () => (tipOwner === null ? undefined : showTip(tipOwner)), { passive: true });

// ---------- cards ----------

const CARD = "rounded-xl border border-line p-4";

function noteCard(tone, title, body) {
	const card = el("div", `${CARD} ${tone}`);
	card.append(el("h4", "text-sm font-bold", title), el("p", "mt-1 text-sm leading-relaxed", rich(body)));
	return card;
}

function explainCard(section) {
	const ui = text().ui;
	const card = el("div", `${CARD} bg-info`);
	card.dataset.explain = "true";
	const grid = el("dl", "grid gap-4 md:grid-cols-2");
	for (const [label, body] of [
		[ui.what, section.what],
		[ui.analogy, section.analogy],
		[ui.matters, section.matters],
		[ui.read, section.read],
	]) {
		grid.append(
			el("div", "", el("dt", "text-sm font-bold", label), el("dd", "mt-1 text-sm leading-relaxed", rich(body))),
		);
	}
	card.append(grid);
	return card;
}

// ---------- charts ----------

function chartWidth(container) {
	return Math.max(240, Math.floor(container.clientWidth || 640));
}

function mark(node, label) {
	node.classList.add("mark");
	node.dataset.tip = label;
	return node;
}

function emptyChart(container) {
	container.replaceChildren(el("p", "py-6 text-sm text-soft", text().ui.noData));
}

// EN: Horizontal bars, one per language. Each row has the name and the number written above the
//     bar, so nothing has to be guessed from colour or from the axis, and the layout survives
//     a 320 px screen. The thin line over the bar goes from the smallest to the largest run:
//     it shows how much the measurement moved.
// PT: Barras horizontais, uma por linguagem. Cada linha tem o nome e o número escritos acima da
//     barra, então nada precisa ser adivinhado pela cor ou pelo eixo, e o desenho sobrevive a
//     uma tela de 320 px. A linha fina sobre a barra vai da menor à maior execução: ela mostra
//     o quanto a medição variou.
// ES: Barras horizontales, una por lenguaje. Cada fila tiene el nombre y el número escritos
//     sobre la barra, así que no hay que adivinar nada por el color o por el eje, y el dibujo
//     sobrevive a una pantalla de 320 px. La línea fina sobre la barra va de la ejecución menor a
//     la mayor: muestra cuánto varió la medición.
function drawBars(container, rows, spec) {
	if (rows.length === 0) {
		emptyChart(container);
		return;
	}
	const width = chartWidth(container);
	const rowHeight = 46;
	const top = spec.limit === undefined ? 4 : 22;
	const height = top + rows.length * rowHeight + 4;
	const largest = Math.max(...rows.map((row) => Math.max(row.value, row.high ?? 0)), spec.limit?.value ?? 0) || 1;
	const scale = (value) => (Math.max(value, 0) / largest) * width;
	const chart = svg("svg", {
		width,
		height,
		viewBox: `0 0 ${width} ${height}`,
		role: "img",
		"aria-label": spec.label,
	});

	if (spec.limit !== undefined) {
		const x = Math.min(scale(spec.limit.value), width - 1);
		chart.append(svg("text", { x, y: 12, "text-anchor": "end", class: "chart-soft" }, spec.limit.label));
		// EN: The limit is marked on each bar only, so it never crosses the numbers written above.
		// PT: O limite é marcado só em cada barra, então nunca atravessa os números escritos acima.
		// ES: El límite se marca solo en cada barra, así que nunca cruza los números escritos arriba.
		rows.forEach((_, index) => {
			const y = top + index * rowHeight;
			chart.append(
				svg("line", {
					x1: x,
					x2: x,
					y1: y + 19,
					y2: y + 39,
					stroke: "var(--color-ink)",
					"stroke-width": 2,
					"stroke-dasharray": "3 3",
				}),
			);
		});
	}

	rows.forEach((row, index) => {
		const y = top + index * rowHeight;
		const group = svg("g", {});
		const valueText = spec.format(row.value) + (row.spreadText ? ` ${row.spreadText}` : "");
		group.append(
			svg("text", { x: 0, y: y + 15, class: "chart-text", "font-weight": 600 }, row.name),
			svg("text", { x: width, y: y + 15, "text-anchor": "end", class: "chart-text" }, valueText),
			svg("rect", { x: 0, y: y + 22, width, height: 14, rx: 4, fill: "var(--color-track)" }),
			svg("rect", {
				x: 0,
				y: y + 22,
				width: Math.max(scale(row.value), 3),
				height: 14,
				rx: 4,
				fill: `var(--lang-${row.language})`,
				class: "bar",
			}),
		);
		if (row.low !== undefined && row.high !== undefined && row.high > row.low) {
			const from = scale(row.low);
			const to = Math.min(scale(row.high), width - 1);
			group.append(
				svg("line", {
					x1: from,
					x2: to,
					y1: y + 29,
					y2: y + 29,
					stroke: "var(--color-ink)",
					"stroke-width": 1.5,
				}),
				svg("line", {
					x1: from,
					x2: from,
					y1: y + 25,
					y2: y + 33,
					stroke: "var(--color-ink)",
					"stroke-width": 1.5,
				}),
				svg("line", {
					x1: to,
					x2: to,
					y1: y + 25,
					y2: y + 33,
					stroke: "var(--color-ink)",
					"stroke-width": 1.5,
				}),
			);
		}
		// EN: An invisible rectangle over the whole row is the hover and tap target.
		// PT: Um retângulo invisível sobre a linha inteira é o alvo do mouse e do toque.
		// ES: Un rectángulo invisible sobre toda la fila es el objetivo del mouse y del toque.
		group.append(mark(svg("rect", { x: 0, y, width, height: rowHeight - 4, fill: "transparent" }), row.tip));
		chart.append(group);
	});
	container.replaceChildren(chart);
}

// EN: Latency chart: three bars per language (p50, p95, p99), from light to strong. The
//     distance between the first and the last bar is the "tail": how much worse the unlucky
//     requests are than the typical one.
// PT: Gráfico de latência: três barras por linguagem (p50, p95, p99), da mais clara à mais
//     forte. A distância entre a primeira e a última barra é a "cauda": o quanto as requisições
//     azaradas são piores que a típica.
// ES: Gráfico de latencia: tres barras por lenguaje (p50, p95, p99), de la más clara a la más
//     fuerte. La distancia entre la primera y la última barra es la "cola": cuánto peores son las
//     peticiones con mala suerte que la típica.
function drawPercentiles(container, rows, spec) {
	if (rows.length === 0) {
		emptyChart(container);
		return;
	}
	const width = chartWidth(container);
	const labelWidth = 34;
	const valueWidth = 84;
	const barMax = width - labelWidth - valueWidth;
	const rowHeight = 86;
	const height = rows.length * rowHeight;
	const largest = Math.max(...rows.map((row) => row.p99)) || 1;
	const chart = svg("svg", {
		width,
		height,
		viewBox: `0 0 ${width} ${height}`,
		role: "img",
		"aria-label": spec.label,
	});
	rows.forEach((row, index) => {
		const y = index * rowHeight;
		chart.append(svg("text", { x: 0, y: y + 15, class: "chart-text", "font-weight": 600 }, row.name));
		[
			["p50", row.p50, 0.45],
			["p95", row.p95, 0.72],
			["p99", row.p99, 1],
		].forEach(([label, value, opacity], line) => {
			const barY = y + 24 + line * 18;
			const length = Math.max((value / largest) * barMax, 3);
			chart.append(
				svg("text", { x: 0, y: barY + 11, class: "chart-soft" }, label),
				svg("rect", {
					x: labelWidth,
					y: barY,
					width: length,
					height: 13,
					rx: 4,
					fill: `var(--lang-${row.language})`,
					"fill-opacity": opacity,
					class: "bar",
				}),
				svg("text", { x: labelWidth + length + 6, y: barY + 11, class: "chart-text" }, UNITS.ms(value)),
			);
		});
		chart.append(mark(svg("rect", { x: 0, y, width, height: rowHeight - 6, fill: "transparent" }), row.tip));
	});
	container.replaceChildren(chart);
}

// EN: Speed-up against workers. Both axes double at every step (1, 2, 4, 8, 16), so the perfect
//     result, "twice the workers, twice as fast", is a straight diagonal. Real lines bend away
//     from it, and the gap is the time lost to coordination and to shared hardware.
// PT: Speed-up contra workers. Os dois eixos dobram a cada passo (1, 2, 4, 8, 16), então o
//     resultado perfeito, "o dobro de workers, o dobro da velocidade", é uma diagonal reta. As
//     linhas reais se afastam dela, e a distância é o tempo perdido com coordenação e com
//     hardware compartilhado.
// ES: Speed-up contra workers. Los dos ejes se duplican en cada paso (1, 2, 4, 8, 16), así que el
//     resultado perfecto, "el doble de workers, el doble de velocidad", es una diagonal recta.
//     Las líneas reales se alejan de ella, y la distancia es el tiempo perdido en coordinación y
//     en hardware compartido.
function drawSpeedup(container, series, spec) {
	if (series.length === 0) {
		emptyChart(container);
		return;
	}
	const width = chartWidth(container);
	const height = Math.min(360, Math.max(260, Math.round(width * 0.62)));
	const pad = { top: 14, right: 14, bottom: 44, left: 48 };
	const workers = series[0].points.map((point) => point.workers);
	const maxWorkers = Math.max(...workers);
	const lowest = Math.min(1, ...series.flatMap((item) => item.points.map((point) => point.speedup)));
	const yMin = Math.log2(Math.max(lowest, 0.25));
	const yMax = Math.log2(maxWorkers);
	const x = (value) => pad.left + (Math.log2(value) / Math.log2(maxWorkers)) * (width - pad.left - pad.right);
	const y = (value) =>
		height -
		pad.bottom -
		((Math.log2(Math.max(value, 0.25)) - yMin) / (yMax - yMin)) * (height - pad.top - pad.bottom);
	const chart = svg("svg", {
		width,
		height,
		viewBox: `0 0 ${width} ${height}`,
		role: "img",
		"aria-label": spec.label,
	});

	for (const tick of workers) {
		chart.append(
			svg("line", {
				x1: pad.left,
				x2: width - pad.right,
				y1: y(tick),
				y2: y(tick),
				stroke: "var(--color-line)",
				"stroke-width": 1,
			}),
			svg("text", { x: pad.left - 8, y: y(tick) + 4, "text-anchor": "end", class: "chart-soft" }, `${tick}×`),
			svg(
				"text",
				{ x: x(tick), y: height - pad.bottom + 18, "text-anchor": "middle", class: "chart-soft" },
				String(tick),
			),
		);
	}
	chart.append(
		svg(
			"text",
			{ x: (pad.left + width - pad.right) / 2, y: height - 6, "text-anchor": "middle", class: "chart-soft" },
			spec.xLabel,
		),
		svg(
			"text",
			{
				x: 12,
				y: (pad.top + height - pad.bottom) / 2,
				"text-anchor": "middle",
				class: "chart-soft",
				transform: `rotate(-90 12 ${(pad.top + height - pad.bottom) / 2})`,
			},
			spec.yLabel,
		),
		svg("line", {
			x1: x(1),
			y1: y(1),
			x2: x(maxWorkers),
			y2: y(maxWorkers),
			stroke: "var(--color-soft)",
			"stroke-width": 2,
			"stroke-dasharray": "6 5",
			class: "ideal",
		}),
		svg(
			"text",
			{ x: x(maxWorkers) - 6, y: y(maxWorkers) + 16, "text-anchor": "end", class: "chart-soft" },
			spec.idealLabel,
		),
	);

	for (const item of series) {
		const colour = `var(--lang-${item.language})`;
		const path = item.points
			.map(
				(point, index) =>
					`${index === 0 ? "M" : "L"}${x(point.workers).toFixed(1)},${y(point.speedup).toFixed(1)}`,
			)
			.join(" ");
		chart.append(
			svg("path", {
				d: path,
				fill: "none",
				stroke: colour,
				"stroke-width": 2,
				"stroke-linejoin": "round",
				class: "line",
			}),
		);
	}
	// EN: Points are drawn after all the lines, with a ring in the card colour, so a point is
	//     never hidden under another language's line.
	// PT: Os pontos são desenhados depois de todas as linhas, com um anel na cor do cartão,
	//     então um ponto nunca fica escondido sob a linha de outra linguagem.
	// ES: Los puntos se dibujan después de todas las líneas, con un anillo del color de la tarjeta,
	//     así un punto nunca queda escondido bajo la línea de otro lenguaje.
	for (const item of series) {
		for (const point of item.points) {
			chart.append(
				svg("circle", {
					cx: x(point.workers),
					cy: y(point.speedup),
					r: 4.5,
					fill: `var(--lang-${item.language})`,
					stroke: "var(--color-card)",
					"stroke-width": 2,
				}),
				mark(
					svg("circle", { cx: x(point.workers), cy: y(point.speedup), r: 13, fill: "transparent" }),
					spec.pointTip(item, point),
				),
			);
		}
	}
	container.replaceChildren(chart);
}

function legend(languages) {
	const list = el("ul", "mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm");
	for (const language of languages) {
		const swatch = el("span", "inline-block h-3 w-3 rounded-sm");
		swatch.style.backgroundColor = `var(--lang-${language})`;
		list.append(el("li", "flex items-center gap-2", swatch, nameOf(language)));
	}
	return list;
}

function dataTable(head, rows) {
	const table = el("table", "w-full border-collapse text-sm");
	const headRow = el("tr", "border-b border-line text-left");
	for (const cell of head) {
		const th = el("th", "px-2 py-2 font-semibold", cell);
		th.scope = "col";
		headRow.append(th);
	}
	table.append(el("thead", "", headRow));
	const body = el("tbody", "");
	for (const row of rows) {
		const line = el("tr", "border-b border-line");
		for (const [index, cell] of row.entries()) {
			line.append(
				el(
					index === 0 ? "th" : "td",
					`px-2 py-1.5 tabular-nums ${index === 0 ? "text-left font-semibold" : ""}`,
					cell,
				),
			);
		}
		body.append(line);
	}
	table.append(body);
	const details = el("details", "mt-3");
	details.append(
		el("summary", "cursor-pointer py-2 text-sm font-semibold text-link", text().ui.numbers),
		el("div", "overflow-x-auto", table),
	);
	return details;
}

// ---------- captions made from the data ----------

function extremes(rows, better) {
	const sorted = [...rows].sort((a, b) => a.value - b.value);
	const best = better === "lower" ? sorted[0] : sorted.at(-1);
	const worst = better === "lower" ? sorted.at(-1) : sorted[0];
	const times =
		better === "lower" ? worst.value / Math.max(best.value, 1e-9) : best.value / Math.max(worst.value, 1e-9);
	return { best, worst, times };
}

function caption(kind, rows, better) {
	const templates = text().ui.captions;
	if (rows.length === 0) {
		return "";
	}
	if (rows.length === 1) {
		return fill(templates.single, { name: rows[0].name });
	}
	const { best, worst, times } = extremes(rows, better);
	const template = times < 1.15 ? templates.same : templates[kind];
	return fill(template, { best: best.name, worst: worst.name, times: ratio(times) });
}

// ---------- the chart list ----------

const visibleRows = (rows) => rows.filter((row) => state.visible.has(row.language));
const spreadText = (stddev, unit) => `± ${unit(stddev).replace(/\s.*$/, "")}`;

function timeRows(rows, tag) {
	const ui = text().ui;
	return visibleRows(rows).map((row) => ({
		language: row.language,
		name: nameOf(row.language) + (tag ? ` · ${tag(row)}` : ""),
		value: row.processMs,
		low: row.minMs,
		high: row.maxMs,
		spreadText: spreadText(row.stddevMs, UNITS.ms),
		tip: fill(ui.tips.time, {
			name: nameOf(row.language),
			mean: UNITS.ms(row.processMs),
			low: UNITS.ms(row.minMs),
			high: UNITS.ms(row.maxMs),
			section: UNITS.ms(row.sectionMs),
			cpu: UNITS.ms(row.cpuMs),
		}),
		raw: row,
	}));
}

function memoryRows(rows, tag) {
	const ui = text().ui;
	return visibleRows(rows).map((row) => ({
		language: row.language,
		name: nameOf(row.language) + (tag ? ` · ${tag(row)}` : ""),
		value: row.peakMemoryKb,
		tip: fill(ui.tips.memory, { name: nameOf(row.language), value: UNITS.mib(row.peakMemoryKb) }),
		raw: row,
	}));
}

function timeTable(rows) {
	const head = text().ui.tables;
	return dataTable(
		[head.language, head.process, head.range, head.section, head.cpu, head.peak],
		rows.map(({ raw }) => [
			nameOf(raw.language),
			`${UNITS.ms(raw.processMs)} ± ${number(raw.stddevMs)}`,
			`${number(raw.minMs)} – ${number(raw.maxMs)}`,
			UNITS.ms(raw.sectionMs),
			UNITS.ms(raw.cpuMs),
			UNITS.mib(raw.peakMemoryKb),
		]),
	);
}

const gcTag = (row) => (row.garbageCollected ? text().ui.gc : text().ui.manual);

function barsChart(id, getRows, unit, better, kind, table, limit) {
	return {
		id,
		draw(container, title) {
			const rows = getRows();
			drawBars(container, rows, { format: UNITS[unit], label: title, limit: limit?.() });
			return { caption: caption(kind, rows, better), better, table: rows.length > 0 ? table(rows) : null };
		},
	};
}

function httpRows() {
	return visibleRows(data.http[state.endpoint] ?? []);
}

const CHARTS = {
	cpu: [
		barsChart("cpu-nbody", () => timeRows(data.cpu.nbody), "ms", "lower", "faster", timeTable),
		barsChart("cpu-sieve", () => timeRows(data.cpu.sieve), "ms", "lower", "faster", timeTable),
	],
	parallelism: [
		{
			id: "par-speedup",
			draw(container, title) {
				const ui = text().ui;
				const series = visibleRows(data.parallelism);
				drawSpeedup(container, series, {
					label: title,
					xLabel: ui.axes.workers,
					yLabel: ui.axes.speedup,
					idealLabel: ui.ideal,
					pointTip: (item, point) =>
						fill(ui.tips.speedup, {
							name: nameOf(item.language),
							workers: point.workers,
							speedup: UNITS.times(point.speedup),
							efficiency: UNITS.percent(point.efficiency * 100),
							time: UNITS.ms(point.sectionMs),
							cpu: UNITS.ms(point.cpuMs),
						}),
				});
				const last = series
					.map((item) => ({ name: nameOf(item.language), point: item.points.at(-1) }))
					.sort((a, b) => b.point.speedup - a.point.speedup);
				const head = ui.tables;
				const table =
					series.length === 0
						? null
						: dataTable(
								[
									head.language,
									head.workers,
									head.sectionTime,
									head.speedup,
									head.efficiency,
									head.cpu,
								],
								series.flatMap((item) =>
									item.points.map((point) => [
										nameOf(item.language),
										String(point.workers),
										`${UNITS.ms(point.sectionMs)} ± ${number(point.sectionStddevMs)}`,
										UNITS.times(point.speedup),
										UNITS.percent(point.efficiency * 100),
										UNITS.ms(point.cpuMs),
									]),
								),
							);
				return {
					caption:
						last.length === 0
							? ""
							: fill(ui.captions.speedup, {
									best: last[0].name,
									workers: last[0].point.workers,
									times: ratio(last[0].point.speedup),
									worst: last.at(-1).name,
									worstTimes: ratio(last.at(-1).point.speedup),
								}),
					legend: legend(series.map((item) => item.language)),
					better: "diagonal",
					table,
				};
			},
		},
		barsChart(
			"par-efficiency",
			() => {
				const ui = text().ui;
				return visibleRows(data.parallelism).map((item) => {
					const point = item.points.find((candidate) => candidate.workers === 8) ?? item.points.at(-1);
					return {
						language: item.language,
						name: nameOf(item.language),
						value: point.efficiency * 100,
						tip: fill(ui.tips.efficiency, {
							name: nameOf(item.language),
							workers: point.workers,
							efficiency: UNITS.percent(point.efficiency * 100),
							speedup: UNITS.times(point.speedup),
						}),
					};
				});
			},
			"percent",
			"higher",
			"efficiency",
			(rows) =>
				dataTable(
					[text().ui.tables.language, text().ui.tables.efficiency],
					rows.map((row) => [row.name, UNITS.percent(row.value)]),
				),
			() => ({ value: 100, label: text().ui.limits.efficiency }),
		),
	],
	concurrency: [
		barsChart(
			"conc-time",
			() =>
				visibleRows(data.concurrency).map((row) => ({
					language: row.language,
					name: `${nameOf(row.language)} · ${text().ui.models[row.model] ?? row.model}${row.n < 100000 ? ` (${number(row.n, 0)})` : ""}`,
					value: row.processMs,
					low: row.minMs,
					high: row.maxMs,
					spreadText: spreadText(row.stddevMs, UNITS.ms),
					tip: fill(text().ui.tips.tasks, {
						name: nameOf(row.language),
						n: number(row.n, 0),
						mean: UNITS.ms(row.processMs),
						section: UNITS.ms(row.sectionMs),
						peak: UNITS.mib(row.peakMemoryKb),
						each: UNITS.bytes(row.bytesPerTask),
					}),
					raw: row,
				})),
			"ms",
			"lower",
			"faster",
			(rows) => concurrencyTable(rows),
		),
		barsChart(
			"conc-memory",
			() =>
				visibleRows(data.concurrency).map((row) => ({
					language: row.language,
					name: `${nameOf(row.language)} · ${text().ui.models[row.model] ?? row.model}${row.n < 100000 ? ` (${number(row.n, 0)})` : ""}`,
					value: row.bytesPerTask,
					tip: fill(text().ui.tips.tasks, {
						name: nameOf(row.language),
						n: number(row.n, 0),
						mean: UNITS.ms(row.processMs),
						section: UNITS.ms(row.sectionMs),
						peak: UNITS.mib(row.peakMemoryKb),
						each: UNITS.bytes(row.bytesPerTask),
					}),
					raw: row,
				})),
			"bytes",
			"lower",
			"lighter",
			(rows) => concurrencyTable(rows),
		),
	],
	http: [
		barsChart(
			"http-rps",
			() =>
				httpRows().map((row) => ({
					language: row.language,
					name: nameOf(row.language),
					value: row.rps,
					low: row.rpsMin,
					high: row.rpsMax,
					spreadText: `± ${number(row.rpsStddev, 0)}`,
					tip: fill(text().ui.tips.rps, {
						name: nameOf(row.language),
						rps: UNITS.rps(row.rps),
						low: number(row.rpsMin, 0),
						high: number(row.rpsMax, 0),
						k6: UNITS.percent(row.loadGeneratorCpuPercent),
					}),
					raw: row,
				})),
			"rps",
			"higher",
			"more",
			(rows) => httpTable(rows),
		),
		{
			id: "http-latency",
			draw(container, title) {
				const ui = text().ui;
				const rows = httpRows().map((row) => ({
					language: row.language,
					name: nameOf(row.language),
					p50: row.p50Ms,
					p95: row.p95Ms,
					p99: row.p99Ms,
					value: row.p99Ms,
					tip: fill(ui.tips.latency, {
						name: nameOf(row.language),
						p50: UNITS.ms(row.p50Ms),
						p95: UNITS.ms(row.p95Ms),
						p99: UNITS.ms(row.p99Ms),
					}),
					raw: row,
				}));
				drawPercentiles(container, rows, { label: title });
				const typical = [...rows].sort((a, b) => a.p50 - b.p50)[0];
				const tail = [...rows].sort((a, b) => a.p99 - b.p99)[0];
				return {
					caption:
						rows.length === 0
							? ""
							: fill(ui.captions.latency, {
									typical: typical.name,
									p50: UNITS.ms(typical.p50),
									tail: tail.name,
									p99: UNITS.ms(tail.p99),
								}),
					better: "lower",
					table: rows.length > 0 ? httpTable(rows) : null,
				};
			},
		},
		barsChart(
			"http-cpu",
			() =>
				httpRows().map((row) => ({
					language: row.language,
					name: nameOf(row.language),
					value: row.cpuPercent,
					tip: fill(text().ui.tips.cpu, {
						name: nameOf(row.language),
						cpu: UNITS.percent(row.cpuPercent),
						cores: number(row.cpuPercent / 100, 1),
					}),
					raw: row,
				})),
			"percent",
			"lower",
			"cpu",
			(rows) => httpTable(rows),
			() => ({ value: 400, label: text().ui.limits.cpu }),
		),
		barsChart(
			"http-memory",
			() => memoryRows(httpRows()),
			"mib",
			"lower",
			"lighter",
			(rows) => httpTable(rows),
		),
	],
	memory: [
		barsChart("mem-trees-peak", () => memoryRows(data.memory.trees, gcTag), "mib", "lower", "lighter", timeTable),
		barsChart("mem-trees-time", () => timeRows(data.memory.trees, gcTag), "ms", "lower", "faster", timeTable),
		barsChart("mem-idle-time", () => timeRows(data.memory.idle, gcTag), "ms", "lower", "faster", timeTable),
		barsChart("mem-idle-peak", () => memoryRows(data.memory.idle, gcTag), "mib", "lower", "lighter", timeTable),
	],
	build: [
		barsChart("build-cold", () => buildRows("cold"), "ms", "lower", "faster", buildTable),
		barsChart("build-warm", () => buildRows("warm"), "ms", "lower", "faster", buildTable),
	],
	size: [
		barsChart("size-artifact", () => sizeRows((row) => row.artifactBytes), "size", "lower", "smaller", sizeTable),
		barsChart(
			"size-total",
			() => sizeRows((row) => row.artifactBytes + row.runtimeBytes),
			"size",
			"lower",
			"smaller",
			sizeTable,
		),
	],
	database: [
		barsChart(
			"db-ops",
			() =>
				databaseRows().map((row) => ({
					language: row.language,
					name: nameOf(row.language),
					value: row.opsPerSecond,
					low: row.opsMin,
					high: row.opsMax,
					spreadText: `± ${number(row.opsStddev, 0)}`,
					tip: fill(text().ui.tips.ops, {
						name: nameOf(row.language),
						ops: UNITS.ops(row.opsPerSecond),
						low: number(row.opsMin, 0),
						high: number(row.opsMax, 0),
						driver: data.databaseRuntimes[row.language],
					}),
					raw: row,
				})),
			"ops",
			"higher",
			"moreOps",
			(rows) => databaseTable(rows),
		),
		{
			id: "db-latency",
			draw(container, title) {
				const ui = text().ui;
				const rows = databaseRows().map((row) => ({
					language: row.language,
					name: nameOf(row.language),
					p50: row.p50Ms,
					p95: row.p95Ms,
					p99: row.p99Ms,
					value: row.p99Ms,
					tip: fill(ui.tips.latency, {
						name: nameOf(row.language),
						p50: UNITS.ms(row.p50Ms),
						p95: UNITS.ms(row.p95Ms),
						p99: UNITS.ms(row.p99Ms),
					}),
					raw: row,
				}));
				drawPercentiles(container, rows, { label: title });
				const typical = [...rows].sort((a, b) => a.p50 - b.p50)[0];
				const tail = [...rows].sort((a, b) => a.p99 - b.p99)[0];
				return {
					caption:
						rows.length === 0
							? ""
							: fill(ui.captions.dbLatency, {
									typical: typical.name,
									p50: UNITS.ms(typical.p50),
									tail: tail.name,
									p99: UNITS.ms(tail.p99),
								}),
					better: "lower",
					table: rows.length > 0 ? databaseTable(rows) : null,
				};
			},
		},
		barsChart(
			"db-cpu",
			() =>
				visibleRows(data.database.read ?? []).map((row) => ({
					language: row.language,
					name: nameOf(row.language),
					value: row.clientCpuMs,
					tip: fill(text().ui.tips.clientCpu, { name: nameOf(row.language), cpu: UNITS.ms(row.clientCpuMs) }),
					raw: row,
				})),
			"ms",
			"lower",
			"lessCpu",
			(rows) => databaseTable(rows),
		),
		barsChart(
			"db-memory",
			() =>
				visibleRows(data.database.read ?? []).map((row) => ({
					language: row.language,
					name: nameOf(row.language),
					value: row.clientPeakMemoryKb,
					tip: fill(text().ui.tips.memory, {
						name: nameOf(row.language),
						value: UNITS.mib(row.clientPeakMemoryKb),
					}),
					raw: row,
				})),
			"mib",
			"lower",
			"lighter",
			(rows) => databaseTable(rows),
		),
	],
};

function buildRows(mode) {
	const ui = text().ui;
	return visibleRows(data.build).map((row) => ({
		language: row.language,
		name: `${nameOf(row.language)} · ${ui.steps[row.step] ?? row.step}`,
		value: row[`${mode}Ms`],
		low: row[`${mode}MinMs`],
		high: row[`${mode}MaxMs`],
		spreadText: spreadText(row[`${mode}StddevMs`], UNITS.ms),
		tip: fill(ui.tips.build, {
			name: nameOf(row.language),
			step: ui.steps[row.step] ?? row.step,
			cold: UNITS.ms(row.coldMs),
			warm: UNITS.ms(row.warmMs),
			command: row.command,
		}),
		raw: row,
	}));
}

function buildTable(rows) {
	const head = text().ui.tables;
	return dataTable(
		[head.language, head.step, head.cold, head.warm, head.command],
		rows.map(({ raw }) => [
			nameOf(raw.language),
			text().ui.steps[raw.step] ?? raw.step,
			`${UNITS.ms(raw.coldMs)} ± ${number(raw.coldStddevMs)}`,
			`${UNITS.ms(raw.warmMs)} ± ${number(raw.warmStddevMs)}`,
			raw.command,
		]),
	);
}

function sizeRows(pick) {
	const ui = text().ui;
	return visibleRows(data.size).map((row) => ({
		language: row.language,
		name: nameOf(row.language),
		value: pick(row),
		tip: fill(ui.tips.size, {
			name: nameOf(row.language),
			artifact: UNITS.size(row.artifactBytes),
			runtime: UNITS.size(row.runtimeBytes),
			total: UNITS.size(row.artifactBytes + row.runtimeBytes),
			what: ui.artifacts[row.language],
			needs: ui.runtimes[row.language],
		}),
		raw: row,
	}));
}

function sizeTable(rows) {
	const head = text().ui.tables;
	const ui = text().ui;
	return dataTable(
		[head.language, head.artifact, head.runtime, head.totalSize, head.artifactIs, head.runtimeIs],
		rows.map(({ raw }) => [
			nameOf(raw.language),
			UNITS.size(raw.artifactBytes),
			UNITS.size(raw.runtimeBytes),
			UNITS.size(raw.artifactBytes + raw.runtimeBytes),
			ui.artifacts[raw.language],
			ui.runtimes[raw.language],
		]),
	);
}

function databaseRows() {
	return visibleRows(data.database[state.phase] ?? []);
}

function databaseTable(rows) {
	const head = text().ui.tables;
	return dataTable(
		[head.language, head.ops, "p50", "p95", "p99", head.clientCpu, head.clientMemory, head.driver],
		rows.map(({ raw }) => [
			nameOf(raw.language),
			`${number(raw.opsPerSecond, 0)} ± ${number(raw.opsStddev, 0)}`,
			UNITS.ms(raw.p50Ms),
			UNITS.ms(raw.p95Ms),
			UNITS.ms(raw.p99Ms),
			UNITS.ms(raw.clientCpuMs),
			UNITS.mib(raw.clientPeakMemoryKb),
			data.databaseRuntimes[raw.language],
		]),
	);
}

function concurrencyTable(rows) {
	const head = text().ui.tables;
	return dataTable(
		[head.language, head.model, head.tasks, head.total, head.peak, head.perTask],
		rows.map(({ raw }) => [
			nameOf(raw.language),
			text().ui.models[raw.model] ?? raw.model,
			number(raw.n, 0),
			`${UNITS.ms(raw.processMs)} ± ${number(raw.stddevMs)}`,
			UNITS.mib(raw.peakMemoryKb),
			UNITS.bytes(raw.bytesPerTask),
		]),
	);
}

function httpTable(rows) {
	const head = text().ui.tables;
	return dataTable(
		[head.language, head.rps, "p50", "p95", "p99", head.peak, head.meanCpu, head.k6Cpu],
		rows.map(({ raw }) => [
			nameOf(raw.language),
			`${number(raw.rps, 0)} ± ${number(raw.rpsStddev, 0)}`,
			UNITS.ms(raw.p50Ms),
			UNITS.ms(raw.p95Ms),
			UNITS.ms(raw.p99Ms),
			UNITS.mib(raw.peakMemoryKb),
			UNITS.percent(raw.cpuPercent),
			UNITS.percent(raw.loadGeneratorCpuPercent),
		]),
	);
}

// ---------- page ----------

const redraws = [];

function chartFigure(chart, chartText) {
	const ui = text().ui;
	const figure = el("figure", `${CARD} bg-card`);
	figure.dataset.figure = chart.id;
	const captionNode = el("p", "mt-1 text-sm leading-relaxed");
	captionNode.dataset.caption = chart.id;
	const badge = el("p", "mt-2 inline-block rounded-full bg-chip px-3 py-1 text-xs font-semibold");
	const plot = el("div", "mt-3");
	plot.dataset.chart = chart.id;
	const extras = el("div", "");
	figure.append(
		el("h3", "text-lg font-bold", rich(chartText.title)),
		el("p", "mt-1 text-sm text-soft", rich(chartText.unit)),
		badge,
		plot,
		extras,
	);

	const figcaption = el("figcaption", "mt-3 rounded-lg bg-chip p-3");
	figcaption.append(el("p", "text-xs font-bold uppercase tracking-wide text-soft", ui.shows), captionNode);
	figure.append(figcaption);
	figure.append(
		el(
			"div",
			"mt-3 grid gap-3 md:grid-cols-2",
			noteCard("bg-why", ui.why, chartText.why),
			noteCard("bg-care", ui.careful, chartText.careful),
		),
	);

	redraws.push(() => {
		const result = chart.draw(
			plot,
			chartText.plain ?? chartText.title.replace(/\[\[[a-z0-9-]+\|([^\]]+)\]\]/g, "$1"),
		);
		captionNode.textContent = result.caption || ui.noData;
		badge.textContent = ui.better[result.better];
		extras.replaceChildren(...[result.legend, result.table].filter((node) => node !== null && node !== undefined));
	});
	return figure;
}

function sectionHeading(id, title) {
	const heading = el("h2", "text-2xl font-bold", title);
	heading.id = `${id}-title`;
	return heading;
}

// EN: A row of buttons that picks one option (the kind of request, the database phase). The
//     chosen one is marked with aria-pressed, which screen readers announce and the CSS paints.
// PT: Uma fileira de botões que escolhe uma opção (o tipo de requisição, a fase do banco). A
//     escolhida é marcada com aria-pressed, que os leitores de tela anunciam e o CSS pinta.
// ES: Una fila de botones que elige una opción (el tipo de petición, la fase de la base de datos).
//     La elegida se marca con aria-pressed, que los lectores de pantalla anuncian y el CSS pinta.
function optionSwitch(key, options, labels) {
	const group = el("div", "flex flex-wrap items-center gap-2");
	group.setAttribute("role", "group");
	group.setAttribute("aria-label", labels.label);
	group.dataset.switch = key;
	group.append(el("span", "text-sm font-semibold", rich(labels.rich)));
	for (const option of options) {
		const button = el(
			"button",
			"min-h-11 rounded-lg border border-line px-3 text-sm font-semibold aria-pressed:bg-ink aria-pressed:text-card",
			labels[option],
		);
		button.type = "button";
		button.dataset.option = option;
		button.setAttribute("aria-pressed", String(state[key] === option));
		button.addEventListener("click", () => {
			state[key] = option;
			for (const other of group.querySelectorAll("button")) {
				other.setAttribute("aria-pressed", String(other.dataset.option === option));
			}
			redrawAll();
		});
		group.append(button);
	}
	return group;
}

function dimensionSection(id) {
	const section = el("section", "mt-12 scroll-mt-28");
	section.id = id;
	section.setAttribute("aria-labelledby", `${id}-title`);
	const sectionText = text().sections[id];
	section.append(
		sectionHeading(id, sectionText.title),
		el("p", "mt-2 text-base leading-relaxed", rich(sectionText.lead)),
		el("div", "mt-4", explainCard(sectionText)),
	);
	if (id === "http") {
		section.append(el("div", "mt-4", optionSwitch("endpoint", ["echo", "primes"], text().ui.endpoint)));
	}
	if (id === "database") {
		section.append(el("div", "mt-4", optionSwitch("phase", ["insert", "read", "query", "pool"], text().ui.phase)));
	}
	const grid = el("div", "mt-4 grid gap-4");
	for (const chart of CHARTS[id]) {
		grid.append(chartFigure(chart, sectionText.charts[chart.id]));
	}
	section.append(grid);
	return section;
}

function introSection() {
	const intro = text().intro;
	const section = el("section", "scroll-mt-28");
	section.id = "start";
	section.append(el("h1", "text-3xl font-bold leading-tight", intro.title));
	for (const paragraph of intro.paragraphs) {
		section.append(el("p", "mt-3 text-base leading-relaxed", rich(paragraph)));
	}
	const how = el("div", `${CARD} mt-4 bg-info`);
	how.dataset.explain = "true";
	const list = el("ul", "mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed");
	for (const item of intro.how) {
		list.append(el("li", "", rich(item)));
	}
	how.append(el("h2", "text-base font-bold", intro.howTitle), list);
	section.append(how);

	// EN: The language filter. Real checkboxes inside a fieldset: keyboard, touch and screen
	//     readers get the right behaviour for free.
	// PT: O filtro de linguagens. Checkboxes de verdade dentro de um fieldset: teclado, toque e
	//     leitores de tela ganham o comportamento certo de graça.
	// ES: El filtro de lenguajes. Checkboxes de verdad dentro de un fieldset: teclado, toque y
	//     lectores de pantalla reciben el comportamiento correcto gratis.
	const filter = el("fieldset", `${CARD} mt-4 bg-card`);
	filter.id = "language-filter";
	filter.append(
		el("legend", "px-1 text-base font-bold", text().ui.filterTitle),
		el("p", "text-sm text-soft", text().ui.filterHelp),
	);
	const chips = el("div", "mt-3 flex flex-wrap gap-2");
	for (const language of LANGUAGES) {
		const input = el("input", "h-5 w-5");
		input.type = "checkbox";
		input.value = language;
		input.checked = state.visible.has(language);
		input.addEventListener("change", () => {
			if (input.checked) {
				state.visible.add(language);
			} else {
				state.visible.delete(language);
			}
			redrawAll();
		});
		const swatch = el("span", "inline-block h-3 w-3 rounded-sm");
		swatch.style.backgroundColor = `var(--lang-${language})`;
		chips.append(
			el(
				"label",
				"flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold",
				input,
				swatch,
				nameOf(language),
			),
		);
	}
	filter.append(chips);
	section.append(filter);
	return section;
}

function languagesSection() {
	const languages = text().languages;
	const section = el("section", "mt-12 scroll-mt-28");
	section.id = "languages";
	section.append(
		el("h2", "text-2xl font-bold", languages.title),
		el("p", "mt-2 text-base leading-relaxed", rich(languages.lead)),
	);
	const grid = el("div", "mt-4 grid gap-4 md:grid-cols-2");
	for (const language of LANGUAGES) {
		const card = el("article", `${CARD} bg-card`);
		card.dataset.languageCard = language;
		const swatch = el("span", "inline-block h-4 w-4 rounded-sm");
		swatch.style.backgroundColor = `var(--lang-${language})`;
		card.append(
			el("h3", "flex items-center gap-2 text-lg font-bold", swatch, nameOf(language)),
			el("p", "text-xs text-soft", data.runtimes[language] ?? ""),
		);
		const list = el("dl", "mt-2 space-y-2 text-sm leading-relaxed");
		for (const field of ["what", "runs", "threads"]) {
			list.append(
				el(
					"div",
					"",
					el("dt", "font-bold", languages.fields[field]),
					el("dd", "", rich(languages.cards[language][field])),
				),
			);
		}
		card.append(list);
		grid.append(card);
	}
	section.append(grid);
	return section;
}

function glossarySection() {
	const glossary = text().glossary;
	const section = el("section", "mt-12 scroll-mt-28");
	section.id = "glossary";
	section.append(
		el("h2", "text-2xl font-bold", glossary.title),
		el("p", "mt-2 text-base leading-relaxed", glossary.lead),
	);
	const list = el("dl", "mt-4 grid gap-3 md:grid-cols-2");
	const entries = Object.entries(glossary.terms).sort(([, a], [, b]) => a.term.localeCompare(b.term, locale()));
	for (const [id, term] of entries) {
		const definition = el("dd", "mt-1 text-sm leading-relaxed", term.text);
		definition.id = `def-${id}`;
		list.append(el("div", `${CARD} bg-card`, el("dt", "font-bold", term.term), definition));
	}
	section.append(list);
	return section;
}

function definitionList(entries) {
	const list = el("dl", "mt-2 text-sm");
	for (const [key, value] of entries) {
		list.append(el("dt", "mt-2 font-semibold", key), el("dd", "break-words text-soft", value));
	}
	return list;
}

function methodologySection() {
	const method = text().methodology;
	const section = el("section", "mt-12 scroll-mt-28");
	section.id = "methodology";
	section.append(
		el("h2", "text-2xl font-bold", method.title),
		el("p", "mt-2 text-base leading-relaxed", method.lead),
	);
	for (const block of method.blocks) {
		const card = el("div", `${CARD} mt-4 bg-card`);
		card.append(el("h3", "text-lg font-bold", block.title));
		for (const paragraph of block.paragraphs ?? []) {
			card.append(el("p", "mt-2 text-sm leading-relaxed", rich(paragraph)));
		}
		if (block.items !== undefined) {
			const list = el("ul", "mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed");
			for (const item of block.items) {
				list.append(el("li", "", rich(item)));
			}
			card.append(list);
		}
		if (block.data === "machine") {
			card.append(
				definitionList([
					...Object.entries(data.machine),
					...Object.entries(data.measuredAt).map(([key, value]) => [`${method.measuredAt} ${key}`, value]),
				]),
			);
		}
		if (block.data === "runtimes") {
			card.append(
				definitionList(
					LANGUAGES.map((language) => [
						nameOf(language),
						`${data.runtimes[language]} · HTTP: ${data.httpRuntimes[language]} · ${method.databaseLabel}: ${data.databaseRuntimes[language]}`,
					]),
				),
			);
		}
		if (block.data === "commands") {
			for (const [workload, perLanguage] of Object.entries(data.commands)) {
				const details = el("details", "mt-2");
				const list = el("ul", "mt-1 space-y-1");
				for (const [language, commands] of Object.entries(perLanguage)) {
					for (const command of commands) {
						list.append(el("li", "break-all font-mono text-xs", `${language}: ${command}`));
					}
				}
				details.append(el("summary", "cursor-pointer py-2 text-sm font-semibold text-link", workload), list);
				card.append(details);
			}
		}
		section.append(card);
	}
	return section;
}

const NAV = [
	"start",
	"languages",
	"cpu",
	"parallelism",
	"concurrency",
	"http",
	"memory",
	"build",
	"size",
	"database",
	"glossary",
	"methodology",
];

function renderNav() {
	const nav = document.getElementById("nav");
	nav.setAttribute("aria-label", text().ui.navLabel);
	const list = el("ul", "flex flex-wrap gap-x-1 gap-y-1");
	for (const id of NAV) {
		const link = el(
			"a",
			"inline-flex min-h-9 items-center rounded-md px-2 text-sm font-semibold text-link underline-offset-4 hover:underline",
			text().ui.nav[id],
		);
		link.href = `#${id}`;
		list.append(el("li", "", link));
	}
	nav.replaceChildren(list);
}

function applyTheme() {
	if (state.theme === "light" || state.theme === "dark") {
		document.documentElement.dataset.theme = state.theme;
	} else {
		delete document.documentElement.dataset.theme;
	}
	const dark =
		state.theme === "dark" || (state.theme === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
	const button = document.getElementById("theme-toggle");
	button.textContent = dark ? text().ui.theme.toLight : text().ui.theme.toDark;
	button.dataset.next = dark ? "light" : "dark";
}

function redrawAll() {
	hideTip();
	for (const redraw of redraws) {
		redraw();
	}
}

function render() {
	hideTip();
	redraws.length = 0;
	document.documentElement.lang = HTML_LANGS[state.lang] ?? "en";
	document.title = text().ui.title;
	document.getElementById("brand").textContent = text().ui.title;
	for (const button of document.querySelectorAll("#language-switch button")) {
		button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang));
		button.classList.toggle("bg-ink", button.dataset.lang === state.lang);
		button.classList.toggle("text-card", button.dataset.lang === state.lang);
	}
	document.getElementById("language-switch").setAttribute("aria-label", text().ui.languageSwitch);
	renderNav();
	applyTheme();

	const app = document.getElementById("app");
	if (data === undefined || content === undefined) {
		app.replaceChildren(el("p", `${CARD} bg-card`, "No results yet. Run: bun run all"));
		return;
	}
	app.replaceChildren(
		introSection(),
		languagesSection(),
		...Object.keys(CHARTS).map((id) => dimensionSection(id)),
		glossarySection(),
		methodologySection(),
		el("p", "mt-12 text-sm text-soft", fill(text().ui.footer, { date: data.generatedAt.slice(0, 10) })),
	);
	redrawAll();
}

for (const button of document.querySelectorAll("#language-switch button")) {
	button.addEventListener("click", () => {
		state.lang = button.dataset.lang;
		remember("lang", state.lang);
		render();
	});
}
document.getElementById("theme-toggle").addEventListener("click", (event) => {
	state.theme = event.currentTarget.dataset.next;
	remember("theme", state.theme);
	applyTheme();
});

// EN: Charts are drawn at the real width of their card, so text keeps its size on a phone
//     instead of shrinking with the drawing. When the window changes width they are redrawn.
// PT: Os gráficos são desenhados na largura real do cartão, então o texto mantém o tamanho no
//     celular em vez de encolher com o desenho. Quando a janela muda de largura, são redesenhados.
// ES: Los gráficos se dibujan al ancho real de su tarjeta, así el texto mantiene su tamaño en el
//     celular en lugar de encogerse con el dibujo. Cuando la ventana cambia de ancho, se redibujan.
let lastWidth = window.innerWidth;
window.addEventListener("resize", () => {
	if (window.innerWidth !== lastWidth) {
		lastWidth = window.innerWidth;
		redrawAll();
	}
});

render();
