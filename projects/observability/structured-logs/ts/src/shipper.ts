// EN: A tiny log shipper: it collects the lines a service writes and sends them in batches to
//     the Loki push API. It lives inside the process only to keep the lab small. In production
//     the service just writes to stdout, and an agent outside it (Grafana Alloy, the
//     OpenTelemetry Collector) tails the output and ships it, so a slow or broken log store can
//     never slow down or break the application.
// PT: Um shipper de logs minúsculo: ele junta as linhas que um serviço escreve e as envia em
//     lotes para a API de push do Loki. Ele fica dentro do processo só para manter o
//     laboratório pequeno. Em produção o serviço apenas escreve em stdout, e um agente de fora
//     (Grafana Alloy, OpenTelemetry Collector) acompanha a saída e a envia, de modo que um
//     armazenamento de logs lento ou quebrado nunca atrasa nem quebra a aplicação.

export interface Shipper {
	add: (line: string, time: Date) => void;
	flush: () => Promise<void>;
	stop: () => Promise<void>;
}

export interface ShipperOptions {
	lokiUrl: string;
	/**
	 * EN: Labels are what Loki indexes, and every distinct combination of label values is a
	 *     separate stream. So labels must have few possible values: the service and the format.
	 *     A correlation id as a label would create one stream per request and ruin the index.
	 *     It stays inside the line, where a query filters it after selecting the streams.
	 * PT: Labels são o que o Loki indexa, e cada combinação distinta de valores de label é um
	 *     stream separado. Por isso labels precisam ter poucos valores possíveis: o serviço e o
	 *     formato. Um correlation id como label criaria um stream por requisição e arruinaria o
	 *     índice. Ele fica dentro da linha, onde uma consulta o filtra depois de escolher os streams.
	 */
	labels: Record<string, string>;
	intervalMs?: number;
	maxBuffered?: number;
	send?: (url: string, body: string) => Promise<boolean>;
}

type Entry = [timestampNs: string, line: string];

/** The body of `POST /loki/api/v1/push`: streams, each with its labels and `[timestamp in ns, line]` pairs. */
export function pushBody(labels: Record<string, string>, values: Entry[]): string {
	return JSON.stringify({ streams: [{ stream: labels, values }] });
}

async function postJson(url: string, body: string): Promise<boolean> {
	try {
		const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body });
		return response.ok;
	} catch {
		return false;
	}
}

export function createShipper(options: ShipperOptions): Shipper {
	const url = `${options.lokiUrl.replace(/\/+$/, "")}/loki/api/v1/push`;
	const send = options.send ?? postJson;
	const maxBuffered = options.maxBuffered ?? 5000;
	let buffer: Entry[] = [];
	let lastNs = 0n;
	let sending: Promise<void> = Promise.resolve();

	const flushOnce = async (): Promise<void> => {
		if (buffer.length === 0) {
			return;
		}
		const batch = buffer;
		buffer = [];
		const ok = await send(url, pushBody(options.labels, batch));
		if (!ok) {
			// EN: Loki may still be starting. The batch goes back to the front and is retried on
			//     the next tick. The buffer is bounded: when the store stays down, the oldest
			//     lines are dropped instead of the process running out of memory.
			// PT: O Loki pode ainda estar iniciando. O lote volta para a frente e é tentado de
			//     novo no próximo ciclo. O buffer é limitado: se o armazenamento continuar fora,
			//     as linhas mais antigas são descartadas em vez de o processo ficar sem memória.
			buffer = [...batch, ...buffer].slice(-maxBuffered);
		}
	};

	// EN: Flushes run one after another, so two batches never race and lines stay in order.
	// PT: Os envios rodam um depois do outro, então dois lotes nunca disputam e as linhas ficam em ordem.
	const flush = (): Promise<void> => {
		sending = sending.then(flushOnce);
		return sending;
	};

	const timer = setInterval(() => void flush(), options.intervalMs ?? 300);

	return {
		add: (line, time) => {
			// EN: Loki wants nanoseconds. JavaScript clocks give milliseconds, so two lines of the
			//     same millisecond get increasing nanoseconds and keep the order they were written in.
			// PT: O Loki quer nanossegundos. Os relógios do JavaScript dão milissegundos, então duas
			//     linhas do mesmo milissegundo recebem nanossegundos crescentes e mantêm a ordem de escrita.
			let ns = BigInt(time.getTime()) * 1_000_000n;
			if (ns <= lastNs) {
				ns = lastNs + 1n;
			}
			lastNs = ns;
			buffer.push([ns.toString(), line]);
		},
		flush,
		stop: async () => {
			clearInterval(timer);
			await flush();
		},
	};
}
