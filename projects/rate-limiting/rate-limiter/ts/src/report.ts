import type { ExperimentResult, Series } from "./experiment";

export type Language = "en" | "pt" | "es";

// EN: Texts of the chart and of the table, in the two languages of the repository. The numbers
//     always come from the experiment result, never from here.
// PT: Textos do gráfico e da tabela, nos dois idiomas do repositório. Os números sempre vêm do
//     resultado do experimento, nunca daqui.
// ES: Textos del gráfico y de la tabla, en los tres idiomas del repositorio. Los números
//     siempre vienen del resultado del experimento, nunca de aquí.
export const SERIES_LABELS: Record<string, Record<Language, string>> = {
	offered: { en: "Offered traffic", pt: "Tráfego oferecido", es: "Tráfico ofrecido" },
	"fixed-window": { en: "Fixed window", pt: "Janela fixa", es: "Ventana fija" },
	"sliding-log": { en: "Sliding window (log)", pt: "Janela deslizante (log)", es: "Ventana deslizante (log)" },
	"sliding-counter": {
		en: "Sliding window (counter)",
		pt: "Janela deslizante (contador)",
		es: "Ventana deslizante (contador)",
	},
	"token-bucket": { en: "Token bucket", pt: "Token bucket", es: "Token bucket" },
	"leaky-bucket": { en: "Leaky bucket (admitted)", pt: "Leaky bucket (admitidas)", es: "Leaky bucket (admitidas)" },
	"leaky-bucket-output": {
		en: "Leaky bucket (leaving the queue)",
		pt: "Leaky bucket (saindo da fila)",
		es: "Leaky bucket (saliendo de la cola)",
	},
};

export const TEXTS: Record<Language, Record<string, string>> = {
	en: {
		title: "Same traffic, five algorithms, limit of 10 requests per second",
		subtitle:
			"Bars: requests per 100 ms. Grey: offered and rejected. Colour: admitted. Dashed line: the limit spread evenly (1 per 100 ms).",
		axis: "time (s)",
		events: "events",
		peak: "worst 1 s interval",
		series: "Series",
		total: "Total",
		of: "of",
	},
	pt: {
		title: "Mesmo tráfego, cinco algoritmos, limite de 10 requisições por segundo",
		subtitle:
			"Barras: requisições a cada 100 ms. Cinza: oferecidas e rejeitadas. Cor: admitidas. Linha tracejada: o limite espalhado por igual (1 a cada 100 ms).",
		axis: "tempo (s)",
		events: "eventos",
		peak: "pior intervalo de 1 s",
		series: "Série",
		total: "Total",
		of: "de",
	},
	es: {
		title: "Mismo tráfico, cinco algoritmos, límite de 10 solicitudes por segundo",
		subtitle:
			"Barras: solicitudes cada 100 ms. Gris: ofrecidas y rechazadas. Color: admitidas. Línea punteada: el límite repartido por igual (1 cada 100 ms).",
		axis: "tiempo (s)",
		events: "eventos",
		peak: "peor intervalo de 1 s",
		series: "Serie",
		total: "Total",
		of: "de",
	},
};

export function labelOf(id: string, language: Language): string {
	return SERIES_LABELS[id]?.[language] ?? id;
}

function row(cells: readonly (string | number)[]): string {
	return `| ${cells.join(" | ")} |`;
}

// EN: The table answers the question of the mini-project in numbers: the offered traffic is
//     the same in every row, and what changes is how much each algorithm lets through in each
//     phase and in its worst one-second interval.
// PT: A tabela responde à pergunta do mini-projeto em números: o tráfego oferecido é o mesmo em
//     todas as linhas, e o que muda é quanto cada algoritmo deixa passar em cada fase e no seu
//     pior intervalo de um segundo.
// ES: La tabla responde la pregunta del miniproyecto con números: el tráfico ofrecido es el mismo
//     en todas las filas, y lo que cambia es cuánto deja pasar cada algoritmo en cada fase y en
//     su peor intervalo de un segundo.
export function renderTable(result: ExperimentResult, language: Language): string {
	const text = TEXTS[language];
	const header = [
		text.series ?? "",
		...result.phases.map((phase) => `${phase.label[language]} (${phase.fromMs / 1000}-${phase.toMs / 1000} s)`),
		text.total ?? "",
		text.peak ?? "",
	];
	const line = (series: Series): string =>
		row([labelOf(series.id, language), ...series.perPhase, series.total, series.peakPerWindow]);
	return [row(header), row(header.map(() => "---")), line(result.offered), ...result.series.map(line)].join("\n");
}
