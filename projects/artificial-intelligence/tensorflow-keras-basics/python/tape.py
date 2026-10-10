"""EN: The low-level way: gradients with `tf.GradientTape` and the training step written by hand,
first run eagerly and then as a graph with `tf.function`.

PT: O jeito de baixo nível: gradientes com `tf.GradientTape` e o passo de treinamento escrito à
mão, primeiro executado na hora (eager) e depois como grafo com `tf.function`.

ES: La forma de bajo nivel: gradientes con `tf.GradientTape` y el paso de entrenamiento escrito a
mano, primero ejecutado al instante (eager) y después como grafo con `tf.function`.
"""

from collections.abc import Callable
from dataclasses import dataclass

import keras
import numpy as np
import tensorflow as tf

from data import moons_train
from model import EPOCHS, LEARNING_RATE, SEED, as_arrays, build_model, make_loss


def square_gradient() -> float:
    """EN: dy/dx of y = x * x at x = 3, which is 2x = 6.

    PT: dy/dx de y = x * x em x = 3: 6.

    ES: dy/dx de y = x * x en x = 3: 6.
    """
    # EN: TensorFlow records operations only inside the `with` block. Afterwards the tape is
    #     asked for the slope of a result with respect to a variable. PyTorch records always
    #     and stores the answer in `.grad`; here the answer is returned by `tape.gradient`.
    # PT: O TensorFlow registra as operações só dentro do bloco `with`. Depois pergunta-se à
    #     fita a inclinação de um resultado em relação a uma variável. O PyTorch registra
    #     sempre e guarda a resposta em `.grad`; aqui a resposta é devolvida por
    #     `tape.gradient`.
    # ES: TensorFlow registra las operaciones solo dentro del bloque `with`. Después se le pregunta
    #     a la cinta por la pendiente de un resultado respecto a una variable. PyTorch registra
    #     siempre y guarda la respuesta en `.grad`; aquí la respuesta la devuelve
    #     `tape.gradient`.
    x = tf.Variable(3.0)
    with tf.GradientTape() as tape:
        y = x * x
    return float(tape.gradient(y, x))


def worked_example() -> tuple[float, float, float, float]:
    """EN: f = (x + y) * z at x = 2, y = 1, z = 4: the example of MP-AI-2 and of the area page.

    PT: f = (x + y) * z em x = 2, y = 1, z = 4: o exemplo do MP-AI-2 e da página da área.

    ES: f = (x + y) * z en x = 2, y = 1, z = 4: el ejemplo de MP-AI-2 y de la página del área.
    """
    x, y, z = tf.Variable(2.0), tf.Variable(1.0), tf.Variable(4.0)
    with tf.GradientTape() as tape:
        f = (x + y) * z
    # EN: By hand: df/dx = z = 4, df/dy = z = 4, df/dz = x + y = 3.
    # PT: À mão: df/dx = z = 4, df/dy = z = 4, df/dz = x + y = 3.
    # ES: A mano: df/dx = z = 4, df/dy = z = 4, df/dz = x + y = 3.
    dx, dy, dz = tape.gradient(f, [x, y, z])
    return float(f), float(dx), float(dy), float(dz)


def constant_gradient(watch: bool) -> float | None:
    """EN: The gradient of x * x with respect to a constant, with and without `tape.watch`.

    PT: O gradiente de x * x em relação a uma constante, com e sem `tape.watch`.

    ES: El gradiente de x * x respecto a una constante, con y sin `tape.watch`.
    """
    # EN: A `tf.Variable` is watched automatically, because variables are what training
    #     changes. A `tf.constant` is not: its gradient comes back as `None`, with no error,
    #     unless the tape is told to watch it.
    # PT: Uma `tf.Variable` é observada automaticamente, porque as variáveis são o que o
    #     treinamento muda. Uma `tf.constant` não é: o gradiente dela volta como `None`, sem
    #     erro nenhum, a menos que se peça à fita para observá-la.
    # ES: Una `tf.Variable` se vigila automáticamente, porque las variables son lo que cambia el
    #     entrenamiento. Una `tf.constant` no: su gradiente vuelve como `None`, sin ningún error, a
    #     menos que se le pida a la cinta que la vigile.
    x = tf.constant(3.0)
    with tf.GradientTape() as tape:
        if watch:
            tape.watch(x)
        y = x * x
    gradient = tape.gradient(y, x)
    return None if gradient is None else float(gradient)


Step = Callable[[tf.Tensor, tf.Tensor], tf.Tensor]


