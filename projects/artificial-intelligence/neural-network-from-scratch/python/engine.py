"""EN: Scalar automatic differentiation: a number that remembers how it was computed.

Every `Value` holds one number (`data`), the slope of the final result with respect to it
(`grad`) and the values it was built from. Doing arithmetic with `Value` objects builds a graph,
and `backward()` walks that graph from the result to the inputs applying the chain rule. That
walk is backpropagation.

PT: Diferenciação automática escalar: um número que lembra como foi calculado.

Cada `Value` guarda um número (`data`), a inclinação do resultado final em relação a ele
(`grad`) e os valores a partir dos quais foi construído. Fazer contas com objetos `Value` constrói
um grafo, e `backward()` percorre esse grafo do resultado até as entradas aplicando a regra da
cadeia. Esse percurso é a retropropagação.
"""

from __future__ import annotations

import math
from collections.abc import Callable

Number = int | float


class Value:
    """EN: One node of the computation graph. PT: Um nó do grafo de computação."""

    __slots__ = ("_backward", "_parents", "data", "grad", "op")

    def __init__(self, data: Number, parents: tuple[Value, ...] = (), op: str = "") -> None:
        self.data = float(data)
        self.grad = 0.0
        self.op = op
        self._parents = parents
        # EN: Each operation stores here a small function that knows its own local slope and
        #     passes the gradient on to its inputs. A leaf (an input or a weight) has nothing
        #     to pass on.
        # PT: Cada operação guarda aqui uma pequena função que conhece a sua inclinação local
        #     e repassa o gradiente às suas entradas. Uma folha (uma entrada ou um peso) não
        #     tem nada a repassar.
        self._backward: Callable[[], None] = _nothing

    def __repr__(self) -> str:
        return f"Value(data={self.data:.4f}, grad={self.grad:.4f})"

    # EN: Addition. d(a + b)/da = 1 and d(a + b)/db = 1, so the gradient of the result flows
    #     unchanged to both inputs. The `+=` matters: a value used in two places receives
    #     gradient from both, and the two contributions add up.
    # PT: Soma. d(a + b)/da = 1 e d(a + b)/db = 1, então o gradiente do resultado passa
    #     inalterado para as duas entradas. O `+=` importa: um valor usado em dois lugares
    #     recebe gradiente dos dois, e as duas contribuições se somam.
    def __add__(self, other: Value | Number) -> Value:
        other = _wrap(other)
        out = Value(self.data + other.data, (self, other), "+")

        def backward() -> None:
            self.grad += out.grad
            other.grad += out.grad

        out._backward = backward
        return out

    # EN: Multiplication. d(a * b)/da = b and d(a * b)/db = a: each input receives the
    #     gradient of the result multiplied by the OTHER input.
    # PT: Multiplicação. d(a * b)/da = b e d(a * b)/db = a: cada entrada recebe o gradiente
    #     do resultado multiplicado pela OUTRA entrada.
    def __mul__(self, other: Value | Number) -> Value:
        other = _wrap(other)
        out = Value(self.data * other.data, (self, other), "*")

        def backward() -> None:
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad

        out._backward = backward
        return out

    # EN: Power with a constant exponent. d(a^n)/da = n * a^(n-1). Division and square roots
    #     are built from it.
    # PT: Potência com expoente constante. d(a^n)/da = n * a^(n-1). A divisão e a raiz
    #     quadrada são construídas a partir dela.
    def __pow__(self, exponent: Number) -> Value:
        out = Value(self.data**exponent, (self,), f"**{exponent}")

        def backward() -> None:
            self.grad += exponent * self.data ** (exponent - 1) * out.grad

        out._backward = backward
        return out

    # EN: The activation functions. tanh squashes any number into (-1, 1), and its slope is
    #     1 - tanh^2: almost 0 when the output is near -1 or 1 (the neuron is "saturated").
    # PT: As funções de ativação. A tanh espreme qualquer número em (-1, 1), e a sua
    #     inclinação é 1 - tanh^2: quase 0 quando a saída está perto de -1 ou 1 (o neurônio
    #     está "saturado").
    def tanh(self) -> Value:
        result = math.tanh(self.data)
        out = Value(result, (self,), "tanh")

        def backward() -> None:
            self.grad += (1.0 - result * result) * out.grad

        out._backward = backward
        return out

    # EN: ReLU keeps positive numbers and turns negative ones into 0. Its slope is 1 on the
    #     positive side and 0 on the negative side, so no gradient passes through a neuron
    #     whose output was 0.
    # PT: A ReLU mantém os números positivos e transforma os negativos em 0. A inclinação é 1
    #     no lado positivo e 0 no negativo, então nenhum gradiente passa por um neurônio cuja
    #     saída foi 0.
    def relu(self) -> Value:
        out = Value(max(0.0, self.data), (self,), "relu")

        def backward() -> None:
            self.grad += (1.0 if self.data > 0 else 0.0) * out.grad

        out._backward = backward
        return out

    # EN: The sigmoid squashes a number into (0, 1), so its output reads as a probability.
    #     Its slope is s * (1 - s).
    # PT: A sigmoide espreme um número em (0, 1), então a saída pode ser lida como uma
    #     probabilidade. A inclinação é s * (1 - s).
    def sigmoid(self) -> Value:
        result = 1.0 / (1.0 + math.exp(-self.data))
        out = Value(result, (self,), "sigmoid")

        def backward() -> None:
            self.grad += result * (1.0 - result) * out.grad

        out._backward = backward
        return out

    def exp(self) -> Value:
        result = math.exp(self.data)
        out = Value(result, (self,), "exp")

        def backward() -> None:
            self.grad += result * out.grad

        out._backward = backward
        return out

    def log(self) -> Value:
        out = Value(math.log(self.data), (self,), "log")

        def backward() -> None:
            self.grad += out.grad / self.data

        out._backward = backward
        return out

    # EN: Everything else is written with the operations above, so it needs no slope of its
    #     own: a - b is a + (-1 * b), and a / b is a * b^-1.
    # PT: Todo o resto é escrito com as operações acima, então não precisa de inclinação
    #     própria: a - b é a + (-1 * b), e a / b é a * b^-1.
    def __neg__(self) -> Value:
        return self * -1.0

    def __sub__(self, other: Value | Number) -> Value:
        return self + (-_wrap(other))

    def __truediv__(self, other: Value | Number) -> Value:
        return self * _wrap(other) ** -1.0

    def __radd__(self, other: Number) -> Value:
        return self + other

    def __rmul__(self, other: Number) -> Value:
        return self * other

    def __rsub__(self, other: Number) -> Value:
        return _wrap(other) - self

    def __rtruediv__(self, other: Number) -> Value:
        return _wrap(other) / self

    def backward(self) -> None:
        """EN: Backpropagation: fills `grad` of every value this one depends on.

        The nodes are first put in topological order (every node after the nodes it was built
        from). Walking that order backwards guarantees that a node passes its gradient on only
        after it has received all of it. The walk starts with d(self)/d(self) = 1.

        PT: Retropropagação: preenche o `grad` de todo valor do qual este depende.

        Os nós são primeiro colocados em ordem topológica (cada nó depois dos nós a partir dos
        quais foi construído). Percorrer essa ordem de trás para a frente garante que um nó só
        repassa o seu gradiente depois de tê-lo recebido por inteiro. O percurso começa com
        d(self)/d(self) = 1.
        """
        order: list[Value] = []
        seen: set[int] = set()
        # EN: An explicit stack instead of recursion: the graph of a whole training batch is
        #     deeper than Python's recursion limit.
        # PT: Uma pilha explícita em vez de recursão: o grafo de um lote inteiro de treino é
        #     mais fundo que o limite de recursão do Python.
        stack: list[tuple[Value, bool]] = [(self, False)]
        while stack:
            node, expanded = stack.pop()
            if expanded:
                order.append(node)
            elif id(node) not in seen:
                seen.add(id(node))
                stack.append((node, True))
                stack.extend((parent, False) for parent in node._parents)
        self.grad = 1.0
        for node in reversed(order):
            node._backward()


def _nothing() -> None:
    return None


def _wrap(value: Value | Number) -> Value:
    return value if isinstance(value, Value) else Value(value)
