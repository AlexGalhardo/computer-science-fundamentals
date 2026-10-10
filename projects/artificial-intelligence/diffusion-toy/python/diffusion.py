"""EN: A diffusion model in miniature, on two-dimensional points instead of pixels.

The "image" here is one point (x, y) on a ring. The forward process adds Gaussian noise step by
step until the ring is gone. A small network, written by hand with NumPy, learns to say which
noise was added. Generation starts from pure noise and removes a little of it at each step, until
the points are back on the ring. It follows the method of "Denoising Diffusion Probabilistic
Models" (Ho, Jain and Abbeel, 2020) with everything made small enough to plot.

PT: Um modelo de difusão em miniatura, com pontos de duas dimensões no lugar de pixels.

A "imagem" aqui é um ponto (x, y) sobre um anel. O processo direto soma ruído gaussiano passo a
passo até o anel sumir. Uma rede pequena, escrita à mão com NumPy, aprende a dizer qual ruído foi
somado. A geração parte de ruído puro e tira um pouco dele a cada passo, até os pontos voltarem
para o anel. Segue o método de "Denoising Diffusion Probabilistic Models" (Ho, Jain e Abbeel,
2020) com tudo pequeno o bastante para desenhar.

ES: Un modelo de difusión en miniatura, con puntos de dos dimensiones en lugar de píxeles.

La "imagen" aquí es un punto (x, y) sobre un anillo. El proceso directo suma ruido gaussiano paso
a paso hasta que el anillo desaparece. Una red pequeña, escrita a mano con NumPy, aprende a decir
qué ruido se sumó. La generación parte de ruido puro y le quita un poco en cada paso, hasta que
los puntos vuelven al anillo. Sigue el método de "Denoising Diffusion Probabilistic Models" (Ho,
Jain y Abbeel, 2020) con todo lo bastante pequeño como para dibujarlo.
"""

import math
from dataclasses import dataclass, field

import numpy as np
import numpy.typing as npt

Array = npt.NDArray[np.float64]
IntArray = npt.NDArray[np.int64]

# EN: The target shape is a ring of radius 1 centred on the origin. A ring was chosen because the
#     distance from any point p to it is exact and one line long: |length of p - radius|.
# PT: A forma alvo é um anel de raio 1 centrado na origem. O anel foi escolhido porque a distância
#     de qualquer ponto p até ele é exata e cabe em uma linha: |comprimento de p - raio|.
# ES: La forma objetivo es un anillo de radio 1 centrado en el origen. Se eligió el anillo porque la
#     distancia de cualquier punto p a él es exacta y cabe en una línea: |longitud de p - radio|.
RING_RADIUS = 1.0
# EN: Real data is never perfectly clean, so each point sits a little inside or outside the ring.
# PT: Dado real nunca é perfeitamente limpo, então cada ponto fica um pouco dentro ou fora do anel.
# ES: Un dato real nunca es perfectamente limpio, así que cada punto queda un poco dentro o fuera
#     del anillo.
RING_JITTER = 0.03

# EN: The paper uses 1000 steps with beta going from 0.0001 to 0.02. Here there are 10 times
#     fewer steps and each beta is 10 times bigger, so the total amount of noise is about the
#     same and the last step is still pure noise. Bigger steps are a rougher approximation, which
#     is acceptable for a ring and would not be for a photograph.
# PT: O artigo usa 1000 passos com beta indo de 0,0001 a 0,02. Aqui há 10 vezes menos passos e
#     cada beta é 10 vezes maior, então a quantidade total de ruído é quase a mesma e o último
#     passo continua sendo ruído puro. Passos maiores são uma aproximação mais grosseira, o que é
#     aceitável para um anel e não seria para uma fotografia.
# ES: El artículo usa 1000 pasos con beta yendo de 0,0001 a 0,02. Aquí hay 10 veces menos pasos y
#     cada beta es 10 veces mayor, así que la cantidad total de ruido es casi la misma y el último
#     paso sigue siendo ruido puro. Pasos mayores son una aproximación más gruesa, lo que es
#     aceptable para un anillo y no lo sería para una fotografía.
STEPS = 100
BETA_START = 0.001
BETA_END = 0.2

TIME_FREQUENCIES = 8
SECTORS = 12
SAMPLE_COUNT = 2000
SAMPLE_SEED = 7


def make_ring(count: int, seed: int) -> Array:
    """EN: `count` points on the ring: a random angle, and a radius that is almost RING_RADIUS.

    PT: `count` pontos sobre o anel: um ângulo aleatório, e um raio que é quase RING_RADIUS.

    ES: `count` puntos sobre el anillo: un ángulo aleatorio, y un radio que es casi RING_RADIUS.
    """
    rng = np.random.default_rng(seed)
    angle = rng.uniform(0.0, 2.0 * math.pi, count)
    radius = RING_RADIUS + RING_JITTER * rng.standard_normal(count)
    return np.stack([radius * np.cos(angle), radius * np.sin(angle)], axis=1)


