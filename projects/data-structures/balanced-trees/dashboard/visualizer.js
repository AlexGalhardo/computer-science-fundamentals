// EN: Rotation visualiser. It reads `window.TREE_STEPS`, written by `tree_demo steps` into
//     `steps.js`, and replays the insertion of a fixed sequence of keys one frame at a time.
//     Each frame is a complete picture of the tree, so going backwards is as easy as going
//     forwards. There is no build step and no network request: the page works when opened
//     straight from disk.
// PT: Visualizador de rotações. Ele lê `window.TREE_STEPS`, escrito por `tree_demo steps` em
//     `steps.js`, e reproduz a inserção de uma sequência fixa de chaves um quadro por vez. Cada
//     quadro é uma foto completa da árvore, então voltar é tão fácil quanto avançar. Não há
//     etapa de build nem requisição de rede: a página funciona aberta direto do disco.

const SVG = "http://www.w3.org/2000/svg";
const STEP_X = 44;
const STEP_Y = 58;
const RADIUS = 17;
const TREE_NAMES = { bst: "Unbalanced BST", avl: "AVL", "red-black": "Red-black" };

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

function heightOf(tree) {
	return tree === null ? 0 : 1 + Math.max(heightOf(tree.l), heightOf(tree.r));
}

function countOf(tree) {
	return tree === null ? 0 : 1 + countOf(tree.l) + countOf(tree.r);
}

// EN: Layout. The horizontal position of a node is its place in the in-order traversal, and the
//     vertical position is its depth. Because a search tree keeps its keys in in-order, the
//     keys always appear sorted from left to right, and a rotation shows as two nodes changing
//     level while every node keeps its column.
// PT: Layout. A posição horizontal de um nó é o seu lugar no percurso em-ordem, e a vertical é
//     a sua profundidade. Como uma árvore de busca mantém as chaves em-ordem, elas aparecem
//     sempre ordenadas da esquerda para a direita, e uma rotação aparece como dois nós trocando
//     de nível enquanto todo nó fica na mesma coluna.
function layout(tree) {
	const placed = [];
	let column = 0;
	function visit(node, depth, parent) {
		if (node === null) {
			return;
		}
		const item = { node, depth, parent, column: 0 };
		visit(node.l, depth + 1, item);
		item.column = column++;
		placed.push(item);
		visit(node.r, depth + 1, item);
	}
	visit(tree, 0, null);
	return placed;
}

// EN: The key named by the label ("rotate left at 20", "insert 55") is the node to highlight.
// PT: A chave citada no rótulo ("rotate left at 20", "insert 55") é o nó a destacar.
function highlightedKeys(label) {
	if (label.startsWith("recolour")) {
		return (label.match(/\d+/g) ?? []).map(Number);
	}
	const match = label.match(/(\d+)$/);
	return match === null ? [] : [Number(match[1])];
}

