"""EN: The same CPU scheduling simulator as ts/src/scheduler.ts, in Python.

The lesson of the second language is that the algorithm is the same and only the vocabulary
changes: TypeScript interfaces become dataclasses, and policy objects become small classes
with the same three methods. Both programs must print exactly the same numbers.

PT: O mesmo simulador de escalonamento de CPU de ts/src/scheduler.ts, em Python.

A lição da segunda linguagem é que o algoritmo é o mesmo e só o vocabulário muda: as
interfaces do TypeScript viram dataclasses, e os objetos de política viram classes pequenas
com os mesmos três métodos. Os dois programas precisam imprimir exatamente os mesmos números.

ES: El mismo simulador de planificación de CPU de ts/src/scheduler.ts, en Python.

La lección del segundo lenguaje es que el algoritmo es el mismo y solo cambia el vocabulario: las
interfaces de TypeScript se vuelven dataclasses, y los objetos de política se vuelven clases
pequeñas con los mismos tres métodos. Ambos programas deben imprimir exactamente los mismos números.
"""

from collections.abc import Callable, Sequence
from dataclasses import dataclass
from math import inf


@dataclass(frozen=True)
class Process:
    id: str
    arrival: int
    burst: int
    # EN: Lower number means higher priority. Only the priority policy reads it.
    # PT: Número menor significa prioridade maior. Só a política de prioridade o lê.
    # ES: Un número menor significa mayor prioridad. Solo la política de prioridad lo lee.
    priority: int = 0


@dataclass
class Slice:
    """EN: One uninterrupted stretch of CPU: a bar of the Gantt chart.

    PT: Um trecho ininterrupto de CPU: uma barra do gráfico de Gantt.

    ES: Un tramo ininterrumpido de CPU: una barra del diagrama de Gantt.
    """

    id: str
    start: int
    end: int


@dataclass(frozen=True)
class Metrics:
    id: str
    waiting: int
    turnaround: int
    response: int
    dispatches: int


@dataclass(frozen=True)
class Averages:
    waiting: float
    turnaround: float
    response: float
    max_waiting: int


@dataclass(frozen=True)
class Schedule:
    policy: str
    slices: list[Slice]
    metrics: list[Metrics]
    averages: Averages


@dataclass
class Entry:
    process: Process
    remaining: int
    level: int = 0
    first_start: int | None = None
    finish: int = 0
    dispatches: int = 0


def _index_of_min(ready: Sequence[Entry], key: Callable[[Entry], float]) -> int:
    best = 0
    for index in range(1, len(ready)):
        # EN: Strictly smaller, so ties keep the entry that has been in the queue the longest.
        # PT: Estritamente menor, então empates mantêm a entrada há mais tempo na fila.
        # ES: Estrictamente menor, así los empates conservan la entrada que lleva más tiempo en la
        #     cola.
        if key(ready[index]) < key(ready[best]):
            best = index
    return best


class Policy:
    """EN: A policy answers three questions: who runs next, for how long, and what happens to
    an entry that used its whole quantum. The default is first come, first served.

    PT: Uma política responde a três perguntas: quem executa em seguida, por quanto tempo, e o
    que acontece com a entrada que usou o quantum inteiro. O padrão é a ordem de chegada.

    ES: Una política responde tres preguntas: quién se ejecuta a continuación, por cuánto tiempo, y
    qué pasa con la entrada que usó todo el quantum. Por defecto es el orden de llegada.
    """

    name = "FCFS"

    def select(self, ready: Sequence[Entry]) -> int:
        return 0

    def quantum(self, entry: Entry) -> float:
        return inf

    def expired(self, entry: Entry) -> None:
        return None


class Fcfs(Policy):
    """EN: First come, first served. One long job delays every short job behind it.

    PT: Primeiro a chegar, primeiro a ser servido. Um job longo atrasa todos os curtos atrás dele.

    ES: Primero en llegar, primero en ser atendido. Un trabajo largo retrasa a todos los cortos
    que están detrás.
    """


class Sjf(Policy):
    """EN: Shortest job first, no preemption. Lowest average waiting time when all jobs are
    available together, but it needs the bursts in advance and can starve long jobs.

    PT: Job mais curto primeiro, sem preempção. Menor espera média quando todos os jobs estão
    disponíveis juntos, mas exige conhecer os tempos e pode deixar jobs longos em inanição.

    ES: Primero el trabajo más corto, sin expropiación. Menor tiempo medio de espera cuando todos
    los trabajos están disponibles a la vez, pero exige conocer los tiempos y puede dejar a los
    trabajos largos en inanición.
    """

    name = "SJF"

    def select(self, ready: Sequence[Entry]) -> int:
        return _index_of_min(ready, lambda entry: entry.process.burst)


