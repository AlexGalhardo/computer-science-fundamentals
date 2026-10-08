"""EN: A small convolutional network (CNN), a fully connected network (MLP) of the same size, the
training loop and the experiment that compares them.

The experiment trains three models on the same centred shapes:
1. the CNN,
2. the MLP, with almost the same number of parameters,
3. the CNN again, from the same starting weights, with data augmentation.
Then it measures all of them on images they never saw: centred, shifted and rotated.

PT: Uma rede convolucional pequena (CNN), uma rede totalmente conectada (MLP) do mesmo tamanho, o
laço de treino e o experimento que as compara.

O experimento treina três modelos nas mesmas formas centradas:
1. a CNN,
2. a MLP, com quase o mesmo número de parâmetros,
3. a CNN de novo, a partir dos mesmos pesos iniciais, com aumento de dados.
Depois mede todos em imagens que eles nunca viram: centradas, deslocadas e giradas.
"""

from collections.abc import Callable
from dataclasses import dataclass

import torch
from torch import nn

from shapes import CLASSES, SIZE, make_dataset, random_augment

SEED = 0
THREADS = 2
TRAIN_IMAGES = 1200
TEST_IMAGES = 800
EPOCHS = 20
BATCH_SIZE = 32
LEARNING_RATE = 0.01
TRAIN_SEED, CLEAN_SEED, SHIFTED_SEED, ROTATED_SEED = 1, 101, 102, 103
# EN: Shifted test images: 2 to 4 pixels away from the centre on each axis. Rotated test images:
#     10 to 30 degrees. The training images have neither, only 1 pixel of position jitter.
# PT: Imagens de teste deslocadas: de 2 a 4 pixels do centro em cada eixo. Imagens de teste
#     giradas: de 10 a 30 graus. As imagens de treino não têm nem um nem outro, só 1 pixel de
#     variação de posição.
TEST_SHIFT = (2.0, 4.0)
TEST_ANGLE = (10.0, 30.0)


def set_reproducible(seed: int = SEED) -> None:
    # EN: Same seed, same random numbers, same weights, same results. The thread count is fixed
    #     too, because adding floating-point numbers in another order changes the last decimals.
    # PT: Mesma semente, mesmos números aleatórios, mesmos pesos, mesmos resultados. O número de
    #     threads também é fixo, porque somar números de ponto flutuante em outra ordem muda as
    #     últimas casas decimais.
    torch.manual_seed(seed)
    torch.set_num_threads(THREADS)
    torch.use_deterministic_algorithms(True)