function drawTree(container, frame, treeName) {
	container.replaceChildren();
	if (frame.tree === null) {
		container.append(element("p", "py-8 text-center text-slate-600 dark:text-slate-300", "(empty tree)"));
		return;
	}
	const placed = layout(frame.tree);
	const depth = Math.max(...placed.map((item) => item.depth));
	const width = placed.length * STEP_X + 2 * RADIUS;
	const height = depth * STEP_Y + 3 * RADIUS + 14;
	const chart = svg("svg", {
		viewBox: `0 0 ${width} ${height}`,
		width,
		height,
		role: "img",
		class: "mx-auto max-w-none",
	});
	chart.append(svg("title", {}, `${TREE_NAMES[treeName]} after: ${frame.label}`));
	const x = (item) => RADIUS + 8 + item.column * STEP_X;
	const y = (item) => RADIUS + 4 + item.depth * STEP_Y;
	for (const item of placed) {
		if (item.parent !== null) {
			chart.append(
				svg("line", {
					x1: x(item.parent),
					y1: y(item.parent),
					x2: x(item),
					y2: y(item),
					stroke: "currentColor",
					"stroke-opacity": 0.5,
					"stroke-width": 1.5,
				}),
			);
		}
	}
	const highlighted = highlightedKeys(frame.label);
	for (const item of placed) {
		const { node } = item;
		const balance = heightOf(node.r) - heightOf(node.l);
		let fill = "#ffffff";
		let text = "#0f172a";
		let stroke = "#2563eb";
		if (node.c === "R") {
			fill = "#dc2626";
			text = "#ffffff";
			stroke = "#7f1d1d";
		} else if (node.c === "B") {
			fill = "#111827";
			text = "#ffffff";
			stroke = "#9ca3af";
		}
		if (highlighted.includes(node.k)) {
			chart.append(
				svg("circle", {
					cx: x(item),
					cy: y(item),
					r: RADIUS + 5,
					fill: "none",
					stroke: "#f59e0b",
					"stroke-width": 3,
				}),
			);
		}
		const circle = svg("circle", { cx: x(item), cy: y(item), r: RADIUS, fill, stroke, "stroke-width": 2 });
		const colour = node.c === "R" ? ", red" : node.c === "B" ? ", black" : "";
		circle.append(svg("title", {}, `key ${node.k}${colour}, balance factor ${balance}`));
		chart.append(
			circle,
			svg(
				"text",
				{
					x: x(item),
					y: y(item) + 5,
					"text-anchor": "middle",
					"font-size": 14,
					"font-weight": 600,
					fill: text,
				},
				node.k,
			),
		);
		// EN: Under each node of the AVL tree goes its balance factor (right height minus left
		//     height). A value of +2 or -2 is the imbalance the next rotation repairs.
		// PT: Embaixo de cada nó da AVL vai o seu fator de balanceamento (altura direita menos
		//     altura esquerda). Um valor +2 ou -2 é o desequilíbrio que a próxima rotação conserta.
		if (treeName !== "red-black") {
			const unbalanced = Math.abs(balance) > 1;
			chart.append(
				svg(
					"text",
					{
						x: x(item),
						y: y(item) + RADIUS + 13,
						"text-anchor": "middle",
						"font-size": 11,
						"font-weight": unbalanced ? 700 : 400,
						fill: unbalanced ? "#d97706" : "currentColor",
					},
					balance > 0 ? `+${balance}` : String(balance),
				),
			);
		}
	}
	container.append(chart);
}

function explain(label, treeName) {
	if (label === "empty tree") {
		return "Nothing was inserted yet. / Nada foi inserido ainda.";
	}
	if (label.startsWith("insert")) {
		if (treeName === "bst") {
			return "The key becomes a leaf where its search ends. Nothing else moves. / A chave vira folha onde a busca por ela termina. Nada mais se move.";
		}
		if (treeName === "avl") {
			return "The key becomes a leaf. The balance factors on the way back to the root are then checked. / A chave vira folha. Depois os fatores de balanceamento no caminho de volta à raiz são conferidos.";
		}
		return "The key goes in as a red leaf, so no path gains a black node. / A chave entra como folha vermelha, então nenhum caminho ganha um nó preto.";
	}
	if (label.startsWith("rotate")) {
		return "Rotation: the highlighted node goes down one level and its child rises to its place. The left-to-right order of the keys does not change. / Rotação: o nó destacado desce um nível e o filho dele sobe para o seu lugar. A ordem das chaves da esquerda para a direita não muda.";
	}
	return "Only colours change: the black of the grandparent moves down to its two children, or the root goes back to black. / Só as cores mudam: o preto do avô desce para os dois filhos, ou a raiz volta a ser preta.";
}

function legend(treeName) {
	if (treeName === "red-black") {
		return "Red and black circles are the node colours. The amber ring marks the nodes named in the step. / Círculos vermelhos e pretos são as cores dos nós. O anel âmbar marca os nós citados no passo.";
	}
	return "The number under each node is its balance factor: right height minus left height. The amber ring marks the node named in the step. / O número embaixo de cada nó é o fator de balanceamento: altura direita menos altura esquerda. O anel âmbar marca o nó citado no passo.";
}