@dataclass(frozen=True)
class Schedule:
    """EN: How much noise each step adds. All arrays have STEPS + 1 entries so that index t is
    step t: index 0 is the clean data (beta 0, alpha_bar 1) and index STEPS is the last step.

    PT: Quanto ruído cada passo soma. Todos os vetores têm STEPS + 1 posições para que o índice t
    seja o passo t: o índice 0 é o dado limpo (beta 0, alpha_bar 1) e o índice STEPS é o último.

    ES: Cuánto ruido suma cada paso. Todos los vectores tienen STEPS + 1 posiciones para que el
    índice t sea el paso t: el índice 0 es el dato limpio (beta 0, alpha_bar 1) y el índice STEPS
    es el último.
    """

    betas: Array
    alphas: Array
    alpha_bars: Array

    @property
    def steps(self) -> int:
        return len(self.betas) - 1


def make_schedule(steps: int = STEPS, start: float = BETA_START, end: float = BETA_END) -> Schedule:
    # EN: beta_t is the variance of the noise added at step t. It grows in a straight line: the
    #     first steps barely touch the data, the last ones add a lot.
    #     alpha_t = 1 - beta_t is the share of the previous point that survives the step, and
    #     alpha_bar_t = alpha_1 x alpha_2 x ... x alpha_t is the share of the ORIGINAL point that
    #     is still there after t steps. It starts at 1 and must end close to 0.
    # PT: beta_t é a variância do ruído somado no passo t. Cresce em linha reta: os primeiros
    #     passos quase não mexem no dado, os últimos somam muito.
    #     alpha_t = 1 - beta_t é a parte do ponto anterior que sobrevive ao passo, e
    #     alpha_bar_t = alpha_1 x alpha_2 x ... x alpha_t é a parte do ponto ORIGINAL que ainda
    #     está lá depois de t passos. Começa em 1 e precisa terminar perto de 0.
    # ES: beta_t es la varianza del ruido sumado en el paso t. Crece en línea recta: los primeros
    #     pasos casi no tocan el dato, los últimos suman mucho.
    #     alpha_t = 1 - beta_t es la parte del punto anterior que sobrevive al paso, y
    #     alpha_bar_t = alpha_1 x alpha_2 x ... x alpha_t es la parte del punto ORIGINAL que sigue
    #     ahí tras t pasos. Empieza en 1 y tiene que terminar cerca de 0.
    betas = np.concatenate([[0.0], np.linspace(start, end, steps)])
    alphas = 1.0 - betas
    return Schedule(betas=betas, alphas=alphas, alpha_bars=np.cumprod(alphas))


def forward_step(previous: Array, t: int, schedule: Schedule, rng: np.random.Generator) -> Array:
    """EN: One step of the forward process: shrink the point a little and add a little noise.

    x_t = sqrt(1 - beta_t) x_(t-1) + sqrt(beta_t) noise. The shrinking is what keeps the variance
    from growing without limit: with a variance of 1 before the step, (1 - beta) x 1 + beta = 1.

    PT: Um passo do processo direto: encolhe um pouco o ponto e soma um pouco de ruído.

    x_t = sqrt(1 - beta_t) x_(t-1) + sqrt(beta_t) ruído. O encolhimento é o que impede a variância
    de crescer sem limite: com variância 1 antes do passo, (1 - beta) x 1 + beta = 1.

    ES: Un paso del proceso directo: encoge un poco el punto y suma un poco de ruido.

    x_t = sqrt(1 - beta_t) x_(t-1) + sqrt(beta_t) ruido. El encogimiento es lo que impide que la
    varianza crezca sin límite: con varianza 1 antes del paso, (1 - beta) x 1 + beta = 1.
    """
    beta = schedule.betas[t]
    return math.sqrt(1.0 - beta) * previous + math.sqrt(beta) * rng.standard_normal(previous.shape)


def forward_chain(
    start: Array, schedule: Schedule, seed: int, keep: tuple[int, ...]
) -> dict[int, Array]:
    """EN: Runs the forward process step by step and returns the points at the steps in `keep`.

    PT: Roda o processo direto passo a passo e devolve os pontos nos passos listados em `keep`.

    ES: Ejecuta el proceso directo paso a paso y devuelve los puntos en los pasos listados en
    `keep`.
    """
    rng = np.random.default_rng(seed)
    points = start
    kept = {0: start} if 0 in keep else {}
    for t in range(1, max(keep) + 1):
        points = forward_step(points, t, schedule, rng)
        if t in keep:
            kept[t] = points
    return kept


