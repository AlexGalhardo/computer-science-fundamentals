"""EN: The same network, three ways of getting its gradients: the hand-written backpropagation of
MP-AI-2, PyTorch's `backward()`, and the numerical gradient. If the three agree, the framework is
doing what was written by hand.

PT: A mesma rede, três formas de obter os seus gradientes: a retropropagação escrita à mão do
MP-AI-2, o `backward()` do PyTorch e o gradiente numérico. Se as três concordam, o framework está
fazendo o que foi escrito à mão.
"""

from dataclasses import dataclass

import torch
from torch import nn

from model import MoonsNet
from scratch.data import Point, moons_train
from scratch.nn import MLP
from scratch.train import MOONS_SEED, mean_loss
from train import THREADS, as_tensors

STEP = 1e-6


def copy_scratch_weights(scratch: MLP) -> MoonsNet:
    """EN: A PyTorch network with exactly the weights of a from-scratch network.

    PT: Uma rede do PyTorch com exatamente os pesos de uma rede feita à mão.
    """
    # EN: Python floats have 64 bits and PyTorch uses 32 bits by default. `.double()` turns
    #     the parameters into 64-bit floats, so both networks compute with the same precision
    #     and the comparison can be tight.
    # PT: Os floats do Python têm 64 bits e o PyTorch usa 32 bits por padrão. O `.double()`
    #     transforma os parâmetros em floats de 64 bits, então as duas redes calculam com a
    #     mesma precisão e a comparação pode ser apertada.
    model = MoonsNet().double()
    linears = [model.hidden1, model.hidden2, model.output]
    # EN: Writing into a parameter is not part of the computation, so it is done under
    #     `no_grad`. Row i of the weight matrix is neuron i of the from-scratch layer.
    # PT: Escrever em um parâmetro não faz parte do cálculo, então é feito sob `no_grad`. A
    #     linha i da matriz de pesos é o neurônio i da camada feita à mão.
    with torch.no_grad():
        for linear, layer in zip(linears, scratch.layers, strict=True):
            weights = [[weight.data for weight in neuron.weights] for neuron in layer.neurons]
            biases = [neuron.bias.data for neuron in layer.neurons]
            linear.weight.copy_(torch.tensor(weights, dtype=torch.float64))
            linear.bias.copy_(torch.tensor(biases, dtype=torch.float64))
    return model


def flatten(pairs: list[tuple[torch.Tensor, torch.Tensor]]) -> list[float]:
    """EN: (weight, bias) tensors of each layer as one list, in the order MP-AI-2 uses: layer by
    layer, neuron by neuron, the weights of the neuron and then its bias.

    PT: Os tensores (peso, viés) de cada camada como uma lista só, na ordem que o MP-AI-2 usa:
    camada por camada, neurônio por neurônio, os pesos do neurônio e depois o seu viés.
    """
    values: list[float] = []
    for weight, bias in pairs:
        for row, single in zip(weight.tolist(), bias.tolist(), strict=True):
            values += [*row, single]
    return values


def _linears(model: MoonsNet) -> list[nn.Linear]:
    return [model.hidden1, model.hidden2, model.output]


def scratch_gradients(
    scratch: MLP, points: list[Point], labels: list[int]
) -> tuple[float, list[float]]:
    loss = mean_loss(scratch, points, labels)
    scratch.zero_grad()
    loss.backward()
    return loss.data, [parameter.grad for parameter in scratch.parameters()]


def torch_gradients(
    model: MoonsNet, inputs: torch.Tensor, targets: torch.Tensor
) -> tuple[float, list[float]]:
    loss = nn.BCEWithLogitsLoss()(model(inputs), targets)
    model.zero_grad()
    loss.backward()
    return loss.item(), flatten([(layer.weight.grad, layer.bias.grad) for layer in _linears(model)])


def numerical_gradients(
    model: MoonsNet, inputs: torch.Tensor, targets: torch.Tensor
) -> list[float]:
    """EN: Centred differences, (L(w + h) - L(w - h)) / 2h, one parameter at a time.

    It uses no calculus at all, only the definition of a slope: nudge one weight, see how the
    loss moves. It is slow (two forward passes per parameter) and slightly imprecise, so it is
    never used for training, only to check the other two.

    PT: Diferenças centradas, (L(w + h) - L(w - h)) / 2h, um parâmetro de cada vez.

    Não usa cálculo nenhum, só a definição de inclinação: mexe um peso e vê como a perda se move.
    É lento (duas passadas de ida por parâmetro) e um pouco impreciso, então nunca é usado para
    treinar, só para conferir os outros dois.
    """
    loss_fn = nn.BCEWithLogitsLoss()
    pairs: list[tuple[torch.Tensor, torch.Tensor]] = []
    with torch.no_grad():
        for layer in _linears(model):
            slopes = []
            for parameter in (layer.weight, layer.bias):
                slope = torch.zeros_like(parameter)
                # EN: `view(-1)` sees the same memory as a flat list, so writing to it changes
                #     the parameter itself.
                # PT: `view(-1)` enxerga a mesma memória como uma lista plana, então escrever
                #     nela muda o próprio parâmetro.
                flat, flat_slope = parameter.view(-1), slope.view(-1)
                for index in range(flat.numel()):
                    original = flat[index].item()
                    flat[index] = original + STEP
                    up = loss_fn(model(inputs), targets).item()
                    flat[index] = original - STEP
                    down = loss_fn(model(inputs), targets).item()
                    flat[index] = original
                    flat_slope[index] = (up - down) / (2 * STEP)
                slopes.append(slope)
            pairs.append((slopes[0], slopes[1]))
    return flatten(pairs)


def largest_gap(left: list[float], right: list[float]) -> float:
    return max(abs(a - b) for a, b in zip(left, right, strict=True))


@dataclass
class GradientCheck:
    """EN: The three gradients of one network. PT: Os três gradientes de uma mesma rede."""

    points: int
    scratch_loss: float
    torch_loss: float
    scratch: list[float]
    torch: list[float]
    numerical: list[float]


def check_gradients(seed: int = MOONS_SEED) -> GradientCheck:
    """EN: Builds the 2-8-8-1 network of MP-AI-2 with the given seed, copies it into PyTorch
    and computes the gradient of the loss on the 80 training points in the three ways.

    PT: Constrói a rede 2-8-8-1 do MP-AI-2 com a semente dada, copia-a para o PyTorch e calcula
    o gradiente da perda nos 80 pontos de treino das três formas.
    """
    torch.set_num_threads(THREADS)
    points, labels = moons_train()
    scratch = MLP(2, [8, 8, 1], seed=seed)
    model = copy_scratch_weights(scratch)
    inputs, targets = as_tensors(points, labels, dtype=torch.float64)
    scratch_loss, by_hand = scratch_gradients(scratch, points, labels)
    torch_loss, by_torch = torch_gradients(model, inputs, targets)
    return GradientCheck(
        points=len(points),
        scratch_loss=scratch_loss,
        torch_loss=torch_loss,
        scratch=by_hand,
        torch=by_torch,
        numerical=numerical_gradients(model, inputs, targets),
    )
