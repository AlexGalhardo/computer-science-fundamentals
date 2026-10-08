"""Database client of the benchmark in Python, with psycopg 3 and psycopg_pool.

EN: psycopg is the most used PostgreSQL driver for Python. The four phases are the same in the
    7 languages: insert n rows one by one, read each by primary key, run a query with a filter
    and an aggregate, and read by key again from 8 threads sharing a pool of 8 connections.
    Threads work well here even with the GIL: while a thread waits for the database it
    releases the lock, and waiting is most of what this program does.
PT: O psycopg é o driver PostgreSQL mais usado em Python. As quatro fases são as mesmas nas 7
    linguagens: inserir n linhas uma a uma, ler cada uma pela chave primária, rodar uma consulta
    com filtro e agregação, e ler pela chave de novo a partir de 8 threads dividindo um pool de
    8 conexões. Threads funcionam bem aqui mesmo com a GIL: enquanto uma thread espera o banco
    ela solta a trava, e esperar é a maior parte do que este programa faz.
"""

import json
import os
import resource
import sys
import time
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor

import psycopg
from psycopg_pool import ConnectionPool

QUERY_OPS = 200
CATEGORIES = 10
TABLE = "items_python"


def timed(ids: range, fn: Callable[[int], int]) -> tuple[dict[str, float], list[float], int]:
    # EN: Runs fn for every id, records how long each call took and adds up what it returned.
    # PT: Roda fn para cada id, registra quanto tempo cada chamada levou e soma o que ela devolveu.
    latencies = []
    total = 0
    start = time.perf_counter()
    for i in ids:
        before = time.perf_counter()
        total += fn(i)
        latencies.append((time.perf_counter() - before) * 1000)
    return {"ops": len(ids), "elapsedMs": (time.perf_counter() - start) * 1000}, latencies, total


def summary(phase: dict[str, float], latencies: list[float]) -> dict[str, float]:
    ordered = sorted(latencies)

    def at(q: float) -> float:
        return ordered[min(len(ordered) - 1, int(q * len(ordered)))] if ordered else 0.0

    return {**phase, "p50Ms": at(0.50), "p95Ms": at(0.95), "p99Ms": at(0.99)}


def main() -> None:
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    conninfo = (
        f"host={os.environ.get('PGHOST', 'localhost')} "
        f"port={os.environ.get('PGPORT', '5432')} "
        f"user={os.environ.get('PGUSER', 'bench')} "
        f"password={os.environ.get('PGPASSWORD', 'bench')} "
        f"dbname={os.environ.get('PGDATABASE', 'bench')}"
    )
    phases = {}
    checksum = 0

    with psycopg.connect(conninfo, autocommit=True) as conn:
        conn.execute(f"DROP TABLE IF EXISTS {TABLE}")
        conn.execute(
            f"CREATE TABLE {TABLE} (id integer PRIMARY KEY, name text NOT NULL, "
            "category integer NOT NULL, price integer NOT NULL)"
        )

        def insert(i: int) -> int:
            conn.execute(
                f"INSERT INTO {TABLE} (id, name, category, price) VALUES (%s, %s, %s, %s)",
                (i, f"item-{i}", i % CATEGORIES, (i * 37) % 1000),
            )
            return 0

        def read(i: int) -> int:
            row = conn.execute(f"SELECT name, price FROM {TABLE} WHERE id = %s", (i,)).fetchone()
            return row[1] if row else 0

        def query(i: int) -> int:
            row = conn.execute(
                f"SELECT count(*), coalesce(sum(price), 0) FROM {TABLE} WHERE category = %s",
                (i % CATEGORIES,),
            ).fetchone()
            return row[0] + row[1] if row else 0

        phase, latencies, _ = timed(range(1, n + 1), insert)
        phases["insert"] = summary(phase, latencies)
        phase, latencies, total = timed(range(1, n + 1), read)
        phases["read"] = summary(phase, latencies)
        checksum += total
        phase, latencies, total = timed(range(QUERY_OPS), query)
        phases["query"] = summary(phase, latencies)
        checksum += total

        # EN: A pool keeps connections open and lends one to each thread that asks.
        # PT: Um pool mantém conexões abertas e empresta uma a cada thread que pedir.
        with ConnectionPool(
            conninfo, min_size=workers, max_size=workers, kwargs={"autocommit": True}
        ) as pool:
            pool.wait()

            def pooled_read(i: int) -> int:
                with pool.connection() as pooled:
                    row = pooled.execute(
                        f"SELECT name, price FROM {TABLE} WHERE id = %s", (i,)
                    ).fetchone()
                    return row[1] if row else 0

            start = time.perf_counter()
            with ThreadPoolExecutor(workers) as executor:
                parts = list(
                    executor.map(
                        lambda w: timed(range(w + 1, n + 1, workers), pooled_read), range(workers)
                    )
                )
            elapsed = (time.perf_counter() - start) * 1000
            phases["pool"] = summary(
                {"ops": sum(part[0]["ops"] for part in parts), "elapsedMs": elapsed},
                [latency for part in parts for latency in part[1]],
            )
            checksum += sum(part[2] for part in parts)

        conn.execute(f"DROP TABLE {TABLE}")

    # EN: CPU time and peak memory of this client process, as counted by the kernel.
    # PT: Tempo de CPU e pico de memória deste processo cliente, contados pelo kernel.
    usage = resource.getrusage(resource.RUSAGE_SELF)
    print(
        json.dumps(
            {
                "language": "python",
                "driver": "psycopg",
                "n": n,
                "concurrency": workers,
                "checksum": str(checksum),
                "cpuMs": (usage.ru_utime + usage.ru_stime) * 1000,
                "memoryKb": usage.ru_maxrss,
                "phases": phases,
            }
        )
    )


if __name__ == "__main__":
    main()