def noisy_at(start: Array, t: int | IntArray, schedule: Schedule, noise: Array) -> Array:
    """EN: The shortcut: the point at step t in one jump, without walking through the steps.

    x_t = sqrt(alpha_bar_t) x_0 + sqrt(1 - alpha_bar_t) noise. It works because a sum of Gaussian
    noises is again Gaussian noise, so t small noises can be replaced by one big one. Training
    depends on this: each example needs one multiplication instead of up to STEPS steps.
    `t` may be one step for every point or one step per point.

    PT: O atalho: o ponto no passo t em um salto só, sem andar pelos passos.

    x_t = sqrt(alpha_bar_t) x_0 + sqrt(1 - alpha_bar_t) ruído. Funciona porque uma soma de ruídos
    gaussianos é de novo ruído gaussiano, então t ruídos pequenos podem virar um ruído grande. O
    treino depende disto: cada exemplo custa uma multiplicação em vez de até STEPS passos.
    `t` pode ser um passo para todos os pontos ou um passo por ponto.

    ES: El atajo: el punto en el paso t de un solo salto, sin recorrer los pasos.

    x_t = sqrt(alpha_bar_t) x_0 + sqrt(1 - alpha_bar_t) ruido. Funciona porque una suma de ruidos
    gaussianos es de nuevo ruido gaussiano, así que t ruidos pequeños pueden volverse un ruido
    grande. El entrenamiento depende de esto: cada ejemplo cuesta una multiplicación en lugar de
    hasta STEPS pasos. `t` puede ser un paso para todos los puntos o un paso por punto.
    """
    alpha_bar = np.reshape(schedule.alpha_bars[t], (-1, 1))
    return np.sqrt(alpha_bar) * start + np.sqrt(1.0 - alpha_bar) * noise


def time_embedding(t: IntArray, steps: int) -> Array:
    """EN: Turns the step number into 16 numbers the network can use.

    The network must know the step, because removing noise at step 5 (almost clean) and at step
    95 (almost pure noise) are different jobs. One raw number would be hard to use, so the step is
    described by sines and cosines of several speeds: the slow waves say "early or late", the fast
    ones separate neighbouring steps. It is the same idea as the position encoding of a
    transformer.

    PT: Transforma o número do passo em 16 números que a rede consegue usar.

    A rede precisa saber o passo, porque tirar ruído no passo 5 (quase limpo) e no passo 95 (quase
    ruído puro) são tarefas diferentes. Um número cru seria difícil de usar, então o passo é
    descrito por senos e cossenos de várias velocidades: as ondas lentas dizem "cedo ou tarde", as
    rápidas separam passos vizinhos. É a mesma ideia da codificação de posição de um transformer.

    ES: Convierte el número del paso en 16 números que la red puede usar.

    La red necesita saber el paso, porque quitar ruido en el paso 5 (casi limpio) y en el paso 95
    (casi ruido puro) son tareas distintas. Un número crudo sería difícil de usar, así que el paso
    se describe con senos y cosenos de varias velocidades: las ondas lentas dicen "temprano o
    tarde", las rápidas separan pasos vecinos. Es la misma idea de la codificación de posición de
    un transformer.
    """
    frequencies = 2.0 ** np.arange(TIME_FREQUENCIES) * (math.pi / 8.0)
    angles = (np.asarray(t, dtype=np.float64) / steps)[:, None] * frequencies[None, :]
    return np.concatenate([np.sin(angles), np.cos(angles)], axis=1)


@dataclass
class Network:
    """EN: A multilayer perceptron: a list of weight matrices and a list of bias vectors.

    PT: Um perceptron multicamadas: uma lista de matrizes de pesos e uma lista de vetores de viés.

    ES: Un perceptrón multicapa: una lista de matrices de pesos y una lista de vectores de sesgo.
    """

    weights: list[Array]
    biases: list[Array]

    def parameters(self) -> list[Array]:
        return [*self.weights, *self.biases]

    def parameter_count(self) -> int:
        return sum(parameter.size for parameter in self.parameters())


