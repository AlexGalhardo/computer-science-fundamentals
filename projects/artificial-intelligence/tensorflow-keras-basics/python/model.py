"""EN: The network of MP-AI-2 (2 inputs, two hidden layers of 8 neurons with tanh, 1 output)
described with Keras, and the dataset as arrays.

PT: A rede do MP-AI-2 (2 entradas, duas camadas ocultas de 8 neurônios com tanh, 1 saída)
descrita com o Keras, e o conjunto de dados como arranjos.

ES: La red de MP-AI-2 (2 entradas, dos capas ocultas de 8 neuronas con tanh, 1 salida) descrita
con Keras, y el conjunto de datos como arreglos.
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
# ES: Una red tan pequeña no gana nada con más núcleos, y la máquina es compartida. TensorFlow solo
#     acepta este ajuste antes de ejecutar su primera operación, así que se hace aquí, cuando se
#     importa el módulo.
tf.config.threading.set_intra_op_parallelism_threads(THREADS)
tf.config.threading.set_inter_op_parallelism_threads(THREADS)


def build_model() -> keras.Sequential:
    """EN: The model 2-8-8-1 as a list of layers.

    PT: O modelo 2-8-8-1 como uma lista de camadas.

    ES: El modelo 2-8-8-1 como una lista de capas.
    """

    # EN: The starting rule of MP-AI-2: weights drawn uniformly from (-1, 1). The biases start at
    #     zero, which is already what `Dense` does. Each layer needs its own initialiser object.
    # PT: A regra inicial do MP-AI-2: pesos sorteados uniformemente em (-1, 1). Os vieses
    #     começam em zero, que já é o que o `Dense` faz. Cada camada precisa do seu próprio
    #     objeto inicializador.
    # ES: La regla inicial de MP-AI-2: pesos sorteados uniformemente en (-1, 1). Los sesgos
    #     empiezan en cero, que ya es lo que hace `Dense`. Cada capa necesita su propio objeto
    #     inicializador.
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
    # ES: `Dense(8)` es una capa totalmente conectada de 8 neuronas, el `nn.Linear` de PyTorch.
    #     Solo se indica el número de salidas: el número de entradas lo descubre la capa anterior,
    #     empezando en `Input(shape=(2,))`. La activación es un argumento de la capa. La última
    #     capa no tiene activación, así que el modelo devuelve un logit, como en MP-AI-2 y en la
    #     versión en PyTorch. La pérdida lo sabe con `from_logits=True`.
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
    # ES: Entropía cruzada binaria calculada a partir del logit: log(1 + e^(-s z)), la pérdida
    #     escrita a mano en MP-AI-2 y la `BCEWithLogitsLoss` en PyTorch. La otra forma común, una
    #     última capa con `activation="sigmoid"` y la pérdida `"binary_crossentropy"`, es el mismo
    #     modelo: la sigmoide solo sale de dentro de la pérdida y pasa a la última capa. La forma
    #     con logit es numéricamente más segura, porque sigmoide y logaritmo se calculan en una
    #     sola fórmula.
    return keras.losses.BinaryCrossentropy(from_logits=True)


def as_arrays(points: list[Point], labels: list[int]) -> tuple[np.ndarray, np.ndarray]:
    # EN: Inputs of shape (N, 2) and targets of shape (N, 1), as 32-bit floats: one row per
    #     point, and the targets with the same shape as the output of the model.
    # PT: Entradas de formato (N, 2) e alvos de formato (N, 1), como floats de 32 bits: uma
    #     linha por ponto, e os alvos com o mesmo formato da saída do modelo.
    # ES: Entradas de forma (N, 2) y objetivos de forma (N, 1), como floats de 32 bits: una fila
    #     por punto, y los objetivos con la misma forma que la salida del modelo.
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
    # ES: Contada a mano, sin métrica de Keras: la respuesta es la clase 1 cuando el logit es
    #     positivo, porque sigmoid(z) > 0,5 exactamente cuando z > 0. `training=False` es el
    #     `model.eval()` de PyTorch.
    logits = model(inputs, training=False).numpy()
    return float(((logits > 0.0) == (targets > 0.5)).mean())
