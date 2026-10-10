// EN: Static page of the master theorem. The classification of every (a, b, f) offered here was
//     computed by the tested TypeScript classifier and stored in `../results/results.js`, so
//     this file only looks the answer up and draws the recursion tree. There is no build step
//     and no network request: the page works when opened straight from disk.
// PT: Página estática do teorema mestre. A classificação de cada (a, b, f) oferecido aqui foi
//     calculada pelo classificador TypeScript testado e gravada em `../results/results.js`,
//     então este arquivo só consulta a resposta e desenha a árvore de recursão. Não há etapa de
//     build nem requisição de rede: a página funciona aberta direto do disco.
// ES: Página estática del teorema maestro. La clasificación de cada (a, b, f) ofrecido aquí fue
//     calculada por el clasificador TypeScript probado y guardada en `../results/results.js`,
//     así que este archivo solo busca la respuesta y dibuja el árbol de recursión. No hay paso
//     de build ni petición de red: la página funciona abierta directo desde el disco.

const SVG = "http://www.w3.org/2000/svg";
const WIDTH = 760;
const ROW = 84;
const TREE_WIDTH = 440;
const DEPTH = 4;
const MAX_NODES = 9;
const NODE = "#2563eb";
const BAR = "#d97706";

const CASES = {
	"case-1": "Case 1: the leaves dominate / Caso 1: as folhas dominam / Caso 1: las hojas dominan",
	"case-2":
		"Case 2: every level costs the same / Caso 2: todo nível custa o mesmo / Caso 2: cada nivel cuesta lo mismo",
	"case-3": "Case 3: the root dominates / Caso 3: a raiz domina / Caso 3: la raíz domina",
	"not-applicable":
		"The basic master theorem does not apply / O teorema mestre básico não se aplica / El teorema maestro básico no se aplica",
};

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

function growthText(d, k) {
	const parts = [];
	if (d !== 0) {
		parts.push(d === 1 ? "n" : `n^${d}`);
	}
	if (k !== 0) {
		parts.push(k === 1 ? "log n" : `log^${k} n`);
	}
	return parts.length === 0 ? "1" : parts.join(" ");
}

function formatCost(value) {
	return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toFixed(1);
}

// EN: The same arithmetic as the recursion tree of the CLI: level i has a^i nodes of size
//     n / b^i, each costing f(size), and a node of size 1 is a base case that costs 1.
// PT: A mesma aritmética da árvore de recursão da CLI: o nível i tem a^i nós de tamanho
//     n / b^i, cada um custando f(tamanho), e um nó de tamanho 1 é um caso base que custa 1.
// ES: La misma aritmética del árbol de recursión de la CLI: el nivel i tiene a^i nodos de tamaño
//     n / b^i, cada uno costando f(tamaño), y un nodo de tamaño 1 es un caso base que cuesta 1.
function treeLevels(recurrence) {
	const levels = [];
	const n = recurrence.b ** DEPTH;
	for (let depth = 0; depth <= DEPTH; depth++) {
		const size = n / recurrence.b ** depth;
		const nodes = recurrence.a ** depth;
		const nodeCost = size <= 1 ? 1 : size ** recurrence.d * Math.log2(size) ** recurrence.k;
		levels.push({ depth, nodes, size, levelCost: nodes * nodeCost });
	}
	return levels;
}

function nodeX(index, shown) {
	return ((index + 0.5) / shown) * TREE_WIDTH;
}

