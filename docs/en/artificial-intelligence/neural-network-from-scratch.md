# Neural network from scratch

> Versão em português: [docs/pt/artificial-intelligence/neural-network-from-scratch.md](../../pt/artificial-intelligence/neural-network-from-scratch.md)

Mini-project MP-AI-2, in [`projects/artificial-intelligence/neural-network-from-scratch`](../../../projects/artificial-intelligence/neural-network-from-scratch). It teaches what a neuron computes and how backpropagation finds the gradients. The background is in sections [5](README.md#5-neurons-layers-and-activation-functions) and [6](README.md#6-gradient-descent-and-backpropagation) of the area page.

## The plan

Training a network needs one thing that is hard to do by hand: the slope of the loss with respect to every weight. This project builds the tool that computes those slopes automatically, then uses it.

1. `engine.py`: a number that remembers how it was computed (`Value`).
2. `nn.py`: a neuron, a layer and a network made of such numbers.
3. `train.py`: the loss and the gradient descent loop.

There is no NumPy and no framework. The three files have about 430 lines of plain Python, and half of those lines are comments.

## A number that remembers

```python
x, y, z = Value(2.0), Value(1.0), Value(4.0)
f = (x + y) * z      # f.data == 12.0
f.backward()
# x.grad == 4.0, y.grad == 4.0, z.grad == 3.0
```

Each arithmetic operation creates a new `Value` and stores two things in it: the values it came from, and a small function with the **local slope** of that operation.

| Operation | Local slopes |
| --- | --- |
| `a + b` | 1 for `a`, 1 for `b` |
| `a * b` | `b` for `a`, `a` for `b` |
| `a ** n` | `n * a^(n-1)` |
| `tanh(a)` | `1 - tanh(a)^2` |
| `relu(a)` | 1 if `a > 0`, otherwise 0 |
| `sigmoid(a)` | `s * (1 - s)` |
| `exp(a)` | `exp(a)` |
| `log(a)` | `1 / a` |

The graph of the example:

```text
x = 2 --\
         (+) --> q = 3 --\
y = 1 --/                 (*) --> f = 12
z = 4 -------------------/
```

`backward()` starts at `f` with a gradient of 1 and walks the graph from the result to the inputs. At each node it multiplies the gradient that arrived by the local slope and hands the product to the inputs:

```text
f:  gradient 1
*:  q receives 1 x z = 4      z receives 1 x q = 3
+:  x receives 4 x 1 = 4      y receives 4 x 1 = 4
```

That is the chain rule, and doing it for every node in the right order is backpropagation. Two details make it correct:

- **Order.** A node may pass its gradient on only after it has received all of it. The nodes are sorted so that each one comes after the ones it was built from (a topological order), and the walk goes through that list backwards.
- **Accumulation.** When a value is used in two places, it receives gradient from both, so gradients are added (`+=`) and never overwritten. For `x * x` at x = 3 the two contributions are 3 + 3 = 6, the derivative of x². The other side of this: gradients must be set back to zero before the next backward pass, or the old ones are added to the new ones.

## Is the gradient right?

The definition of a slope gives a second, independent way to compute it: move the input a tiny bit and see how the output moves.

```text
numerical gradient = (f(x + h) - f(x - h)) / 2h        with h = 0.000001
```

The tests compare the two for each operation alone, for combinations, for a value used twice and for **every weight of a whole network**, within 1e-6. This is the test that catches a wrong sign or a forgotten term, and it is how real libraries test their own gradients.

## From a number to a network

A **neuron** is a short expression made of `Value` objects: `activation(w1 x1 + w2 x2 + bias)`. A **layer** is a list of neurons that receive the same inputs. An **MLP** is a list of layers, the outputs of one feeding the next. Since every number involved is a `Value`, the loss computed at the end is a `Value` too, and one call to `backward()` fills the gradient of every weight.

The weights start as random numbers between -1 and 1. If they all started equal, the neurons of a layer would compute the same output, receive the same gradient and remain copies of each other.

## The loss and the loop

The network outputs one number, the logit `z`. `sigmoid(z)` is read as the probability of class 1. The loss of an example is the negative logarithm of the probability given to the right class, which is `log(1 + e^(-s z))` with s = +1 for class 1 and -1 for class 0: close to 0 when the network is right and sure, large when it is wrong and sure.

```python
for epoch in range(epochs):
    loss = mean_loss(model, points, labels)   # 1. forward
    model.zero_grad()                         # 2. clear the old gradients
    loss.backward()                           # 3. backward
    for p in model.parameters():              # 4. step against the gradient
        p.data -= learning_rate * p.grad
```

These four steps are the training loop of every framework.

## XOR

XOR answers 1 when exactly one of the two inputs is 1. Drawn on paper, the two classes sit on opposite corners of a square, and no straight line separates them. A single neuron is a straight line, so it gets at most 3 of the 4 points right, and a test checks that. With a hidden layer of 4 neurons (17 parameters):

| x1 | x2 | XOR | P(class 1) | Answer |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0 | 0 | 0.005 | 0 |
| 0 | 1 | 1 | 0.974 | 1 |
| 1 | 0 | 1 | 0.973 | 1 |
| 1 | 1 | 0 | 0.037 | 0 |

The loss went from 0.7863 to 0.0244 in 300 epochs.

## Two moons

The second dataset has two interleaved half circles with noise, 80 points for training and 200 others for testing. A network 2-8-8-1 (105 parameters) trained for 120 epochs:

| Set | Points | Accuracy |
| --- | ---: | ---: |
| Training | 80 | 98.8% |
| Test (never used in training) | 200 | 99.5% |

The test set is the honest number: it is made of points the network never saw.

![Loss per epoch](../../../projects/artificial-intelligence/neural-network-from-scratch/results/loss-curve.svg)

The loss falls quickly at first, crawls for a while and then falls again when the network finds how to bend the boundary. A loss curve is the first thing to look at in any training run.

![Decision boundary](../../../projects/artificial-intelligence/neural-network-from-scratch/results/decision-boundary.svg)

The **decision boundary** is where the answer changes from one class to the other. It is drawn by asking the network for its answer at every cell of a grid. The colour is stronger where the network is more certain, and the boundary is a curve: that curve is what the hidden layers bought.

## What a real framework adds

- **Tensors.** Here each number is a Python object. A framework stores a whole layer as one array and computes it in a single optimised operation, on a CPU or a GPU. The idea of the graph and of local slopes is the same.
- **More operations**, with the slope of each one already written.
- **Optimisers** better than plain gradient descent, such as Adam.

The mini-project [pytorch-basics](pytorch-basics.md) redoes this network with PyTorch and checks that the framework computes the same gradients as this engine.

## Run it

```sh
cd projects/artificial-intelligence/neural-network-from-scratch
./setup-unix-neural-network-from-scratch.sh
```
