"""EN: A neuron, a layer and a multi-layer perceptron (MLP), built on `engine.Value`.

PT: Um neurônio, uma camada e um perceptron multicamadas (MLP), construídos sobre `engine.Value`.

ES: Una neurona, una capa y un perceptrón multicapa (MLP), construidos sobre `engine.Value`.
"""

import random

from scratch.engine import Value


class Neuron:
    """EN: weighted sum of the inputs + bias, then an activation function.

    PT: soma ponderada das entradas + viés, depois uma função de ativação.

    ES: suma ponderada de las entradas + sesgo, luego una función de activación.
    """

    def __init__(self, inputs: int, activation: str, rng: random.Random) -> None:
        # EN: Weights start as small random numbers. If they all started equal, every neuron
        #     of a layer would compute the same thing, receive the same gradient and stay equal
        #     forever. Randomness breaks that symmetry.
        # PT: Os pesos começam como números aleatórios pequenos. Se todos começassem iguais,
        #     todos os neurônios de uma camada calculariam a mesma coisa, receberiam o mesmo
        #     gradiente e ficariam iguais para sempre. A aleatoriedade quebra essa simetria.
        # ES: Los pesos empiezan como números aleatorios pequeños. Si todos empezaran iguales, todas
        #     las neuronas de una capa calcularían lo mismo, recibirían el mismo gradiente y
        #     quedarían iguales para siempre. La aleatoriedad rompe esa simetría.
        self.weights = [Value(rng.uniform(-1.0, 1.0)) for _ in range(inputs)]
        self.bias = Value(0.0)
        self.activation = activation

    def __call__(self, inputs: list[Value]) -> Value:
        total = self.bias
        for weight, value in zip(self.weights, inputs, strict=True):
            total = total + weight * value
        if self.activation == "tanh":
            return total.tanh()
        if self.activation == "relu":
            return total.relu()
        if self.activation == "sigmoid":
            return total.sigmoid()
        # EN: "linear" means no activation: the output layer returns a raw score (a logit).
        # PT: "linear" significa sem ativação: a camada de saída devolve uma nota crua (logit).
        # ES: "linear" significa sin activación: la capa de salida devuelve una puntuación cruda
        #     (logit).
        return total

    def parameters(self) -> list[Value]:
        return [*self.weights, self.bias]


class Layer:
    """EN: Several neurons that receive the same inputs.

    PT: Vários neurônios que recebem as mesmas entradas.

    ES: Varias neuronas que reciben las mismas entradas.
    """

    def __init__(self, inputs: int, outputs: int, activation: str, rng: random.Random) -> None:
        self.neurons = [Neuron(inputs, activation, rng) for _ in range(outputs)]

    def __call__(self, inputs: list[Value]) -> list[Value]:
        return [neuron(inputs) for neuron in self.neurons]

    def parameters(self) -> list[Value]:
        return [parameter for neuron in self.neurons for parameter in neuron.parameters()]


class MLP:
    """EN: Layers in a row: the outputs of one are the inputs of the next.

    `MLP(2, [8, 8, 1])` has 2 inputs, two hidden layers of 8 neurons and 1 output. The hidden
    layers use the given activation. The last layer is linear, so the network outputs a logit.

    PT: Camadas em sequência: as saídas de uma são as entradas da seguinte.

    `MLP(2, [8, 8, 1])` tem 2 entradas, duas camadas ocultas de 8 neurônios e 1 saída. As camadas
    ocultas usam a ativação dada. A última camada é linear, então a rede devolve um logit.

    ES: Capas en secuencia: las salidas de una son las entradas de la siguiente.

    `MLP(2, [8, 8, 1])` tiene 2 entradas, dos capas ocultas de 8 neuronas y 1 salida. Las capas
    ocultas usan la activación dada. La última capa es lineal, así que la red devuelve un logit.
    """

    def __init__(self, inputs: int, sizes: list[int], seed: int, activation: str = "tanh") -> None:
        rng = random.Random(seed)
        widths = [inputs, *sizes]
        self.layers = [
            Layer(widths[i], widths[i + 1], activation if i < len(sizes) - 1 else "linear", rng)
            for i in range(len(sizes))
        ]

    def __call__(self, inputs: list[float]) -> Value:
        values = [Value(value) for value in inputs]
        for layer in self.layers:
            values = layer(values)
        return values[0]

    def parameters(self) -> list[Value]:
        return [parameter for layer in self.layers for parameter in layer.parameters()]

    def zero_grad(self) -> None:
        # EN: Gradients accumulate with `+=`, so they must be cleared before each new
        #     backward pass. Forgetting this is the classic bug of a training loop.
        # PT: Os gradientes se acumulam com `+=`, então precisam ser zerados antes de cada
        #     nova retropropagação. Esquecer isso é o bug clássico de um laço de treinamento.
        # ES: Los gradientes se acumulan con `+=`, así que hay que ponerlos a cero antes de cada
        #     nueva retropropagación. Olvidarlo es el bug clásico de un bucle de entrenamiento.
        for parameter in self.parameters():
            parameter.grad = 0.0
