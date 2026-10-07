"""EN: Pure and slotted ALOHA: the theoretical throughput and a simulation of each.

PT: ALOHA puro e slotted ALOHA: a vazão teórica e uma simulação de cada um.
"""

import math
import random

# EN: Time is measured in frame times: every frame takes exactly 1 unit to transmit. The
#     offered load G is the mean number of transmission attempts per frame time, new frames
#     and retransmissions together. The throughput S is the mean number of frames that get
#     through per frame time, so it is also the fraction of the channel that does useful work.
# PT: O tempo é medido em tempos de quadro: todo quadro leva exatamente 1 unidade para ser
#     transmitido. A carga oferecida G é o número médio de tentativas de transmissão por tempo
#     de quadro, somando quadros novos e retransmissões. A vazão S é o número médio de quadros
#     que passam por tempo de quadro, ou seja, a fração do canal que faz trabalho útil.

PURE_PEAK = 1 / (2 * math.e)
SLOTTED_PEAK = 1 / math.e


def pure_aloha_theory(load: float) -> float:
    """EN: S = G * e^(-2G). A frame survives if nobody else starts in a window of 2 frame times.

    PT: S = G * e^(-2G). Um quadro sobrevive se ninguém mais começa em uma janela de 2 tempos
    de quadro.
    """
    return load * math.exp(-2 * load)


def slotted_aloha_theory(load: float) -> float:
    """EN: S = G * e^(-G). With slots the vulnerable window shrinks to 1 frame time.

    PT: S = G * e^(-G). Com slots a janela vulnerável encolhe para 1 tempo de quadro.
    """
    return load * math.exp(-load)


def simulate_pure_aloha(load: float, frames: int, rng: random.Random) -> float:
    """EN: Simulated throughput of pure ALOHA with `frames` transmission attempts.

    PT: Vazão simulada do ALOHA puro com `frames` tentativas de transmissão.
    """
    # EN: Stations transmit whenever they want, so attempts form a Poisson process: the gaps
    #     between consecutive starts are exponential with mean 1/G.
    # PT: As estações transmitem quando querem, então as tentativas formam um processo de
    #     Poisson: os intervalos entre inícios consecutivos são exponenciais com média 1/G.
    gaps = [rng.expovariate(load) for _ in range(frames + 1)]

    # EN: A frame that starts at t occupies [t, t + 1). It collides with the previous frame if
    #     that one started less than 1 frame time before, and with the next one if it starts
    #     less than 1 frame time after. Both gaps must be at least 1: that is the vulnerable
    #     period of 2 frame times.
    # PT: Um quadro que começa em t ocupa [t, t + 1). Ele colide com o quadro anterior se este
    #     começou menos de 1 tempo de quadro antes, e com o seguinte se ele começa menos de 1
    #     tempo de quadro depois. Os dois intervalos precisam ser de pelo menos 1: esse é o
    #     período vulnerável de 2 tempos de quadro.
    successes = sum(1 for i in range(frames) if gaps[i] >= 1 and gaps[i + 1] >= 1)
    elapsed = sum(gaps[:frames])
    return successes / elapsed


def poisson(mean: float, rng: random.Random) -> int:
    """EN: Number of events of a Poisson process of rate `mean` inside one unit of time.

    PT: Número de eventos de um processo de Poisson de taxa `mean` dentro de uma unidade de
    tempo.
    """
    count = 0
    clock = rng.expovariate(mean)
    while clock < 1:
        count += 1
        clock += rng.expovariate(mean)
    return count


def simulate_slotted_aloha(load: float, slots: int, rng: random.Random) -> float:
    """EN: Simulated throughput of slotted ALOHA over `slots` slots of one frame time each.

    PT: Vazão simulada do slotted ALOHA em `slots` slots de um tempo de quadro cada.
    """
    # EN: A station that wants to transmit waits for the next slot boundary. Frames in the same
    #     slot overlap completely, frames in different slots do not touch. A slot is useful only
    #     when exactly one station picked it.
    # PT: Uma estação que quer transmitir espera o início do próximo slot. Quadros no mesmo slot
    #     se sobrepõem por inteiro, quadros em slots diferentes não se tocam. Um slot só é útil
    #     quando exatamente uma estação o escolheu.
    successes = sum(1 for _ in range(slots) if poisson(load, rng) == 1)
    return successes / slots
