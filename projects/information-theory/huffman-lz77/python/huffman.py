import heapq
from collections import Counter

# EN: File format: 8 bytes with the original size, 256 bytes with the code length of each byte
#     value (0 = the value does not appear), then the codes packed bit by bit. The header costs
#     264 bytes whatever the input, which is why tiny or random files grow when "compressed".
# PT: Formato do arquivo: 8 bytes com o tamanho original, 256 bytes com o comprimento do código
#     de cada valor de byte (0 = o valor não aparece), e depois os códigos empacotados bit a
#     bit. O cabeçalho custa 264 bytes para qualquer entrada, e é por isso que arquivos
#     minúsculos ou aleatórios crescem ao serem "comprimidos".
HEADER_LEN = 8 + 256


class DecodeError(ValueError):
    """EN: The compressed input is damaged. PT: A entrada comprimida está danificada."""


# EN: The Huffman algorithm. Start with one node per byte value that appears, weighted by its
#     count. Repeatedly take the two lightest nodes and join them under a new node whose weight
#     is the sum. Rare values are joined first, so they end up deeper in the tree, and the depth
#     of a leaf is the length of its code. The heap gives the two lightest in O(log n).
#     Ties are broken by node id (byte value for leaves, creation order for joined nodes), so
#     the Rust and the Python versions build exactly the same tree.
# PT: O algoritmo de Huffman. Comece com um nó por valor de byte que aparece, com peso igual à
#     sua contagem. Repetidamente, retire os dois nós mais leves e una-os sob um nó novo cujo
#     peso é a soma. Valores raros são unidos primeiro, então ficam mais fundos na árvore, e a
#     profundidade de uma folha é o comprimento do seu código. O heap entrega os dois mais leves
#     em O(log n). Empates são decididos pelo id do nó (valor do byte nas folhas, ordem de
#     criação nos nós unidos), então as versões em Rust e em Python montam a mesma árvore.
def code_lengths(counts: dict[int, int]) -> list[int]:
    lengths = [0] * 256
    heap = [(count, symbol) for symbol, count in counts.items() if count > 0]
    heapq.heapify(heap)

    # EN: A file with one distinct value still needs a 1-bit code: a 0-bit code could not be
    #     told apart from "value absent" in the header.
    # PT: Um arquivo com um único valor distinto ainda precisa de um código de 1 bit: um código
    #     de 0 bit não se distinguiria de "valor ausente" no cabeçalho.
    if len(heap) == 1:
        lengths[heap[0][1]] = 1
        return lengths

    # children[i] holds the two children of the joined node with id 256 + i.
    children: list[tuple[int, int]] = []
    while len(heap) > 1:
        weight_a, a = heapq.heappop(heap)
        weight_b, b = heapq.heappop(heap)
        children.append((a, b))
        heapq.heappush(heap, (weight_a + weight_b, 255 + len(children)))

    # EN: Walk down from the root. Every step down adds one bit to the code.
    # PT: Desce a partir da raiz. Cada passo para baixo acrescenta um bit ao código.
    stack = [(heap[0][1], 0)] if heap else []
    while stack:
        node, depth = stack.pop()
        if node < 256:
            lengths[node] = depth
        else:
            a, b = children[node - 256]
            stack.append((a, depth + 1))
            stack.append((b, depth + 1))
    return lengths


# EN: Canonical Huffman. The tree itself is not stored: the code lengths are enough, because
#     both sides agree on one rule to turn lengths into codes. Sort the symbols by (length,
#     value) and count upwards, appending zeros whenever the length grows. The result is a
#     prefix code with exactly the lengths the tree gave.
# PT: Huffman canônico. A árvore em si não é gravada: os comprimentos dos códigos bastam, porque
#     os dois lados combinam uma regra para transformar comprimentos em códigos. Ordene os
#     símbolos por (comprimento, valor) e conte para cima, acrescentando zeros sempre que o
#     comprimento cresce. O resultado é um código de prefixo com exatamente os comprimentos que
#     a árvore deu.
def canonical_codes(lengths: list[int]) -> dict[int, tuple[int, int]]:
    """Maps each symbol to (length, code)."""
    codes: dict[int, tuple[int, int]] = {}
    code = 0
    previous = 0
    for symbol in sorted((s for s in range(256) if lengths[s] > 0), key=lambda s: (lengths[s], s)):
        code <<= lengths[symbol] - previous
        codes[symbol] = (lengths[symbol], code)
        code += 1
        previous = lengths[symbol]
    return codes


def encode(data: bytes) -> bytes:
    lengths = code_lengths(Counter(data))
    codes = canonical_codes(lengths)

    # EN: Python integers have no size limit, so the whole body is built as one big number:
    #     shift left by the code length and add the code. The first code ends up in the highest
    #     bits, the same order the Rust version writes bit by bit.
    # PT: Os inteiros do Python não têm limite de tamanho, então o corpo inteiro é montado como
    #     um único número grande: desloca à esquerda pelo comprimento do código e soma o código.
    #     O primeiro código fica nos bits mais altos, a mesma ordem que a versão em Rust escreve
    #     bit a bit.
    body = 0
    bits = 0
    for byte in data:
        length, code = codes[byte]
        body = (body << length) | code
        bits += length
    padding = -bits % 8
    body <<= padding

    header = len(data).to_bytes(8, "little") + bytes(lengths)
    return header + body.to_bytes((bits + padding) // 8, "big")


def decode(packed: bytes) -> bytes:
    if len(packed) < HEADER_LEN:
        raise DecodeError("missing header")
    size = int.from_bytes(packed[:8], "little")
    lengths = list(packed[8:HEADER_LEN])
    if max(lengths) > 63:
        raise DecodeError("code length above 63 bits")

    # EN: A prefix code can be decoded greedily: read bits until they form a known code. No
    #     code is the start of another, so the first hit is the right one.
    # PT: Um código de prefixo pode ser decodificado de forma gulosa: leia bits até formarem um
    #     código conhecido. Nenhum código é o começo de outro, então o primeiro acerto é o certo.
    lookup = {pair: symbol for symbol, pair in canonical_codes(lengths).items()}
    longest = max(lengths)

    out = bytearray()
    code = 0
    bits = 0
    for byte in packed[HEADER_LEN:]:
        for shift in range(7, -1, -1):
            if len(out) == size:
                break
            code = (code << 1) | ((byte >> shift) & 1)
            bits += 1
            symbol = lookup.get((bits, code))
            if symbol is not None:
                out.append(symbol)
                code = 0
                bits = 0
            elif bits >= longest:
                raise DecodeError("bits that match no code")
    if len(out) != size:
        raise DecodeError("body ends before the announced size")
    return bytes(out)
