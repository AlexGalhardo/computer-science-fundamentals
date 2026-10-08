"""EN: The training loop written by hand with PyTorch: forward, loss, clear, backward, step.

PT: O laço de treinamento escrito à mão com PyTorch: ida, perda, limpeza, volta, passo.
"""

from dataclasses import dataclass

import torch
from torch import nn

from model import MoonsNet, start_like_scratch
from scratch.data import Point, moons_test, moons_train

SEED = 7
EPOCHS = 120
LEARNING_RATE = 0.5
THREADS = 2


def prepare(seed: int) -> None:
    # EN: Two sources of variation are fixed before anything else. The seed decides the random
    #     starting weights, so the same seed gives the same network. The number of threads is
    #     limited because a network this small gains nothing from more cores, and the machine
    #     is shared.
    # PT: Duas fontes de variação são fixadas antes de qualquer coisa. A semente decide os pesos
    #     iniciais aleatórios, então a mesma semente dá a mesma rede. O número de threads é
    #     limitado porque uma rede tão pequena não ganha nada com mais núcleos, e a máquina é
    #     compartilhada.
    torch.set_num_threads(THREADS)
    torch.manual_seed(seed)


def as_tensors(
    points: list[Point], labels: list[int], dtype: torch.dtype = torch.float32
) -> tuple[torch.Tensor, torch.Tensor]:
    # EN: The dataset becomes two tensors: the inputs, shape (N, 2), and the targets, shape
    #     (N, 1), as floats 0.0 and 1.0. The targets get the same shape as the output of the
    #     network, one column, so that the loss compares them position by position.
    # PT: O conjunto de dados vira dois tensores: as entradas, formato (N, 2), e os alvos,
    #     formato (N, 1), como floats 0.0 e 1.0. Os alvos recebem o mesmo formato da saída da
    #     rede, uma coluna, para que a perda os compare posição por posição.
    inputs = torch.tensor(points, dtype=dtype)
    targets = torch.tensor(labels, dtype=dtype).reshape(-1, 1)
    return inputs, targets


def fit(
    model: nn.Module,
    inputs: torch.Tensor,
    targets: torch.Tensor,
    epochs: int,
    learning_rate: float,
) -> list[float]:
    """EN: Full-batch gradient descent. Returns the loss of every epoch.

    PT: Descida do gradiente com o lote inteiro. Devolve a perda de cada época.
    """
    # EN: `BCEWithLogitsLoss` is the loss of MP-AI-2 under another name. For a logit z and a
    #     label y it computes -[y log(sigmoid(z)) + (1 - y) log(1 - sigmoid(z))], which is
    #     log(1 + e^(-z)) when y = 1 and log(1 + e^z) when y = 0: the same log(1 + e^(-s z))
    #     written there by hand, averaged over the batch. It takes the logit and not the
    #     probability because joining sigmoid and logarithm in one formula avoids log(0).
    # PT: `BCEWithLogitsLoss` é a perda do MP-AI-2 com outro nome. Para um logit z e um rótulo
    #     y ela calcula -[y log(sigmoid(z)) + (1 - y) log(1 - sigmoid(z))], que é
    #     log(1 + e^(-z)) quando y = 1 e log(1 + e^z) quando y = 0: o mesmo log(1 + e^(-s z))
    #     escrito lá à mão, na média do lote. Ela recebe o logit e não a probabilidade porque
    #     juntar sigmoide e logaritmo em uma fórmula só evita log(0).
    loss_fn = nn.BCEWithLogitsLoss()
    # EN: The optimiser receives the parameters once and from then on applies the update
    #     rule to all of them. Plain SGD is `w = w - lr * grad`, the loop written by hand in
    #     MP-AI-2. All the points are used at every step (full batch), as there.
    # PT: O otimizador recebe os parâmetros uma vez e daí em diante aplica a regra de
    #     atualização a todos eles. O SGD puro é `w = w - lr * grad`, o laço escrito à mão no
    #     MP-AI-2. Todos os pontos são usados a cada passo (lote inteiro), como lá.
    optimizer = torch.optim.SGD(model.parameters(), lr=learning_rate)
    model.train()
    history: list[float] = []
    for _ in range(epochs):
        # EN: The five steps. Nothing here is hidden by the framework: remove any line and
        #     the network stops learning. Without `zero_grad` the gradients of all the past
        #     epochs would pile up in `.grad`, because `backward` adds instead of replacing.
        # PT: Os cinco passos. Nada aqui é escondido pelo framework: tire qualquer linha e a
        #     rede para de aprender. Sem o `zero_grad` os gradientes de todas as épocas
        #     passadas se acumulariam em `.grad`, porque o `backward` soma em vez de
        #     substituir.
        logits = model(inputs)  # 1. forward / ida
        loss = loss_fn(logits, targets)  # 2. loss / perda
        optimizer.zero_grad()  # 3. clear the old gradients / zera os gradientes antigos
        loss.backward()  # 4. backward / volta (retropropagação)
        optimizer.step()  # 5. update every parameter / atualiza cada parâmetro
        history.append(loss.item())
    return history


def accuracy(model: nn.Module, inputs: torch.Tensor, targets: torch.Tensor) -> float:
    # EN: Two switches for measuring, often confused. `model.eval()` tells the layers they are
    #     not training (it matters for layers such as dropout, and this network has none, but
    #     the habit is right). `torch.no_grad()` stops recording operations: no graph is built,
    #     which saves memory and time, and the numbers are the same.
    # PT: Dois interruptores para medir, muito confundidos. `model.eval()` avisa às camadas que
    #     não estão treinando (importa para camadas como dropout, e esta rede não tem nenhuma,
    #     mas o hábito é certo). `torch.no_grad()` para de registrar as operações: nenhum grafo
    #     é construído, o que economiza memória e tempo, e os números são os mesmos.
    model.eval()
    with torch.no_grad():
        # EN: sigmoid(z) > 0.5 exactly when z > 0, so the sign of the logit is the answer.
        # PT: sigmoid(z) > 0,5 exatamente quando z > 0, então o sinal do logit é a resposta.
        predictions = model(inputs) > 0.0
    hits = (predictions == (targets > 0.5)).sum().item()
    return hits / len(targets)


@dataclass
class Run:
    """EN: A trained model with its loss per epoch. PT: Um modelo treinado e a perda por época."""

    model: nn.Module
    losses: list[float]


def train_moons(seed: int = SEED, epochs: int = EPOCHS, default_start: bool = False) -> Run:
    """EN: The run of the acceptance criterion: seed 7, the starting rule of MP-AI-2, 120 epochs
    with learning rate 0.5. `default_start=True` keeps the weights `nn.Linear` starts with.

    PT: A execução do critério de aceite: semente 7, a regra inicial do MP-AI-2, 120 épocas com
    taxa de aprendizado 0,5. `default_start=True` mantém os pesos com que o `nn.Linear` começa.
    """
    prepare(seed)
    model = MoonsNet()
    if not default_start:
        start_like_scratch(model)
    inputs, targets = as_tensors(*moons_train())
    return Run(model, fit(model, inputs, targets, epochs, LEARNING_RATE))


def moons_accuracies(model: nn.Module) -> tuple[float, float]:
    dtype = next(model.parameters()).dtype
    train = accuracy(model, *as_tensors(*moons_train(), dtype=dtype))
    test = accuracy(model, *as_tensors(*moons_test(), dtype=dtype))
    return train, test