class RoundRobin(Policy):
    """EN: Round-robin. Each process runs for at most one quantum and goes to the tail.
    Good response time, paid for with more context switches and a longer turnaround.

    PT: Round-robin. Cada processo executa por no máximo um quantum e vai para o fim da fila.
    Bom tempo de resposta, pago com mais trocas de contexto e um tempo de retorno maior.

    ES: Round-robin. Cada proceso se ejecuta como máximo un quantum y va al final de la cola.
    Buen tiempo de respuesta, pagado con más cambios de contexto y un mayor tiempo de retorno.
    """

    def __init__(self, quantum: int) -> None:
        if quantum < 1:
            raise ValueError("quantum must be a positive integer")
        self._quantum = quantum
        self.name = f"RR(q={quantum})"

    def quantum(self, entry: Entry) -> float:
        return self._quantum


class Priority(Policy):
    """EN: Priority scheduling, no preemption. The lowest priority number runs first.
    A low-priority process can starve, which real systems fix with aging.

    PT: Escalonamento por prioridade, sem preempção. O menor número de prioridade executa
    primeiro. Um processo de baixa prioridade pode ficar em inanição, o que sistemas reais
    corrigem com envelhecimento (aging).

    ES: Planificación por prioridad, sin expropiación. El menor número de prioridad se ejecuta
    primero. Un proceso de baja prioridad puede quedar en inanición, algo que los sistemas reales
    corrigen con envejecimiento (aging).
    """

    name = "Priority"

    def select(self, ready: Sequence[Entry]) -> int:
        return _index_of_min(ready, lambda entry: entry.process.priority)


class Mlfq(Policy):
    """EN: Multilevel feedback queue. Everybody starts at level 0 with a short quantum. Using
    the whole quantum moves the process down one level, where the quantum doubles but the turn
    comes only when the levels above are empty. A running process is not interrupted in the
    middle of its quantum by an arrival (same simplification as the TypeScript version).

    PT: Múltiplas filas com realimentação. Todos começam no nível 0, com quantum curto. Usar o
    quantum inteiro faz o processo descer um nível, onde o quantum dobra, mas a vez só chega
    quando os níveis acima estão vazios. O processo em execução não é interrompido no meio do
    quantum por uma chegada (mesma simplificação da versão em TypeScript).

    ES: Múltiples colas con retroalimentación. Todos empiezan en el nivel 0, con un quantum corto.
    Usar todo el quantum hace que el proceso baje un nivel, donde el quantum se duplica, pero el
    turno solo llega cuando los niveles superiores están vacíos. El proceso en ejecución no es
    interrumpido a mitad de su quantum por una llegada (misma simplificación que la versión en
    TypeScript).
    """

    def __init__(self, base_quantum: int, levels: int) -> None:
        if base_quantum < 1 or levels < 1:
            raise ValueError("base_quantum and levels must be positive integers")
        self._base = base_quantum
        self._levels = levels
        self.name = f"MLFQ(q={base_quantum},levels={levels})"

    def select(self, ready: Sequence[Entry]) -> int:
        return _index_of_min(ready, lambda entry: entry.level)

    def quantum(self, entry: Entry) -> float:
        return self._base * 2**entry.level

    def expired(self, entry: Entry) -> None:
        entry.level = min(entry.level + 1, self._levels - 1)


def _validate(processes: Sequence[Process]) -> None:
    seen: set[str] = set()
    for process in processes:
        if process.id in seen:
            raise ValueError(f'duplicate process id "{process.id}"')
        seen.add(process.id)
        if process.arrival < 0:
            raise ValueError(f"{process.id}: arrival must be a non-negative integer")
        if process.burst < 1:
            raise ValueError(f"{process.id}: burst must be a positive integer")


