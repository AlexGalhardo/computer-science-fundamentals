export interface HttpRequest {
	readonly method: "GET" | "POST";
	readonly url: string;
	readonly body: string | undefined;
	readonly headers: readonly string[];
	readonly timeoutSeconds: number;
	readonly retry: boolean;
	readonly followRedirects: boolean;
}

// EN: BUILDER. Each value arrives through a named method, optional ones are simply not called,
//     and `build` is the single door through which a request comes to exist.
// PT: BUILDER. Cada valor chega por um método com nome, os opcionais simplesmente não são
//     chamados, e `build` é a única porta pela qual uma requisição passa a existir.
export class RequestBuilder {
	private body: string | undefined;
	private headers: string[] = [];
	private timeoutSeconds = 30;
	private retry = false;
	private followRedirects = true;

	private constructor(
		private readonly method: "GET" | "POST",
		private readonly url: string,
	) {}

	static get(url: string): RequestBuilder {
		return new RequestBuilder("GET", url);
	}

	static post(url: string): RequestBuilder {
		return new RequestBuilder("POST", url);
	}

	withBody(body: string): this {
		this.body = body;
		return this;
	}

	withHeader(header: string): this {
		this.headers.push(header);
		return this;
	}

	withTimeout(seconds: number): this {
		this.timeoutSeconds = seconds;
		return this;
	}

	withRetry(): this {
		this.retry = true;
		return this;
	}

	withoutRedirects(): this {
		this.followRedirects = false;
		return this;
	}

	// EN: Rules that cross fields are checked here, when all the data is known, so an invalid
	//     request never exists. The headers are copied and frozen: the product must not stay
	//     linked to the builder, which may go on being used.
	// PT: As regras que cruzam campos são verificadas aqui, quando todos os dados são conhecidos,
	//     então uma requisição inválida nunca chega a existir. Os cabeçalhos são copiados e
	//     congelados: o produto não pode ficar ligado ao builder, que pode continuar em uso.
	build(): HttpRequest {
		if (this.method === "POST" && this.body === undefined) {
			throw new Error("a POST request needs a body");
		}
		if (this.method === "GET" && this.body !== undefined) {
			throw new Error("a GET request has no body");
		}
		if (this.timeoutSeconds <= 0) {
			throw new Error("the timeout must be positive");
		}
		return Object.freeze({
			method: this.method,
			url: this.url,
			body: this.body,
			headers: Object.freeze([...this.headers]),
			timeoutSeconds: this.timeoutSeconds,
			retry: this.retry,
			followRedirects: this.followRedirects,
		});
	}
}
