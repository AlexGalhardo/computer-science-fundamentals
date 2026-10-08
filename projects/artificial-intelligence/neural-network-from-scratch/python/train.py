"""EN: The loss, the training loop (gradient descent) and the accuracy.

PT: A perda, o laço de treinamento (descida do gradiente) e a acurácia.
"""

import math
from dataclasses import dataclass

from data import XOR_LABELS, XOR_POINTS, Point, moons_test, moons_train
from engine import Value
from nn import MLP


def binary_cross_entropy(logit: Value, label: int) -> Value:
    """EN: The loss of one example: -log of the probability given to the right class.

    The network outputs a logit z. The probability of class 1 is sigmoid(z), so the probability
    of the right class is sigmoid(s * z), with s = +1 for class 1 and s = -1 for class 0. Its
    negative logarithm is log(1 + e^(-s z)): near 0 when the network is right and confident,
    large when it is wrong and confident.

    PT: A perda de um exemplo: -log da probabilidade dada à classe certa.

    A rede devolve um logit z. A probabilidade da classe 1 é sigmoid(z), então a probabilidade da
    classe certa é sigmoid(s * z), com s = +1 para a classe 1 e s = -1 para a classe 0. O negativo
    do seu logaritmo é log(1 + e^(-s z)): perto de 0 quando a rede acerta com confiança, grande
    quando erra com confiança.
    """
    sign = 1.0 if label == 1 else -1.0
    return ((logit * -sign).exp() + 1.0).log()


def mean_loss(model: MLP, points: list[Point], labels: list[int]) -> Value:
    total = Value(0.0)
    for point, label in zip(points, labels, strict=True):
        total = total + binary_cross_entropy(model(list(point)), label)
    return total / len(points)


def predict(model: MLP, point: Point) -> int:
    # EN: sigmoid(z) > 0.5 exactly when z > 0, so the sign of the logit is the decision.
    # PT: sigmoid(z) > 0,5 exatamente quando z > 0, então o sinal do logit é a decisão.
    return 1 if model(list(point)).data > 0.0 else 0


def probability(model: MLP, point: Point) -> float:
    return 1.0 / (1.0 + math.exp(-model(list(point)).data))


def accuracy(model: MLP, points: list[Point], labels: list[int]) -> float:
    hits = sum(predict(model, point) == label for point, label in zip(points, labels, strict=True))
    return hits / len(points)


def fit(
    model: MLP, points: list[Point], labels: list[int], epochs: int, learning_rate: float
) -> list[float]:
    """EN: Full-batch gradient descent. Returns the loss of every epoch.

    One epoch is the four steps of every training loop ever written:
    1. forward: compute the loss with the current weights;
    2. clear the old gradients;
    3. backward: backpropagation fills the gradient of every weight;
    4. update: move each weight a small step AGAINST its gradient.

    PT: Descida do gradiente com o lote inteiro. Devolve a perda de cada época.

    Uma época são os quatro passos de todo laço de treinamento já escrito:
    1. ida: calcula a perda com os pesos atuais;
    2. zera os gradientes antigos;
    3. volta: a retropropagação preenche o gradiente de cada peso;
    4. atualização: move cada peso um pequeno passo CONTRA o seu gradiente.
    """
    history: list[float] = []
    for _ in range(epochs):
        loss = mean_loss(model, points, labels)
        model.zero_grad()
        loss.backward()
        for parameter in model.parameters():
            parameter.data -= learning_rate * parameter.grad
        history.append(loss.data)
    return history


@dataclass
class Run:
    """EN: A trained model with its loss per epoch. PT: Um modelo treinado e a perda por época."""

    model: MLP
    losses: list[float]


XOR_SEED = 7
XOR_EPOCHS = 300
XOR_LEARNING_RATE = 0.5
MOONS_SEED = 7
MOONS_EPOCHS = 120
MOONS_LEARNING_RATE = 0.5


def train_xor() -> Run:
    model = MLP(2, [4, 1], seed=XOR_SEED)
    return Run(model, fit(model, XOR_POINTS, XOR_LABELS, XOR_EPOCHS, XOR_LEARNING_RATE))


def train_moons() -> Run:
    model = MLP(2, [8, 8, 1], seed=MOONS_SEED)
    points, labels = moons_train()
    return Run(model, fit(model, points, labels, MOONS_EPOCHS, MOONS_LEARNING_RATE))


def moons_accuracies(model: MLP) -> tuple[float, float]:
    return accuracy(model, *moons_train()), accuracy(model, *moons_test())
