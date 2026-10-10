// EN: The pure parts of the lab: the message, the backoff formula, a seeded random generator and
//     the configuration. Nothing here touches the network, so it is unit-tested without Docker
//     services.
// PT: As partes puras do laboratório: a mensagem, a fórmula de backoff, um gerador aleatório com
//     semente e a configuração. Nada aqui toca a rede, então é testado sem serviços do Docker.
// ES: Las partes puras del laboratorio: el mensaje, la fórmula de backoff, un generador aleatorio
//     con semilla y la configuración. Nada aquí toca la red, así que se prueba sin servicios de
//     Docker.

import { resolve } from "node:path";
import { z } from "zod";

// EN: A message arrives from the network and may be anything. The schema is the gate: what does
//     not pass is a permanent failure, because no retry will make an invalid payload valid.
// PT: Uma mensagem chega da rede e pode ser qualquer coisa. O schema é o portão: o que não passa
//     é uma falha permanente, porque nenhuma retentativa torna válido um payload inválido.
// ES: Un mensaje llega desde la red y puede ser cualquier cosa. El esquema es la puerta: lo que no
//     pasa es un fallo permanente, porque ningún reintento vuelve válido un payload inválido.
export const paymentSchema = z.object({
	/** Idempotency key: chosen once by the producer, identical in every copy of the message. */
	id: z.string().min(1),
	accountId: z.string().min(1),
	amountCents: z.number().int().positive(),
});

export type Payment = z.infer<typeof paymentSchema>;

// EN: Exponential backoff: the wait doubles after each failed attempt, so a dependency in trouble
//     gets more and more time to recover. `attempt` is the attempt that just failed, starting at 1:
//     base, 2 x base, 4 x base, ...
// PT: Backoff exponencial: a espera dobra a cada tentativa que falha, então uma dependência com
//     problemas ganha cada vez mais tempo para se recuperar. `attempt` é a tentativa que acabou de
//     falhar, começando em 1: base, 2 x base, 4 x base, ...
// ES: Backoff exponencial: la espera se duplica tras cada intento fallido, así que una dependencia
//     con problemas tiene cada vez más tiempo para recuperarse. `attempt` es el intento que acaba
//     de fallar, empezando en 1: base, 2 x base, 4 x base, ...
export function backoffDelay(attempt: number, baseMs: number): number {
	if (!Number.isInteger(attempt) || attempt < 1) {
		throw new RangeError("attempt starts at 1");
	}
	return baseMs * 2 ** (attempt - 1);
}

// EN: A small seeded generator (mulberry32). "Fails randomly" must still be reproducible: the
//     same seed gives the same failures, so a test that fails can be run again and fail the same way.
// PT: Um pequeno gerador com semente (mulberry32). "Falha aleatoriamente" ainda precisa ser
//     reproduzível: a mesma semente dá as mesmas falhas, então um teste que falha pode ser rodado
//     de novo e falhar do mesmo jeito.
// ES: Un pequeño generador con semilla (mulberry32). "Falla aleatoriamente" aún debe ser
//     reproducible: la misma semilla da los mismos fallos, así que una prueba que falla puede
//     ejecutarse de nuevo y fallar del mismo modo.
export function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const envSchema = z.object({
	// EN: Lab credentials, obviously fake, valid only inside docker-compose.
	// PT: Credenciais de laboratório, claramente falsas, válidas só dentro do docker-compose.
	// ES: Credenciales de laboratorio, claramente falsas, válidas solo dentro de docker-compose.
	DATABASE_URL: z.url().default("postgres://lab:lab-fake-password@db:5432/lab"),
	AMQP_URL: z.url().default("amqp://lab:lab-fake-password@broker:5672"),
	/** Folder of the mini-project, where `results/` lives. */
	PROJECT_DIR: z
		.string()
		.min(1)
		.default(resolve(import.meta.dir, "..", "..")),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	return envSchema.parse({
		DATABASE_URL: env.DATABASE_URL,
		AMQP_URL: env.AMQP_URL,
		PROJECT_DIR: env.PROJECT_DIR,
	});
}
