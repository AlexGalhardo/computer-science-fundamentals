"""EN: Convolution written by hand, with plain Python loops, to show what a framework computes.

An image is a table of numbers. A filter (also called kernel) is a small table of numbers. The
convolution slides the filter over the image and, at each position, multiplies the numbers that
overlap and adds everything up. Nothing else happens inside `torch.nn.functional.conv2d`, only
much faster. The tests compare this file with the framework, number by number.

PT: Convolução escrita à mão, com laços simples de Python, para mostrar o que um framework calcula.

Uma imagem é uma tabela de números. Um filtro (também chamado de kernel) é uma tabela pequena de
números. A convolução desliza o filtro sobre a imagem e, em cada posição, multiplica os números
que se sobrepõem e soma tudo. Nada além disso acontece dentro de `torch.nn.functional.conv2d`, só
que muito mais rápido. Os testes comparam este arquivo com o framework, número por número.
"""

import torch

# EN: The Sobel filters, written by people long before neural networks. SOBEL_X answers with a
#     large positive number where the image goes from dark (left) to bright (right), a large
#     negative number for bright to dark, and 0 on a flat region. SOBEL_Y does the same from top
#     to bottom. A CNN is not given these numbers: it learns its own filters.
# PT: Os filtros de Sobel, escritos por pessoas muito antes das redes neurais. SOBEL_X responde com
#     um número positivo grande onde a imagem vai do escuro (esquerda) para o claro (direita), um
#     número negativo grande do claro para o escuro, e 0 em uma região lisa. SOBEL_Y faz o mesmo
#     de cima para baixo. Uma CNN não recebe esses números: ela aprende os seus próprios filtros.
SOBEL_X = torch.tensor([[-1.0, 0.0, 1.0], [-2.0, 0.0, 2.0], [-1.0, 0.0, 1.0]])
SOBEL_Y = torch.tensor([[-1.0, -2.0, -1.0], [0.0, 0.0, 0.0], [1.0, 2.0, 1.0]])


def output_size(size: int, kernel: int, stride: int = 1, padding: int = 0) -> int:
    """EN: How many positions the filter visits along one side: (W - F + 2P) / S + 1, rounded down.

    W is the side of the image, F the side of the filter, P the padding (zeros added on each
    border) and S the stride (how many pixels the filter jumps). Example: W=20, F=3, P=0, S=1
    gives 18, because a 3-wide filter fits in 18 places of a 20-wide row.

    PT: Quantas posições o filtro visita ao longo de um lado: (W - F + 2P) / S + 1, arredondado
    para baixo.

    W é o lado da imagem, F o lado do filtro, P o padding (zeros somados em cada borda) e S o
    stride (quantos pixels o filtro pula). Exemplo: W=20, F=3, P=0, S=1 dá 18, porque um filtro
    de largura 3 cabe em 18 lugares de uma linha de largura 20.
    """
    return (size - kernel + 2 * padding) // stride + 1


def conv2d_by_hand(
    image: torch.Tensor, kernel: torch.Tensor, stride: int = 1, padding: int = 0
) -> torch.Tensor:
    """EN: Convolution of one greyscale image (H x W) with one filter (FH x FW), with four loops.

    PT: Convolução de uma imagem em tons de cinza (H x W) com um filtro (FH x FW), com quatro
    laços.
    """
    pixels: list[list[float]] = image.tolist()
    weights: list[list[float]] = kernel.tolist()
    height, width = len(pixels), len(pixels[0])
    kernel_height, kernel_width = len(weights), len(weights[0])

    # EN: Padding surrounds the image with zeros, so the filter can also be centred on the border
    #     pixels. With a 3x3 filter and padding 1 the output has the same size as the input.
    # PT: O padding cerca a imagem com zeros, para que o filtro também possa ficar centrado nos
    #     pixels da borda. Com um filtro 3x3 e padding 1 a saída tem o mesmo tamanho da entrada.
    padded = [[0.0] * (width + 2 * padding) for _ in range(height + 2 * padding)]
    for row in range(height):
        for column in range(width):
            padded[row + padding][column + padding] = pixels[row][column]

    out_height = output_size(height, kernel_height, stride, padding)
    out_width = output_size(width, kernel_width, stride, padding)
    output = [[0.0] * out_width for _ in range(out_height)]

    # EN: The two outer loops choose where the filter is. The two inner loops multiply each weight
    #     by the pixel under it and add the products: one dot product per position.
    #     The filter is NOT flipped. Mathematics calls this operation cross-correlation and keeps
    #     the name convolution for the flipped version, but deep learning libraries use this one
    #     and call it convolution. Since the weights are learned, the flip would change nothing.
    # PT: Os dois laços de fora escolhem onde o filtro está. Os dois de dentro multiplicam cada
    #     peso pelo pixel embaixo dele e somam os produtos: um produto escalar por posição.
    #     O filtro NÃO é espelhado. A matemática chama esta operação de correlação cruzada e
    #     reserva o nome convolução para a versão espelhada, mas as bibliotecas de deep learning
    #     usam esta e a chamam de convolução. Como os pesos são aprendidos, espelhar não mudaria
    #     nada.
    for out_row in range(out_height):
        for out_column in range(out_width):
            total = 0.0
            for i in range(kernel_height):
                for j in range(kernel_width):
                    pixel = padded[out_row * stride + i][out_column * stride + j]
                    total += weights[i][j] * pixel
            output[out_row][out_column] = total
    return torch.tensor(output, dtype=torch.float32)


def conv2d_by_framework(
    image: torch.Tensor, kernel: torch.Tensor, stride: int = 1, padding: int = 0
) -> torch.Tensor:
    """EN: The same operation done by PyTorch.

    The framework works on batches, so it wants 4 dimensions: (images, channels, height, width)
    for the input and (filters, channels, height, width) for the weights. One greyscale image and
    one filter become 1 x 1 x H x W and 1 x 1 x F x F, and the extra dimensions are removed at
    the end.

    PT: A mesma operação feita pelo PyTorch.

    O framework trabalha com lotes, então quer 4 dimensões: (imagens, canais, altura, largura)
    para a entrada e (filtros, canais, altura, largura) para os pesos. Uma imagem em tons de
    cinza e um filtro viram 1 x 1 x H x W e 1 x 1 x F x F, e as dimensões extras são removidas no
    fim.
    """
    result = torch.nn.functional.conv2d(
        image[None, None], kernel[None, None], stride=stride, padding=padding
    )
    return result[0, 0]
