"""EN: The network of MP-AI-2 (2 inputs, two hidden layers of 8 neurons with tanh, 1 output)
described with Keras, and the dataset as arrays.

PT: A rede do MP-AI-2 (2 entradas, duas camadas ocultas de 8 neurônios com tanh, 1 saída)
descrita com o Keras, e o conjunto de dados como arranjos.
"""

import keras
import numpy as np
import tensorflow as tf

from data import Point

SEED = 7
EPOCHS = 120
LEARNING_RATE = 0.5
THREADS = 2

# EN: A network this small gains nothing from more cores, and the machine is shared. TensorFlow
#     accepts this setting only before it runs its first operation, so it is done here, when the
#     module is imported.
# PT: Uma rede tão pequena não ganha nada com mais núcleos, e a máquina é compartilhada. O
#     TensorFlow só aceita esse ajuste antes de executar a sua primeira operação, então ele é
#     feito aqui, quando o módulo é importado.
tf.config.threading.set_intra_op_parallelism_threads(THREADS)
tf.config.threading.set_inter_op_parallelism_threads(THREADS)


def build_model() -> keras.Sequential:
    """EN: The model 2-8-8-1 as a list of layers. PT: O modelo 2-8-8-1 como uma lista de camadas."""

    # EN: The starting rule of MP-AI-2: weights drawn uniformly from (-1, 1). The biases start at
    #     zero, which is already what `Dense` does. Each layer needs its own initialiser object.
    # PT: A regra inicial do MP-AI-2: pesos sorteados uniformemente em (-1, 1). Os vieses
    #     começam em zero, que já é o que o `Dense` faz. Cada camada precisa do seu próprio
    #     objeto inicializador.
    def start() -> keras.initializers.Initializer:
        return keras.initializers.RandomUniform(minval=-1.0, maxval=1.0)

    # EN: `Dense(8)` is a fully connected layer of 8 neurons, the `nn.Linear` of PyTorch. Only
    #     the number of outputs is given: the number of inputs is discovered from the layer
    #     before, starting at `Input(shape=(2,))`. The activation is an argument of the layer.
    #     The last layer has no activation, so the model outputs a logit, as in MP-AI-2 and in
    #     the PyTorch version. The loss is told so with `from_logits=True`.
    # PT: `Dense(8)` é uma camada totalmente conectada de 8 neurônios, o `nn.Linear` do PyTorch.
    #     Só o número de saídas é informado: o número de entradas é descoberto pela camada
    #     anterior, começando em `Input(shape=(2,))`. A ativação é um argumento da camada. A
    #     última camada não tem ativação, então o modelo devolve um logit, como no MP-AI-2 e na
    #     versão em PyTorch. A perda fica sabendo disso com `from_logits=True`.
    return keras.Sequential(
        [
            keras.Input(shape=(2,)),
            keras.layers.Dense(8, activation="tanh", kernel_initializer=start()),
            keras.layers.Dense(8, activation="tanh", kernel_initializer=start()),
            keras.layers.Dense(1, kernel_initializer=start()),
        ]
    )


def make_loss() -> keras.losses.Loss:
    # EN: Binary cross-entropy computed from the logit: log(1 + e^(-s z)), the loss written by
    #     hand in MP-AI-2 and `BCEWithLogitsLoss` in PyTorch. The other common spelling, a last
    #     layer with `activation="sigmoid"` and the loss `"binary_crossentropy"`, is the same
    #     model: the sigmoid only moves from inside the loss to the last layer. The logit form
    #     is numerically safer, because sigmoid and logarithm are computed in one formula.
    # PT: Entropia cruzada binária calculada a partir do logit: log(1 + e^(-s z)), a perda
    #     escrita à mão no MP-AI-2 e a `BCEWithLogitsLoss` no PyTorch. A outra forma comum, uma
    #     última camada com `activation="sigmoid"` e a perda `"binary_crossentropy"`, é o mesmo
    #     modelo: a sigmoide só sai de dentro da perda e vai para a última camada. A forma com
    #     logit é numericamente mais segura, porque sigmoide e logaritmo são calculados em uma
    #     fórmula só.
    return keras.losses.BinaryCrossentropy(from_logits=True)


def as_arrays(points: list[Point], labels: list[int]) -> tuple[np.ndarray, np.ndarray]:
    # EN: Inputs of shape (N, 2) and targets of shape (N, 1), as 32-bit floats: one row per
    #     point, and the targets with the same shape as the output of the model.
    # PT: Entradas de formato (N, 2) e alvos de formato (N, 1), como floats de 32 bits: uma
    #     linha por ponto, e os alvos com o mesmo formato da saída do modelo.
    inputs = np.array(points, dtype="float32")
    targets = np.array(labels, dtype="float32").reshape(-1, 1)
    return inputs, targets


def accuracy(model: keras.Model, inputs: np.ndarray, targets: np.ndarray) -> float:
    # EN: Counted by hand, with no Keras metric: the answer is class 1 when the logit is
    #     positive, because sigmoid(z) > 0.5 exactly when z > 0. `training=False` is the
    #     `model.eval()` of PyTorch.
    # PT: Contada à mão, sem métrica do Keras: a resposta é a classe 1 quando o logit é
    #     positivo, porque sigmoid(z) > 0,5 exatamente quando z > 0. `training=False` é o
    #     `model.eval()` do PyTorch.
    logits = model(inputs, training=False).numpy()
    return float(((logits > 0.0) == (targets > 0.5)).mean())
