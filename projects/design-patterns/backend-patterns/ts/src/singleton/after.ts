// EN: An ordinary class. Nothing in it decides how many instances exist.
// PT: Uma classe comum. Nada nela decide quantas instâncias existem.
// ES: Una clase común. Nada en ella decide cuántas instancias existen.
export class RequestCounter {
	private readonly hits = new Map<string, number>();

	hit(key: string): number {
		const total = (this.hits.get(key) ?? 0) + 1;
		this.hits.set(key, total);
		return total;
	}
}

// EN: DEPENDENCY INJECTION INSTEAD OF SINGLETON. The limiter receives its counter, so the
//     constructor says everything the class needs, and whoever builds two limiters decides,
//     in plain sight, whether they share a counter.
// PT: INJEÇÃO DE DEPENDÊNCIA NO LUGAR DO SINGLETON. O limitador recebe seu contador, então o
//     construtor diz tudo o que a classe precisa, e quem monta dois limitadores decide, à
//     vista de todos, se eles compartilham um contador.
// ES: INYECCIÓN DE DEPENDENCIAS EN LUGAR DEL SINGLETON. El limitador recibe su contador, así que
//     el constructor dice todo lo que la clase necesita, y quien monta dos limitadores decide, a
//     la vista de todos, si comparten un contador.
export class RateLimiter {
	constructor(
		private readonly counter: RequestCounter,
		private readonly limit: number,
	) {}

	allow(key: string): boolean {
		return this.counter.hit(key) <= this.limit;
	}
}

export interface App {
	login: RateLimiter;
	passwordReset: RateLimiter;
	search: RateLimiter;
}

// EN: The composition root: the one place that creates the objects and wires them. "Only one
//     instance" is still possible, and here it is a visible decision: login and password
//     reset share a counter on purpose, and search gets its own.
// PT: A raiz de composição: o único lugar que cria os objetos e os liga. "Uma única instância"
//     continua possível, e aqui é uma decisão visível: login e redefinição de senha
//     compartilham um contador de propósito, e a busca recebe o seu.
// ES: La composition root: el único lugar que crea los objetos y los conecta. "Una única
//     instancia" sigue siendo posible, y aquí es una decisión visible: login y restablecimiento
//     de contraseña comparten un contador a propósito, y la búsqueda recibe el suyo.
export function createApp(): App {
	const authCounter = new RequestCounter();
	return {
		login: new RateLimiter(authCounter, 3),
		passwordReset: new RateLimiter(authCounter, 3),
		search: new RateLimiter(new RequestCounter(), 3),
	};
}