def make_step(
    model: keras.Model, optimizer: keras.optimizers.Optimizer, graph: bool
) -> tuple[Step, list[str]]:
    """EN: One training step, the five steps of PyTorch in TensorFlow's words. Also returns a
    list that receives one entry each time Python really runs the body of the step.

    PT: Um passo de treinamento, os cinco passos do PyTorch nas palavras do TensorFlow. Devolve
    também uma lista que recebe uma entrada cada vez que o Python realmente executa o corpo do
    passo.

    ES: Un paso de entrenamiento, los cinco pasos de PyTorch con las palabras de TensorFlow.
    Devuelve también una lista que recibe una entrada cada vez que Python realmente ejecuta el
    cuerpo del paso.
    """
    loss_fn = make_loss()
    python_runs: list[str] = []

    def step(inputs: tf.Tensor, targets: tf.Tensor) -> tf.Tensor:
        # EN: Ordinary Python. Run eagerly, this line executes at every step. Inside a
        #     `tf.function` it executes only while the graph is being recorded (tracing).
        # PT: Python comum. Executada na hora, esta linha roda a cada passo. Dentro de uma
        #     `tf.function` ela roda só enquanto o grafo está sendo gravado (tracing).
        # ES: Python común. Ejecutada al instante, esta línea corre en cada paso. Dentro de una
        #     `tf.function` corre solo mientras se está grabando el grafo (tracing).
        python_runs.append("ran")
        with tf.GradientTape() as tape:
            logits = model(inputs, training=True)  # 1. forward / ida
            loss = loss_fn(targets, logits)  # 2. loss / perda
        # EN: 3 and 4. There is no `zero_grad`: the tape returns fresh gradients, one per
        #     variable, and nothing accumulates between steps.
        # PT: 3 e 4. Não existe `zero_grad`: a fita devolve gradientes novos, um por variável,
        #     e nada se acumula entre os passos.
        # ES: 3 y 4. No existe `zero_grad`: la cinta devuelve gradientes nuevos, uno por variable,
        #     y nada se acumula entre los pasos.
        gradients = tape.gradient(loss, model.trainable_variables)
        # EN: 5. The optimiser receives (gradient, variable) pairs and updates each variable.
        # PT: 5. O otimizador recebe pares (gradiente, variável) e atualiza cada variável.
        # ES: 5. El optimizador recibe pares (gradiente, variable) y actualiza cada variable.
        optimizer.apply_gradients(zip(gradients, model.trainable_variables, strict=True))
        return loss

    # EN: `tf.function` turns the Python function into a graph. The first call runs the Python
    #     code once to record the operations, and every later call with the same kind of
    #     input executes the recorded graph, without Python.
    # PT: O `tf.function` transforma a função Python em um grafo. A primeira chamada roda o
    #     código Python uma vez para gravar as operações, e toda chamada seguinte com o mesmo
    #     tipo de entrada executa o grafo gravado, sem Python.
    # ES: `tf.function` convierte la función de Python en un grafo. La primera llamada ejecuta el
    #     código Python una vez para grabar las operaciones, y toda llamada posterior con el mismo
    #     tipo de entrada ejecuta el grafo grabado, sin Python.
    return (tf.function(step) if graph else step), python_runs


@dataclass
class TapeRun:
    """EN: A model trained with the hand-written step.

    PT: Um modelo treinado com o passo à mão.

    ES: Un modelo entrenado con el paso escrito a mano.
    """

    model: keras.Model
    losses: list[float]
    python_runs: int


def train_with_tape(seed: int = SEED, epochs: int = EPOCHS, graph: bool = False) -> TapeRun:
    """EN: The loop `fit` hides, written out: same model, same seed, same optimiser, full batch.

    PT: O laço que o `fit` esconde, escrito por extenso: mesmo modelo, mesma semente, mesmo
    otimizador, lote inteiro.

    ES: El bucle que `fit` esconde, escrito por extenso: mismo modelo, misma semilla, mismo
    optimizador, lote entero.
    """
    keras.utils.set_random_seed(seed)
    model = build_model()
    optimizer = keras.optimizers.SGD(learning_rate=LEARNING_RATE)
    # EN: The optimiser creates its own variables (a step counter) the first time it is used.
    #     A graph may not create variables after its first recording, so they are created now.
    # PT: O otimizador cria as suas próprias variáveis (um contador de passos) na primeira vez
    #     em que é usado. Um grafo não pode criar variáveis depois da primeira gravação, então
    #     elas são criadas agora.
    # ES: El optimizador crea sus propias variables (un contador de pasos) la primera vez que se
    #     usa. Un grafo no puede crear variables después de su primera grabación, así que se crean
    #     ahora.
    optimizer.build(model.trainable_variables)
    step, python_runs = make_step(model, optimizer, graph)
    arrays: tuple[np.ndarray, np.ndarray] = as_arrays(*moons_train())
    inputs, targets = tf.constant(arrays[0]), tf.constant(arrays[1])
    losses = [float(step(inputs, targets)) for _ in range(epochs)]
    return TapeRun(model, losses, len(python_runs))
