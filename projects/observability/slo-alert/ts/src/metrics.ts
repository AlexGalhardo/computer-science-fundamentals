// EN: A counter and a histogram written by hand, in the Prometheus text exposition format.
//     A client library would do this in one line; doing it once shows what a metric really is:
//     a few numbers in memory that only grow, printed as text when Prometheus asks.
// PT: Um counter e um histograma escritos à mão, no formato de exposição em texto do
//     Prometheus. Uma biblioteca cliente faria isso em uma linha; fazer uma vez mostra o que
//     uma métrica realmente é: alguns números em memória que só crescem, impressos como texto
//     quando o Prometheus pede.
// ES: Un counter y un histograma escritos a mano, en el formato de exposición en texto de
//     Prometheus. Una biblioteca cliente lo haría en una línea; hacerlo una vez muestra lo que
//     una métrica realmente es: unos números en memoria que solo crecen, impresos como texto
//     cuando Prometheus lo pide.

export type Labels = Record<string, string>;

function renderLabels(labels: Labels): string {
	const parts = Object.entries(labels).map(([name, value]) => {
		// EN: The format escapes backslash, double quote and line feed inside label values.
		// PT: O formato escapa barra invertida, aspas duplas e quebra de linha nos valores de label.
		// ES: El formato escapa la barra invertida, las comillas dobles y el salto de línea en los valores de label.
		const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
		return `${name}="${escaped}"`;
	});
	return parts.length === 0 ? "" : `{${parts.join(",")}}`;
}

/**
 * A counter: a value that only goes up (and restarts from zero with the process).
 *
 * EN: Prometheus never reads "requests per second" from the service. It reads this total every
 *     few seconds and `rate()` computes the speed from the difference between two readings.
 * PT: O Prometheus nunca lê "requisições por segundo" do serviço. Ele lê este total a cada
 *     poucos segundos, e o `rate()` calcula a velocidade pela diferença entre duas leituras.
 * ES: Prometheus nunca lee "peticiones por segundo" del servicio. Lee este total cada
 *     pocos segundos, y `rate()` calcula la velocidad por la diferencia entre dos lecturas.
 */
export class Counter {
	private readonly values = new Map<string, { labels: Labels; value: number }>();

	constructor(
		readonly name: string,
		readonly help: string,
	) {}

	/**
	 * Creates the series with value 0.
	 *
	 * EN: A series that does not exist is not zero, it is missing. If the first 503 created the
	 *     error series, the error ratio would have no value before it, and a rule comparing it
	 *     could not tell "no errors" from "no data". So every expected series starts at 0.
	 * PT: Uma série que não existe não é zero, é ausente. Se o primeiro 503 criasse a série de
	 *     erros, a razão de erros não teria valor antes dele, e uma regra que a compara não
	 *     saberia distinguir "sem erros" de "sem dados". Por isso toda série esperada começa em 0.
	 * ES: Una serie que no existe no es cero, está ausente. Si el primer 503 creara la serie de
	 *     errores, la razón de errores no tendría valor antes de él, y una regla que la compara no
	 *     sabría distinguir "sin errores" de "sin datos". Por eso toda serie esperada empieza en 0.
	 */
	init(labels: Labels): void {
		this.inc(labels, 0);
	}

	inc(labels: Labels, amount = 1): void {
		const key = renderLabels(labels);
		const entry = this.values.get(key);
		if (entry === undefined) {
			this.values.set(key, { labels, value: amount });
		} else {
			entry.value += amount;
		}
	}

	get(labels: Labels): number {
		return this.values.get(renderLabels(labels))?.value ?? 0;
	}

	render(): string {
		const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
		for (const { labels, value } of this.values.values()) {
			lines.push(`${this.name}${renderLabels(labels)} ${value}`);
		}
		return lines.join("\n");
	}
}

/**
 * A classic histogram: one counter per bucket, plus the sum and the count of observations.
 *
 * EN: Buckets are cumulative. `le="0.1"` counts every observation less than or equal to 0.1 s,
 *     including the ones already counted in `le="0.05"`. That is what makes a latency SLI one
 *     division: requests under the threshold = the bucket of the threshold, all requests = the
 *     `+Inf` bucket (or `_count`). The threshold of the objective must be one of the limits.
 * PT: Os buckets são cumulativos. `le="0.1"` conta toda observação menor ou igual a 0,1 s,
 *     inclusive as já contadas em `le="0.05"`. É isso que faz de um SLI de latência uma única
 *     divisão: requisições abaixo do limite = o bucket do limite, todas as requisições = o
 *     bucket `+Inf` (ou `_count`). O limite do objetivo precisa ser um dos limites de bucket.
 * ES: Los buckets son acumulativos. `le="0.1"` cuenta toda observación menor o igual a 0,1 s,
 *     incluidas las ya contadas en `le="0.05"`. Eso es lo que hace de un SLI de latencia una única
 *     división: peticiones bajo el umbral = el bucket del umbral, todas las peticiones = el
 *     bucket `+Inf` (o `_count`). El umbral del objetivo debe ser uno de los límites de bucket.
 */
export class Histogram {
	private readonly counts: number[];
	private sum = 0;
	private count = 0;

	constructor(
		readonly name: string,
		readonly help: string,
		readonly bounds: readonly number[],
		private readonly labels: Labels = {},
	) {
		if (bounds.length === 0 || bounds.some((bound, index) => index > 0 && bound <= (bounds[index - 1] ?? 0))) {
			throw new Error("bucket bounds must be a non-empty increasing list");
		}
		this.counts = bounds.map(() => 0);
	}

	observe(value: number): void {
		this.bounds.forEach((bound, index) => {
			if (value <= bound) {
				this.counts[index] = (this.counts[index] ?? 0) + 1;
			}
		});
		this.sum += value;
		this.count += 1;
	}

	/** Cumulative count of the bucket `le`, or of every observation for `Infinity`. */
	bucket(le: number): number {
		if (le === Number.POSITIVE_INFINITY) {
			return this.count;
		}
		const index = this.bounds.indexOf(le);
		if (index < 0) {
			throw new Error(`${le} is not a bucket bound`);
		}
		return this.counts[index] ?? 0;
	}

	render(): string {
		const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
		this.bounds.forEach((bound, index) => {
			lines.push(
				`${this.name}_bucket${renderLabels({ ...this.labels, le: String(bound) })} ${this.counts[index]}`,
			);
		});
		lines.push(`${this.name}_bucket${renderLabels({ ...this.labels, le: "+Inf" })} ${this.count}`);
		lines.push(`${this.name}_sum${renderLabels(this.labels)} ${this.sum}`);
		lines.push(`${this.name}_count${renderLabels(this.labels)} ${this.count}`);
		return lines.join("\n");
	}
}

/** The media type of the text exposition format. */
export const EXPOSITION_CONTENT_TYPE = "text/plain; version=0.0.4; charset=utf-8";

export function renderAll(metrics: readonly { render: () => string }[]): string {
	return `${metrics.map((metric) => metric.render()).join("\n")}\n`;
}
