from huffman import DecodeError

# EN: How far back a match may start, and how long it may be. The offset is stored in 2 bytes
#     and the length in 1 byte, so a token (offset, length, literal) takes 4 bytes.
# PT: Até onde para trás uma repetição pode começar, e que comprimento pode ter. O deslocamento
#     ocupa 2 bytes e o comprimento 1 byte, então um token (deslocamento, comprimento, literal)
#     ocupa 4 bytes.
# ES: Hasta dónde hacia atrás puede empezar una repetición, y qué longitud puede tener. El
#     desplazamiento ocupa 2 bytes y la longitud 1 byte, así que un token (desplazamiento,
#     longitud, literal) ocupa 4 bytes.
WINDOW = 4096
MAX_LENGTH = 255
MIN_LENGTH = 3
TOKEN_LEN = 4

# EN: One step of the output: "copy `length` bytes starting `offset` bytes back, then write
#     `literal`". Offset 0 and length 0 mean "nothing to copy, just the literal".
# PT: Um passo da saída: "copie `length` bytes começando `offset` bytes atrás, depois escreva
#     `literal`". Deslocamento 0 e comprimento 0 significam "nada a copiar, só o literal".
# ES: Un paso de la salida: "copia `length` bytes empezando `offset` bytes atrás, luego escribe
#     `literal`". Desplazamiento 0 y longitud 0 significan "nada que copiar, solo el literal".
Token = tuple[int, int, int]


# EN: LZ77 uses the data already seen as its dictionary. At each position it looks for the
#     longest stretch, starting inside the window behind it, that equals the bytes ahead.
#     Searching every window position would be slow, so an index remembers where each group
#     of 3 bytes started: any match of 3 bytes or more must begin at one of those places.
#     Candidates are tried from the nearest to the farthest and a longer match wins, so on a
#     tie the nearest one is kept. The Rust version follows the same rule and produces the
#     same tokens.
# PT: O LZ77 usa os dados já vistos como dicionário. Em cada posição ele procura o trecho mais
#     longo, começando dentro da janela atrás dela, que seja igual aos bytes à frente. Procurar
#     em todas as posições da janela seria lento, então um índice lembra onde cada grupo de 3
#     bytes começou: toda repetição de 3 bytes ou mais precisa começar em um desses lugares.
#     Os candidatos são testados do mais próximo ao mais distante e uma repetição mais longa
#     vence, então em caso de empate fica a mais próxima. A versão em Rust segue a mesma regra
#     e produz os mesmos tokens.
# ES: LZ77 usa los datos ya vistos como diccionario. En cada posición busca el tramo más largo,
#     que empiece dentro de la ventana detrás de ella, que sea igual a los bytes que vienen.
#     Buscar en todas las posiciones de la ventana sería lento, así que un índice recuerda
#     dónde empezó cada grupo de 3 bytes: toda repetición de 3 bytes o más debe empezar en uno
#     de esos lugares. Los candidatos se prueban del más cercano al más lejano y una repetición
#     más larga gana, así que en caso de empate se queda la más cercana. La versión en Rust
#     sigue la misma regla y produce los mismos tokens.
def tokenize(data: bytes) -> list[Token]:
    tokens: list[Token] = []
    index: dict[bytes, list[int]] = {}
    position = 0

    while position < len(data):
        # EN: Every token ends with a literal, so the match must leave one byte for it.
        # PT: Todo token termina com um literal, então a repetição precisa deixar um byte para ele.
        # ES: Todo token termina con un literal, así que la repetición debe dejarle un byte.
        limit = min(MAX_LENGTH, len(data) - position - 1)
        best_length = 0
        best_offset = 0

        if limit >= MIN_LENGTH:
            for start in reversed(index.get(data[position : position + MIN_LENGTH], [])):
                if position - start > WINDOW:
                    break
                # EN: The comparison may run past `position`: the copy is allowed to overlap
                #     the bytes it is producing, which is how a long run is encoded.
                # PT: A comparação pode passar de `position`: a cópia pode se sobrepor aos bytes
                #     que ela mesma está produzindo, e é assim que uma sequência longa é
                #     codificada.
                # ES: La comparación puede pasar de `position`: la copia puede superponerse a los
                #     bytes que ella misma está produciendo, y así se codifica una secuencia
                #     larga.
                length = 0
                while length < limit and data[start + length] == data[position + length]:
                    length += 1
                if length > best_length:
                    best_length = length
                    best_offset = position - start
                    if length == limit:
                        break

        tokens.append((best_offset, best_length, data[position + best_length]))

        # EN: Every position that was just consumed becomes a possible start of a later match.
        # PT: Cada posição recém-consumida vira um possível início de uma repetição futura.
        # ES: Cada posición recién consumida se vuelve un posible inicio de una repetición futura.
        for start in range(position, position + best_length + 1):
            if start + MIN_LENGTH <= len(data):
                index.setdefault(data[start : start + MIN_LENGTH], []).append(start)
        position += best_length + 1
    return tokens


# EN: File format: 8 bytes with the original size, then 4 bytes per token.
# PT: Formato do arquivo: 8 bytes com o tamanho original, depois 4 bytes por token.
# ES: Formato del archivo: 8 bytes con el tamaño original, luego 4 bytes por token.
def encode(data: bytes) -> bytes:
    out = bytearray(len(data).to_bytes(8, "little"))
    for offset, length, literal in tokenize(data):
        out += offset.to_bytes(2, "little")
        out.append(length)
        out.append(literal)
    return bytes(out)


# EN: Decoding needs no search and no index: it only copies. That is why LZ77 decompression is
#     much faster than compression.
# PT: Decodificar não exige busca nem índice: só copia. É por isso que a descompressão do LZ77
#     é muito mais rápida que a compressão.
# ES: Decodificar no exige búsqueda ni índice: solo copia. Por eso la descompresión de LZ77 es
#     mucho más rápida que la compresión.
def expand(tokens: list[Token]) -> bytes:
    out = bytearray()
    for offset, length, literal in tokens:
        if length > 0 and (offset == 0 or offset > len(out)):
            raise DecodeError("offset points outside the data")
        # EN: One byte at a time on purpose: with length > offset the copy reads bytes that
        #     this same loop has just written.
        # PT: Um byte por vez de propósito: com comprimento > deslocamento a cópia lê bytes que
        #     este mesmo laço acabou de escrever.
        # ES: Un byte a la vez a propósito: con longitud > desplazamiento la copia lee bytes que
        #     este mismo bucle acaba de escribir.
        for _ in range(length):
            out.append(out[-offset])
        out.append(literal)
    return bytes(out)


def decode(packed: bytes) -> bytes:
    if len(packed) < 8:
        raise DecodeError("missing length header")
    size = int.from_bytes(packed[:8], "little")
    body = packed[8:]
    if len(body) % TOKEN_LEN != 0:
        raise DecodeError("incomplete token")
    tokens = [
        (int.from_bytes(body[i : i + 2], "little"), body[i + 2], body[i + 3])
        for i in range(0, len(body), TOKEN_LEN)
    ]
    out = expand(tokens)
    if len(out) != size:
        raise DecodeError("size differs from the announced size")
    return out
