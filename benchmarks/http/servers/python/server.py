"""HTTP server of the benchmark in Python, with FastAPI on uvicorn.

EN: The standard library server (http.server) is meant for development, so the most used
    framework is used instead. Model: one process, one thread, one asyncio event loop
    (uvicorn's default, one worker). `async def` handlers run on the loop. A plain `def`
    handler, like /primes, is sent by FastAPI to a pool of threads so it does not freeze the
    loop, but the GIL still lets only one thread run Python code at a time: this server never
    uses more than about one core. Production setups start several worker processes.
    Protocol (the same in the 7 languages): GET /health, POST /echo, GET /primes?limit=N.
PT: O servidor da biblioteca padrão (http.server) é para desenvolvimento, então o framework
    mais usado entra no lugar. Modelo: um processo, uma thread, um event loop asyncio (padrão do
    uvicorn, um worker). Handlers `async def` rodam no loop. Um handler `def` comum, como o
    /primes, é enviado pelo FastAPI a um pool de threads para não congelar o loop, mas a GIL
    ainda deixa só uma thread rodar código Python por vez: este servidor nunca usa mais que
    cerca de um núcleo. Em produção sobem-se vários processos worker.
    Protocolo (o mesmo nas 7 linguagens): GET /health, POST /echo, GET /primes?limit=N.
"""

import json

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse

MAX_LIMIT = 100000

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


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


def count_primes(limit: int) -> int:
    # EN: The CPU-bound endpoint: count the primes up to limit by trial division.
    # PT: O endpoint preso à CPU: conta os primos até limit por divisão por tentativa.
    return sum(1 for k in range(2, limit + 1) if is_prime(k))


@app.get("/health")
async def health() -> PlainTextResponse:
    return PlainTextResponse("ok")


@app.post("/echo")
async def echo(request: Request) -> JSONResponse:
    # EN: The body is parsed and serialised again, so this measures the JSON library and the
    #     HTTP stack, not a copy of bytes.
    # PT: O corpo é interpretado e serializado de novo, então isto mede a biblioteca de JSON e
    #     a pilha HTTP, não uma cópia de bytes.
    try:
        value = json.loads(await request.body())
    except ValueError:
        return JSONResponse({"error": "invalid json"}, status_code=400)
    return JSONResponse({"language": "python", "echo": value})


@app.get("/primes")
def primes(limit: str = "") -> JSONResponse:
    if not limit.isascii() or not limit.isdigit() or not 2 <= int(limit) <= MAX_LIMIT:
        return JSONResponse({"error": "invalid limit"}, status_code=400)
    return JSONResponse(
        {"language": "python", "limit": int(limit), "count": count_primes(int(limit))}
    )
