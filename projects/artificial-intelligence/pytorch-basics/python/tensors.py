"""EN: Tensors and automatic differentiation in a few small examples, each one checked by a test.

PT: Tensores e diferenciação automática em alguns exemplos pequenos, cada um conferido por um
teste.
"""

import torch


def elementwise_and_matrix_product() -> tuple[torch.Tensor, torch.Tensor]:
    # EN: Two different multiplications. `a * b` multiplies position by position and needs
    #     the same shape (or shapes that broadcast). `a @ b` is the matrix product: rows of
    #     `a` times columns of `b`. Mixing them up is the most common tensor bug.
    # PT: Duas multiplicações diferentes. `a * b` multiplica posição por posição e precisa do
    #     mesmo formato (ou de formatos que se expandem). `a @ b` é o produto de matrizes:
    #     linhas de `a` vezes colunas de `b`. Trocar uma pela outra é o bug de tensor mais comum.
    a = torch.tensor([[1.0, 2.0], [3.0, 4.0]])
    b = torch.tensor([[5.0, 6.0], [7.0, 8.0]])
    return a * b, a @ b


def linear_layer_by_hand(
    inputs: torch.Tensor, weight: torch.Tensor, bias: torch.Tensor
) -> torch.Tensor:
    # EN: What `nn.Linear` computes. `inputs` is (N, in), `weight` is (out, in), so
    #     `inputs @ weight.T` is (N, out): one row per point, one column per neuron. `bias` has
    #     shape (out,), and adding it to an (N, out) matrix repeats it on every row. That
    #     automatic repetition is called broadcasting.
    # PT: O que o `nn.Linear` calcula. `inputs` é (N, in), `weight` é (out, in), então
    #     `inputs @ weight.T` é (N, out): uma linha por ponto, uma coluna por neurônio. `bias`
    #     tem formato (out,), e somá-lo a uma matriz (N, out) o repete em cada linha. Essa
    #     repetição automática se chama broadcasting.
    return inputs @ weight.T + bias


def worked_example() -> tuple[float, float, float, float]:
    """EN: f = (x + y) * z at x = 2, y = 1, z = 4: the example of MP-AI-2, now with PyTorch.

    PT: f = (x + y) * z em x = 2, y = 1, z = 4: o exemplo do MP-AI-2, agora com PyTorch.
    """
    # EN: `requires_grad=True` asks PyTorch to record every operation made with the tensor.
    #     `backward()` then walks that record from f back to the inputs, as the `Value` class
    #     of MP-AI-2 did, and leaves each slope in `.grad`.
    # PT: `requires_grad=True` pede ao PyTorch que registre cada operação feita com o tensor.
    #     O `backward()` então percorre esse registro de f até as entradas, como fazia a classe
    #     `Value` do MP-AI-2, e deixa cada inclinação em `.grad`.
    x = torch.tensor(2.0, requires_grad=True)
    y = torch.tensor(1.0, requires_grad=True)
    z = torch.tensor(4.0, requires_grad=True)
    f = (x + y) * z
    f.backward()
    return f.item(), x.grad.item(), y.grad.item(), z.grad.item()


def accumulation() -> tuple[float, float, float]:
    """EN: The gradient of x * x at x = 3 after one backward, after two, and after clearing.

    PT: O gradiente de x * x em x = 3 depois de um backward, depois de dois, e depois de zerar.
    """
    # EN: `backward` ADDS to `.grad`. The derivative of x^2 at 3 is 6, and a second backward
    #     pass leaves 12 there, not 6. This is why a training loop calls `zero_grad` at every
    #     step.
    # PT: O `backward` SOMA em `.grad`. A derivada de x^2 em 3 é 6, e uma segunda passada
    #     deixa 12 ali, não 6. É por isso que um laço de treinamento chama `zero_grad` a cada
    #     passo.
    x = torch.tensor(3.0, requires_grad=True)
    (x * x).backward()
    once = x.grad.item()
    (x * x).backward()
    twice = x.grad.item()
    x.grad.zero_()
    return once, twice, x.grad.item()