def make_network(sizes: tuple[int, ...], seed: int) -> Network:
    # EN: Weights start as small random numbers, scaled by 1 / sqrt(inputs of the layer), so the
    #     signal neither explodes nor dies while it crosses the layers. Biases start at zero.
    # PT: Os pesos começam como números aleatórios pequenos, na escala 1 / sqrt(entradas da
    #     camada), para o sinal não explodir nem morrer ao atravessar as camadas. Os vieses
    #     começam em zero.
    # ES: Los pesos empiezan como números aleatorios pequeños, en la escala 1 / sqrt(entradas de la
    #     capa), para que la señal no explote ni muera al atravesar las capas. Los sesgos empiezan
    #     en cero.
    rng = np.random.default_rng(seed)
    pairs = list(zip(sizes[:-1], sizes[1:], strict=True))
    weights = [rng.standard_normal((n_in, n_out)) / math.sqrt(n_in) for n_in, n_out in pairs]
    return Network(weights=weights, biases=[np.zeros(n_out) for _, n_out in pairs])


def forward_pass(network: Network, inputs: Array) -> list[Array]:
    """EN: Runs the network and keeps the output of every layer, because the backward pass needs
    them. Hidden layers use tanh. The last layer has no activation: a noise value can be any real
    number.

    PT: Roda a rede e guarda a saída de cada camada, porque a volta (backward) precisa delas. As
    camadas escondidas usam tanh. A última não tem ativação: um valor de ruído pode ser qualquer
    número real.

    ES: Ejecuta la red y guarda la salida de cada capa, porque la vuelta (backward) las necesita.
    Las capas ocultas usan tanh. La última no tiene activación: un valor de ruido puede ser
    cualquier número real.
    """
    activations = [inputs]
    last = len(network.weights) - 1
    for index, (weight, bias) in enumerate(zip(network.weights, network.biases, strict=True)):
        linear = activations[-1] @ weight + bias
        activations.append(linear if index == last else np.tanh(linear))
    return activations


def backward_pass(
    network: Network, activations: list[Array], output_gradient: Array
) -> tuple[list[Array], list[Array]]:
    """EN: Backpropagation: the chain rule applied from the last layer to the first.

    `gradient` always means "how much the loss changes when the output of this layer changes".
    For a layer out = in @ W + b: dLoss/dW = in.T @ gradient, dLoss/db = sum of gradient over the
    batch, and the gradient handed to the layer before is gradient @ W.T. Crossing a tanh
    multiplies by its derivative, 1 - tanh^2, which is why the forward pass stored the outputs.

    PT: Backpropagation: a regra da cadeia aplicada da última camada para a primeira.

    `gradient` sempre quer dizer "quanto a perda muda quando a saída desta camada muda". Para uma
    camada out = in @ W + b: dPerda/dW = in.T @ gradient, dPerda/db = soma de gradient no lote, e
    o gradiente entregue à camada anterior é gradient @ W.T. Atravessar uma tanh multiplica pela
    derivada dela, 1 - tanh^2, e é por isso que a ida guardou as saídas.

    ES: Backpropagation: la regla de la cadena aplicada de la última capa a la primera.

    `gradient` siempre quiere decir "cuánto cambia la pérdida cuando cambia la salida de esta
    capa". Para una capa out = in @ W + b: dPérdida/dW = in.T @ gradient, dPérdida/db = suma de
    gradient en el lote, y el gradiente entregado a la capa anterior es gradient @ W.T. Atravesar
    una tanh multiplica por su derivada, 1 - tanh^2, y por eso la ida guardó las salidas.
    """
    weight_gradients: list[Array] = []
    bias_gradients: list[Array] = []
    gradient = output_gradient
    for index in reversed(range(len(network.weights))):
        weight_gradients.append(activations[index].T @ gradient)
        bias_gradients.append(gradient.sum(axis=0))
        if index > 0:
            gradient = (gradient @ network.weights[index].T) * (1.0 - activations[index] ** 2)
    return weight_gradients[::-1], bias_gradients[::-1]


def predict_noise(network: Network, noisy: Array, t: IntArray, steps: int) -> list[Array]:
    """EN: The network reads the noisy point and the step, and answers with its guess of the
    noise (two numbers per point). Returns every layer's output; the guess is the last one.

    PT: A rede lê o ponto com ruído e o passo, e responde com o palpite do ruído (dois números por
    ponto). Devolve a saída de todas as camadas; o palpite é a última.

    ES: La red lee el punto con ruido y el paso, y responde con la estimación del ruido (dos
    números por punto). Devuelve la salida de todas las capas; la estimación es la última.
    """
    return forward_pass(network, np.concatenate([noisy, time_embedding(t, steps)], axis=1))


