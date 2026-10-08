"""EN: Tests of the hand-written convolution and of the image code (MP-AI-8.1).

PT: Testes da convolução escrita à mão e do código de imagens (MP-AI-8.1).
"""

import struct
import zlib

import pytest
import torch

from conv import SOBEL_X, SOBEL_Y, conv2d_by_framework, conv2d_by_hand, output_size
from figures import PNG_SIGNATURE, png_bytes, to_grey, upscale
from shapes import CLASSES, SIZE, draw_shape, make_dataset, transform_batch


# MP-AI-8.1
def test_hand_convolution_with_an_edge_filter_equals_the_framework() -> None:
    image = make_dataset(4, seed=7)[0][1, 0]
    by_hand = conv2d_by_hand(image, SOBEL_X)
    by_framework = conv2d_by_framework(image, SOBEL_X)
    assert by_hand.shape == by_framework.shape == (18, 18)
    assert torch.allclose(by_hand, by_framework, atol=1e-5)
    # EN: The comparison would be empty if the edge map were all zeros.
    # PT: A comparação seria vazia se o mapa de bordas fosse todo zero.
    assert float(by_hand.abs().max()) > 1.0


# MP-AI-8.1
@pytest.mark.parametrize("kernel", [SOBEL_X, SOBEL_Y, torch.tensor([[1.0, -1.0]])])
@pytest.mark.parametrize(("stride", "padding"), [(1, 0), (1, 1), (2, 0), (2, 1), (3, 2)])
def test_hand_convolution_equals_the_framework_with_stride_and_padding(
    kernel: torch.Tensor, stride: int, padding: int
) -> None:
    for kind in CLASSES:
        image = draw_shape(kind)
        by_hand = conv2d_by_hand(image, kernel, stride, padding)
        by_framework = conv2d_by_framework(image, kernel, stride, padding)
        assert by_hand.shape == by_framework.shape
        assert torch.allclose(by_hand, by_framework, atol=1e-5)


# MP-AI-8.1
@pytest.mark.parametrize(
    ("size", "kernel", "stride", "padding", "expected"),
    [(20, 3, 1, 0, 18), (20, 3, 1, 1, 20), (20, 3, 2, 0, 9), (20, 3, 2, 1, 10), (7, 5, 1, 2, 7)],
)
def test_output_size_formula(
    size: int, kernel: int, stride: int, padding: int, expected: int
) -> None:
    assert output_size(size, kernel, stride, padding) == expected
    image = torch.zeros(size, size)
    weights = torch.ones(kernel, kernel)
    assert conv2d_by_framework(image, weights, stride, padding).shape == (expected, expected)
    assert conv2d_by_hand(image, weights, stride, padding).shape == (expected, expected)


# MP-AI-8.1
def test_the_filter_is_not_flipped() -> None:
    # EN: One bright pixel copies the filter into the output upside down and mirrored. If the
    #     code flipped the filter (the convolution of mathematics), the copy would be upright.
    # PT: Um pixel claro copia o filtro para a saída de cabeça para baixo e espelhado. Se o
    #     código espelhasse o filtro (a convolução da matemática), a cópia sairia em pé.
    image = torch.zeros(5, 5)
    image[2, 2] = 1.0
    kernel = torch.arange(1.0, 10.0).reshape(3, 3)
    assert torch.equal(conv2d_by_hand(image, kernel), kernel.flip(0, 1))


# MP-AI-8.1
def test_sobel_finds_a_vertical_edge_and_ignores_a_flat_region() -> None:
    image = torch.zeros(6, 6)
    image[:, 3:] = 1.0
    edges = conv2d_by_hand(image, SOBEL_X)
    assert edges[0].tolist() == [0.0, 4.0, 4.0, 0.0]
    assert float(conv2d_by_hand(image, SOBEL_Y).abs().max()) == 0.0


# MP-AI-8.1
def test_images_are_tensors_with_values_between_zero_and_one() -> None:
    images, labels = make_dataset(40, seed=3)
    assert images.shape == (40, 1, SIZE, SIZE)
    assert images.dtype == torch.float32
    assert float(images.min()) >= 0.0
    assert float(images.max()) <= 1.0
    assert labels.bincount().tolist() == [10, 10, 10, 10]
    again, _ = make_dataset(40, seed=3)
    other, _ = make_dataset(40, seed=4)
    assert torch.equal(images, again)
    assert not torch.equal(images, other)


def test_shift_moves_every_pixel_and_fills_with_black() -> None:
    image = draw_shape("triangle")[None, None]
    moved = transform_batch(image, torch.tensor([0.0]), torch.tensor([[3.0, -2.0]]))
    assert torch.allclose(moved[0, 0, : SIZE - 2, 3:], image[0, 0, 2:, : SIZE - 3], atol=1e-5)
    assert float(moved[0, 0, :, :3].abs().max()) < 1e-5
    assert float(moved[0, 0, SIZE - 2 :].abs().max()) < 1e-5


def test_rotating_an_image_matches_drawing_the_rotated_shape() -> None:
    upright = draw_shape("cross", thickness=2.0)[None, None]
    rotated = transform_batch(upright, torch.tensor([30.0]), torch.zeros(1, 2))[0, 0]
    drawn = draw_shape("cross", thickness=2.0, angle_degrees=30.0)
    # EN: Bilinear interpolation blurs a little, so the two are close, not identical.
    # PT: A interpolação bilinear borra um pouco, então as duas são próximas, não idênticas.
    assert float((rotated - drawn).abs().mean()) < 0.03
    assert float((upright[0, 0] - drawn).abs().mean()) > 0.1


def test_png_writer_produces_a_valid_greyscale_file() -> None:
    pixels = upscale(to_grey(torch.tensor([[0.0, 0.5], [1.0, 0.25]])), 3)
    data = png_bytes(pixels)
    assert data.startswith(PNG_SIGNATURE)
    assert data[12:16] == b"IHDR"
    width, height, depth, colour = struct.unpack(">IIBB", data[16:26])
    assert (width, height, depth, colour) == (6, 6, 8, 0)
    length = struct.unpack(">I", data[33:37])[0]
    assert data[37:41] == b"IDAT"
    rows = zlib.decompress(data[41 : 41 + length])
    # EN: 6 rows of 1 filter byte + 6 pixels. The first pixel is black, the fourth is mid grey.
    # PT: 6 linhas de 1 byte de filtro + 6 pixels. O primeiro pixel é preto, o quarto é cinza.
    assert len(rows) == 6 * 7
    assert rows[1] == 0
    assert rows[4] == 128
    assert data.endswith(b"IEND" + struct.pack(">I", zlib.crc32(b"IEND")))
