import { assertConfig, type LimiterConfig, type RateLimiter } from "./limiter";

// EN: Sliding log. Keep the timestamp of every admitted request. A request at time t is
//     admitted when fewer than `limit` timestamps lie in (t - W, t], the window that ends
//     exactly now. Nothing is aligned to the clock, so there is no boundary to exploit and the
//     limit holds for ANY interval of length W. The price is memory: up to `limit` timestamps
//     per client, against one counter for the fixed window.
// PT: Log deslizante. Guarda o instante de cada requisição admitida. Uma requisição no tempo t
//     é admitida quando menos de `limit` instantes estão em (t - W, t], a janela que termina
//     exatamente agora. Nada é alinhado ao relógio, então não existe fronteira para explorar e
//     o limite vale para QUALQUER intervalo de tamanho W. O preço é memória: até `limit`
//     instantes por cliente, contra um contador na janela fixa.
// ES: Log deslizante. Guarda el instante de cada solicitud admitida. Una solicitud en el tiempo t
//     se admite cuando hay menos de `limit` instantes en (t - W, t], la ventana que termina
//     exactamente ahora. Nada está alineado al reloj, así que no existe frontera que explotar y
//     el límite vale para CUALQUIER intervalo de tamaño W. El precio es memoria: hasta `limit`
//     instantes por cliente, contra un contador en la ventana fija.
export class SlidingLog implements RateLimiter {
	private readonly log: number[] = [];

	constructor(private readonly config: LimiterConfig) {
		assertConfig(config);
	}

	allow(nowMs: number): boolean {
		// EN: Times arrive in order, so the oldest timestamp is always at the front. An entry
		//     exactly W old is outside (t - W, t] and is dropped.
		// PT: Os tempos chegam em ordem, então o instante mais antigo está sempre na frente.
		//     Uma entrada com exatamente W de idade está fora de (t - W, t] e é descartada.
		// ES: Los tiempos llegan en orden, así que el instante más antiguo siempre está al frente.
		//     Una entrada con exactamente W de antigüedad está fuera de (t - W, t] y se descarta.
		const oldestKept = nowMs - this.config.windowMs;
		while (this.log.length > 0 && (this.log[0] ?? 0) <= oldestKept) {
			this.log.shift();
		}
		if (this.log.length >= this.config.limit) {
			// EN: Only admitted requests are logged. If rejected ones were logged too, a client
			//     that keeps retrying would keep its own log full and never be admitted again.
			// PT: Só requisições admitidas entram no log. Se as rejeitadas também entrassem, um
			//     cliente que insiste manteria o próprio log cheio e nunca mais seria admitido.
			// ES: Solo las solicitudes admitidas entran al log. Si las rechazadas también entraran, un
			//     cliente que insiste mantendría su propio log lleno y nunca volvería a ser admitido.
			return false;
		}
		this.log.push(nowMs);
		return true;
	}
}
