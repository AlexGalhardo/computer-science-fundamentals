"""Single-thread CPU workload in Python.

EN: `nbody` (floating point) and `sieve` (integers and memory). CPython interprets bytecode one
    instruction at a time and every number is a heap object, so the same loops that take
    milliseconds in a compiled language take seconds here. The loops are written by hand on
    purpose: slicing tricks or NumPy would measure C code, not the interpreter.
PT: `nbody` (ponto flutuante) e `sieve` (inteiros e memória). O CPython interpreta bytecode uma
    instrução por vez e todo número é um objeto no heap, então os mesmos laços que levam
    milissegundos em uma linguagem compilada levam segundos aqui. Os laços são escritos à mão
    de propósito: truques de fatiamento ou NumPy mediriam código C, não o interpretador.
ES: `nbody` (punto flotante) y `sieve` (enteros y memoria). CPython interpreta bytecode una
    instrucción a la vez y todo número es un objeto en el heap, así que los mismos bucles que
    toman milisegundos en un lenguaje compilado toman segundos aquí. Los bucles están escritos a
    mano a propósito: trucos de rebanado o NumPy medirían código C, no el intérprete.
"""

import json
import math
import resource
import sys
import time

SOLAR_MASS = 4.0 * math.pi * math.pi
DAYS_PER_YEAR = 365.24
DT = 0.01


def make_bodies() -> list[list[float]]:
    # EN: Sun, Jupiter, Saturn, Uranus and Neptune as [x, y, z, vx, vy, vz, mass].
    # PT: Sol, Júpiter, Saturno, Urano e Netuno como [x, y, z, vx, vy, vz, massa].
    # ES: Sol, Júpiter, Saturno, Urano y Neptuno como [x, y, z, vx, vy, vz, masa].
    raw = [
        (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0),
        (
            4.84143144246472090e00,
            -1.16032004402742839e00,
            -1.03622044471123109e-01,
            1.66007664274403694e-03,
            7.69901118419740425e-03,
            -6.90460016972063023e-05,
            9.54791938424326609e-04,
        ),
        (
            8.34336671824457987e00,
            4.12479856412430479e00,
            -4.03523417114321381e-01,
            -2.76742510726862411e-03,
            4.99852801234917238e-03,
            2.30417297573763929e-05,
            2.85885980666130812e-04,
        ),
        (
            1.28943695621391310e01,
            -1.51111514016986312e01,
            -2.23307578892655734e-01,
            2.96460137564761618e-03,
            2.37847173959480950e-03,
            -2.96589568540237556e-05,
            4.36624404335156298e-05,
        ),
        (
            1.53796971148509165e01,
            -2.59193146099879641e01,
            1.79258772950371181e-01,
            2.68067772490389322e-03,
            1.62824170038242295e-03,
            -9.51592254519715870e-05,
            5.15138902046611451e-05,
        ),
    ]
    return [
        [x, y, z, vx * DAYS_PER_YEAR, vy * DAYS_PER_YEAR, vz * DAYS_PER_YEAR, mass * SOLAR_MASS]
        for (x, y, z, vx, vy, vz, mass) in raw
    ]


def offset_momentum(bodies: list[list[float]]) -> None:
    px = py = pz = 0.0
    for b in bodies:
        px += b[3] * b[6]
        py += b[4] * b[6]
        pz += b[5] * b[6]
    bodies[0][3] = -px / SOLAR_MASS
    bodies[0][4] = -py / SOLAR_MASS
    bodies[0][5] = -pz / SOLAR_MASS


def advance(bodies: list[list[float]]) -> None:
    # EN: One time step: every pair pulls on each other, then every body moves.
    # PT: Um passo de tempo: cada par se atrai, depois cada corpo anda.
    # ES: Un paso de tiempo: cada par se atrae, luego cada cuerpo avanza.
    count = len(bodies)
    for i in range(count):
        a = bodies[i]
        for j in range(i + 1, count):
            b = bodies[j]
            dx = a[0] - b[0]
            dy = a[1] - b[1]
            dz = a[2] - b[2]
            dist2 = dx * dx + dy * dy + dz * dz
            mag = DT / (dist2 * math.sqrt(dist2))
            a[3] -= dx * b[6] * mag
            a[4] -= dy * b[6] * mag
            a[5] -= dz * b[6] * mag
            b[3] += dx * a[6] * mag
            b[4] += dy * a[6] * mag
            b[5] += dz * a[6] * mag
    for b in bodies:
        b[0] += DT * b[3]
        b[1] += DT * b[4]
        b[2] += DT * b[5]


def energy(bodies: list[list[float]]) -> float:
    e = 0.0
    for i, a in enumerate(bodies):
        e += 0.5 * a[6] * (a[3] * a[3] + a[4] * a[4] + a[5] * a[5])
        for b in bodies[i + 1 :]:
            dx = a[0] - b[0]
            dy = a[1] - b[1]
            dz = a[2] - b[2]
            e -= a[6] * b[6] / math.sqrt(dx * dx + dy * dy + dz * dz)
    return e


def nbody(n: int) -> str:
    bodies = make_bodies()
    offset_momentum(bodies)
    for _ in range(n):
        advance(bodies)
    return f"{energy(bodies):.9f}"


def sieve(n: int) -> str:
    # EN: Sieve of Eratosthenes. The checksum is "how many primes:the largest one".
    # PT: Crivo de Eratóstenes. O checksum é "quantos primos:o maior deles".
    # ES: Criba de Eratóstenes. El checksum es "cuántos primos:el mayor de ellos".
    composite = bytearray(n + 1)
    i = 2
    while i * i <= n:
        if not composite[i]:
            j = i * i
            while j <= n:
                composite[j] = 1
                j += i
        i += 1
    count = largest = 0
    for value in range(2, n + 1):
        if not composite[value]:
            count += 1
            largest = value
    return f"{count}:{largest}"


def main() -> None:
    implementation = sys.argv[1] if len(sys.argv) > 1 else "nbody"
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 1000

    start = time.perf_counter()
    checksum = sieve(n) if implementation == "sieve" else nbody(n)
    elapsed_ms = (time.perf_counter() - start) * 1000

    print(
        json.dumps(
            {
                "n": n,
                "elapsedMs": round(elapsed_ms, 3),
                # EN: On Linux, ru_maxrss is the peak resident memory, already in kibibytes.
                # PT: No Linux, ru_maxrss é o pico de memória residente, já em kibibytes.
                # ES: En Linux, ru_maxrss es el pico de memoria residente, ya en kibibytes.
                "memoryKb": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                "language": "python",
                "implementation": implementation,
                "checksum": checksum,
            }
        )
    )


if __name__ == "__main__":
    main()