def noise_loss(
    network: Network, noisy: Array, t: IntArray, noise: Array, steps: int
) -> tuple[float, list[Array]]:
    """EN: The training objective: mean squared error between the true noise and the guess.

    Returns the loss and the gradients, in the order of Network.parameters(). The derivative of
    mean((guess - noise)^2) with respect to the guess is 2 (guess - noise) / number of values.

    PT: O objetivo do treino: erro quadrático médio entre o ruído verdadeiro e o palpite.

    Devolve a perda e os gradientes, na ordem de Network.parameters(). A derivada de
    mean((palpite - ruído)^2) em relação ao palpite é 2 (palpite - ruído) / número de valores.

    ES: El objetivo del entrenamiento: error cuadrático medio entre el ruido verdadero y la
    estimación.

    Devuelve la pérdida y los gradientes, en el orden de Network.parameters(). La derivada de
    mean((estimación - ruido)^2) respecto a la estimación es 2 (estimación - ruido) / número de
    valores.
    """
    activations = predict_noise(network, noisy, t, steps)
    error = activations[-1] - noise
    weight_gradients, bias_gradients = backward_pass(network, activations, 2.0 * error / error.size)
    return float(np.mean(error**2)), [*weight_gradients, *bias_gradients]


@dataclass
class Adam:
    """EN: The Adam optimiser. Plain gradient descent uses one step size for every weight. Adam
    keeps, for each weight, a running mean of its gradient (`mean`, the direction) and of its
    squared gradient (`square`, the usual size), and divides one by the root of the other, so
    every weight moves about `rate` per step whatever the scale of its gradient. Both means start
    at zero, and the division by (1 - decay^step) corrects that bias in the first steps.

    PT: O otimizador Adam. A descida de gradiente simples usa um tamanho de passo para todos os
    pesos. O Adam guarda, para cada peso, uma média móvel do gradiente (`mean`, a direção) e do
    gradiente ao quadrado (`square`, o tamanho típico), e divide uma pela raiz da outra, então
    cada peso anda cerca de `rate` por passo qualquer que seja a escala do seu gradiente. As duas
    médias começam em zero, e a divisão por (1 - decay^step) corrige esse viés nos primeiros
    passos.

    ES: El optimizador Adam. El descenso de gradiente simple usa un tamaño de paso para todos los
    pesos. Adam guarda, para cada peso, una media móvil del gradiente (`mean`, la dirección) y del
    gradiente al cuadrado (`square`, el tamaño típico), y divide una entre la raíz de la otra, así
    que cada peso avanza cerca de `rate` por paso sea cual sea la escala de su gradiente. Las dos
    medias empiezan en cero, y la división entre (1 - decay^step) corrige ese sesgo en los primeros
    pasos.
    """

    rate: float
    mean_decay: float = 0.9
    square_decay: float = 0.999
    epsilon: float = 1e-8
    step: int = 0
    mean: list[Array] = field(default_factory=list)
    square: list[Array] = field(default_factory=list)

    def update(self, parameters: list[Array], gradients: list[Array], rate: float) -> None:
        if not self.mean:
            self.mean = [np.zeros_like(parameter) for parameter in parameters]
            self.square = [np.zeros_like(parameter) for parameter in parameters]
        self.step += 1
        mean_fix = 1.0 - self.mean_decay**self.step
        square_fix = 1.0 - self.square_decay**self.step
        for parameter, gradient, mean, square in zip(
            parameters, gradients, self.mean, self.square, strict=True
        ):
            mean *= self.mean_decay
            mean += (1.0 - self.mean_decay) * gradient
            square *= self.square_decay
            square += (1.0 - self.square_decay) * gradient**2
            # EN: `-=` changes the array in place, so the network sees the new weights.
            # PT: `-=` altera o vetor no lugar, então a rede enxerga os pesos novos.
            # ES: `-=` modifica el vector en su lugar, así que la red ve los pesos nuevos.
            parameter -= rate * (mean / mean_fix) / (np.sqrt(square / square_fix) + self.epsilon)


@dataclass(frozen=True)
class TrainConfig:
    hidden: tuple[int, ...] = (64, 64, 64)
    iterations: int = 6000
    batch_size: int = 256
    rate: float = 0.003
    data_count: int = 4000
    data_seed: int = 1
    network_seed: int = 2
    batch_seed: int = 3
    log_every: int = 200


@dataclass
class Trained:
    network: Network
    schedule: Schedule
    data: Array
    # EN: Mean loss of each block of `log_every` iterations, for the loss curve.
    # PT: Perda média de cada bloco de `log_every` iterações, para a curva de perda.
    # ES: Pérdida media de cada bloque de `log_every` iteraciones, para la curva de pérdida.
    losses: list[float]


