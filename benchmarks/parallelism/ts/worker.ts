// EN: Code of one worker thread. It receives a chunk number, counts the primes of that chunk
//     and posts the count back. Nothing here is shared with the main thread.
// PT: Código de uma thread worker. Ela recebe um número de pedaço, conta os primos desse pedaço
//     e devolve a contagem. Nada aqui é compartilhado com a thread principal.
// ES: Código de un thread worker. Recibe un número de pedazo, cuenta los primos de ese pedazo
//     y devuelve el conteo. Nada aquí se comparte con el thread principal.

// EN: An empty export makes this file a module, so its names stay private to it.
// PT: Um export vazio torna este arquivo um módulo, então seus nomes ficam privados a ele.
// ES: Un export vacío convierte este archivo en un módulo, así sus nombres quedan privados a él.
export {};

declare var self: Worker;

const CHUNKS = 256;

function isPrime(k: number): boolean {
	if (k < 2) return false;
	if (k < 4) return true;
	if (k % 2 === 0) return false;
	for (let d = 3; d * d <= k; d += 2) {
		if (k % d === 0) return false;
	}
	return true;
}

// EN: Chunk c covers [c*n/256, (c+1)*n/256).
// PT: O pedaço c cobre [c*n/256, (c+1)*n/256).
// ES: El pedazo c cubre [c*n/256, (c+1)*n/256).
function countChunk(chunk: number, n: number): number {
	let count = 0;
	const stop = Math.floor(((chunk + 1) * n) / CHUNKS);
	for (let k = Math.floor((chunk * n) / CHUNKS); k < stop; k++) {
		if (isPrime(k)) count++;
	}
	return count;
}

self.onmessage = (event: MessageEvent<{ chunk: number; n: number }>): void => {
	self.postMessage(countChunk(event.data.chunk, event.data.n));
};