class SmallCNN(nn.Module):
    """EN: image -> [conv + ReLU + pool] -> [conv + ReLU + pool] -> global average -> linear.

    Shapes for one 20 x 20 image: 1 x 20 x 20 -> conv1 -> 8 x 20 x 20 -> pool -> 8 x 10 x 10
    -> conv2 -> 24 x 10 x 10 -> pool -> 24 x 5 x 5 -> average of each map -> 24 numbers -> 4 scores.

    PT: imagem -> [conv + ReLU + pool] -> [conv + ReLU + pool] -> média global -> linear.

    Formatos para uma imagem 20 x 20: 1 x 20 x 20 -> conv1 -> 8 x 20 x 20 -> pool -> 8 x 10 x 10
    -> conv2 -> 24 x 10 x 10 -> pool -> 24 x 5 x 5 -> média de cada mapa -> 24 números -> 4 notas.
    """

    def __init__(self) -> None:
        super().__init__()
        # EN: 8 filters of 3 x 3 over 1 channel: 8 * (3*3*1) weights + 8 biases = 80 parameters,
        #     whatever the size of the image. The same 9 weights of a filter are used at all the
        #     400 positions: this is parameter sharing.
        # PT: 8 filtros de 3 x 3 sobre 1 canal: 8 * (3*3*1) pesos + 8 vieses = 80 parâmetros,
        #     seja qual for o tamanho da imagem. Os mesmos 9 pesos de um filtro são usados nas
        #     400 posições: isto é o compartilhamento de parâmetros.
        self.conv1 = nn.Conv2d(1, 8, kernel_size=3, padding=1)
        # EN: 24 filters of 3 x 3 over the 8 maps of the layer before: 24 * (3*3*8) + 24 = 1752.
        # PT: 24 filtros de 3 x 3 sobre os 8 mapas da camada anterior: 24 * (3*3*8) + 24 = 1752.
        self.conv2 = nn.Conv2d(8, 24, kernel_size=3, padding=1)
        self.classifier = nn.Linear(24, len(CLASSES))

    def first_layer_maps(self, images: torch.Tensor) -> torch.Tensor:
        """EN: The activation (feature) maps of the first layer: where each filter found its
        pattern.

        PT: Os mapas de ativação (de características) da primeira camada: onde cada filtro achou
        o seu padrão.
        """
        return torch.relu(self.conv1(images))

    def forward(self, images: torch.Tensor) -> torch.Tensor:
        # EN: Max pooling keeps the largest value of each 2 x 2 block. It halves each side, has
        #     no parameters, and a pattern that moves 1 pixel often stays in the same block, so
        #     the output changes little.
        # PT: O max pooling guarda o maior valor de cada bloco 2 x 2. Ele divide cada lado por
        #     dois, não tem parâmetros, e um padrão que anda 1 pixel muitas vezes continua no
        #     mesmo bloco, então a saída muda pouco.
        x = torch.max_pool2d(self.first_layer_maps(images), 2)
        x = torch.max_pool2d(torch.relu(self.conv2(x)), 2)
        # EN: Global average pooling: each of the 24 maps (5 x 5) becomes ONE number, its mean.
        #     That number says "how much of this pattern is in the image" and no longer "where".
        #     Flattening the 24 x 5 x 5 values instead would give the classifier one weight per
        #     position, and the position would matter again, as in the fully connected network.
        # PT: Média global (global average pooling): cada um dos 24 mapas (5 x 5) vira UM número,
        #     a sua média. Esse número diz "quanto deste padrão existe na imagem" e não mais
        #     "onde". Achatar os 24 x 5 x 5 valores daria ao classificador um peso por posição, e
        #     a posição voltaria a importar, como na rede totalmente conectada.
        return self.classifier(x.mean(dim=(2, 3)))


class SmallMLP(nn.Module):
    """EN: The plain network: every pixel connected to every hidden neuron.

    400 pixels x 5 neurons + 5 biases = 2005 parameters in the first layer alone. Each weight
    belongs to ONE pixel position, so what the network learns about a line at the centre says
    nothing about the same line 4 pixels to the right.

    PT: A rede simples: cada pixel ligado a cada neurônio escondido.

    400 pixels x 5 neurônios + 5 vieses = 2005 parâmetros só na primeira camada. Cada peso
    pertence a UMA posição de pixel, então o que a rede aprende sobre um traço no centro não diz
    nada sobre o mesmo traço 4 pixels à direita.
    """

    def __init__(self, hidden: int = 5) -> None:
        super().__init__()
        self.hidden = nn.Linear(SIZE * SIZE, hidden)
        self.classifier = nn.Linear(hidden, len(CLASSES))

    def forward(self, images: torch.Tensor) -> torch.Tensor:
        return self.classifier(torch.relu(self.hidden(images.flatten(start_dim=1))))


def count_parameters(model: nn.Module) -> int:
    return sum(parameter.numel() for parameter in model.parameters())