def simulate(processes: Sequence[Process], policy: Policy) -> Schedule:
    _validate(processes)
    # EN: sorted() is stable, so processes that arrive together keep their input order.
    # PT: sorted() é estável, então processos que chegam juntos mantêm a ordem de entrada.
    # ES: sorted() es estable, así los procesos que llegan juntos conservan su orden de entrada.
    everyone = [
        Entry(process, process.burst) for process in sorted(processes, key=lambda p: p.arrival)
    ]
    pending = list(everyone)
    ready: list[Entry] = []
    slices: list[Slice] = []
    time = 0

    def admit() -> None:
        while pending and pending[0].process.arrival <= time:
            ready.append(pending.pop(0))

    while pending or ready:
        admit()
        if not ready:
            # EN: Nobody is ready: the CPU idles until the next arrival.
            # PT: Ninguém está pronto: a CPU fica ociosa até a próxima chegada.
            # ES: Nadie está listo: la CPU queda ociosa hasta la siguiente llegada.
            time = pending[0].process.arrival
            continue
        entry = ready.pop(policy.select(ready))
        run = int(min(entry.remaining, policy.quantum(entry)))
        if entry.first_start is None:
            entry.first_start = time
        entry.dispatches += 1
        if slices and slices[-1].id == entry.process.id and slices[-1].end == time:
            slices[-1].end = time + run
        else:
            slices.append(Slice(entry.process.id, time, time + run))
        time += run
        entry.remaining -= run
        # EN: Arrivals during this run enter the queue BEFORE the process goes back to the tail.
        # PT: As chegadas durante esta execução entram na fila ANTES de o processo voltar ao fim.
        # ES: Las llegadas durante esta ejecución entran en la cola ANTES de que el proceso vuelva
        #     al final.
        admit()
        if entry.remaining == 0:
            entry.finish = time
        else:
            policy.expired(entry)
            ready.append(entry)

    # EN: Turnaround is arrival to completion. Waiting is turnaround minus burst. Response is
    #     arrival to the first time on the CPU.
    # PT: Retorno (turnaround) vai da chegada ao término. Espera é retorno menos tempo de CPU.
    #     Resposta vai da chegada à primeira vez na CPU.
    # ES: El retorno (turnaround) va de la llegada a la finalización. La espera es el retorno menos
    #     el tiempo de CPU. La respuesta va de la llegada a la primera vez en la CPU.
    metrics = [
        Metrics(
            id=entry.process.id,
            waiting=entry.finish - entry.process.arrival - entry.process.burst,
            turnaround=entry.finish - entry.process.arrival,
            response=(entry.first_start or 0) - entry.process.arrival,
            dispatches=entry.dispatches,
        )
        for entry in everyone
    ]
    return Schedule(policy.name, slices, metrics, averages(metrics))


def averages(metrics: Sequence[Metrics]) -> Averages:
    count = max(len(metrics), 1)
    return Averages(
        waiting=sum(m.waiting for m in metrics) / count,
        turnaround=sum(m.turnaround for m in metrics) / count,
        response=sum(m.response for m in metrics) / count,
        max_waiting=max((m.waiting for m in metrics), default=0),
    )


UNIT = 3
IDLE = "-"


def _centre(text: str, width: int) -> str:
    left = max((width - len(text)) // 2, 0)
    return (" " * left + text).ljust(width)


def render_gantt(slices: Sequence[Slice]) -> str:
    """EN: Draws the schedule on a time line, three characters per time unit, idle gaps as "-".

    PT: Desenha a escala em uma linha do tempo, três caracteres por unidade, ociosidade como "-".

    ES: Dibuja la planificación en una línea de tiempo, tres caracteres por unidad, la ociosidad
    como "-".
    """
    bars: list[Slice] = []
    cursor = 0
    for item in slices:
        if item.start > cursor:
            bars.append(Slice(IDLE, cursor, item.start))
        bars.append(item)
        cursor = item.end
    chart = ""
    axis = ""
    for bar in bars:
        chart += "|" + _centre(bar.id, (bar.end - bar.start) * UNIT - 1)
        axis = axis.ljust(bar.start * UNIT) + str(bar.start)
    return chart + "|\n" + axis.ljust(cursor * UNIT) + str(cursor)


class Lcg:
    """EN: Linear congruential generator, identical to the TypeScript one, so both languages
    simulate the same workload.

    PT: Gerador congruente linear, idêntico ao do TypeScript, para que as duas linguagens
    simulem a mesma carga.

    ES: Generador congruencial lineal, idéntico al de TypeScript, para que ambos lenguajes
    simulen la misma carga.
    """

    def __init__(self, seed: int) -> None:
        self._state = seed & 0xFFFFFFFF

    def next(self) -> int:
        self._state = (self._state * 1664525 + 1013904223) & 0xFFFFFFFF
        return self._state >> 16

    def between(self, low: int, high: int) -> int:
        return low + self.next() % (high - low + 1)


WORKLOADS = ("interactive", "cpu-bound", "mixed")
MAX_GAP = {"interactive": 10, "cpu-bound": 90, "mixed": 30}


def generate(kind: str, count: int, seed: int) -> list[Process]:
    random = Lcg(seed)
    processes: list[Process] = []
    arrival = 0
    for index in range(count):
        arrival += random.between(0, MAX_GAP[kind])
        if kind == "interactive":
            burst = random.between(1, 8)
        elif kind == "cpu-bound":
            burst = random.between(20, 60)
        else:
            burst = random.between(1, 6) if random.between(1, 10) <= 8 else random.between(30, 80)
        processes.append(Process(f"P{index + 1}", arrival, burst, random.between(1, 5)))
    return processes
