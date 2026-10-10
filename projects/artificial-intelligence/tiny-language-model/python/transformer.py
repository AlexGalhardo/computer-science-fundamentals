"""EN: A decoder-only transformer written with NumPy only: the forward pass AND the backward
pass (backpropagation) are spelled out by hand, with no automatic differentiation.

Shape names used in the comments: B = sequences in the batch, T = positions in a sequence,
D = size of each vector (d_model), H = attention heads, V = vocabulary size.

The model is "pre-norm": layer normalisation is applied BEFORE attention and before the MLP,
and the residual path (x = x + ...) is left untouched. This is the GPT-2 layout, and it trains
more easily than the "post-norm" layout of the original paper.

PT: Um transformer só-decodificador escrito apenas com NumPy: a passagem direta E a passagem
reversa (retropropagação) estão escritas à mão, sem diferenciação automática.

Nomes de formato usados nos comentários: B = sequências no lote, T = posições em uma sequência,
D = tamanho de cada vetor (d_model), H = cabeças de atenção, V = tamanho do vocabulário.

O modelo é "pre-norm": a normalização de camada é aplicada ANTES da atenção e antes do MLP, e o
caminho residual (x = x + ...) fica intacto. É o arranjo do GPT-2, e treina com mais facilidade
do que o arranjo "post-norm" do artigo original.

ES: Un transformer solo decodificador escrito únicamente con NumPy: el paso hacia adelante Y el
paso hacia atrás (retropropagación) están escritos a mano, sin diferenciación automática.

Nombres de forma usados en los comentarios: B = secuencias en el lote, T = posiciones en una
secuencia, D = tamaño de cada vector (d_model), H = cabezas de atención, V = tamaño del vocabulario.

El modelo es "pre-norm": la normalización de capa se aplica ANTES de la atención y antes del MLP, y
el camino residual (x = x + ...) queda intacto. Es la disposición de GPT-2, y se entrena con más
facilidad que la disposición "post-norm" del artículo original.
"""

from dataclasses import dataclass
from typing import Any

import numpy as np

Params = dict[str, np.ndarray]
Cache = dict[str, Any]
LAYER_NORM_EPSILON = 1e-5


@dataclass(frozen=True)
class Config:
    vocab_size: int
    # EN: The context window: how many previous tokens the model can look at.
    # PT: A janela de contexto: quantos tokens anteriores o modelo consegue olhar.
    # ES: La ventana de contexto: a cuántos tokens anteriores puede mirar el modelo.
    block_size: int = 32
    d_model: int = 48
    n_heads: int = 4
    n_layers: int = 2
    # EN: The hidden layer of the MLP is this many times wider than d_model.
    # PT: A camada escondida do MLP é esta quantidade de vezes mais larga que d_model.
    # ES: La capa oculta del MLP es esta cantidad de veces más ancha que d_model.
    mlp_ratio: int = 4


