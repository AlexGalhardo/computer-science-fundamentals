"""EN: CSMA/CD with binary exponential backoff, the access method of classic Ethernet.

PT: CSMA/CD com recuo binário exponencial, o método de acesso da Ethernet clássica.
"""

import random
from dataclasses import dataclass

MAX_BACKOFF_EXPONENT = 10
MAX_ATTEMPTS = 16


@dataclass(frozen=True)
class CsmaCdResult:
    throughput: float  # fraction of the time carrying frames that got through
    offered_load: float  # frames generated per frame time, as measured
    delivered: int
    collisions: int
    dropped: int  # frames given up after MAX_ATTEMPTS collisions


def backoff_slots(collisions: int, rng: random.Random) -> int:
    """EN: Slots to wait after the n-th collision in a row of the same frame.

    PT: Slots de espera depois da n-ésima colisão seguida do mesmo quadro.
    """
    # EN: The range doubles with every collision: 0..1, 0..3, 0..7, up to 0..1023. Few
    #     contenders get a short wait, many contenders spread out quickly, and nobody needs to
    #     know how many stations are competing.
    # PT: O intervalo dobra a cada colisão: 0..1, 0..3, 0..7, até 0..1023. Poucos concorrentes
    #     esperam pouco, muitos concorrentes se espalham depressa, e ninguém precisa saber
    #     quantas estações estão disputando.
    return rng.randrange(2 ** min(collisions, MAX_BACKOFF_EXPONENT))


def simulate_csma_cd(
    load: float,
    frames: int,
    rng: random.Random,
    stations: int = 50,
    frame_slots: int = 32,
) -> CsmaCdResult:
    """EN: Simulates about `frames` frame times of a shared cable with `stations` stations.

    PT: Simula cerca de `frames` tempos de quadro de um cabo compartilhado por `stations`
    estações.
    """
    # EN: The clock ticks in contention slots. One slot is a round trip on the cable (2 tau),
    #     the time a station needs to be sure that it has the channel or to notice a
    #     collision. A frame lasts `frame_slots` slots, so a collision wastes one slot while
    #     a success uses many: that ratio is what makes CSMA/CD efficient.
    # PT: O relógio anda em slots de contenção. Um slot é uma ida e volta no cabo (2 tau), o
    #     tempo de que uma estação precisa para ter certeza de que tem o canal ou para perceber
    #     uma colisão. Um quadro dura `frame_slots` slots, então uma colisão desperdiça um slot
    #     enquanto um sucesso usa muitos: essa razão é o que torna o CSMA/CD eficiente.
    horizon = frames * frame_slots
    arrival_rate = load / frame_slots  # new frames per slot, all stations together

    queued = [0] * stations  # frames waiting at each station
    collisions_in_a_row = [0] * stations
    ready_at = [0] * stations  # first slot in which the station may transmit
    backlogged: set[int] = set()

    now = 0
    next_arrival = rng.expovariate(arrival_rate)
    generated = delivered = collisions = dropped = 0

    while now < horizon:
        while next_arrival <= now:
            station = rng.randrange(stations)
            queued[station] += 1
            backlogged.add(station)
            generated += 1
            next_arrival += rng.expovariate(arrival_rate)

        # EN: Carrier sense, 1-persistent: a station with a frame transmits as soon as the
        #     channel is idle and its backoff is over. Stations that became ready while a
        #     frame was on the cable all start together when it ends.
        # PT: Escuta de portadora, 1-persistente: uma estação com quadro transmite assim que o
        #     canal fica livre e o seu recuo terminou. Estações que ficaram prontas enquanto
        #     um quadro estava no cabo começam todas juntas quando ele termina.
        contenders = [s for s in backlogged if ready_at[s] <= now]

        if not contenders:
            # Nothing to do in this slot: jump to the next moment something can happen.
            wake = min((ready_at[s] for s in backlogged), default=horizon)
            now = max(now + 1, min(wake, int(next_arrival) + 1))
            continue

        if len(contenders) == 1:
            # EN: Alone on the channel: after the first slot everybody else hears the carrier
            #     and stays quiet, so the rest of the frame cannot be damaged.
            # PT: Sozinha no canal: depois do primeiro slot todas as outras ouvem a portadora
            #     e ficam em silêncio, então o resto do quadro não pode ser danificado.
            station = contenders[0]
            delivered += 1
            collisions_in_a_row[station] = 0
            now += frame_slots
            ready_at[station] = now
            finish(station, queued, backlogged)
            continue

        # EN: Collision detection: the stations notice the collision within the slot, stop
        #     at once and back off. Only one slot is lost, not a whole frame time as in ALOHA.
        # PT: Detecção de colisão: as estações percebem a colisão dentro do slot, param na
        #     hora e recuam. Só um slot é perdido, não um tempo de quadro inteiro como no ALOHA.
        collisions += 1
        now += 1
        for station in contenders:
            collisions_in_a_row[station] += 1
            if collisions_in_a_row[station] >= MAX_ATTEMPTS:
                dropped += 1
                collisions_in_a_row[station] = 0
                ready_at[station] = now
                finish(station, queued, backlogged)
            else:
                ready_at[station] = now + backoff_slots(collisions_in_a_row[station], rng)

    return CsmaCdResult(
        throughput=delivered * frame_slots / now,
        offered_load=generated * frame_slots / now,
        delivered=delivered,
        collisions=collisions,
        dropped=dropped,
    )


def finish(station: int, queued: list[int], backlogged: set[int]) -> None:
    """EN: Removes the frame at the head of the queue of `station`.

    PT: Remove o quadro que está na frente da fila de `station`.
    """
    queued[station] -= 1
    if queued[station] == 0:
        backlogged.discard(station)
