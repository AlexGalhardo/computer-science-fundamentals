import { assertConfig, type LimiterConfig, type RateLimiter } from "./limiter";

// EN: Sliding window counter. A cheap approximation of the sliding log with two counters: the
//     current fixed window and the previous one. The sliding window that ends now covers all
//     of the current fixed window so far and the last part of the previous one, so:
//
//         estimate = previous * (1 - elapsed / W) + current
//
//     where `elapsed` is the time since the current fixed window began. The request is
//     admitted when estimate < limit. The formula assumes the previous window's requests were
//     evenly spread. When they were bunched at its end, the estimate is too low and a little
//     more than the limit can pass in some interval of length W: memory is traded for accuracy.
// PT: Contador de janela deslizante. Uma aproximação barata do log deslizante com dois
//     contadores: a janela fixa atual e a anterior. A janela deslizante que termina agora cobre
//     toda a janela fixa atual até aqui e a parte final da anterior, então:
//
//         estimativa = anterior * (1 - decorrido / W) + atual
//
//     em que `decorrido` é o tempo desde o início da janela fixa atual. A requisição é admitida
//     quando estimativa < limite. A fórmula supõe que as requisições da janela anterior
//     chegaram espalhadas por igual. Quando elas se concentraram no fim, a estimativa fica
//     baixa demais e um pouco mais que o limite pode passar em algum intervalo de tamanho W:
//     troca-se memória por precisão.
// ES: Contador de ventana deslizante. Una aproximación barata del log deslizante con dos
//     contadores: la ventana fija actual y la anterior. La ventana deslizante que termina ahora
//     cubre toda la ventana fija actual hasta aquí y la parte final de la anterior, así que:
//
//         estimación = anterior * (1 - transcurrido / W) + actual
//
//     donde `transcurrido` es el tiempo desde el inicio de la ventana fija actual. La solicitud
//     se admite cuando estimación < límite. La fórmula supone que las solicitudes de la ventana
//     anterior llegaron repartidas por igual. Cuando se concentraron al final, la estimación
//     queda demasiado baja y puede pasar un poco más que el límite en algún intervalo de tamaño
//     W: se cambia memoria por precisión.
export class SlidingCounter implements RateLimiter {
	private windowId = -1;
	private current = 0;
	private previous = 0;

	constructor(private readonly config: LimiterConfig) {
		assertConfig(config);
	}

	allow(nowMs: number): boolean {
		const { limit, windowMs } = this.config;
		const windowId = Math.floor(nowMs / windowMs);
		if (windowId !== this.windowId) {
			// EN: Moving to the very next window turns "current" into "previous". After a longer
			//     silence the window just before this one was empty, so "previous" is zero.
			// PT: Passar para a janela imediatamente seguinte transforma "atual" em "anterior".
			//     Depois de um silêncio maior, a janela logo antes desta ficou vazia, então
			//     "anterior" é zero.
			// ES: Pasar a la ventana inmediatamente siguiente convierte "actual" en "anterior".
			//     Después de un silencio mayor, la ventana justo anterior a esta quedó vacía, así
			//     que "anterior" es cero.
			this.previous = windowId === this.windowId + 1 ? this.current : 0;
			this.current = 0;
			this.windowId = windowId;
		}
		const elapsed = nowMs - windowId * windowMs;
		// EN: Both sides of "estimate < limit" are multiplied by W, so no division happens and
		//     the comparison is exact with integers.
		// PT: Os dois lados de "estimativa < limite" são multiplicados por W, então não há
		//     divisão e a comparação é exata com inteiros.
		// ES: Los dos lados de "estimación < límite" se multiplican por W, así que no hay división
		//     y la comparación es exacta con enteros.
		const scaledEstimate = this.previous * (windowMs - elapsed) + this.current * windowMs;
		if (scaledEstimate >= limit * windowMs) {
			return false;
		}
		this.current += 1;
		return true;
	}
}
