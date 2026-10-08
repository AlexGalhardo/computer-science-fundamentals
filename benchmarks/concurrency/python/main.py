"""Concurrency workload in Python: n tasks wait at a gate, then each sends its number.

EN: Python model: asyncio. One thread runs an event loop, and each task is a coroutine that
    gives control back to the loop at every `await`. Tasks never run at the same time, so no
    lock is needed, and one slow task delays all the others (cooperative scheduling). A parked
    task is a few Python objects on the heap. OS threads exist, but the GIL lets only one run
    Python code at a time and each costs a real stack, so asyncio is the way to hold many
    waiting tasks.
PT: Modelo do Python: asyncio. Uma thread roda um event loop, e cada tarefa é uma corrotina que
    devolve o controle ao loop a cada `await`. As tarefas nunca rodam ao mesmo tempo, então não
    é preciso trava, e uma tarefa lenta atrasa todas as outras (escalonamento cooperativo). Uma
    tarefa parada são alguns objetos Python no heap. Threads do SO existem, mas a GIL só deixa
    uma rodar código Python por vez e cada uma custa uma pilha real, então o asyncio é o jeito
    de manter muitas tarefas esperando.
"""

import asyncio
import json
import resource
import sys
import time


async def worker(gate: asyncio.Event, mailbox: asyncio.Queue[int], task_id: int) -> None:
    await gate.wait()
    await mailbox.put(task_id)


async def run(n: int) -> int:
    gate = asyncio.Event()
    mailbox: asyncio.Queue[int] = asyncio.Queue()
    tasks = [asyncio.create_task(worker(gate, mailbox, task_id)) for task_id in range(n)]
    # EN: A task only starts when the loop gets control, so yield once to park all at the gate.
    # PT: Uma tarefa só começa quando o loop recebe o controle, então cede uma vez para que
    #     todas parem no portão.
    await asyncio.sleep(0)
    gate.set()

    total = 0
    for _ in range(n):
        total += await mailbox.get()
    await asyncio.gather(*tasks)
    return total


def main() -> None:
    implementation = sys.argv[1] if len(sys.argv) > 1 else "asyncio-tasks"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 1000

    start = time.perf_counter()
    total = asyncio.run(run(n))
    elapsed_ms = (time.perf_counter() - start) * 1000

    print(
        json.dumps(
            {
                "n": n,
                "elapsedMs": round(elapsed_ms, 3),
                "memoryKb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                "language": "python",
                "implementation": implementation,
                "checksum": str(total),
            }
        )
    )


if __name__ == "__main__":
    main()
