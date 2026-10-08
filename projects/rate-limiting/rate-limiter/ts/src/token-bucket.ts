import { assertConfig, type LimiterConfig, type RateLimiter } from "./limiter";

// EN: Token bucket. A bucket holds up to `limit` tokens and gains `limit` tokens every
//     `windowMs`, at a steady pace. A request takes one token and is rejected when there is
//     none. The capacity is the size of the burst that passes at once (a full bucket is
//     credit saved while the client was quiet), and the refill rate is the average rate in
//     the long run. Tokens above the capacity are thrown away, so silence cannot be saved
//     forever.
// PT: Token bucket (balde de fichas). Um balde guarda até `limit` fichas e ganha `limit` fichas
//     a cada `windowMs`, em ritmo constante. Uma requisição gasta uma ficha e é rejeitada
//     quando não há nenhuma. A capacidade é o tamanho da rajada que passa de uma vez (um balde
//     cheio é crédito guardado enquanto o cliente ficou quieto), e a taxa de reposição é a taxa
//     média no longo prazo. Fichas acima da capacidade são descartadas, então o silêncio não
//     pode ser poupado para sempre.
export class TokenBucket implements RateLimiter {
	// EN: The balance is kept in "credit" units, where one token is worth `windowMs` credits.
	//     Each elapsed millisecond then adds exactly `limit` credits, a whole number, and
	//     fractions of a token never become floating-point rounding errors.
	// PT: O saldo é guardado em unidades de "crédito", em que uma ficha vale `windowMs`
	//     créditos. Cada milissegundo decorrido soma exatamente `limit` créditos, um número
	//     inteiro, e frações de ficha nunca viram erro de arredondamento de ponto flutuante.
	private credit: number;
	private lastMs = 0;

	constructor(private readonly config: LimiterConfig) {
		assertConfig(config);
		this.credit = config.limit * config.windowMs;
	}

	allow(nowMs: number): boolean {
		const { limit, windowMs } = this.config;
		// EN: Lazy refill. No timer drips tokens in the background: on each request the bucket
		//     computes how much it earned since the last one. The state is two numbers.
		// PT: Reposição preguiçosa. Nenhum timer pinga fichas em segundo plano: a cada
		//     requisição o balde calcula quanto ganhou desde a anterior. O estado são dois números.
		const earned = (nowMs - this.lastMs) * limit;
		this.credit = Math.min(limit * windowMs, this.credit + earned);
		this.lastMs = nowMs;
		if (this.credit < windowMs) {
			return false;
		}
		this.credit -= windowMs;
		return true;
	}
}
