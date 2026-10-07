// EN: THE FIX for sessions, part 1: the server-side store. The cookie carries only a random id.
//     Who is logged in, and until when, lives here on the server, where the browser cannot edit it.
// PT: A CORREÇÃO das sessões, parte 1: o armazenamento no servidor. O cookie carrega só um id
//     aleatório. Quem está logado, e até quando, fica aqui no servidor, onde o navegador não
//     consegue editar.

import { randomBytes } from "node:crypto";
import type { Clock } from "../data";

export interface SessionTimeouts {
	// EN: Idle timeout: the session dies after this long without a request. It limits how long
	//     a forgotten open tab or a copied id stays useful.
	// PT: Expiração por inatividade: a sessão morre depois desse tempo sem requisições. Limita
	//     por quanto tempo uma aba esquecida aberta ou um id copiado continua útil.
	idleMs: number;
	// EN: Absolute timeout: the session dies this long after it was created, however active it
	//     is. Without it, a stolen id could be kept alive forever with one request now and then.
	// PT: Expiração absoluta: a sessão morre esse tempo depois de criada, por mais ativa que
	//     esteja. Sem ela, um id roubado poderia ser mantido vivo para sempre com uma requisição
	//     de vez em quando.
	absoluteMs: number;
}

export interface Session {
	username: string | null;
	createdAt: number;
	lastSeenAt: number;
}

export class SessionStore {
	private readonly sessions = new Map<string, Session>();

	constructor(
		private readonly timeouts: SessionTimeouts,
		private readonly clock: Clock,
	) {}

	// EN: 32 bytes from the operating system's secure random generator: 256 bits, impossible to
	//     guess. `Math.random()` is not meant for secrets and must never be used here.
	// PT: 32 bytes do gerador aleatório seguro do sistema operacional: 256 bits, impossível de
	//     adivinhar. `Math.random()` não foi feito para segredos e nunca deve ser usado aqui.
	create(username: string | null): string {
		const id = randomBytes(32).toString("base64url");
		const now = this.clock();
		this.sessions.set(id, { username, createdAt: now, lastSeenAt: now });
		return id;
	}

	// EN: Looking a session up is also where it expires: an id past either timeout is deleted
	//     and treated exactly like an id that never existed.
	// PT: Buscar uma sessão também é onde ela expira: um id que passou de qualquer um dos
	//     prazos é apagado e tratado exatamente como um id que nunca existiu.
	get(id: string | undefined): Session | undefined {
		if (id === undefined) return undefined;
		const session = this.sessions.get(id);
		if (session === undefined) return undefined;
		const now = this.clock();
		const idle = now - session.lastSeenAt >= this.timeouts.idleMs;
		const tooOld = now - session.createdAt >= this.timeouts.absoluteMs;
		if (idle || tooOld) {
			this.sessions.delete(id);
			return undefined;
		}
		session.lastSeenAt = now;
		return session;
	}

	destroy(id: string | undefined): void {
		if (id !== undefined) this.sessions.delete(id);
	}
}
