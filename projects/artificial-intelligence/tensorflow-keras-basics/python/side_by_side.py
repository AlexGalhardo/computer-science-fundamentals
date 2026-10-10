"""EN: PyTorch and TensorFlow side by side: each concept in both frameworks, and the accuracy
measured in each.

This project contains no PyTorch. The PyTorch numbers below were measured by the mini-project
pytorch-basics (MP-AI-6) and are quoted from its committed results.

PT: PyTorch e TensorFlow lado a lado: cada conceito nos dois frameworks, e a acurácia medida em
cada um.

Este projeto não contém PyTorch. Os números do PyTorch abaixo foram medidos pelo mini-projeto
pytorch-basics (MP-AI-6) e são citados dos resultados versionados dele.

ES: PyTorch y TensorFlow lado a lado: cada concepto en los dos frameworks, y la exactitud medida en
cada uno.

Este proyecto no contiene PyTorch. Los números de PyTorch de abajo los midió el miniproyecto
pytorch-basics (MP-AI-6) y se citan de sus resultados versionados.
"""

# EN: Source: projects/artificial-intelligence/pytorch-basics/results/results.md, section
#     "Training on the two moons", first row (the rule of MP-AI-2, torch.manual_seed(7), 120
#     epochs): 97.5% on the 80 training points, 98.0% on the 200 test points.
# PT: Fonte: projects/artificial-intelligence/pytorch-basics/results/results.md, seção
#     "Training on the two moons", primeira linha (a regra do MP-AI-2, torch.manual_seed(7),
#     120 épocas): 97,5% nos 80 pontos de treino, 98,0% nos 200 pontos de teste.
# ES: Fuente: projects/artificial-intelligence/pytorch-basics/results/results.md, sección
#     "Training on the two moons", primera fila (la regla de MP-AI-2, torch.manual_seed(7),
#     120 épocas): 97,5% en los 80 puntos de entrenamiento, 98,0% en los 200 puntos de prueba.
PYTORCH_TRAIN_ACCURACY = 0.975
PYTORCH_TEST_ACCURACY = 0.980
PYTORCH_SOURCE = "pytorch-basics/results/results.md"

CONCEPTS: list[tuple[str, str, str]] = [
    (
        "Tensor",
        "`torch.Tensor`: `torch.tensor(points)`",
        "`tf.Tensor` (cannot be changed): `tf.constant(points)`. Parameters are `tf.Variable`",
    ),
    (
        "Gradient",
        "`requires_grad=True`, `loss.backward()`, read `.grad`",
        "`with tf.GradientTape() as tape:`, then `tape.gradient(loss, variables)`",
    ),
    (
        "Layer",
        "`nn.Linear(2, 8)` followed by `torch.tanh`",
        '`keras.layers.Dense(8, activation="tanh")`',
    ),
    (
        "Model",
        "a class that inherits from `nn.Module`, with `forward`",
        "`keras.Sequential([...])`",
    ),
    (
        "Loss on a logit",
        "`nn.BCEWithLogitsLoss()`",
        "`keras.losses.BinaryCrossentropy(from_logits=True)`",
    ),
    (
        "Optimiser",
        "`torch.optim.SGD(model.parameters(), lr=0.5)`, `zero_grad()` and `step()`",
        "`keras.optimizers.SGD(learning_rate=0.5)`, `apply_gradients(zip(grads, variables))`",
    ),
    (
        "Training loop",
        "written by hand: forward, loss, `zero_grad`, `backward`, `step`",
        "`model.compile(...)` and `model.fit(...)`, or by hand with a tape",
    ),
    (
        "Measuring",
        "`model.eval()` and `with torch.no_grad():`",
        "`model.evaluate(...)`, or `model(inputs, training=False)`",
    ),
    (
        "Execution",
        "eager: the graph is rebuilt at every forward pass",
        "eager by default, a recorded graph with `@tf.function`",
    ),
]


def side_by_side_table(fit_accuracies: tuple[float, float], tape_test_accuracy: float) -> list[str]:
    """EN: The Markdown table of the READMEs, with the accuracies measured by this demo.

    PT: A tabela em Markdown dos READMEs, com as acurácias medidas por esta demo.

    ES: La tabla en Markdown de los README, con las exactitudes medidas por esta demo.
    """
    train, test = fit_accuracies
    rows = ["| Concept | PyTorch | TensorFlow and Keras |", "| --- | --- | --- |"]
    rows += [f"| {concept} | {torch} | {tensorflow} |" for concept, torch, tensorflow in CONCEPTS]
    rows += [
        f"| **Measured accuracy, 80 training points** | **{PYTORCH_TRAIN_ACCURACY:.1%}** | "
        f"**{train:.1%}** (`fit`) |",
        f"| **Measured accuracy, 200 test points** | **{PYTORCH_TEST_ACCURACY:.1%}** | "
        f"**{test:.1%}** (`fit`), **{tape_test_accuracy:.1%}** (gradient tape) |",
    ]
    return rows