def train(
    model: nn.Module,
    images: torch.Tensor,
    labels: torch.Tensor,
    augment: bool = False,
    epochs: int = EPOCHS,
    seed: int = SEED,
) -> list[float]:
    """EN: The training loop. Returns the mean loss of each epoch.

    PT: O laço de treino. Devolve a perda média de cada época.
    """
    generator = torch.Generator().manual_seed(seed)
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
    losses: list[float] = []
    model.train()
    for _ in range(epochs):
        # EN: A new random order at each epoch, then slices of 32 images: mini-batches by hand.
        # PT: Uma nova ordem aleatória a cada época, depois fatias de 32 imagens: mini-lotes
        #     feitos à mão.
        order = torch.randperm(images.shape[0], generator=generator)
        total = 0.0
        for start in range(0, images.shape[0], BATCH_SIZE):
            batch = order[start : start + BATCH_SIZE]
            inputs = images[batch]
            if augment:
                # EN: The augmentation is random and redone at every step, so the network never
                #     sees exactly the same image twice.
                # PT: O aumento é aleatório e refeito a cada passo, então a rede nunca vê
                #     exatamente a mesma imagem duas vezes.
                inputs = random_augment(inputs, generator)
            # EN: The five steps of every PyTorch training loop: predict, measure the error,
            #     clear the old gradients, compute the new ones, update the weights.
            # PT: Os cinco passos de todo laço de treino em PyTorch: prever, medir o erro, zerar
            #     os gradientes antigos, calcular os novos, atualizar os pesos.
            loss = nn.functional.cross_entropy(model(inputs), labels[batch])
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total += float(loss.detach()) * batch.shape[0]
        losses.append(total / images.shape[0])
    return losses


def accuracy(model: nn.Module, images: torch.Tensor, labels: torch.Tensor) -> float:
    """EN: Fraction of images whose highest score is the right class (0 to 1).

    PT: Fração das imagens cuja maior nota é a classe certa (0 a 1).
    """
    model.eval()
    with torch.no_grad():
        predicted = model(images).argmax(dim=1)
    return float((predicted == labels).float().mean())


@dataclass
class Experiment:
    models: dict[str, nn.Module]
    parameters: dict[str, int]
    losses: dict[str, list[float]]
    # EN: accuracies[model][test set], with test sets "clean", "shifted" and "rotated".
    # PT: accuracies[modelo][conjunto de teste], com os conjuntos "clean", "shifted" e "rotated".
    accuracies: dict[str, dict[str, float]]
    test_sets: dict[str, tuple[torch.Tensor, torch.Tensor]]


def run_experiment() -> Experiment:
    """EN: Trains the three models and measures them. Used by the tests and by the demo.

    PT: Treina os três modelos e os mede. Usado pelos testes e pela demo.
    """
    set_reproducible()
    train_images, train_labels = make_dataset(TRAIN_IMAGES, TRAIN_SEED)
    # EN: The test images come from other seeds: the network is graded on images it never saw.
    # PT: As imagens de teste vêm de outras sementes: a rede é avaliada em imagens que nunca viu.
    test_sets = {
        "clean": make_dataset(TEST_IMAGES, CLEAN_SEED),
        "shifted": make_dataset(TEST_IMAGES, SHIFTED_SEED, shift=TEST_SHIFT),
        "rotated": make_dataset(TEST_IMAGES, ROTATED_SEED, angle=TEST_ANGLE),
    }

    plans: list[tuple[str, Callable[[], nn.Module], bool]] = [
        ("cnn", SmallCNN, False),
        ("mlp", SmallMLP, False),
        ("cnn_augmented", SmallCNN, True),
    ]
    experiment = Experiment({}, {}, {}, {}, test_sets)
    for name, build, augment in plans:
        # EN: Seeding again before each model gives the two CNNs the same starting weights, so
        #     the only difference between them is the augmentation.
        # PT: Semear de novo antes de cada modelo dá às duas CNNs os mesmos pesos iniciais, então
        #     a única diferença entre elas é o aumento de dados.
        torch.manual_seed(SEED)
        model = build()
        experiment.models[name] = model
        experiment.parameters[name] = count_parameters(model)
        experiment.losses[name] = train(model, train_images, train_labels, augment=augment)
        experiment.accuracies[name] = {
            test: accuracy(model, images, labels) for test, (images, labels) in test_sets.items()
        }
    return experiment
