"""EN: The network of MP-AI-2 (2 inputs, two hidden layers of 8 neurons with tanh, 1 output)
written as a PyTorch module.

PT: A rede do MP-AI-2 (2 entradas, duas camadas ocultas de 8 neurônios com tanh, 1 saída)
escrita como um módulo do PyTorch.
"""

import torch
from torch import nn


class MoonsNet(nn.Module):
    """EN: A multi-layer perceptron 2-8-8-1. PT: Um perceptron multicamadas 2-8-8-1."""

    def __init__(self) -> None:
        super().__init__()
        # EN: `nn.Linear(2, 8)` is a whole layer of 8 neurons in one object. It owns a weight
        #     matrix of shape (8, 2), one row per neuron, and a bias vector of shape (8,). In
        #     the from-scratch version this was a list of 8 `Neuron` objects, each with a list
        #     of weights. Assigning a layer to `self` registers it: that is how
        #     `model.parameters()` later finds every weight without being told.
        # PT: `nn.Linear(2, 8)` é uma camada inteira de 8 neurônios em um só objeto. Ela é dona
        #     de uma matriz de pesos de formato (8, 2), uma linha por neurônio, e de um vetor de
        #     vieses de formato (8,). Na versão feita à mão isso era uma lista de 8 objetos
        #     `Neuron`, cada um com uma lista de pesos. Atribuir uma camada a `self` a registra:
        #     é assim que `model.parameters()` depois encontra todos os pesos sem ser avisado.
        self.hidden1 = nn.Linear(2, 8)
        self.hidden2 = nn.Linear(8, 8)
        self.output = nn.Linear(8, 1)

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        # EN: `inputs` holds the whole batch at once, shape (N, 2): N points, 2 numbers each.
        #     A linear layer computes `inputs @ weight.T + bias` for all N points in a single
        #     matrix product, so the shapes go (N, 2) -> (N, 8) -> (N, 8) -> (N, 1). There is no
        #     Python loop over the points and none over the neurons.
        # PT: `inputs` guarda o lote inteiro de uma vez, formato (N, 2): N pontos, 2 números
        #     cada. Uma camada linear calcula `inputs @ weight.T + bias` para os N pontos em um
        #     único produto de matrizes, então os formatos vão de (N, 2) -> (N, 8) -> (N, 8) ->
        #     (N, 1). Não há laço de Python sobre os pontos nem sobre os neurônios.
        hidden = torch.tanh(self.hidden1(inputs))
        hidden = torch.tanh(self.hidden2(hidden))
        # EN: No activation at the end: the output is a logit, exactly as in MP-AI-2. The loss
        #     function applies the sigmoid itself.
        # PT: Sem ativação no fim: a saída é um logit, exatamente como no MP-AI-2. A função de
        #     perda aplica a sigmoide por conta própria.
        return self.output(hidden)


def start_like_scratch(model: MoonsNet) -> None:
    """EN: Replaces the starting weights by the rule of MP-AI-2: weights drawn uniformly from
    (-1, 1) and biases at zero.

    `nn.Linear` already starts with random weights, but smaller ones (between -1/sqrt(inputs)
    and 1/sqrt(inputs)), a choice made for deep networks. With them this small network also
    learns the dataset, only more slowly, and the demo shows it. To redo MP-AI-2 the same rule
    is used here. The numbers drawn are not the same ones (PyTorch has its own random generator),
    only the rule is.

    PT: Troca os pesos iniciais pela regra do MP-AI-2: pesos sorteados uniformemente em (-1, 1)
    e vieses em zero.

    O `nn.Linear` já começa com pesos aleatórios, mas menores (entre -1/raiz(entradas) e
    1/raiz(entradas)), uma escolha feita para redes profundas. Com eles esta rede pequena também
    aprende o conjunto de dados, só que mais devagar, e a demo mostra isso. Para refazer o
    MP-AI-2 a mesma regra é usada aqui. Os números sorteados não são os mesmos (o PyTorch tem o
    seu próprio gerador aleatório), só a regra é.
    """
    with torch.no_grad():
        for layer in (model.hidden1, model.hidden2, model.output):
            nn.init.uniform_(layer.weight, -1.0, 1.0)
            nn.init.zeros_(layer.bias)


def count_parameters(model: nn.Module) -> int:
    return sum(parameter.numel() for parameter in model.parameters())
