"""Parallelism workload in Python: count the primes below n, range cut into 256 chunks.

EN: Python model: processes, not threads. In the standard CPython build the global interpreter
    lock (GIL) lets only one thread run Python bytecode at a time, so threads do not speed up
    CPU work. `multiprocessing.Pool` starts one interpreter per worker, each with its own GIL
    and its own memory, and sends them chunk numbers through pipes. The price is start-up time
    and memory per process, both visible in the results.
PT: Modelo do Python: processos, não threads. Na build padrão do CPython a trava global do
    interpretador (GIL) deixa só uma thread rodar bytecode Python por vez, então threads não
    aceleram trabalho de CPU. O `multiprocessing.Pool` sobe um interpretador por worker, cada
    um com sua GIL e sua memória, e envia a eles números de pedaço por pipes. O preço é tempo
    de inicialização e memória por processo, ambos visíveis nos resultados.
ES: Modelo de Python: procesos, no threads. En la build estándar de CPython el candado global del
    intérprete (GIL) deja que solo un thread ejecute bytecode de Python a la vez, así que los
    threads no aceleran el trabajo de CPU. `multiprocessing.Pool` levanta un intérprete por worker,
    cada uno con su GIL y su memoria, y les envía números de pedazo por pipes. El precio es tiempo
    de inicialización y memoria por proceso, ambos visibles en los resultados.
"""

import json
import resource
import sys
import time
from functools import partial
from multiprocessing import get_context

CHUNKS = 256


def is_prime(k: int) -> bool:
    if k < 2:
        return False
    if k < 4:
        return True
    if k % 2 == 0:
        return False
    d = 3
    while d * d <= k:
        if k % d == 0:
            return False
        d += 2
    return True


def count_chunk(n: int, chunk: int) -> int:
    # EN: Chunk c covers [c*n/256, (c+1)*n/256).
    # PT: O pedaço c cobre [c*n/256, (c+1)*n/256).
    # ES: El pedazo c cubre [c*n/256, (c+1)*n/256).
    count = 0
    for k in range(chunk * n // CHUNKS, (chunk + 1) * n // CHUNKS):
        if is_prime(k):
            count += 1
    return count


def count_primes(n: int, workers: int) -> int:
    # EN: "spawn" starts each worker as a direct child running a fresh interpreter. The default
    #     on Linux ("forkserver") creates them under a helper process, and then the CPU time
    #     of the workers would not be counted as time of this program.
    # PT: O "spawn" sobe cada worker como filho direto rodando um interpretador novo. O padrão
    #     no Linux ("forkserver") os cria sob um processo auxiliar, e aí o tempo de CPU dos
    #     workers não seria contado como tempo deste programa.
    # ES: "spawn" levanta cada worker como hijo directo ejecutando un intérprete nuevo. El valor
    #     predeterminado en Linux ("forkserver") los crea bajo un proceso auxiliar, y entonces el
    #     tiempo de CPU de los workers no se contaría como tiempo de este programa.
    pool = get_context("spawn").Pool(workers)
    try:
        # EN: imap_unordered hands out one chunk at a time to whichever process is free.
        # PT: O imap_unordered entrega um pedaço por vez ao processo que estiver livre.
        # ES: imap_unordered entrega un pedazo a la vez al proceso que esté libre.
        total = sum(pool.imap_unordered(partial(count_chunk, n), range(CHUNKS)))
    finally:
        # EN: close and join let the workers exit by themselves, so the OS adds their CPU time
        #     and memory to this process's totals.
        # PT: close e join deixam os workers saírem sozinhos, então o SO soma o tempo de CPU e
        #     a memória deles aos totais deste processo.
        # ES: close y join dejan que los workers salgan solos, así el SO suma su tiempo de CPU y
        #     su memoria a los totales de este proceso.
        pool.close()
        pool.join()
    return total


def main() -> None:
    implementation = sys.argv[1] if len(sys.argv) > 1 else "primes"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 100000
    workers = int(sys.argv[3]) if len(sys.argv) > 3 else 1

    start = time.perf_counter()
    total = count_primes(n, workers)
    elapsed_ms = (time.perf_counter() - start) * 1000

    # EN: The work happened in the children, so the peak is the parent plus the largest child.
    #     It is still an underestimate of the whole pool: hyperfine's figure has the same limit.
    # PT: O trabalho aconteceu nos filhos, então o pico é o pai mais o maior filho. Ainda é uma
    #     subestimativa do pool inteiro: o número do hyperfine tem o mesmo limite.
    # ES: El trabajo ocurrió en los hijos, así que el pico es el padre más el mayor hijo. Sigue
    #     siendo una subestimación del pool completo: el número de hyperfine tiene el mismo límite.
    own = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    children = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
    print(
        json.dumps(
            {
                "n": n,
                "elapsedMs": round(elapsed_ms, 3),
                "memoryKb": own + children,
                "language": "python",
                "implementation": implementation,
                "checksum": str(total),
            }
        )
    )


if __name__ == "__main__":
    main()
