// EN: THE FIX for unlimited attempts: a counter of failed logins per key, with a temporary
//     lockout. The API uses two of them, one keyed by account and one keyed by client.
// PT: A CORREÇÃO para tentativas ilimitadas: um contador de logins que falharam por chave, com
//     bloqueio temporário. A API usa dois deles, um com a conta como chave e outro com o cliente.
// ES: LA CORRECCIÓN para intentos ilimitados: un contador de inicios de sesión fallidos por clave, con
//     bloqueo temporal. La API usa dos de ellos, uno con la cuenta como clave y otro con el cliente.

import type { Clock } from "../data";

export interface LimiterRule {
	// EN: Failures allowed inside the window. The one that reaches this number starts the lock.
	// PT: Falhas permitidas dentro da janela. A que alcança este número inicia o bloqueio.
	// ES: Fallos permitidos dentro de la ventana. El que alcanza este número inicia el bloqueo.
	maxFailures: number;
	windowMs: number;
	lockMs: number;
}

interface Entry {
	failures: number;
	windowStartedAt: number;
	lockedUntil: number;
}

export class AttemptLimiter {
	private readonly entries = new Map<string, Entry>();

	// EN: The clock comes from outside, so a test can jump 15 minutes ahead in one line. The
	//     entry limit keeps the map from growing without bound when somebody sends thousands of
	//     different keys: memory is also something to protect.
	// PT: O relógio vem de fora, então um teste pula 15 minutos em uma linha. O limite de
	//     entradas impede o mapa de crescer sem fim quando alguém manda milhares de chaves
	//     diferentes: memória também é algo a proteger.
	// ES: El reloj viene de fuera, así que una prueba salta 15 minutos en una línea. El límite de
	//     entradas impide que el mapa crezca sin fin cuando alguien manda miles de claves
	//     distintas: la memoria también es algo que proteger.
	constructor(
		private readonly rule: LimiterRule,
		private readonly clock: Clock,
		private readonly maxEntries = 10_000,
	) {}

	// EN: How long this key still has to wait, in milliseconds. Zero means "go ahead".
	// PT: Quanto tempo esta chave ainda precisa esperar, em milissegundos. Zero significa "pode ir".
	// ES: Cuánto tiempo más debe esperar esta clave, en milisegundos. Cero significa "puede pasar".
	retryAfterMs(key: string): number {
		const entry = this.entries.get(key);
		if (entry === undefined) return 0;
		return Math.max(0, entry.lockedUntil - this.clock());
	}

	recordFailure(key: string): void {
		const now = this.clock();
		let entry = this.entries.get(key);
		if (entry === undefined || now - entry.windowStartedAt >= this.rule.windowMs) {
			entry = { failures: 0, windowStartedAt: now, lockedUntil: 0 };
			this.entries.delete(key);
			this.entries.set(key, entry);
		}
		entry.failures += 1;
		if (entry.failures >= this.rule.maxFailures) {
			// EN: The lock is temporary on purpose. A permanent lock would let anybody disable
			//     somebody else's account just by typing wrong passwords for it.
			// PT: O bloqueio é temporário de propósito. Um bloqueio permanente deixaria qualquer
			//     pessoa desativar a conta de outra só digitando senhas erradas para ela.
			// ES: El bloqueo es temporal a propósito. Un bloqueo permanente dejaría que cualquier
			//     persona desactive la cuenta de otra solo escribiendo contraseñas incorrectas para ella.
			entry.lockedUntil = now + this.rule.lockMs;
			entry.failures = 0;
			entry.windowStartedAt = now;
		}
		this.prune(now);
	}

	// EN: A successful login clears the account's count, so honest typos do not add up for days.
	// PT: Um login bem-sucedido zera a contagem da conta, para que erros honestos de digitação
	//     não se acumulem por dias.
	// ES: Un inicio de sesión exitoso pone a cero el conteo de la cuenta, para que los errores honestos de escritura
	//     no se acumulen durante días.
	reset(key: string): void {
		this.entries.delete(key);
	}

	private prune(now: number): void {
		if (this.entries.size <= this.maxEntries) return;
		for (const [key, entry] of this.entries) {
			const expired = entry.lockedUntil <= now && now - entry.windowStartedAt >= this.rule.windowMs;
			if (expired) this.entries.delete(key);
		}
		// EN: Still too many: drop the oldest keys that are not locked (a Map keeps insertion
		//     order). Locked keys go last, otherwise a flood of made-up keys would be a way to
		//     erase somebody's lock.
		// PT: Ainda são muitas: descarta as chaves mais antigas que não estão bloqueadas (um Map
		//     mantém a ordem de inserção). As bloqueadas ficam por último, senão uma enxurrada
		//     de chaves inventadas seria um jeito de apagar o bloqueio de alguém.
		// ES: Aún son demasiadas: descarta las claves más antiguas que no están bloqueadas (un Map
		//     mantiene el orden de inserción). Las bloqueadas quedan para el final, de lo contrario una avalancha
		//     de claves inventadas sería una manera de borrar el bloqueo de alguien.
		for (const [key, entry] of this.entries) {
			if (this.entries.size <= this.maxEntries) return;
			if (entry.lockedUntil <= now) this.entries.delete(key);
		}
		for (const key of this.entries.keys()) {
			if (this.entries.size <= this.maxEntries) return;
			this.entries.delete(key);
		}
	}
}
