import { assertConfig, type LimiterConfig, type RateLimiter } from "./limiter";

// EN: Fixed window. Time is cut into windows aligned to multiples of `windowMs`
//     ([0, W), [W, 2W), ...) and one counter counts the admitted requests of the current
//     window. The state is tiny (a window number and a counter), which is why this is the
//     first algorithm everyone writes. Its flaw is at the boundary: the counter goes back to
//     zero at once, so `limit` requests at the end of one window plus `limit` at the start of
//     the next all pass, up to twice the limit in a very short time.
// PT: Janela fixa. O tempo é cortado em janelas alinhadas a múltiplos de `windowMs`
//     ([0, W), [W, 2W), ...) e um contador conta as requisições admitidas na janela atual.
//     O estado é mínimo (um número de janela e um contador), e por isso é o primeiro algoritmo
//     que todo mundo escreve. O defeito está na fronteira: o contador volta a zero de uma vez,
//     então `limit` requisições no fim de uma janela mais `limit` no começo da seguinte passam
//     todas, até o dobro do limite em um tempo muito curto.
// ES: Ventana fija. El tiempo se corta en ventanas alineadas a múltiplos de `windowMs`
//     ([0, W), [W, 2W), ...) y un contador cuenta las solicitudes admitidas en la ventana actual.
//     El estado es mínimo (un número de ventana y un contador), y por eso es el primer algoritmo
//     que todo el mundo escribe. El defecto está en la frontera: el contador vuelve a cero de
//     golpe, así que `limit` solicitudes al final de una ventana más `limit` al comienzo de la
//     siguiente pasan todas, hasta el doble del límite en un tiempo muy corto.
export class FixedWindow implements RateLimiter {
	private windowId = -1;
	private count = 0;

	constructor(private readonly config: LimiterConfig) {
		assertConfig(config);
	}

	allow(nowMs: number): boolean {
		const windowId = Math.floor(nowMs / this.config.windowMs);
		if (windowId !== this.windowId) {
			this.windowId = windowId;
			this.count = 0;
		}
		// EN: A rejected request is not counted. Counting it would not change any decision
		//     here, because the counter is discarded at the boundary anyway.
		// PT: Uma requisição rejeitada não é contada. Contá-la não mudaria nenhuma decisão
		//     aqui, porque o contador é descartado na fronteira de qualquer forma.
		// ES: Una solicitud rechazada no se cuenta. Contarla no cambiaría ninguna decisión aquí,
		//     porque el contador se descarta en la frontera de todas formas.
		if (this.count >= this.config.limit) {
			return false;
		}
		this.count += 1;
		return true;
	}
}
