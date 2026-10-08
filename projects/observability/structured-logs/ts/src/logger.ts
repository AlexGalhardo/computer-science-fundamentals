// EN: One logger, two formats. Every call describes an event twice: as data (`message` plus
//     `fields`) and as the sentence a developer would have typed in an ad hoc log (`text`).
//     The JSON format writes the data, the text format writes the sentence. Keeping both in one
//     call makes the comparison fair: the two variants log exactly the same events.
// PT: Um logger, dois formatos. Cada chamada descreve um evento duas vezes: como dado (`message`
//     mais `fields`) e como a frase que um desenvolvedor teria digitado em um log improvisado
//     (`text`). O formato JSON grava o dado, o formato texto grava a frase. Manter os dois em
//     uma chamada torna a comparação justa: as duas variantes registram exatamente os mesmos eventos.

import type { LogFormat } from "./config";
import { currentCorrelationId } from "./correlation";

export type LogLevel = "info" | "warn" | "error";
export type LogFields = Record<string, string | number | boolean>;

export interface LogEvent {
	/** A fixed, searchable name of the event. It never contains variable data. */
	message: string;
	/** The variable data, one field per value. */
	fields?: LogFields;
	/** The free-text sentence used by the unstructured variant. */
	text: string;
}

export interface Logger {
	info: (event: LogEvent) => void;
	warn: (event: LogEvent) => void;
	error: (event: LogEvent) => void;
}

export interface LoggerOptions {
	service: string;
	format: LogFormat;
	/** Where a finished line goes: stdout and the shipper in the services, an array in the tests. */
	write: (line: string, time: Date) => void;
	now?: () => Date;
}

/**
 * EN: The structured line: one JSON object per line. The timestamp is UTC in ISO 8601, so lines
 *     of services in different time zones sort correctly as plain text. The fixed keys are
 *     written last, so an event field can never overwrite `correlation_id` or `service`.
 * PT: A linha estruturada: um objeto JSON por linha. O timestamp é UTC em ISO 8601, então linhas
 *     de serviços em fusos diferentes ordenam corretamente como texto puro. As chaves fixas são
 *     gravadas por último, então um campo do evento nunca sobrescreve `correlation_id` ou `service`.
 */
export function formatJson(service: string, level: LogLevel, event: LogEvent, time: Date): string {
	const correlationId = currentCorrelationId();
	return JSON.stringify({
		...event.fields,
		timestamp: time.toISOString(),
		level,
		service,
		message: event.message,
		...(correlationId === undefined ? {} : { correlation_id: correlationId }),
	});
}

/**
 * EN: The unstructured line, the way ad hoc logs look: a local-style timestamp, the level and a
 *     sentence. There is no correlation id, and each sentence names (or forgets) whatever its
 *     author thought of at the time. A person reads it easily; a machine needs a regex per sentence.
 * PT: A linha não estruturada, do jeito que logs improvisados são: um timestamp em estilo local,
 *     o nível e uma frase. Não há correlation id, e cada frase cita (ou esquece) o que o autor
 *     lembrou na hora. Uma pessoa lê com facilidade; uma máquina precisa de uma regex por frase.
 */
export function formatText(service: string, level: LogLevel, event: LogEvent, time: Date): string {
	const stamp = time.toISOString().slice(0, 19).replace("T", " ");
	return `${stamp} ${level.toUpperCase()} [${service}] ${event.text}`;
}

export function createLogger(options: LoggerOptions): Logger {
	const now = options.now ?? ((): Date => new Date());
	const format = options.format === "json" ? formatJson : formatText;
	const log = (level: LogLevel, event: LogEvent): void => {
		const time = now();
		options.write(format(options.service, level, event, time), time);
	};
	return {
		info: (event) => log("info", event),
		warn: (event) => log("warn", event),
		error: (event) => log("error", event),
	};
}