function drawSummary(container, data) {
	const table = element("table", "w-full border-collapse text-sm");
	const head = element("tr", "border-b border-slate-300 text-left dark:border-slate-600");
	for (const title of ["Tree", "Height", "Rotations", "Frames"]) {
		head.append(element("th", "px-2 py-2 font-semibold", title));
	}
	table.append(head);
	for (const [name, frames] of Object.entries(data.trees)) {
		const last = frames[frames.length - 1];
		const row = element("tr", "border-b border-slate-200 dark:border-slate-700");
		for (const cell of [TREE_NAMES[name], heightOf(last.tree), last.rotations, frames.length]) {
			row.append(element("td", "px-2 py-1.5 tabular-nums", String(cell)));
		}
		table.append(row);
	}
	container.replaceChildren(table);
}

function main() {
	const data = window.TREE_STEPS;
	const status = document.getElementById("status");
	if (!data) {
		status.textContent =
			"No steps yet. Generate them: docker compose run --rm cpp-test tree_demo steps > dashboard/steps.js";
		return;
	}
	document.getElementById("sequence").textContent = data.sequence.join(", ");
	drawSummary(document.getElementById("summary"), data);

	const slider = document.getElementById("slider");
	const play = document.getElementById("play");
	const stepList = document.getElementById("steps");
	let treeName = "avl";
	let index = 0;
	let timer = null;

	function frames() {
		return data.trees[treeName];
	}

	function render() {
		const frame = frames()[index];
		document.getElementById("position").textContent =
			`${TREE_NAMES[treeName]}: step ${index} of ${frames().length - 1}`;
		document.getElementById("label").textContent = frame.label;
		document.getElementById("explanation").textContent = explain(frame.label, treeName);
		document.getElementById("nodes").textContent = String(countOf(frame.tree));
		document.getElementById("height").textContent = String(heightOf(frame.tree));
		document.getElementById("rotations").textContent = String(frame.rotations);
		document.getElementById("legend").textContent = legend(treeName);
		slider.max = String(frames().length - 1);
		slider.value = String(index);
		drawTree(document.getElementById("tree"), frame, treeName);
		for (const button of document.querySelectorAll(".tree-button")) {
			const selected = button.dataset.tree === treeName;
			button.setAttribute("aria-pressed", String(selected));
			button.classList.toggle("bg-slate-900", selected);
			button.classList.toggle("text-white", selected);
			button.classList.toggle("dark:bg-slate-100", selected);
			button.classList.toggle("dark:text-slate-900", selected);
		}
		[...stepList.children].forEach((item, position) => {
			item.firstChild.classList.toggle("bg-amber-200", position === index);
			item.firstChild.classList.toggle("dark:bg-amber-700", position === index);
		});
	}

	function fillSteps() {
		stepList.replaceChildren(
			...frames().map((frame, position) => {
				const item = element("li", "");
				const rotation = frame.label.startsWith("rotate");
				const button = element(
					"button",
					`block w-full rounded px-2 py-1 text-left ${rotation ? "font-semibold text-blue-700 dark:text-blue-300" : ""}`,
					`${position}. ${frame.label}`,
				);
				button.type = "button";
				button.addEventListener("click", () => go(position));
				item.append(button);
				return item;
			}),
		);
	}

	function stop() {
		if (timer !== null) {
			clearInterval(timer);
			timer = null;
			play.textContent = "Play";
		}
	}

	function go(position) {
		index = Math.min(Math.max(position, 0), frames().length - 1);
		render();
	}

	document.getElementById("first").addEventListener("click", () => {
		stop();
		go(0);
	});
	document.getElementById("previous").addEventListener("click", () => {
		stop();
		go(index - 1);
	});
	document.getElementById("next").addEventListener("click", () => {
		stop();
		go(index + 1);
	});
	slider.addEventListener("input", () => {
		stop();
		go(Number(slider.value));
	});
	play.addEventListener("click", () => {
		if (timer !== null) {
			stop();
			return;
		}
		if (index === frames().length - 1) {
			go(0);
		}
		play.textContent = "Pause";
		timer = setInterval(() => {
			if (index === frames().length - 1) {
				stop();
			} else {
				go(index + 1);
			}
		}, 900);
	});
	for (const button of document.querySelectorAll(".tree-button")) {
		button.addEventListener("click", () => {
			stop();
			treeName = button.dataset.tree;
			index = 0;
			fillSteps();
			render();
		});
	}
	fillSteps();
	render();
}

main();
