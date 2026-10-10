import type { ExperimentResult, Series } from "./experiment";
import { type Language, labelOf, TEXTS } from "./report";

// EN: The chart is an SVG file written as plain text: no chart library, no script, no font or
//     image fetched from anywhere. It opens from disk in any browser and renders inside the
//     README. It is "small multiples": one panel per algorithm, all with the same axes, stacked
//     so the eye compares the same instant from top to bottom.
// PT: O gráfico é um arquivo SVG escrito como texto puro: sem biblioteca de gráficos, sem
//     script, sem fonte ou imagem buscada em lugar nenhum. Ele abre do disco em qualquer
//     navegador e aparece dentro do README. São "pequenos múltiplos": um painel por algoritmo,
//     todos com os mesmos eixos, empilhados para o olho comparar o mesmo instante de cima a baixo.
// ES: El gráfico es un archivo SVG escrito como texto puro: sin biblioteca de gráficos, sin
//     script, sin fuente ni imagen traída de ningún lado. Se abre desde el disco en cualquier
//     navegador y aparece dentro del README. Son "pequeños múltiplos": un panel por algoritmo,
//     todos con los mismos ejes, apilados para que el ojo compare el mismo instante de arriba abajo.

const WIDTH = 920;
const LEFT = 24;
const RIGHT = 24;
const TOP = 106;
const PANEL_HEIGHT = 72;
const PANEL_GAP = 34;
const BOTTOM = 44;

const INK = "#1f2937";
const MUTED = "#6b7280";
const GRID = "#e5e7eb";
const OFFERED = "#cbd5e1";
const ADMITTED = "#2563eb";
const OUTPUT = "#0f766e";
const LIMIT = "#b91c1c";

function escapeXml(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function round(value: number): string {
	return String(Math.round(value * 100) / 100);
}

export function renderChart(result: ExperimentResult, language: Language): string {
	const text = TEXTS[language];
	const { binMs, durationMs, limit, windowMs } = result.config;
	const bins = durationMs / binMs;
	const plotWidth = WIDTH - LEFT - RIGHT;
	const binWidth = plotWidth / bins;
	const yMax = Math.max(...result.offered.perBin, 1);
	const panels: { series: Series; colour: string }[] = [
		{ series: result.offered, colour: OFFERED },
		...result.series.map((series) => ({
			series,
			colour: series.id === "leaky-bucket-output" ? OUTPUT : ADMITTED,
		})),
	];
	const height = TOP + panels.length * (PANEL_HEIGHT + PANEL_GAP) + BOTTOM;
	const x = (ms: number): number => LEFT + (ms / durationMs) * plotWidth;
	const out: string[] = [];

	out.push(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" width="${WIDTH}" height="${height}" role="img" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">`,
		`<title>${escapeXml(text.title ?? "")}</title>`,
		// EN: A solid background, so the chart stays readable on a dark page.
		// PT: Um fundo sólido, para o gráfico continuar legível em uma página escura.
		// ES: Un fondo sólido, para que el gráfico siga siendo legible en una página oscura.
		`<rect width="${WIDTH}" height="${height}" fill="#ffffff"/>`,
		`<text x="${LEFT}" y="28" font-size="17" font-weight="600" fill="${INK}">${escapeXml(text.title ?? "")}</text>`,
		`<text x="${LEFT}" y="48" font-size="11.5" fill="${MUTED}">${escapeXml(text.subtitle ?? "")}</text>`,
	);

	// EN: Phase names sit once at the top; their limits run through every panel as thin lines.
	// PT: Os nomes das fases ficam uma vez no topo; seus limites atravessam todos os painéis
	//     como linhas finas.
	// ES: Los nombres de las fases aparecen una vez arriba; sus límites cruzan todos los paneles
	//     como líneas finas.
	for (const phase of result.phases) {
		out.push(
			`<text x="${round(x(phase.fromMs) + 4)}" y="${TOP - 34}" font-size="11" font-weight="600" fill="${MUTED}">${escapeXml(phase.label[language])}</text>`,
		);
	}

	panels.forEach(({ series, colour }, index) => {
		const top = TOP + index * (PANEL_HEIGHT + PANEL_GAP);
		const base = top + PANEL_HEIGHT;
		const y = (count: number): number => base - (count / yMax) * PANEL_HEIGHT;
		const isOffered = series.id === "offered";
		const summary = isOffered
			? `${series.total} ${text.events ?? ""}`
			: `${series.total} ${text.of ?? ""} ${result.offered.total} · ${text.peak ?? ""}: ${series.peakPerWindow}`;

		for (let ms = 0; ms <= durationMs; ms += windowMs) {
			const isPhaseEdge = result.phases.some((phase) => phase.fromMs === ms);
			out.push(
				`<line x1="${round(x(ms))}" x2="${round(x(ms))}" y1="${top}" y2="${base}" stroke="${isPhaseEdge ? MUTED : GRID}" stroke-width="1"${isPhaseEdge ? "" : ' stroke-dasharray="2 3"'}/>`,
			);
		}
		// EN: Behind the coloured bars, the offered traffic in grey: the grey that stays
		//     visible is what the algorithm rejected.
		// PT: Atrás das barras coloridas, o tráfego oferecido em cinza: o cinza que continua
		//     visível é o que o algoritmo rejeitou.
		// ES: Detrás de las barras de color, el tráfico ofrecido en gris: el gris que sigue
		//     visible es lo que el algoritmo rechazó.
		for (let bin = 0; bin < bins; bin++) {
			const offered = result.offered.perBin[bin] ?? 0;
			const count = series.perBin[bin] ?? 0;
			const left = round(LEFT + bin * binWidth + 1);
			const barWidth = round(binWidth - 2);
			if (offered > 0 && series.id !== "leaky-bucket-output") {
				out.push(
					`<rect x="${left}" y="${round(y(offered))}" width="${barWidth}" height="${round(base - y(offered))}" fill="${OFFERED}"/>`,
				);
			}
			if (count > 0 && !isOffered) {
				out.push(
					`<rect x="${left}" y="${round(y(count))}" width="${barWidth}" height="${round(base - y(count))}" fill="${colour}"><title>${bin * binMs} ms: ${count}</title></rect>`,
				);
			}
		}
		const evenShare = (limit * binMs) / windowMs;
		out.push(
			`<line x1="${LEFT}" x2="${WIDTH - RIGHT}" y1="${round(y(evenShare))}" y2="${round(y(evenShare))}" stroke="${LIMIT}" stroke-width="1" stroke-dasharray="5 4"/>`,
			`<line x1="${LEFT}" x2="${WIDTH - RIGHT}" y1="${base}" y2="${base}" stroke="${INK}" stroke-width="1"/>`,
			`<text x="${LEFT}" y="${top - 8}" font-size="12.5" font-weight="600" fill="${INK}">${escapeXml(labelOf(series.id, language))}</text>`,
			`<text x="${WIDTH - RIGHT}" y="${top - 8}" font-size="11.5" text-anchor="end" fill="${MUTED}">${escapeXml(summary)}</text>`,
		);
	});

	const axisY = height - BOTTOM + 4;
	for (let ms = 0; ms <= durationMs; ms += windowMs) {
		out.push(
			`<text x="${round(x(ms))}" y="${axisY}" font-size="11" text-anchor="middle" fill="${MUTED}">${ms / 1000}</text>`,
		);
	}
	out.push(
		`<text x="${WIDTH / 2}" y="${axisY + 20}" font-size="11.5" text-anchor="middle" fill="${MUTED}">${escapeXml(text.axis ?? "")}</text>`,
		"</svg>",
	);
	return `${out.join("\n")}\n`;
}