def train(config: TrainConfig | None = None) -> Trained:
    """EN: Trains the noise predictor. Every iteration is the recipe of the paper:

    1. take a batch of clean points x_0 from the data;
    2. pick a random step t for each one;
    3. draw the noise and jump to x_t with the shortcut;
    4. ask the network for the noise, given x_t and t;
    5. move the weights so that the squared error gets smaller.

    The labels (the noise) were created by us, so this is ordinary supervised learning.

    PT: Treina o previsor de ruído. Cada iteração é a receita do artigo:

    1. pega um lote de pontos limpos x_0 dos dados;
    2. sorteia um passo t para cada um;
    3. sorteia o ruído e salta para x_t com o atalho;
    4. pergunta à rede qual foi o ruído, dados x_t e t;
    5. move os pesos para o erro quadrático diminuir.

    Os rótulos (o ruído) foram criados por nós, então isto é aprendizado supervisionado comum.

    ES: Entrena el predictor de ruido. Cada iteración es la receta del artículo:

    1. toma un lote de puntos limpios x_0 de los datos;
    2. sortea un paso t para cada uno;
    3. sortea el ruido y salta a x_t con el atajo;
    4. pregunta a la red cuál fue el ruido, dados x_t y t;
    5. mueve los pesos para que el error cuadrático disminuya.

    Las etiquetas (el ruido) las creamos nosotros, así que esto es aprendizaje supervisado común.
    """
    config = config or TrainConfig()
    schedule = make_schedule()
    data = make_ring(config.data_count, config.data_seed)
    network = make_network((2 + 2 * TIME_FREQUENCIES, *config.hidden, 2), config.network_seed)
    optimiser = Adam(rate=config.rate)
    rng = np.random.default_rng(config.batch_seed)
    losses: list[float] = []
    block: list[float] = []
    for iteration in range(config.iterations):
        clean = data[rng.integers(0, len(data), config.batch_size)]
        t = rng.integers(1, schedule.steps + 1, config.batch_size)
        noise = rng.standard_normal(clean.shape)
        loss, gradients = noise_loss(
            network, noisy_at(clean, t, schedule, noise), t, noise, schedule.steps
        )
        # EN: The step size falls smoothly to zero (half a cosine wave): big moves first, fine
        #     adjustments at the end.
        # PT: O tamanho do passo cai suavemente até zero (meia onda de cosseno): movimentos
        #     grandes primeiro, ajustes finos no fim.
        # ES: El tamaño del paso cae suavemente hasta cero (media onda de coseno): movimientos
        #     grandes primero, ajustes finos al final.
        rate = config.rate * 0.5 * (1.0 + math.cos(math.pi * iteration / config.iterations))
        optimiser.update(network.parameters(), gradients, rate)
        block.append(loss)
        if len(block) == config.log_every:
            losses.append(sum(block) / len(block))
            block = []
    return Trained(network=network, schedule=schedule, data=data, losses=losses)


def reverse_step(
    network: Network, points: Array, t: int, schedule: Schedule, noise: Array | None
) -> Array:
    """EN: One step of generation, from x_t to x_(t-1).

    The network says which noise it sees in x_t. Only the part of it that belongs to this one
    step is removed: (1 - alpha_t) / sqrt(1 - alpha_bar_t). Dividing by sqrt(alpha_t) undoes the
    shrinking of the forward step. Then a little fresh noise is added back (sigma_t = sqrt(beta_t)
    here, one of the two choices of the paper): the network gives the average answer, and without
    this noise all points would slide to the same blurry average. `noise` is None at the last
    step, where the result must be clean.

    PT: Um passo da geração, de x_t para x_(t-1).

    A rede diz qual ruído enxerga em x_t. Só a parte que pertence a este passo é retirada:
    (1 - alpha_t) / sqrt(1 - alpha_bar_t). Dividir por sqrt(alpha_t) desfaz o encolhimento do
    passo direto. Depois um pouco de ruído novo é somado de volta (sigma_t = sqrt(beta_t) aqui,
    uma das duas escolhas do artigo): a rede dá a resposta média, e sem esse ruído todos os pontos
    escorregariam para a mesma média borrada. `noise` é None no último passo, em que o resultado
    precisa sair limpo.

    ES: Un paso de la generación, de x_t a x_(t-1).

    La red dice qué ruido ve en x_t. Solo se retira la parte que pertenece a este paso:
    (1 - alpha_t) / sqrt(1 - alpha_bar_t). Dividir entre sqrt(alpha_t) deshace el encogimiento del
    paso directo. Después se suma de vuelta un poco de ruido nuevo (sigma_t = sqrt(beta_t) aquí,
    una de las dos opciones del artículo): la red da la respuesta media, y sin ese ruido todos los
    puntos resbalarían hacia la misma media borrosa. `noise` es None en el último paso, en el que
    el resultado tiene que salir limpio.
    """
    steps = np.full(len(points), t, dtype=np.int64)
    guess = predict_noise(network, points, steps, schedule.steps)[-1]
    beta = schedule.betas[t]
    share = beta / math.sqrt(1.0 - schedule.alpha_bars[t])
    mean = (points - share * guess) / math.sqrt(schedule.alphas[t])
    return mean if noise is None else mean + math.sqrt(beta) * noise


