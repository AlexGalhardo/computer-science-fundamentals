// EN: FAILING DESIGN: SINGLETON. One instance, reachable from anywhere through a static method.
//     The single instance is not the problem. The global access is: it works as a global
//     variable, and the mutable state inside it silently links all the code that touches it.
// PT: DESENHO COM DEFEITO: SINGLETON. Uma instância, alcançável de qualquer lugar por um método
//     estático. A instância única não é o problema. O acesso global é: ele funciona como uma
//     variável global, e o estado mutável lá dentro liga, sem aviso, todo código que o toca.
// ES: DISEÑO QUE FALLA: SINGLETON. Una instancia, accesible desde cualquier lugar mediante un
//     método estático. La instancia única no es el problema. El acceso global sí: funciona como
//     una variable global, y el estado mutable que hay dentro une, sin aviso, a todo el código
//     que lo toca.
export class RequestCounter {
	private static instance: RequestCounter | undefined;
	private readonly hits = new Map<string, number>();

	private constructor() {}

	static getInstance(): RequestCounter {
		RequestCounter.instance ??= new RequestCounter();
		return RequestCounter.instance;
	}

	hit(key: string): number {
		const total = (this.hits.get(key) ?? 0) + 1;
		this.hits.set(key, total);
		return total;
	}
}

// EN: The constructor takes only the limit, so this class looks independent. It is not: the
//     dependency on the counter is hidden inside `allow`, and two limiters that were never
//     introduced to each other count on the same numbers.
// PT: O construtor recebe só o limite, então esta classe parece independente. Não é: a
//     dependência do contador está escondida dentro de `allow`, e dois limitadores que nunca
//     foram apresentados um ao outro contam sobre os mesmos números.
// ES: El constructor recibe solo el límite, así que esta clase parece independiente. No lo es: la
//     dependencia del contador está escondida dentro de `allow`, y dos limitadores que nunca se
//     presentaron cuentan sobre los mismos números.
export class RateLimiter {
	constructor(private readonly limit: number) {}

	allow(key: string): boolean {
		return RequestCounter.getInstance().hit(key) <= this.limit;
	}
}