// EN: Each row is one level of the tree. On the left, the calls of that level (at most nine are
//     drawn, the rest is summarised). On the right, a bar with the total cost of the level.
//     Reading the bars from top to bottom shows the case: growing bars mean the leaves dominate,
//     equal bars mean a log n factor, shrinking bars mean the root dominates.
// PT: Cada linha é um nível da árvore. À esquerda, as chamadas daquele nível (no máximo nove são
//     desenhadas, o resto é resumido). À direita, uma barra com o custo total do nível. Ler as
//     barras de cima para baixo mostra o caso: barras crescentes significam que as folhas
//     dominam, barras iguais significam um fator log n, barras decrescentes que a raiz domina.
// ES: Cada fila es un nivel del árbol. A la izquierda, las llamadas de ese nivel (se dibujan como
//     máximo nueve, el resto se resume). A la derecha, una barra con el costo total del nivel.
//     Leer las barras de arriba hacia abajo muestra el caso: barras crecientes significan que las
//     hojas dominan, barras iguales significan un factor log n, barras decrecientes que la raíz
//     domina.
function drawTree(container, recurrence) {
	const levels = treeLevels(recurrence);
	const height = ROW * levels.length;
	const chart = svg("svg", { viewBox: `0 0 ${WIDTH} ${height}`, role: "img", class: "w-full h-auto" });
	chart.append(svg("title", {}, "Recursion tree with the cost of each level"));
	const widest = Math.max(...levels.map((level) => level.levelCost));
	const barLeft = TREE_WIDTH + 24;
	const barWidth = WIDTH - barLeft - 8;

	levels.forEach((level, row) => {
		const y = row * ROW + 26;
		const shown = Math.min(level.nodes, MAX_NODES);
		const parent = levels[row - 1];
		for (let index = 0; index < shown; index++) {
			if (parent) {
				const parentShown = Math.min(parent.nodes, MAX_NODES);
				const parentIndex = Math.floor(index / recurrence.a);
				chart.append(
					svg("line", {
						x1: nodeX(parentIndex, parentShown),
						y1: y - ROW + 10,
						x2: nodeX(index, shown),
						y2: y - 10,
						stroke: "currentColor",
						"stroke-opacity": 0.35,
					}),
				);
			}
			chart.append(svg("circle", { cx: nodeX(index, shown), cy: y, r: 9, fill: NODE }));
		}
		const hidden = level.nodes > shown ? `, ${shown} drawn / desenhados / dibujados` : "";
		chart.append(
			svg(
				"text",
				{ x: barLeft, y: y + 26, "font-size": 12, fill: "currentColor" },
				`${formatCost(level.nodes)} × size / tamanho / tamaño ${formatCost(level.size)}${hidden}`,
			),
			svg("rect", {
				x: barLeft,
				y: y - 9,
				width: Math.max(2, (level.levelCost / widest) * barWidth),
				height: 18,
				fill: BAR,
			}),
			svg(
				"text",
				{ x: barLeft, y: y + 42, "font-size": 12, fill: "currentColor" },
				`level cost / custo do nível / costo del nivel: ${formatCost(level.levelCost)}`,
			),
		);
	});
	container.replaceChildren(chart);
}

function fillSelect(select, options, initial) {
	select.replaceChildren(...options.map(([value, label]) => new Option(label, value)));
	select.value = initial;
}

function main() {
	const results = window.MASTER_THEOREM_RESULTS;
	const status = document.getElementById("status");
	if (!results) {
		status.textContent = "No results yet. Run: docker compose run --rm ts-demo";
		return;
	}
	status.textContent = `Classifications generated at ${results.generatedAt}.`;

	const grid = results.grid;
	const unique = (key) => [...new Set(grid.map((item) => item.recurrence[key]))].sort((x, y) => x - y);
	const selectA = document.getElementById("a");
	const selectB = document.getElementById("b");
	const selectF = document.getElementById("f");
	fillSelect(
		selectA,
		unique("a").map((value) => [String(value), String(value)]),
		"2",
	);
	fillSelect(
		selectB,
		unique("b").map((value) => [String(value), String(value)]),
		"2",
	);
	const drivers = unique("d").flatMap((d) => unique("k").map((k) => [`${d},${k}`, growthText(d, k)]));
	fillSelect(selectF, drivers, "1,0");

	function render() {
		const [d, k] = selectF.value.split(",").map(Number);
		const found = grid.find(
			(item) =>
				item.recurrence.a === Number(selectA.value) &&
				item.recurrence.b === Number(selectB.value) &&
				item.recurrence.d === d &&
				item.recurrence.k === k,
		);
		if (!found) {
			return;
		}
		const { a, b } = found.recurrence;
		document.getElementById("recurrence").textContent =
			`T(n) = ${a === 1 ? "" : a}T(n/${b}) + ${growthText(d, k)}  ·  log_${b}(${a}) = ${found.criticalExponent.toFixed(3)}`;
		let solution = found.solution ? `T(n) = ${found.solution}` : "";
		if (!found.solution && found.extendedSolution) {
			solution = `extended case 2 / caso 2 estendido / caso 2 extendido:T(n) = ${found.extendedSolution}`;
		}
		document.getElementById("verdict").textContent = `${CASES[found.case]}. ${solution}`;
		document.getElementById("reason-en").textContent = `EN: ${found.reason.en}`;
		document.getElementById("reason-pt").textContent = `PT: ${found.reason.pt}`;
		document.getElementById("reason-es").textContent = `ES: ${found.reason.es}`;
		document.getElementById("tree-note").textContent =
			`n = ${b}^${DEPTH} = ${b ** DEPTH}. The last level is the base cases, which cost 1 each. / O último nível são os casos base, que custam 1 cada. / El último nivel son los casos base, que cuestan 1 cada uno.`;
		drawTree(document.getElementById("tree"), found.recurrence);
	}
	for (const select of [selectA, selectB, selectF]) {
		select.addEventListener("change", render);
	}
	render();
}

main();