def sample(
    trained: Trained,
    count: int = SAMPLE_COUNT,
    seed: int = SAMPLE_SEED,
    keep: tuple[int, ...] = (0,),
) -> dict[int, Array]:
    """EN: Generates `count` new points. It starts from pure Gaussian noise (step STEPS) and
    applies the reverse step STEPS times, calling the network once per step. That is why a
    diffusion model is slower than a model that answers in a single pass. Returns the points at
    the steps in `keep`; step 0 is the final result.

    PT: Gera `count` pontos novos. Parte de ruído gaussiano puro (passo STEPS) e aplica o passo
    reverso STEPS vezes, chamando a rede uma vez por passo. É por isso que um modelo de difusão é
    mais lento que um modelo que responde em uma passada só. Devolve os pontos nos passos de
    `keep`; o passo 0 é o resultado final.

    ES: Genera `count` puntos nuevos. Parte de ruido gaussiano puro (paso STEPS) y aplica el paso
    inverso STEPS veces, llamando a la red una vez por paso. Por eso un modelo de difusión es más
    lento que un modelo que responde en una sola pasada. Devuelve los puntos en los pasos de
    `keep`; el paso 0 es el resultado final.
    """
    rng = np.random.default_rng(seed)
    schedule = trained.schedule
    points = rng.standard_normal((count, 2))
    kept = {schedule.steps: points} if schedule.steps in keep else {}
    for t in range(schedule.steps, 0, -1):
        noise = rng.standard_normal(points.shape) if t > 1 else None
        points = reverse_step(trained.network, points, t, schedule, noise)
        if t - 1 in keep:
            kept[t - 1] = points
    return kept


def ring_distance(points: Array) -> float:
    """EN: Mean distance from the points to the ring: |length of the point - radius|.

    PT: Distância média dos pontos até o anel: |comprimento do ponto - raio|.

    ES: Distancia media de los puntos al anillo: |longitud del punto - radio|.
    """
    return float(np.mean(np.abs(np.linalg.norm(points, axis=1) - RING_RADIUS)))


def sector_counts(points: Array, sectors: int = SECTORS) -> list[int]:
    """EN: Cuts the plane into equal slices, like a pizza, and counts the points in each one.

    A small mean distance is not enough: a model that puts every point on the same spot of the
    ring would have it too. An empty slice reveals that failure.

    PT: Corta o plano em fatias iguais, como uma pizza, e conta os pontos de cada uma.

    Uma distância média pequena não basta: um modelo que põe todos os pontos no mesmo lugar do
    anel também a teria. Uma fatia vazia revela essa falha.

    ES: Corta el plano en porciones iguales, como una pizza, y cuenta los puntos de cada una.

    Una distancia media pequeña no basta: un modelo que pone todos los puntos en el mismo lugar
    del anillo también la tendría. Una porción vacía revela ese fallo.
    """
    angle = np.arctan2(points[:, 1], points[:, 0]) + math.pi
    index = np.minimum((angle / (2.0 * math.pi) * sectors).astype(np.int64), sectors - 1)
    return [int(value) for value in np.bincount(index, minlength=sectors)]


def normal_cdf(value: float) -> float:
    return 0.5 * (1.0 + math.erf(value / math.sqrt(2.0)))


def ks_statistic(values: Array) -> float:
    """EN: Kolmogorov-Smirnov statistic against the standard normal.

    Sort the values. After the i-th of n values, the share of the sample seen so far is i / n. A
    standard normal says that share should be normal_cdf(value). The statistic is the largest gap
    between the two, anywhere: 0 would be a perfect match. For a sample that really is normal it
    stays below about 1.95 / sqrt(n) in 999 of 1000 cases.

    PT: Estatística de Kolmogorov-Smirnov contra a normal padrão.

    Ordene os valores. Depois do i-ésimo de n valores, a parte da amostra já vista é i / n. Uma
    normal padrão diz que essa parte deveria ser normal_cdf(valor). A estatística é a maior
    diferença entre as duas, em qualquer lugar: 0 seria um encaixe perfeito. Para uma amostra que
    é mesmo normal ela fica abaixo de cerca de 1,95 / sqrt(n) em 999 de 1000 casos.

    ES: Estadístico de Kolmogorov-Smirnov contra la normal estándar.

    Ordena los valores. Después del i-ésimo de n valores, la parte de la muestra ya vista es i / n.
    Una normal estándar dice que esa parte debería ser normal_cdf(valor). El estadístico es la
    mayor diferencia entre las dos, en cualquier lugar: 0 sería un ajuste perfecto. Para una
    muestra que de verdad es normal queda por debajo de cerca de 1,95 / sqrt(n) en 999 de 1000
    casos.
    """
    ordered = np.sort(values)
    count = len(ordered)
    expected = np.array([normal_cdf(float(value)) for value in ordered])
    above = np.arange(1, count + 1) / count - expected
    below = expected - np.arange(0, count) / count
    return float(max(above.max(), below.max()))


