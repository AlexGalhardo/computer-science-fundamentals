import { createHash } from "node:crypto";

// EN: CAUSE 1: TIME. A session expires 30 minutes after it is created. "Now" is not a constant:
//     it is a hidden input that changes between two reads. Code that calls `Date.now()` directly
//     can only be tested against the real clock, and the real clock does not wait for the test.
//     The fix is to make the clock a parameter. Production passes the real one (the default),
//     and a test passes a fake clock it controls.
// PT: CAUSA 1: TEMPO. Uma sessão expira 30 minutos depois de criada. "Agora" não é uma constante:
//     é uma entrada escondida que muda entre duas leituras. Código que chama `Date.now()` direto
//     só pode ser testado contra o relógio real, e o relógio real não espera o teste.
//     A correção é transformar o relógio em parâmetro. A produção passa o real (o padrão), e um
//     teste passa um relógio falso que ele controla.
// ES: CAUSA 1: TIEMPO. Una sesión expira 30 minutos después de crearse. "Ahora" no es una constante:
//     es una entrada oculta que cambia entre dos lecturas. El código que llama a `Date.now()` directamente
//     solo se puede probar contra el reloj real, y el reloj real no espera a la prueba.
//     La corrección es convertir el reloj en un parámetro. La producción pasa el real (el valor por
//     defecto), y una prueba pasa un reloj falso que ella controla.
export type Clock = () => number;

export const SESSION_TTL_MS = 30 * 60 * 1000;

export interface Session {
	id: string;
	userId: string;
	expiresAt: number;
}

// EN: Deriving the id is real work: one SHA-256, a fraction of a millisecond in a fresh process.
//     That is enough for the clock to tick, some of the time, between "the moment the session
//     was created" and the moment a test looks at the clock again.
// PT: Derivar o id é trabalho de verdade: um SHA-256, uma fração de milissegundo em um processo
//     recém-iniciado. Isso basta para o relógio avançar, parte das vezes, entre "o momento em
//     que a sessão foi criada" e o momento em que um teste olha o relógio de novo.
// ES: Derivar el id es trabajo de verdad: un SHA-256, una fracción de milisegundo en un proceso
//     recién iniciado. Eso basta para que el reloj avance, a veces, entre "el momento en que se
//     creó la sesión" y el momento en que una prueba mira el reloj de nuevo.
function deriveId(userId: string, createdAt: number): string {
	return createHash("sha256").update(`${userId}:${createdAt}`).digest("hex").slice(0, 16);
}

export function createSession(userId: string, now: Clock = Date.now): Session {
	const createdAt = now();
	return { id: deriveId(userId, createdAt), userId, expiresAt: createdAt + SESSION_TTL_MS };
}

export function isExpired(session: Session, now: Clock = Date.now): boolean {
	return now() >= session.expiresAt;
}

// EN: A fake clock: time stands still until the test moves it. With it, "29 minutes and 59
//     seconds later" takes zero real time and gives the same answer on every run.
// PT: Um relógio falso: o tempo fica parado até o teste movê-lo. Com ele, "29 minutos e 59
//     segundos depois" leva zero tempo real e dá a mesma resposta em toda execução.
// ES: Un reloj falso: el tiempo se queda quieto hasta que la prueba lo mueve. Con él, "29 minutos y 59
//     segundos después" toma cero tiempo real y da la misma respuesta en cada ejecución.
export class FakeClock {
	private current: number;

	constructor(start: number) {
		this.current = start;
	}

	readonly now: Clock = () => this.current;

	advance(milliseconds: number): void {
		this.current += milliseconds;
	}
}
