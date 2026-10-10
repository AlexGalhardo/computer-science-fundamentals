import math
from collections import Counter


# EN: Order-0 Shannon entropy, H = sum of p * log2(1/p) over the byte values that appear.
#     "Order 0" means that each byte is looked at alone: only how often a value occurs matters,
#     not what comes before it. The result is the average number of bits per byte that any
#     symbol-by-symbol code (such as Huffman) needs at least. It goes from 0 (one value only)
#     to 8 (all 256 values equally frequent).
# PT: Entropia de Shannon de ordem 0, H = soma de p * log2(1/p) sobre os valores de byte que
#     aparecem. "Ordem 0" significa que cada byte é olhado sozinho: só importa a frequência do
#     valor, e não o que vem antes dele. O resultado é o número médio de bits por byte que
#     qualquer código símbolo a símbolo (como Huffman) precisa no mínimo. Vai de 0 (um único
#     valor) a 8 (os 256 valores igualmente frequentes).
# ES: Entropía de Shannon de orden 0, H = suma de p * log2(1/p) sobre los valores de byte que
#     aparecen. "Orden 0" significa que cada byte se mira por separado: solo importa la
#     frecuencia del valor, y no lo que viene antes. El resultado es el número promedio de bits
#     por byte que cualquier código símbolo a símbolo (como Huffman) necesita como mínimo. Va de
#     0 (un único valor) a 8 (los 256 valores igualmente frecuentes).
def bits_per_byte(data: bytes) -> float:
    if not data:
        return 0.0
    total = len(data)
    return sum((count / total) * math.log2(total / count) for count in Counter(data).values())


def bound_bytes(data: bytes) -> float:
    """EN: The entropy bound for the whole input, in bytes.
    PT: O limite para a entrada toda.
    ES: El límite para toda la entrada.
    """
    return bits_per_byte(data) * len(data) / 8