def init_params(config: Config, seed: int, dtype: type = np.float32, std: float = 0.02) -> Params:
    """EN: Small random weights, zero biases, layer-norm gains at 1.

    Training uses float32 (half the memory, faster). The gradient check uses float64, because
    it subtracts two almost equal numbers and needs the extra digits.

    PT: Pesos aleatórios pequenos, vieses em zero, ganhos da normalização em 1.

    O treino usa float32 (metade da memória, mais rápido). A checagem de gradiente usa float64,
    porque subtrai dois números quase iguais e precisa dos dígitos a mais.

    ES: Pesos aleatorios pequeños, sesgos en cero, ganancias de la normalización en 1.

    El entrenamiento usa float32 (la mitad de la memoria, más rápido). La comprobación del gradiente
    usa float64, porque resta dos números casi iguales y necesita los dígitos de más.
    """
    rng = np.random.default_rng(seed)
    d, hidden = config.d_model, config.d_model * config.mlp_ratio

    def weights(*shape: int) -> np.ndarray:
        return (rng.standard_normal(shape) * std).astype(dtype)

    def zeros(*shape: int) -> np.ndarray:
        return np.zeros(shape, dtype=dtype)

    def ones(*shape: int) -> np.ndarray:
        return np.ones(shape, dtype=dtype)

    params: Params = {
        "tok_emb": weights(config.vocab_size, d),
        "pos_emb": weights(config.block_size, d),
    }
    for layer in range(config.n_layers):
        p = f"b{layer}."
        params[p + "ln1_gain"], params[p + "ln1_bias"] = ones(d), zeros(d)
        params[p + "w_query"] = weights(d, d)
        params[p + "w_key"] = weights(d, d)
        params[p + "w_value"] = weights(d, d)
        params[p + "w_proj"], params[p + "b_proj"] = weights(d, d), zeros(d)
        params[p + "ln2_gain"], params[p + "ln2_bias"] = ones(d), zeros(d)
        params[p + "w_mlp1"], params[p + "b_mlp1"] = weights(d, hidden), zeros(hidden)
        params[p + "w_mlp2"], params[p + "b_mlp2"] = weights(hidden, d), zeros(d)
    params["lnf_gain"], params["lnf_bias"] = ones(d), zeros(d)
    params["w_out"], params["b_out"] = weights(d, config.vocab_size), zeros(config.vocab_size)
    return params


def count_parameters(params: Params) -> int:
    return sum(value.size for value in params.values())


def softmax(scores: np.ndarray) -> np.ndarray:
    # EN: Subtracting the largest score changes nothing in the result and keeps exp() from
    #     overflowing. exp(-inf) is exactly 0, which is how the causal mask removes the future.
    # PT: Subtrair o maior valor não muda o resultado e evita que exp() estoure. exp(-inf) é
    #     exatamente 0, e é assim que a máscara causal remove o futuro.
    # ES: Restar el mayor valor no cambia el resultado y evita que exp() se desborde. exp(-inf) es
    #     exactamente 0, y así es como la máscara causal elimina el futuro.
    shifted = scores - scores.max(axis=-1, keepdims=True)
    exponentials = np.exp(shifted)
    return exponentials / exponentials.sum(axis=-1, keepdims=True)


def layer_norm(x: np.ndarray, gain: np.ndarray, bias: np.ndarray) -> tuple[np.ndarray, Cache]:
    """EN: Rescales each vector to mean 0 and variance 1, then applies a learned gain and bias.
    It keeps the numbers in a steady range from layer to layer, which keeps training stable.

    PT: Reescala cada vetor para média 0 e variância 1, depois aplica um ganho e um viés
    aprendidos. Mantém os números em uma faixa estável de camada em camada, o que estabiliza o
    treino.

    ES: Reescala cada vector a media 0 y varianza 1, luego aplica una ganancia y un sesgo
    aprendidos. Mantiene los números en un rango estable de capa en capa, lo que estabiliza el
    entrenamiento.
    """
    mean = x.mean(axis=-1, keepdims=True)
    std = np.sqrt(x.var(axis=-1, keepdims=True) + LAYER_NORM_EPSILON)
    normalised = (x - mean) / std
    return gain * normalised + bias, {"normalised": normalised, "std": std, "gain": gain}


