"""EN: The two datasets of the mini-project, generated here with a fixed seed.

PT: Os dois conjuntos de dados do mini-projeto, gerados aqui com uma semente fixa.
"""

import math
import random

Point = tuple[float, float]

# EN: XOR, "one or the other but not both". No straight line separates the two classes, so a
#     single neuron cannot learn it: it is the smallest problem that needs a hidden layer.
# PT: XOR, "um ou outro, mas não os dois". Nenhuma linha reta separa as duas classes, então um
#     único neurônio não consegue aprendê-lo: é o menor problema que precisa de camada oculta.
XOR_POINTS: list[Point] = [(0.0, 0.0), (0.0, 1.0), (1.0, 0.0), (1.0, 1.0)]
XOR_LABELS: list[int] = [0, 1, 1, 0]


def two_moons(count: int, noise: float, seed: int) -> tuple[list[Point], list[int]]:
    """EN: Two interleaved half circles, one per class, with Gaussian noise on every point.

    The classes cannot be separated by a line, but a curved boundary separates them well.

    PT: Dois semicírculos entrelaçados, um por classe, com ruído gaussiano em cada ponto.

    As classes não podem ser separadas por uma linha, mas uma fronteira curva as separa bem.
    """
    rng = random.Random(seed)
    points: list[Point] = []
    labels: list[int] = []
    for index in range(count):
        label = index % 2
        angle = rng.uniform(0.0, math.pi)
        if label == 0:
            x, y = math.cos(angle), math.sin(angle)
        else:
            x, y = 1.0 - math.cos(angle), 0.5 - math.sin(angle)
        points.append((x + rng.gauss(0.0, noise), y + rng.gauss(0.0, noise)))
        labels.append(label)
    return points, labels


# EN: The model is fitted on the training set and measured on the test set, which it never
#     sees while learning. Only the test accuracy says whether it generalises.
# PT: O modelo é ajustado no conjunto de treino e medido no conjunto de teste, que ele nunca vê
#     enquanto aprende. Só a acurácia de teste diz se ele generaliza.
MOONS_NOISE = 0.12
TRAIN_SIZE = 80
TEST_SIZE = 200
TRAIN_SEED = 20261007
TEST_SEED = 20261008


def moons_train() -> tuple[list[Point], list[int]]:
    return two_moons(TRAIN_SIZE, MOONS_NOISE, TRAIN_SEED)


def moons_test() -> tuple[list[Point], list[int]]:
    return two_moons(TEST_SIZE, MOONS_NOISE, TEST_SEED)
