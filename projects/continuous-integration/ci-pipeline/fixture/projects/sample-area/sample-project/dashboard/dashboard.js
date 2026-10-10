// EN: Draws one list item per result. No library and no network.
// PT: Desenha um item de lista por resultado. Sem biblioteca e sem rede.
// ES: Dibuja un elemento de lista por resultado. Sin biblioteca y sin red.
const list = document.getElementById("results");
for (const result of window.SAMPLE_RESULTS) {
	const item = document.createElement("li");
	item.textContent = `${result.gate}: ${result.seconds} s`;
	list.append(item);
}
