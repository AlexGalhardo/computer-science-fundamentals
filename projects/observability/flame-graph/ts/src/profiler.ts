// EN: A sampling CPU profiler does not measure every call. Many times per second it stops the
//     program for an instant and writes down the call stack. A function that uses a lot of CPU
//     is simply found on the stack more often. That is why the overhead is small, and why the
//     result is statistical: a short profile of a quiet program says little.
//     Bun exposes the profiler of its JavaScript engine through the `node:inspector` module,
//     with the same protocol Chrome DevTools uses (`Profiler.start`, `Profiler.stop`).
// PT: Um profiler de CPU por amostragem não mede cada chamada. Muitas vezes por segundo ele
//     para o programa por um instante e anota a pilha de chamadas. Uma função que usa muita CPU
//     simplesmente é encontrada na pilha mais vezes. Por isso a sobrecarga é pequena, e por
//     isso o resultado é estatístico: um perfil curto de um programa ocioso diz pouco.
//     O Bun expõe o profiler do seu motor JavaScript pelo módulo `node:inspector`, com o mesmo
//     protocolo que o Chrome DevTools usa (`Profiler.start`, `Profiler.stop`).

import { Session } from "node:inspector";

let busy = false;

function post(session: Session, method: string): Promise<unknown> {
	return new Promise((resolve, reject) => {
		session.post(method, (error: Error | null, result?: unknown) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});
}

/** Profiles this process for the given time and returns the raw `.cpuprofile` object. */
export async function captureCpuProfile(seconds: number): Promise<unknown> {
	// EN: One profile at a time: two overlapping sessions would stop each other.
	// PT: Um perfil por vez: duas sessões sobrepostas parariam uma à outra.
	if (busy) {
		throw new Error("a profile is already being captured");
	}
	busy = true;
	const session = new Session();
	session.connect();
	try {
		await post(session, "Profiler.enable");
		await post(session, "Profiler.start");
		await Bun.sleep(seconds * 1000);
		const result = (await post(session, "Profiler.stop")) as { profile?: unknown };
		return result.profile;
	} finally {
		session.disconnect();
		busy = false;
	}
}
