// EN: The two kinds of work a server does, reduced to their essence.
//     CPU-bound: the answer needs the processor the whole time (here, counting primes by trial
//     division). JavaScript runs it on the single thread of the event loop, so while one request
//     counts, every other request of the same process waits.
//     I/O-bound: the answer needs something slow that is not the processor (a database, a disk,
//     another service; here, a timer). While it waits, the thread is free to serve other requests.
// PT: Os dois tipos de trabalho que um servidor faz, reduzidos à essência.
//     CPU-bound: a resposta precisa do processador o tempo todo (aqui, contar primos por divisão
//     por tentativa). O JavaScript executa isso na única thread do event loop, então enquanto uma
//     requisição conta, todas as outras do mesmo processo esperam.
//     I/O-bound: a resposta precisa de algo lento que não é o processador (um banco, um disco,
//     outro serviço; aqui, um timer). Enquanto espera, a thread fica livre para outras requisições.
// ES: Los dos tipos de trabajo que hace un servidor, reducidos a lo esencial.
//     CPU-bound: la respuesta necesita el procesador todo el tiempo (aquí, contar primos por división
//     de prueba). JavaScript lo ejecuta en el único hilo del event loop, así que mientras una
//     solicitud cuenta, todas las demás del mismo proceso esperan.
//     I/O-bound: la respuesta necesita algo lento que no es el procesador (una base de datos, un
//     disco, otro servicio; aquí, un temporizador). Mientras espera, el hilo queda libre para otras solicitudes.

/** Counts the primes below `limit` by trial division. Deliberately not the fastest algorithm. */
export function countPrimes(limit: number): number {
	let count = 0;
	for (let candidate = 2; candidate < limit; candidate++) {
		let isPrime = true;
		for (let divisor = 2; divisor * divisor <= candidate; divisor++) {
			if (candidate % divisor === 0) {
				isPrime = false;
				break;
			}
		}
		if (isPrime) {
			count++;
		}
	}
	return count;
}

/** Resolves after `ms` milliseconds without using the processor, like a query sent to a database. */
export function simulateIo(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
