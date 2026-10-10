"""EN: The high-level way: describe the model, `compile`, `fit`, `evaluate`. The training loop
exists, but Keras wrote it.

PT: O jeito de alto nível: descrever o modelo, `compile`, `fit`, `evaluate`. O laço de
treinamento existe, mas foi o Keras que escreveu.

ES: La forma de alto nivel: describir el modelo, `compile`, `fit`, `evaluate`. El bucle de
entrenamiento existe, pero lo escribió Keras.
"""

from dataclasses import dataclass

import keras

from data import TRAIN_SIZE, moons_test, moons_train
from model import EPOCHS, LEARNING_RATE, SEED, as_arrays, build_model, make_loss


@dataclass
class FitRun:
    """EN: A model trained with `fit`, its loss per epoch and what `evaluate` returned.

    PT: Um modelo treinado com `fit`, a perda por época e o que o `evaluate` devolveu.

    ES: Un modelo entrenado con `fit`, la pérdida por época y lo que devolvió `evaluate`.
    """

    model: keras.Model
    losses: list[float]
    train_loss: float
    train_accuracy: float
    test_loss: float
    test_accuracy: float


def train_with_fit(seed: int = SEED, epochs: int = EPOCHS) -> FitRun:
    # EN: One call fixes the seeds of Python, NumPy and TensorFlow, so the starting weights are
    #     the same on every run.
    # PT: Uma chamada fixa as sementes do Python, do NumPy e do TensorFlow, então os pesos
    #     iniciais são os mesmos em toda execução.
    # ES: Una llamada fija las semillas de Python, de NumPy y de TensorFlow, así que los pesos
    #     iniciales son los mismos en cada ejecución.
    keras.utils.set_random_seed(seed)
    model = build_model()
    # EN: `compile` does no computation. It only stores the three choices the loop needs: how
    #     to update (the optimiser), what to minimise (the loss) and what else to report (the
    #     metrics). The usual `metrics=["accuracy"]` would be wrong here: it cuts at 0.5, the
    #     right cut for a probability, and this model outputs a logit, whose cut is 0.
    # PT: O `compile` não faz conta nenhuma. Ele só guarda as três escolhas de que o laço
    #     precisa: como atualizar (o otimizador), o que minimizar (a perda) e o que mais
    #     relatar (as métricas). O `metrics=["accuracy"]` de costume estaria errado aqui: ele
    #     corta em 0,5, o corte certo para uma probabilidade, e este modelo devolve um logit,
    #     cujo corte é 0.
    # ES: `compile` no hace ninguna cuenta. Solo guarda las tres elecciones que necesita el
    #     bucle: cómo actualizar (el optimizador), qué minimizar (la pérdida) y qué más informar
    #     (las métricas). El `metrics=["accuracy"]` habitual sería incorrecto aquí: corta en 0,5,
    #     el corte correcto para una probabilidad, y este modelo devuelve un logit, cuyo corte
    #     es 0.
    model.compile(
        optimizer=keras.optimizers.SGD(learning_rate=LEARNING_RATE),
        loss=make_loss(),
        metrics=[keras.metrics.BinaryAccuracy(threshold=0.0)],
    )
    inputs, targets = as_arrays(*moons_train())
    # EN: `fit` is the whole training loop: for each epoch it runs the forward pass, the loss,
    #     the gradients and the update. By default it cuts the data into mini-batches of 32
    #     points and shuffles them. MP-AI-2 used all the points at every step, so the batch is
    #     set to the whole training set and shuffling is turned off: one epoch, one update.
    # PT: O `fit` é o laço de treinamento inteiro: para cada época ele roda a ida, a perda, os
    #     gradientes e a atualização. Por padrão ele corta os dados em mini-lotes de 32 pontos
    #     e os embaralha. O MP-AI-2 usava todos os pontos a cada passo, então o lote é
    #     ajustado para o conjunto de treino inteiro e o embaralhamento é desligado: uma época,
    #     uma atualização.
    # ES: `fit` es el bucle de entrenamiento completo: en cada época ejecuta la ida, la pérdida,
    #     los gradientes y la actualización. Por defecto corta los datos en mini-batches de 32
    #     puntos y los baraja. MP-AI-2 usaba todos los puntos en cada paso, así que el lote se
    #     ajusta al conjunto de entrenamiento entero y el barajado se desactiva: una época, una
    #     actualización.
    history = model.fit(
        inputs, targets, epochs=epochs, batch_size=TRAIN_SIZE, shuffle=False, verbose=0
    )
    # EN: `evaluate` measures without training: it returns the loss and then each metric.
    #     The test points were never shown to `fit`.
    # PT: O `evaluate` mede sem treinar: devolve a perda e depois cada métrica. Os pontos de
    #     teste nunca foram mostrados ao `fit`.
    # ES: `evaluate` mide sin entrenar: devuelve la pérdida y luego cada métrica. Los puntos de
    #     prueba nunca se le mostraron a `fit`.
    train_loss, train_accuracy = model.evaluate(inputs, targets, verbose=0)
    test_loss, test_accuracy = model.evaluate(*as_arrays(*moons_test()), verbose=0)
    return FitRun(
        model=model,
        losses=[float(loss) for loss in history.history["loss"]],
        train_loss=float(train_loss),
        train_accuracy=float(train_accuracy),
        test_loss=float(test_loss),
        test_accuracy=float(test_accuracy),
    )