@dataclass(frozen=True)
class GaussianReport:
    """EN: What a cloud of 2D points must show to pass for standard Gaussian noise.

    PT: O que uma nuvem de pontos 2D precisa mostrar para passar por ruído gaussiano padrão.

    ES: Lo que una nube de puntos 2D necesita mostrar para pasar por ruido gaussiano estándar.
    """

    mean: tuple[float, float]
    variance: tuple[float, float]
    xy_correlation: float
    start_correlation: tuple[float, float]
    within_one: tuple[float, float]
    within_two: tuple[float, float]
    ks: tuple[float, float]

    def failures(self, count: int) -> list[str]:
        """EN: The checks that fail, with tolerances for a sample of `count` points. Each
        tolerance is about 4 standard errors, so real noise passes almost always. An empty list
        means "these tests cannot tell the points from Gaussian noise".

        PT: As verificações que falham, com tolerâncias para uma amostra de `count` pontos. Cada
        tolerância vale cerca de 4 erros padrão, então ruído de verdade passa quase sempre. Uma
        lista vazia quer dizer "estes testes não distinguem os pontos de ruído gaussiano".

        ES: Las comprobaciones que fallan, con tolerancias para una muestra de `count` puntos. Cada
        tolerancia vale cerca de 4 errores estándar, así que el ruido de verdad pasa casi siempre.
        Una lista vacía quiere decir "estas pruebas no distinguen los puntos de ruido gaussiano".
        """
        unit = 1.0 / math.sqrt(count)
        checks = {
            "mean": max(abs(v) for v in self.mean) < 4.0 * unit,
            "variance": max(abs(v - 1.0) for v in self.variance) < 4.0 * math.sqrt(2.0) * unit,
            "xy_correlation": abs(self.xy_correlation) < 4.0 * unit,
            "start_correlation": max(abs(v) for v in self.start_correlation) < 4.0 * unit,
            "within_one": max(abs(v - 0.6827) for v in self.within_one) < 4.0 * 0.4654 * unit,
            "within_two": max(abs(v - 0.9545) for v in self.within_two) < 4.0 * 0.2084 * unit,
            "ks": max(self.ks) < 1.95 * unit,
        }
        return [name for name, passed in checks.items() if not passed]


def gaussian_report(points: Array, start: Array) -> GaussianReport:
    """EN: Measures `points` against a standard normal: mean 0 and variance 1 in each coordinate,
    no correlation between x and y, no correlation with the point each one started from (`start`),
    68.27% of the values within 1 and 95.45% within 2 standard deviations, and the KS statistic.

    PT: Mede `points` contra uma normal padrão: média 0 e variância 1 em cada coordenada, nenhuma
    correlação entre x e y, nenhuma correlação com o ponto de onde cada um partiu (`start`),
    68,27% dos valores a até 1 e 95,45% a até 2 desvios padrão, e a estatística KS.

    ES: Mide `points` contra una normal estándar: media 0 y varianza 1 en cada coordenada, ninguna
    correlación entre x e y, ninguna correlación con el punto del que partió cada uno (`start`),
    68,27% de los valores a hasta 1 y 95,45% a hasta 2 desviaciones estándar, y el estadístico KS.
    """

    def pair(values: Array) -> tuple[float, float]:
        return float(values[0]), float(values[1])

    def correlation(a: Array, b: Array) -> float:
        return float(np.corrcoef(a, b)[0, 1])

    return GaussianReport(
        mean=pair(points.mean(axis=0)),
        variance=pair(points.var(axis=0)),
        xy_correlation=correlation(points[:, 0], points[:, 1]),
        start_correlation=(
            correlation(points[:, 0], start[:, 0]),
            correlation(points[:, 1], start[:, 1]),
        ),
        within_one=pair(np.mean(np.abs(points) < 1.0, axis=0)),
        within_two=pair(np.mean(np.abs(points) < 2.0, axis=0)),
        ks=(ks_statistic(points[:, 0]), ks_statistic(points[:, 1])),
    )
