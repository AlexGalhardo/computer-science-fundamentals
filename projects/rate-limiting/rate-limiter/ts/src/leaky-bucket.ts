import { assertConfig, type LimiterConfig, type RateLimiter } from "./limiter";

// EN: Leaky bucket, as a queue (a traffic shaper). Requests pour into a bucket that holds at
//     most `limit` of them and leaks at a constant rate, `limit` every `windowMs`. A request
//     that finds the bucket full is rejected. An admitted request is NOT served at once: it
//     waits for the water in front of it to leak out. Whatever the shape of the input, the
//     output is never faster than the leak rate: a burst goes in, an even stream comes out.
//
//     Compare with the token bucket of the same size. Both admit the same requests (a full
//     token bucket and an empty leaky bucket are mirror images). The difference is what
//     happens next: the token bucket forwards the burst immediately, the leaky bucket spreads
//     it over time. Use the first when the system behind tolerates bursts, the second when it
//     has a strict constant capacity.
// PT: Leaky bucket (balde furado), como fila (um modelador de tráfego). As requisições caem em
//     um balde que guarda no máximo `limit` delas e vaza em taxa constante, `limit` a cada
//     `windowMs`. Uma requisição que encontra o balde cheio é rejeitada. Uma requisição admitida
//     NÃO é atendida na hora: ela espera a água à sua frente vazar. Seja qual for o formato da
//     entrada, a saída nunca é mais rápida que a taxa de vazão: entra uma rajada, sai um fluxo
//     uniforme.
//
//     Compare com o token bucket do mesmo tamanho. Os dois admitem as mesmas requisições (um
//     token bucket cheio e um leaky bucket vazio são imagens espelhadas). A diferença é o que
//     acontece depois: o token bucket encaminha a rajada imediatamente, o leaky bucket a
//     espalha no tempo. Use o primeiro quando o sistema atrás tolera rajadas, o segundo quando
//     ele tem uma capacidade constante e rígida.
export class LeakyBucket implements RateLimiter {
	// EN: Water level in the same "credit" units as the token bucket: one request is worth
	//     `windowMs` credits and each millisecond leaks `limit` credits. Integers only.
	// PT: Nível de água nas mesmas unidades de "crédito" do token bucket: uma requisição vale
	//     `windowMs` créditos e cada milissegundo vaza `limit` créditos. Só inteiros.
	private level = 0;
	private lastMs = 0;

	constructor(private readonly config: LimiterConfig) {
		assertConfig(config);
	}

	/**
	 * Admits the request or not. When admitted, returns the time at which it leaves the bucket
	 * (is forwarded to the system behind). Returns `null` when the bucket is full.
	 */
	schedule(nowMs: number): number | null {
		const { limit, windowMs } = this.config;
		const leaked = (nowMs - this.lastMs) * limit;
		this.level = Math.max(0, this.level - leaked);
		this.lastMs = nowMs;
		if (this.level + windowMs > limit * windowMs) {
			return null;
		}
		// EN: The wait is the time the water already in the bucket takes to leak. Because the
		//     level grows by one request each time, two departures are never closer than
		//     `windowMs / limit`: that spacing is the smoothing.
		// PT: A espera é o tempo que a água já presente no balde leva para vazar. Como o nível
		//     sobe uma requisição por vez, duas saídas nunca ficam mais próximas que
		//     `windowMs / limit`: esse espaçamento é a suavização.
		const waitMs = Math.ceil(this.level / limit);
		this.level += windowMs;
		return nowMs + waitMs;
	}

	allow(nowMs: number): boolean {
		return this.schedule(nowMs) !== null;
	}
}