def layer_norm_backward(
    d_out: np.ndarray, cache: Cache
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """EN: Returns the gradients of (input, gain, bias).

    The input gradient has three terms because each input number acts on the output three ways:
    directly, through the mean, and through the standard deviation.

    PT: Devolve os gradientes de (entrada, ganho, viés).

    O gradiente da entrada tem três termos porque cada número de entrada age na saída de três
    jeitos: direto, pela média e pelo desvio padrão.

    ES: Devuelve los gradientes de (entrada, ganancia, sesgo).

    El gradiente de la entrada tiene tres términos porque cada número de entrada actúa sobre la
    salida de tres maneras: directa, por la media y por la desviación estándar.
    """
    normalised, std = cache["normalised"], cache["std"]
    d_gain = (d_out * normalised).sum(axis=0)
    d_bias = d_out.sum(axis=0)
    d_norm = d_out * cache["gain"]
    d_x = (
        d_norm
        - d_norm.mean(axis=-1, keepdims=True)
        - normalised * (d_norm * normalised).mean(axis=-1, keepdims=True)
    ) / std
    return d_x, d_gain, d_bias


def split_heads(x: np.ndarray, batch: int, n_heads: int) -> np.ndarray:
    # EN: (B*T, D) -> (B, H, T, D/H): the vector is cut into H slices, one per head, and the
    #     rows are regrouped by sequence, because attention works inside one sequence.
    # PT: (B*T, D) -> (B, H, T, D/H): o vetor é cortado em H fatias, uma por cabeça, e as
    #     linhas são reagrupadas por sequência, porque a atenção trabalha dentro de uma sequência.
    # ES: (B*T, D) -> (B, H, T, D/H): el vector se corta en H porciones, una por cabeza, y las
    #     filas se reagrupan por secuencia, porque la atención trabaja dentro de una secuencia.
    return x.reshape(batch, -1, n_heads, x.shape[-1] // n_heads).transpose(0, 2, 1, 3)


def merge_heads(x: np.ndarray) -> np.ndarray:
    b, h, t, head_size = x.shape
    return x.transpose(0, 2, 1, 3).reshape(b * t, h * head_size)


def forward(params: Params, config: Config, tokens: np.ndarray) -> tuple[np.ndarray, Cache]:
    """EN: tokens (B, T) of ids -> logits (B, T, V): at every position, one score per token of
    the vocabulary for "what comes next". The cache keeps what the backward pass will need.

    PT: tokens (B, T) de ids -> logits (B, T, V): em cada posição, uma nota por token do
    vocabulário para "o que vem depois". O cache guarda o que a passagem reversa vai precisar.

    ES: tokens (B, T) de ids -> logits (B, T, V): en cada posición, una puntuación por token del
    vocabulario para "qué viene después". El caché guarda lo que necesitará el paso hacia atrás.
    """
    b, t = tokens.shape
    head_size = config.d_model // config.n_heads
    # EN: Attention by itself sees a bag of tokens with no order, so a learned vector for the
    #     position is ADDED to the vector of the token.
    # PT: A atenção sozinha vê um saco de tokens sem ordem, então um vetor aprendido para a
    #     posição é SOMADO ao vetor do token.
    # ES: La atención por sí sola ve una bolsa de tokens sin orden, así que un vector aprendido
    #     para la posición se SUMA al vector del token.
    x = params["tok_emb"][tokens] + params["pos_emb"][:t]
    # EN: From here on every position of every sequence is one row: (B*T, D). The layers below
    #     treat each row alone. Only attention needs to know which rows share a sequence.
    # PT: Daqui em diante cada posição de cada sequência é uma linha: (B*T, D). As camadas
    #     abaixo tratam cada linha sozinha. Só a atenção precisa saber quais linhas são da
    #     mesma sequência.
    # ES: De aquí en adelante cada posición de cada secuencia es una fila: (B*T, D). Las capas de
    #     abajo tratan cada fila por separado. Solo la atención necesita saber qué filas son de la
    #     misma secuencia.
    x = x.reshape(b * t, config.d_model)
    # EN: The causal mask: row i (the position that asks) may look at column j only when
    #     j <= i. A lower-triangular matrix of True values says exactly that.
    # PT: A máscara causal: a linha i (a posição que pergunta) só pode olhar a coluna j quando
    #     j <= i. Uma matriz triangular inferior de valores True diz exatamente isso.
    # ES: La máscara causal: la fila i (la posición que pregunta) solo puede mirar la columna j
    #     cuando j <= i. Una matriz triangular inferior de valores True dice exactamente eso.
    mask = np.tril(np.ones((t, t), dtype=bool))
    blocks: list[Cache] = []
    for layer in range(config.n_layers):
        p = f"b{layer}."
        c: Cache = {}
        # --- EN: attention: tokens exchange information / PT: atenção: tokens trocam informação
        # --- ES: atención: los tokens intercambian información
        a, c["ln1"] = layer_norm(x, params[p + "ln1_gain"], params[p + "ln1_bias"])
        # EN: Three views of the same vector. Query: "what am I looking for?". Key: "what do I
        #     offer?". Value: "what I pass on if I am chosen".
        # PT: Três visões do mesmo vetor. Query: "o que eu procuro?". Key: "o que eu ofereço?".
        #     Value: "o que eu repasso se for escolhido".
        # ES: Tres vistas del mismo vector. Query: "¿qué busco?". Key: "¿qué ofrezco?".
        #     Value: "lo que transmito si me eligen".
        query = split_heads(a @ params[p + "w_query"], b, config.n_heads)
        key = split_heads(a @ params[p + "w_key"], b, config.n_heads)
        value = split_heads(a @ params[p + "w_value"], b, config.n_heads)
        # EN: scores[i, j] = dot product of the query of position i with the key of position j.
        #     Dividing by sqrt(head size) keeps the scores from growing with the vector size.
        # PT: scores[i, j] = produto escalar da query da posição i com a key da posição j.
        #     Dividir por sqrt(tamanho da cabeça) evita que as notas cresçam com o vetor.
        # ES: scores[i, j] = producto punto de la query de la posición i con la key de la
        #     posición j. Dividir entre sqrt(tamaño de la cabeza) evita que las puntuaciones
        #     crezcan con el vector.
        scores = query @ key.transpose(0, 1, 3, 2) / head_size**0.5
        # EN: Future positions get minus infinity, so softmax gives them weight exactly 0.
        # PT: Posições futuras recebem menos infinito, então o softmax dá a elas peso 0 exato.
        # ES: Las posiciones futuras reciben menos infinito, así que el softmax les da peso 0
        #     exacto.
        scores = np.where(mask, scores, -np.inf)
        weights = softmax(scores)  # (B, H, T, T), each row sums to 1
        # EN: The output of a position is the average of the values, weighted by its row.
        # PT: A saída de uma posição é a média dos values, ponderada pela linha dela.
        # ES: La salida de una posición es el promedio de los values, ponderado por su fila.
        context = merge_heads(weights @ value)
        x_mid = x + context @ params[p + "w_proj"] + params[p + "b_proj"]
        # --- EN: MLP: each position "thinks" alone / PT: MLP: cada posição "pensa" sozinha
        # --- ES: MLP: cada posición "piensa" por sí sola
        m, c["ln2"] = layer_norm(x_mid, params[p + "ln2_gain"], params[p + "ln2_bias"])
        pre_activation = m @ params[p + "w_mlp1"] + params[p + "b_mlp1"]
        hidden = np.maximum(pre_activation, 0)  # ReLU
        x = x_mid + hidden @ params[p + "w_mlp2"] + params[p + "b_mlp2"]
        c.update(a=a, query=query, key=key, value=value, weights=weights, context=context)
        c.update(m=m, pre_activation=pre_activation, hidden=hidden)
        blocks.append(c)
    final, ln_final = layer_norm(x, params["lnf_gain"], params["lnf_bias"])
    logits = (final @ params["w_out"] + params["b_out"]).reshape(b, t, config.vocab_size)
    return logits, {"tokens": tokens, "blocks": blocks, "final": final, "ln_final": ln_final}


def cross_entropy(logits: np.ndarray, targets: np.ndarray) -> tuple[float, np.ndarray]:
    """EN: The loss, and its gradient with respect to the logits.

    loss = mean of -ln(probability given to the token that really came). The gradient has a
    famous simple form: (probabilities - one-hot of the right answer) / number of predictions.

    PT: A perda, e o gradiente dela em relação aos logits.

    perda = média de -ln(probabilidade dada ao token que realmente veio). O gradiente tem uma
    forma simples e famosa: (probabilidades - one-hot da resposta certa) / número de previsões.

    ES: La pérdida, y su gradiente respecto a los logits.

    pérdida = media de -ln(probabilidad dada al token que realmente vino). El gradiente tiene una
    forma simple y famosa: (probabilidades - one-hot de la respuesta correcta) / número de
    predicciones.
    """
    b, t, _ = logits.shape
    probabilities = softmax(logits)
    rows, columns = np.arange(b)[:, None], np.arange(t)[None, :]
    loss = float(-np.log(probabilities[rows, columns, targets]).mean())
    d_logits = probabilities.copy()
    d_logits[rows, columns, targets] -= 1
    return loss, d_logits / (b * t)


def backward(params: Params, config: Config, cache: Cache, d_logits: np.ndarray) -> Params:
    """EN: Backpropagation: walks the forward pass in reverse order and applies the chain rule
    at each step. For every array created in the forward pass there is one `d_...` array here,
    with the same shape, saying "how much the loss changes if this number grows a little".

    Two rules cover almost everything:
    - for y = x @ W:   d_W = x^T @ d_y   and   d_x = d_y @ W^T
    - for y = x + f(x) (a residual connection): the gradient of x is the SUM of both paths.

    PT: Retropropagação: percorre a passagem direta de trás para frente e aplica a regra da
    cadeia em cada passo. Para cada array criado na ida existe aqui um array `d_...`, com o
    mesmo formato, que diz "quanto a perda muda se este número crescer um pouco".

    Duas regras cobrem quase tudo:
    - para y = x @ W:   d_W = x^T @ d_y   e   d_x = d_y @ W^T
    - para y = x + f(x) (uma conexão residual): o gradiente de x é a SOMA dos dois caminhos.

    ES: Retropropagación: recorre el paso hacia adelante de atrás hacia delante y aplica la regla
    de la cadena en cada paso. Para cada arreglo creado en la ida existe aquí un arreglo `d_...`,
    con la misma forma, que dice "cuánto cambia la pérdida si este número crece un poco".

    Dos reglas cubren casi todo:
    - para y = x @ W:   d_W = x^T @ d_y   y   d_x = d_y @ W^T
    - para y = x + f(x) (una conexión residual): el gradiente de x es la SUMA de los dos caminos.
    """
    b, t = cache["tokens"].shape
    head_size = config.d_model // config.n_heads
    grads: Params = {}
    # EN: As in the forward pass, one row per position: (B*T, ...).
    # PT: Como na passagem direta, uma linha por posição: (B*T, ...).
    # ES: Como en el paso hacia adelante, una fila por posición: (B*T, ...).
    d_logits = d_logits.reshape(b * t, config.vocab_size)
    grads["w_out"] = cache["final"].T @ d_logits
    grads["b_out"] = d_logits.sum(axis=0)
    d_final = d_logits @ params["w_out"].T
    d_x, grads["lnf_gain"], grads["lnf_bias"] = layer_norm_backward(d_final, cache["ln_final"])

    for layer in reversed(range(config.n_layers)):
        p = f"b{layer}."
        c = cache["blocks"][layer]
        # --- MLP
        grads[p + "w_mlp2"] = c["hidden"].T @ d_x
        grads[p + "b_mlp2"] = d_x.sum(axis=0)
        d_hidden = d_x @ params[p + "w_mlp2"].T
        # EN: ReLU lets the gradient through only where its input was positive.
        # PT: A ReLU só deixa o gradiente passar onde a entrada dela foi positiva.
        # ES: La ReLU solo deja pasar el gradiente donde su entrada fue positiva.
        d_pre = d_hidden * (c["pre_activation"] > 0)
        grads[p + "w_mlp1"] = c["m"].T @ d_pre
        grads[p + "b_mlp1"] = d_pre.sum(axis=0)
        d_m = d_pre @ params[p + "w_mlp1"].T
        d_ln2, grads[p + "ln2_gain"], grads[p + "ln2_bias"] = layer_norm_backward(d_m, c["ln2"])
        d_x = d_x + d_ln2  # residual: both paths add up
        # --- attention
        grads[p + "w_proj"] = c["context"].T @ d_x
        grads[p + "b_proj"] = d_x.sum(axis=0)
        d_context = split_heads(d_x @ params[p + "w_proj"].T, b, config.n_heads)
        # EN: context = weights @ value, so both factors get a gradient.
        # PT: context = weights @ value, então os dois fatores recebem gradiente.
        # ES: context = weights @ value, así que los dos factores reciben gradiente.
        d_weights = d_context @ c["value"].transpose(0, 1, 3, 2)
        d_value = c["weights"].transpose(0, 1, 3, 2) @ d_context
        # EN: Softmax backward, row by row: d_scores = w * (d_w - sum(d_w * w)). Masked cells
        #     have w = 0, so their gradient is 0: nothing is learned from the future.
        # PT: Softmax de trás para frente, linha a linha: d_scores = w * (d_w - soma(d_w * w)).
        #     Células mascaradas têm w = 0, então o gradiente é 0: nada se aprende do futuro.
        # ES: Softmax hacia atrás, fila a fila: d_scores = w * (d_w - suma(d_w * w)). Las celdas
        #     enmascaradas tienen w = 0, así que su gradiente es 0: no se aprende nada del futuro.
        w = c["weights"]
        d_scores = w * (d_weights - (d_weights * w).sum(axis=-1, keepdims=True))
        d_scores = d_scores / head_size**0.5
        d_query = merge_heads(d_scores @ c["key"])
        d_key = merge_heads(d_scores.transpose(0, 1, 3, 2) @ c["query"])
        d_value = merge_heads(d_value)
        grads[p + "w_query"] = c["a"].T @ d_query
        grads[p + "w_key"] = c["a"].T @ d_key
        grads[p + "w_value"] = c["a"].T @ d_value
        d_a = (
            d_query @ params[p + "w_query"].T
            + d_key @ params[p + "w_key"].T
            + d_value @ params[p + "w_value"].T
        )
        d_ln1, grads[p + "ln1_gain"], grads[p + "ln1_bias"] = layer_norm_backward(d_a, c["ln1"])
        d_x = d_x + d_ln1

    # EN: x = tok_emb[tokens] + pos_emb. A position vector is used once per sequence, so its
    #     gradient is the sum over the batch. A token vector is used wherever that token
    #     appears, so its gradient is the sum over those rows. Looking a row up in a table is
    #     the same as multiplying a one-hot vector by the table, which is why the sum can be
    #     written as one matrix product.
    # PT: x = tok_emb[tokens] + pos_emb. Um vetor de posição é usado uma vez por sequência,
    #     então o gradiente é a soma no lote. Um vetor de token é usado onde quer que o token
    #     apareça, então o gradiente é a soma nessas linhas. Buscar uma linha em uma tabela é
    #     o mesmo que multiplicar um vetor one-hot pela tabela, e por isso a soma pode ser
    #     escrita como um único produto de matrizes.
    # ES: x = tok_emb[tokens] + pos_emb. Un vector de posición se usa una vez por secuencia, así
    #     que el gradiente es la suma en el lote. Un vector de token se usa dondequiera que el token
    #     aparezca, así que el gradiente es la suma en esas filas. Buscar una fila en una tabla es
    #     lo mismo que multiplicar un vector one-hot por la tabla, y por eso la suma se puede
    #     escribir como un único producto de matrices.
    grads["pos_emb"] = np.zeros_like(params["pos_emb"])
    grads["pos_emb"][:t] = d_x.reshape(b, t, config.d_model).sum(axis=0)
    one_hot = np.zeros((b * t, config.vocab_size), dtype=d_x.dtype)
    one_hot[np.arange(b * t), cache["tokens"].reshape(-1)] = 1
    grads["tok_emb"] = one_hot.T @ d_x
    return grads


def loss_and_grads(
    params: Params, config: Config, tokens: np.ndarray, targets: np.ndarray
) -> tuple[float, Params]:
    logits, cache = forward(params, config, tokens)
    loss, d_logits = cross_entropy(logits, targets)
    return loss, backward(params, config, cache, d_logits)


class Adam:
    """EN: The Adam optimiser, by hand. Plain gradient descent does `w -= lr * gradient`. Adam
    keeps two running averages per weight: of the gradient (`m`, the direction that has been
    consistent lately) and of the squared gradient (`v`, how big the gradient usually is), and
    steps by m / sqrt(v). Every weight gets a step of a similar size, whatever its scale.

    PT: O otimizador Adam, à mão. A descida do gradiente simples faz `w -= lr * gradiente`. O
    Adam guarda duas médias móveis por peso: do gradiente (`m`, a direção que tem sido
    consistente) e do gradiente ao quadrado (`v`, o tamanho usual do gradiente), e anda
    m / sqrt(v). Todo peso recebe um passo de tamanho parecido, qualquer que seja a sua escala.

    ES: El optimizador Adam, a mano. El descenso de gradiente simple hace `w -= lr * gradiente`.
    Adam guarda dos medias móviles por peso: del gradiente (`m`, la dirección que ha sido
    consistente) y del gradiente al cuadrado (`v`, el tamaño usual del gradiente), y avanza
    m / sqrt(v). Todo peso recibe un paso de tamaño parecido, sea cual sea su escala.
    """

    def __init__(
        self, params: Params, beta1: float = 0.9, beta2: float = 0.999, epsilon: float = 1e-8
    ) -> None:
        self.beta1, self.beta2, self.epsilon = beta1, beta2, epsilon
        self.m = {name: np.zeros_like(value) for name, value in params.items()}
        self.v = {name: np.zeros_like(value) for name, value in params.items()}
        self.step_count = 0

    def step(self, params: Params, grads: Params, learning_rate: float) -> None:
        self.step_count += 1
        # EN: Both averages start at 0, so the first ones are too small. Dividing by
        #     (1 - beta^step) corrects that bias.
        # PT: As duas médias começam em 0, então as primeiras saem pequenas demais. Dividir por
        #     (1 - beta^passo) corrige esse viés.
        # ES: Las dos medias empiezan en 0, así que las primeras salen demasiado pequeñas. Dividir
        #     entre (1 - beta^paso) corrige ese sesgo.
        correction1 = 1 - self.beta1**self.step_count
        correction2 = 1 - self.beta2**self.step_count
        for name, grad in grads.items():
            self.m[name] = self.beta1 * self.m[name] + (1 - self.beta1) * grad
            self.v[name] = self.beta2 * self.v[name] + (1 - self.beta2) * grad * grad
            m_hat = self.m[name] / correction1
            v_hat = self.v[name] / correction2
            params[name] -= learning_rate * m_hat / (np.sqrt(v_hat) + self.epsilon)


def get_batch(
    ids: np.ndarray, block_size: int, batch_size: int, rng: np.random.Generator
) -> tuple[np.ndarray, np.ndarray]:
    """EN: Random windows of the text. The targets are the same window shifted by one: at each
    position the right answer is simply the character that comes next. No labels are needed.

    PT: Janelas aleatórias do texto. Os alvos são a mesma janela deslocada em um: em cada
    posição a resposta certa é só o caractere que vem depois. Não é preciso rótulo nenhum.

    ES: Ventanas aleatorias del texto. Los objetivos son la misma ventana desplazada en uno: en
    cada posición la respuesta correcta es solo el carácter que viene después. No hace falta
    ninguna etiqueta.
    """
    starts = rng.integers(0, len(ids) - block_size, size=batch_size)
    positions = starts[:, None] + np.arange(block_size)[None, :]
    return ids[positions], ids[positions + 1]


def evaluate(params: Params, config: Config, ids: np.ndarray) -> float:
    """EN: Mean cross-entropy (nats) over the whole text, cut into consecutive windows.

    Every character except the first is predicted exactly once, the same targets the bigram is
    scored on. The first characters of each window are predicted with little context (the very
    first one with a single character, like a bigram), so this number is, if anything, a bit
    pessimistic for the transformer.

    PT: Entropia cruzada média (nats) no texto inteiro, cortado em janelas consecutivas.

    Todo caractere, menos o primeiro, é previsto exatamente uma vez, os mesmos alvos em que o
    bigrama é avaliado. Os primeiros caracteres de cada janela são previstos com pouco contexto
    (o primeiro de todos com um único caractere, como um bigrama), então este número é, se
    tanto, um pouco pessimista para o transformer.

    ES: Entropía cruzada media (nats) en el texto entero, cortado en ventanas consecutivas.

    Todo carácter, menos el primero, se predice exactamente una vez, los mismos objetivos en que se
    evalúa el bigrama. Los primeros caracteres de cada ventana se predicen con poco contexto (el
    primero de todos con un único carácter, como un bigrama), así que este número es, si acaso,
    algo pesimista para el transformer.
    """
    total, count = 0.0, 0
    full = (len(ids) - 1) // config.block_size
    pieces = []
    if full:
        end = full * config.block_size
        shape = (full, config.block_size)
        pieces.append((ids[:end].reshape(shape), ids[1 : end + 1].reshape(shape)))
    rest = len(ids) - 1 - full * config.block_size
    if rest:
        pieces.append((ids[-rest - 1 : -1][None, :], ids[-rest:][None, :]))
    for tokens, targets in pieces:
        logits, _ = forward(params, config, tokens)
        loss, _ = cross_entropy(logits.astype(np.float64), targets)
        total += loss * targets.size
        count += targets.size
    return total / count


@dataclass(frozen=True)
class LossPoint:
    step: int
    train_loss: float
    heldout_loss: float


def train(
    config: Config,
    train_ids: np.ndarray,
    heldout_ids: np.ndarray,
    *,
    steps: int,
    batch_size: int,
    learning_rate: float,
    seed: int,
    log_every: int = 100,
) -> tuple[Params, list[LossPoint]]:
    """EN: The training loop: draw a batch, measure the loss, backpropagate, let Adam move
    every weight a little, repeat. The learning rate falls in a straight line to 10% of its
    starting value: big steps while the model knows nothing, small ones to settle.

    PT: O laço de treino: sorteia um lote, mede a perda, retropropaga, deixa o Adam mexer um
    pouco em cada peso, repete. A taxa de aprendizado cai em linha reta até 10% do valor
    inicial: passos grandes enquanto o modelo não sabe nada, pequenos para assentar.

    ES: El bucle de entrenamiento: sortea un lote, mide la pérdida, retropropaga, deja que Adam
    mueva un poco cada peso, repite. La tasa de aprendizaje cae en línea recta hasta 10% del valor
    inicial: pasos grandes mientras el modelo no sabe nada, pequeños para asentarse.
    """
    params = init_params(config, seed)
    optimiser = Adam(params)
    rng = np.random.default_rng(seed + 1)
    history = [
        LossPoint(
            0, evaluate(params, config, train_ids[:4000]), evaluate(params, config, heldout_ids)
        )
    ]
    recent: list[float] = []
    for step in range(1, steps + 1):
        tokens, targets = get_batch(train_ids, config.block_size, batch_size, rng)
        loss, grads = loss_and_grads(params, config, tokens, targets)
        optimiser.step(params, grads, learning_rate * (1 - 0.9 * (step - 1) / steps))
        recent.append(loss)
        if step % log_every == 0 or step == steps:
            # EN: The training loss is the mean of the batches since the last point.
            # PT: A perda de treino é a média dos lotes desde o último ponto.
            # ES: La pérdida de entrenamiento es la media de los lotes desde el último punto.
            train_loss = float(np.mean(recent))
            history.append(LossPoint(step, train_loss, evaluate(params, config, heldout_ids)))
            recent = []
    return params, history
