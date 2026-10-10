# PyTorch basics

> Versão em português: [docs/pt/artificial-intelligence/pytorch-basics.md](../../pt/artificial-intelligence/pytorch-basics.md) · Versión en español: [docs/es/artificial-intelligence/pytorch-basics.md](../../es/artificial-intelligence/pytorch-basics.md)

Mini-project MP-AI-6, in [`projects/artificial-intelligence/pytorch-basics`](../../../projects/artificial-intelligence/pytorch-basics). It teaches what a deep learning framework does for you, by redoing [neural-network-from-scratch](neural-network-from-scratch.md) (MP-AI-2) with PyTorch. The background is in section [14](README.md#14-what-a-framework-gives-you-pytorch) of the area page.

## The plan

MP-AI-2 wrote three things by hand: a number that remembers how it was computed (`Value`), a network made of such numbers, and a training loop. A framework brings the first one ready, gives building blocks for the second and leaves the third to you. This project does the same work again and checks, number by number, that nothing changed except who wrote the code.

1. `tensors.py`: what a tensor is, and automatic differentiation on small examples.
2. `gradients.py`: the same network in both versions, and its gradients computed in three ways.
3. `model.py` and `train.py`: the network as an `nn.Module` and the training loop written by hand.
4. `versus.py`: lines of code and training time of the two versions.

The files of MP-AI-2 are copied into `python/scratch/`, because a mini-project never imports another one.

## A tensor is an array with a shape

In MP-AI-2 a layer was a list of `Neuron` objects, and each neuron had a list of weights. In PyTorch a whole layer is one **tensor**: a block of numbers with a `shape` and a `dtype` (the kind of number, 32-bit floats by default).

Two multiplications exist, and mixing them up is the most common bug:

```text
a = [[1, 2],      b = [[5, 6],
     [3, 4]]           [7, 8]]

a * b = [[ 5, 12],     position by position
         [21, 32]]

a @ b = [[19, 22],     matrix product: row of a times column of b
         [43, 50]]     19 = 1 x 5 + 2 x 7
```

A fully connected layer is one matrix product. `nn.Linear(2, 8)` owns a weight matrix of shape (8, 2), one row per neuron, and a bias of shape (8,). For a batch of N points, shape (N, 2):

```text
output = inputs @ weight.T + bias
         (N, 2)   (2, 8)     (8,)     ->   (N, 8)
```

The bias has 8 numbers and the product has N rows of 8. PyTorch repeats the bias on every row. This automatic repetition of the smaller tensor is called **broadcasting**. Through the whole network the shapes go (N, 2), (N, 8), (N, 8), (N, 1): all the points are computed at once, with no Python loop over points or neurons. That is where the speed comes from.

## Automatic differentiation

A tensor created with `requires_grad=True` is watched: PyTorch records every operation made with it. `backward()` walks that record from the result back to the inputs and leaves each slope in `.grad`. It is the `backward()` of the `Value` class, for whole arrays.

```python
x = torch.tensor(2.0, requires_grad=True)
y = torch.tensor(1.0, requires_grad=True)
z = torch.tensor(4.0, requires_grad=True)
f = (x + y) * z  # 12
f.backward()
# x.grad = 4, y.grad = 4, z.grad = 3
```

These are the numbers MP-AI-2 found for the same expression. One detail is also the same: **gradients accumulate**. For `x * x` at x = 3 the gradient is 6. A second `backward()` leaves 12 in `x.grad`, not 6, and only `zero_()` brings it back to 0. This is why every training loop clears the gradients at each step.

## The same network, three gradients

This is the central check of the project. The 2-8-8-1 network of MP-AI-2 is created with its seed 7, and each of its 105 weights is copied into a PyTorch model (in 64-bit floats, the precision of Python numbers). Both versions compute the loss on the 80 training points and run backpropagation. A third gradient comes from the definition of a slope, with no calculus at all:

```text
numerical gradient = (loss(w + h) - loss(w - h)) / 2h        with h = 0.000001
```

| | From scratch (MP-AI-2) | PyTorch |
| --- | ---: | ---: |
| Loss | 0.4576158373 | 0.4576158373 |

| Parameter | Hand-written backpropagation | PyTorch `backward()` | Numerical |
| --- | ---: | ---: | ---: |
| `hidden1` `w[0][0]` | -0.060789 | -0.060789 | -0.060789 |
| `hidden1` `w[0][1]` | 0.012666 | 0.012666 | 0.012666 |
| `hidden1` b[0] | -0.049645 | -0.049645 | -0.049645 |
| `hidden1` `w[1][0]` | -0.133021 | -0.133021 | -0.133021 |
| `hidden1` `w[1][1]` | 0.010081 | 0.010081 | 0.010081 |
| `hidden1` b[1] | -0.105778 | -0.105778 | -0.105778 |

Over all 105 gradients, PyTorch and the hand-written backpropagation differ by less than 1e-12, and PyTorch and the numerical gradient by less than 1e-8. The first two are the same algorithm, so they agree to the last digits. The numerical one is an approximation, so it agrees a little less. A sign error in a single weight would show up as a difference thousands of times above the tolerance, and a test checks that too.

## The model and the five steps

```python
class MoonsNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.hidden1 = nn.Linear(2, 8)
        self.hidden2 = nn.Linear(8, 8)
        self.output = nn.Linear(8, 1)

    def forward(self, inputs):
        hidden = torch.tanh(self.hidden1(inputs))
        hidden = torch.tanh(self.hidden2(hidden))
        return self.output(hidden)  # a logit, no sigmoid
```

Assigning a layer to `self` registers it, so `model.parameters()` finds all 105 numbers by itself. The loop is written by hand, and it is the loop of MP-AI-2 with one more line:

```python
loss_fn = nn.BCEWithLogitsLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.5)

for epoch in range(120):
    logits = model(inputs)  # 1. forward
    loss = loss_fn(logits, targets)  # 2. loss
    optimizer.zero_grad()  # 3. clear the old gradients
    loss.backward()  # 4. backward
    optimizer.step()  # 5. update every parameter
```

`BCEWithLogitsLoss` is the loss of MP-AI-2 with another name. For a logit z it computes `log(1 + e^(-z))` when the label is 1 and `log(1 + e^z)` when it is 0, which is the `log(1 + e^(-s z))` written there by hand, averaged over the batch. It receives the logit, not the probability: computing sigmoid and logarithm in one formula avoids `log(0)`. `optimizer.step()` is `w = w - lr * grad` for every parameter, and a test checks that after one step.

Measuring uses two switches that are often confused:

```python
model.eval()  # tells the layers they are not training (dropout and similar)
with torch.no_grad():  # stops recording operations: no graph, less memory
    predictions = model(test_inputs) > 0
```

`eval()` does not stop gradients, and `no_grad()` does not change how layers behave. A test shows both facts. The answer is class 1 when the logit is positive, because `sigmoid(z) > 0.5` exactly when `z > 0`.

## Results

Network 2-8-8-1 with tanh, 120 epochs of full-batch gradient descent with learning rate 0.5, on the 80 training points of MP-AI-2. The accuracy is measured on its 200 test points.

| Starting weights | Epochs | First loss | Last loss | Training accuracy | Test accuracy |
| --- | ---: | ---: | ---: | ---: | ---: |
| The rule of MP-AI-2, drawn by PyTorch (`torch.manual_seed(7)`) | 120 | 0.7541 | 0.1057 | 97.5% | 98.0% |
| Copied from MP-AI-2 (its seed 7), 64-bit floats | 120 | 0.4576 | 0.0604 | 98.8% | 99.5% |
| The default of `nn.Linear` | 120 | 0.7011 | 0.2405 | 87.5% | 92.5% |
| The default of `nn.Linear` | 300 | 0.7011 | 0.0182 | 100.0% | 99.5% |

Three things can be read in this table.

- **The first row** is the run of the acceptance criterion: a fixed seed and 98.0% on the test points. It uses the starting rule of MP-AI-2 (weights uniform between -1 and 1, biases at zero), with numbers drawn by PyTorch's own generator.
- **The second row** starts from the very weights of MP-AI-2 and gives its published result exactly: loss from 0.4576 to 0.0604, 98.8% and 99.5%. Same weights, same arithmetic, same answer. Over the first 20 epochs the two loss curves differ by less than 1e-9.
- **The last two rows** show that the starting weights matter. `nn.Linear` starts with smaller weights (between -1/sqrt(inputs) and 1/sqrt(inputs)), a choice that keeps deep networks stable. This tiny network then learns more slowly: 92.5% after 120 epochs, 99.5% after 300.

![Loss per epoch](../../../projects/artificial-intelligence/pytorch-basics/results/loss-curve.svg)

## From scratch against the framework

The job is the same in both versions and runs inside the same container: build the network and train it for 20 epochs on the 80 training points. Five runs each, after one discarded PyTorch run. Lines of code are the lines that hold code, without blank lines, comments and docstrings.

| Version | Lines of code | Median of 5 runs | Fastest | Slowest | Per epoch |
| --- | ---: | ---: | ---: | ---: | ---: |
| From scratch (MP-AI-2) | 198 | 8.121 s | 7.679 s | 8.464 s | 406.04 ms |
| PyTorch (this version) | 78 | 0.027 s | 0.021 s | 0.065 s | 1.37 ms |

| Part | From scratch (MP-AI-2) | PyTorch |
| --- | ---: | ---: |
| Automatic differentiation | 102 | 0 |
| Network | 45 | 19 |
| Loss, training loop and accuracy | 51 | 59 |
| **Total** | **198** | **78** |

Machine: AMD Ryzen 7 5700X3D, 16 logical cores seen by the container, PyTorch limited to 2 threads, Linux under WSL2, image `python:3.14.8-slim-trixie`, Python 3.14.8, PyTorch 2.14.1+cpu. These are wall-clock times: they change from machine to machine and from run to run (the machine was busy with other containers, and another run gave 6.4 s against 0.010 s). What stays is the order of magnitude: hundreds of times.

Two readings of the table:

- The whole difference in lines is the automatic differentiation. The training loop is not shorter with PyTorch, and that is the point of this project: the framework does not hide the loop, it hides the gradients.
- The speed does not come from a cleverer algorithm. The from-scratch version creates one Python object for every addition and multiplication of every point. PyTorch does one matrix product per layer for all the points, in compiled code.

## What a real system adds

- **A GPU.** `model.to("cuda")` moves the same code to a graphics card. Nothing here needs it.
- **Mini-batches.** Real datasets do not fit in one batch, so each step uses a small random part of the data, served by a `DataLoader`.
- **Better optimisers** such as Adam, more layer types (convolutions, attention, normalisation) and ways to save and load a trained model.
- **More care with randomness.** A fixed seed gives the same numbers on the same machine and version. Across CPUs and versions the last digits may differ.

The mini-project [tensorflow-keras-basics](tensorflow-keras-basics.md) trains this same network with the other large framework, where the loop can be hidden behind one call.

## Run it

```sh
cd projects/artificial-intelligence/pytorch-basics
./setup-unix-pytorch-basics.sh
```

On Windows, `./setup-windows-pytorch-basics.ps1`. Only the demo: `docker compose run --rm python-demo`.
