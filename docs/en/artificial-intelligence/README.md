# Artificial intelligence and LLMs

> Versão em português: [docs/pt/artificial-intelligence/README.md](../../pt/artificial-intelligence/README.md)

This page explains, for a beginner, the ideas behind modern AI: how a program learns from data, what tokens and vectors are, how a language model writes text and how an image model draws. It follows the order of the quiz topics of the area (QC-AI), and each section points to the mini-project that shows the idea running. Every number below is small enough to check by hand.

The sources used to write this area are listed, with links, in [references.md](references.md).

| Section | Quiz topic | Mini-project |
| --- | --- | --- |
| [1. AI, machine learning and deep learning](#1-ai-machine-learning-and-deep-learning) | `ai-ml-foundations` | |
| [2. Probability and statistics](#2-probability-and-statistics) | `probability-statistics` | [tiny-language-model](tiny-language-model.md) |
| [3. Vectors and matrices](#3-vectors-and-matrices) | `linear-algebra` | [embeddings-vector-search](embeddings-vector-search.md) |
| [4. Supervised learning and loss](#4-supervised-learning-and-loss) | `supervised-learning` | [neural-network-from-scratch](neural-network-from-scratch.md) |
| [5. Neurons, layers and activation functions](#5-neurons-layers-and-activation-functions) | `neural-networks` | [neural-network-from-scratch](neural-network-from-scratch.md) |
| [6. Gradient descent and backpropagation](#6-gradient-descent-and-backpropagation) | `training` | [neural-network-from-scratch](neural-network-from-scratch.md) |
| [7. Tokens and tokenisation](#7-tokens-and-tokenisation) | `tokenization` | [bpe-tokenizer](bpe-tokenizer.md) |
| [8. Embeddings and similarity](#8-embeddings-and-similarity) | `embeddings` | [embeddings-vector-search](embeddings-vector-search.md) |
| [9. Attention and the transformer](#9-attention-and-the-transformer) | `attention-transformer` | [tiny-language-model](tiny-language-model.md) |
| [10. How a language model predicts and samples](#10-how-a-language-model-predicts-and-samples) | `language-models` | [tiny-language-model](tiny-language-model.md) |
| [11. Using LLMs](#11-using-llms) | `using-llms` | [embeddings-vector-search](embeddings-vector-search.md) |
| [12. Image generation](#12-image-generation) | `image-generation` | [diffusion-toy](diffusion-toy.md) |
| [13. Limits, bias, safety and cost](#13-limits-bias-safety-and-cost) | `limits-safety-cost` | |
| [14. What a framework gives you: PyTorch](#14-what-a-framework-gives-you-pytorch) | `pytorch` | [pytorch-basics](pytorch-basics.md) |
| [15. TensorFlow and Keras](#15-tensorflow-and-keras) | `tensorflow-keras` | [tensorflow-keras-basics](tensorflow-keras-basics.md) |
| [16. Computer vision](#16-computer-vision) | `computer-vision` | [computer-vision-cnn](computer-vision-cnn.md) |

## The whole idea in one paragraph

A model is a **function with adjustable numbers** (the parameters, or weights). Training shows the function many examples, measures how wrong its outputs are with one number (the loss), and nudges every parameter in the direction that makes the loss smaller. Repeat that millions of times and the function becomes useful. A language model is such a function whose input is a sequence of tokens and whose output is a probability for each possible next token. An image model is such a function whose input is a noisy picture and whose output is a guess of the noise. Everything else on this page is detail about those three sentences.

## 1. AI, machine learning and deep learning

The three terms are nested, like boxes inside boxes:

```text
+--------------------------------------------------------------+
| Artificial intelligence: programs that do tasks we associate |
| with intelligence (playing, translating, recognising)        |
|  +--------------------------------------------------------+  |
|  | Machine learning: the behaviour is learned from data   |  |
|  | instead of being written rule by rule                  |  |
|  |  +--------------------------------------------------+  |  |
|  |  | Deep learning: the learner is a neural network   |  |  |
|  |  | with many layers, which also learns its features |  |  |
|  |  +--------------------------------------------------+  |  |
|  +--------------------------------------------------------+  |
+--------------------------------------------------------------+
```

In classic programming a person writes the rules: `if the e-mail contains "prize" then spam`. In machine learning a person provides examples (e-mails already marked as spam or not) and a learning algorithm finds the rules. Deep learning goes one step further. Older methods needed a person to choose the features (count of capital letters, number of links). A deep network receives the raw input and learns useful features in its own layers. That is what "deep" refers to: several layers of learned representation, not depth of understanding.

**Kinds of learning**, by the signal the learner receives:

| Kind | The data | Example |
| --- | --- | --- |
| Supervised | inputs with the right answer (label) | photos labelled "cat" or "dog" |
| Unsupervised | inputs only, the goal is to find structure | grouping customers by behaviour |
| Self-supervised | inputs only, but the label is cut out of the input itself | hide the next word of a sentence and ask the model to predict it |
| Reinforcement | actions and rewards from an environment | a program that learns a game by playing |

Self-supervised learning is the reason language models could grow so large: any text is its own answer key, so nobody has to label billions of sentences by hand.

Words used all the time:

- **Parameters** (weights): the numbers the training adjusts. **Hyperparameters**: the numbers a person chooses before training (learning rate, number of layers).
- **Training**: adjusting the parameters. **Inference**: using the finished model, with the parameters frozen.
- **Generalisation**: doing well on examples the model never saw. It is the real goal. Doing well on the training examples alone is memorisation.
- **Discriminative** models answer a question about an input ("is this spam?"). **Generative** models produce new data that looks like the training data (text, images).

## 2. Probability and statistics

A model that writes text does not "know" the next word. It gives a **probability** to every candidate. So the language of AI is the language of probability.

A **probability distribution** lists the possible outcomes and how likely each is. The numbers are between 0 and 1 and add up to 1. For a fair die each of the six faces has 1/6.

The **expectation** (mean) is the average outcome in the long run, each value weighted by its probability. For the die: (1 + 2 + 3 + 4 + 5 + 6) / 6 = 3.5. The **variance** measures how spread the outcomes are around that mean, and the **standard deviation** is its square root, in the same unit as the data.

The **normal (Gaussian) distribution** is the bell curve. It is described by a mean and a standard deviation, and about 68% of the values fall within one standard deviation of the mean, about 95% within two. It appears in this area as the noise that diffusion models add to images, and as the random numbers that initialise the weights of a network.

**Conditional probability**, written P(A | B), is the probability of A when we already know B. A language model is a machine of conditional probabilities: P(next token | the tokens so far). The **chain rule** multiplies them to get the probability of a whole sentence:

```text
P("the cat sat") = P("the") x P("cat" | "the") x P("sat" | "the cat")
```

**Bayes' theorem** turns a conditional around. Suppose 20% of the e-mails are spam, the word "prize" appears in 40% of the spam and in 5% of the normal e-mails. An e-mail arrives with "prize". How likely is it spam?

```text
P(spam | prize) = P(prize | spam) x P(spam) / P(prize)
                = 0.40 x 0.20 / (0.40 x 0.20 + 0.05 x 0.80)
                = 0.08 / 0.12
                = 0.667
```

The common mistake is to answer 40%, which is P(prize | spam), the opposite conditional. The right answer also depends on how frequent spam is (the prior, 20%).

**Likelihood** is the probability that a model gives to the data we actually observed, seen as a function of the parameters. If a coin gives 7 heads in 10 throws, the value of p that makes this result most probable is p = 7/10. Choosing parameters this way is **maximum likelihood**, and training a neural network is exactly this. Because a product of many small probabilities becomes too small for a computer to store, we add logarithms instead of multiplying, and because optimisers minimise, we use the **negative log-likelihood**.

The **softmax** function turns any list of scores (called logits) into a probability distribution: raise e to each score and divide by the sum. For the scores (2, 1, 0):

```text
e^2 = 7.389   e^1 = 2.718   e^0 = 1.000   sum = 11.107
softmax = (0.665, 0.245, 0.090)        adds up to 1
```

The **cross-entropy loss** of one prediction is the negative logarithm of the probability given to the right answer. If the right class was the first one, the loss is -ln(0.665) = 0.408. A perfect prediction (probability 1) costs 0, and a confident wrong prediction costs a lot. **Entropy** measures how uncertain a distribution is: a fair coin has 1 bit, a coin that always lands heads has 0.

Seen running: [tiny-language-model](tiny-language-model.md) counts a table of conditional probabilities, checks that every row adds up to 1, and measures the entropy of the samples.

## 3. Vectors and matrices

Neural networks only do arithmetic on lists of numbers.

- A **scalar** is one number. A **vector** is a list of numbers, such as (3, 4). A **matrix** is a table of numbers with rows and columns. A **tensor** is the general name, with any number of dimensions: a colour image is a tensor of height x width x 3.
- The **shape** says how many numbers there are in each dimension. Most bugs in machine learning code are shape bugs.

A vector can be read as a point in space or as an arrow from the origin to that point. Its **length** (norm) comes from Pythagoras: the length of (3, 4) is sqrt(9 + 16) = 5.

The **dot product** multiplies two vectors position by position and adds the results:

```text
(1, 2, 3) . (4, 0, -1) = 1x4 + 2x0 + 3x(-1) = 1
```

It is large when the two vectors point the same way, zero when they are perpendicular and negative when they point in opposite directions. The **cosine similarity** is the dot product divided by the two lengths, so only the direction counts:

```text
a = (3, 4)   b = (4, 3)
a . b = 12 + 12 = 24        |a| = 5   |b| = 5
cosine = 24 / (5 x 5) = 0.96
```

It goes from -1 (opposite) through 0 (unrelated) to 1 (same direction). (1, 2, 2) and (2, 4, 4) have cosine 1, because one is the other multiplied by 2. This one formula is how a search engine decides that two texts talk about the same thing (section 8).

A **matrix times a vector** is a batch of dot products: each row of the matrix is multiplied by the vector. A matrix with m rows and n columns takes a vector of n numbers and returns a vector of m numbers. One layer of a neural network is this operation plus a vector of biases: `y = W x + b`. When two matrices are multiplied, the number of columns of the first must equal the number of rows of the second, and the order matters: A x B is in general different from B x A.

Seen running: [embeddings-vector-search](embeddings-vector-search.md) ranks words and passages by cosine similarity.

## 4. Supervised learning and loss

Supervised learning has pairs (input, right answer). If the answer is a number (the price of a house) the task is **regression**. If the answer is a category (spam or not) it is **classification**.

The **loss function** turns "how wrong is the model?" into one number, which training tries to make small. For regression the usual one is the **mean squared error**:

```text
predictions: 2, 4, 6        right answers: 3, 4, 4
errors:      -1, 0, 2       squares: 1, 0, 4
MSE = (1 + 0 + 4) / 3 = 1.667
```

For classification it is the cross-entropy of section 2.

The data is split in three parts, and the split is the most important habit of the field:

| Part | Used for |
| --- | --- |
| Training set | adjusting the parameters |
| Validation set | choosing hyperparameters and deciding when to stop |
| Test set | one final, honest measurement on data never used for any decision |

**Overfitting** is when the model memorises the training set, including its noise, and does badly on new data. The sign is a training loss that keeps falling while the validation loss starts to rise. **Underfitting** is the opposite: the model is too simple (or trained too little) and is bad on both.

```text
loss
 |\
 | \   .  validation               . '
 |  \    ' .                 . '
 |   \       ' - . _ _ . - '        <- overfitting starts here
 |    '.
 |      ' - . _  training
 |               ' ' - - . . . _ _ _
 +------------------------------------> training time
```

Two traps for a beginner. First, **accuracy can lie**: if 99% of the transactions are legitimate, a model that always answers "legitimate" is 99% accurate and useless, which is why precision and recall exist. Second, **data leakage**: if information from the test set slips into training (the same example on both sides, or a feature that would not exist at prediction time), the measured result is better than reality.

Seen running: [neural-network-from-scratch](neural-network-from-scratch.md) trains a classifier and measures it on points it did not train on.

## 5. Neurons, layers and activation functions

An artificial **neuron** does three things: multiplies each input by a weight, adds everything plus a bias, and passes the result through an activation function.

```text
x1 = 1.0 --( w1 =  0.5 )--\
                           (+) --> z = 0.5 - 2.0 + 0.5 = -1.0 --> activation --> output
x2 = 2.0 --( w2 = -1.0 )--/
              bias b = 0.5
```

With the ReLU activation the output is max(0, -1.0) = 0. With tanh it is tanh(-1.0) = -0.762.

The **activation function** is what makes the network more than a linear formula. Without it, two layers in a row would be `W2 (W1 x)`, which is the same as one layer with the matrix `W2 W1`: stacking would add nothing. The common ones:

| Function | Formula | Output range | Note |
| --- | --- | --- | --- |
| Sigmoid | 1 / (1 + e^-z) | 0 to 1 | reads as a probability, but saturates: far from zero its slope is almost 0 |
| tanh | (e^z - e^-z) / (e^z + e^-z) | -1 to 1 | centred on zero, also saturates |
| ReLU | max(0, z) | 0 to infinity | cheap and does not saturate on the positive side. A neuron stuck on the negative side stops learning ("dying ReLU") |

Neurons are organised in **layers**. Every neuron of a layer receives all the outputs of the previous layer. A network with an input, hidden layers and an output is a multi-layer perceptron (MLP):

```text
input (2)      hidden (8)      output (1)
   o ----------- o o o o
     \  /  /  /  o o o o ----------- o
   o ----------- (every input goes to every hidden neuron)
```

Counting its **parameters**: each hidden neuron has 2 weights and 1 bias, so 2 x 8 + 8 = 24. The output neuron has 8 weights and 1 bias, 9. Total: 33. A language model is the same kind of count with billions instead of 33.

Why hidden layers matter: a single neuron can only separate its inputs with a straight line. XOR ("one or the other, but not both") cannot be separated by one line, so one neuron can never learn it. A hidden layer bends the space so that a line is enough afterwards. The classic theorem says that a network with one hidden layer can approximate any continuous function if it has enough neurons. It says the right weights exist, not that training will find them.

Seen running: [neural-network-from-scratch](neural-network-from-scratch.md) builds neurons, layers and an MLP, and learns XOR.

## 6. Gradient descent and backpropagation

Training is a search for the parameters that make the loss small. Picture the loss as a landscape of hills and the parameters as your position. You are in the fog and can only feel the slope under your feet. The sensible plan is to take a small step downhill and feel again. That plan is **gradient descent**.

The **gradient** is the list of slopes, one per parameter: how much the loss would grow if that parameter grew a little. Since it points uphill, we step against it:

```text
new weight = old weight - learning rate x gradient
```

A worked case with one parameter. The loss is L(w) = (w - 3)^2, whose minimum is at w = 3, and whose slope is 2 (w - 3). Start at w = 0 with a learning rate of 0.1:

```text
step 1: slope = 2 x (0 - 3)    = -6.0    w = 0    - 0.1 x (-6.0) = 0.6
step 2: slope = 2 x (0.6 - 3)  = -4.8    w = 0.6  - 0.1 x (-4.8) = 1.08
step 3: slope = 2 x (1.08 - 3) = -3.84   w = 1.08 - 0.1 x (-3.84) = 1.464
```

Each step gets closer to 3. The **learning rate** is the size of the step. Too small and training takes forever. Too large and the steps jump over the valley and the loss grows instead of shrinking (with a rate of 1.1 in this example, w moves away from 3 at every step).

**Backpropagation** is how the gradient of millions of parameters is computed in one pass. It is the chain rule of calculus applied from the loss back to the inputs. Each operation knows only its own local slope, and the slopes are multiplied along the way back. For f = (x + y) x z with x = 2, y = 1, z = 4:

```text
forward:   q = x + y = 3        f = q x z = 12
backward:  df/dz = q = 3        df/dq = z = 4
           df/dx = df/dq x dq/dx = 4 x 1 = 4
           df/dy = df/dq x dq/dy = 4 x 1 = 4
```

Check by hand: raising x from 2 to 2.01 gives f = 3.01 x 4 = 12.04, a rise of 0.04 = 4 x 0.01. That is also how code is tested: compare the gradient of backpropagation with (f(x + h) - f(x - h)) / 2h, the **numerical gradient**.

The vocabulary of a training run:

- **Batch**: the examples used for one update. Using a few examples at a time (a mini-batch) is **stochastic gradient descent**: each step is noisier but far cheaper than using all the data. One pass over the whole training set is an **epoch**.
- **Optimisers** change how the step is taken. Momentum keeps part of the previous step, like a ball that gathers speed. Adam also adapts the step size of each parameter.
- **Regularisation** fights overfitting: weight decay (L2) pulls the weights towards zero, **dropout** switches off random neurons during training (never at inference), and early stopping ends training when the validation loss stops improving.
- **Vanishing gradients**: in a deep network the slopes are multiplied layer after layer. If they are smaller than 1 (as in the flat parts of sigmoid and tanh), the product shrinks towards zero and the first layers stop learning. ReLU, residual connections (adding the input of a block to its output) and normalisation layers are the usual cures.

Seen running: [neural-network-from-scratch](neural-network-from-scratch.md) implements the chain rule value by value, checks it against the numerical gradient and writes the loss curve.

## 7. Tokens and tokenisation

A model computes on numbers, so text must become numbers first. The unit is the **token**: a piece of text with an integer id. The list of all the tokens a model knows is its **vocabulary**.

Three ways to cut text:

| Unit | Vocabulary | Problem |
| --- | --- | --- |
| Words | huge (every form of every word) | a word outside the vocabulary cannot be represented |
| Characters | tiny | sequences become very long and each unit carries little meaning |
| **Subwords** | medium, chosen by us | none of the two: common words are one token, rare words are split into known pieces |

Modern models use subwords, and the best known algorithm is **byte-pair encoding (BPE)**. Training it is a loop: count every pair of neighbouring tokens, merge the most frequent pair into a new token, repeat. With the text `banana bandana`, starting from characters (14 tokens, the space included):

```text
start     b a n a n a _ b a n d a n a         14 tokens
merge 1   "a"+"n" (4 times)  ->  b an an a _ b an d an a      10 tokens
merge 2   "b"+"an" (2 times) ->  ban an a _ ban d an a         8 tokens
merge 3   "an"+"a" (2 times) ->  ban ana _ ban d ana           6 tokens
```

Each merge adds one token to the vocabulary and makes the text shorter. That is the trade: **a larger vocabulary gives fewer tokens for the same text**.

Real tokenisers start from **bytes**, not from characters. Every text in UTF-8 is a sequence of bytes, and a byte has only 256 values, so the base vocabulary has 256 tokens and no text is ever "unknown": `é` is 2 bytes, an emoji is 4. The vocabulary size is then 256 plus the number of merges (plus a few special tokens, such as the one that marks the end of a text). Decoding joins the bytes back, so encoding and then decoding returns exactly the original text.

Consequences that matter in practice:

- **A token is not a word.** A common English word is often one token, a rare or long word is several, and the same sentence gives different counts in different languages and in different tokenisers. Rules of thumb such as "a token is about three or four characters of English" are only estimates.
- **Models are limited and priced in tokens**, because a token is the unit of work: the model runs once for every token it reads and once for every token it writes.
- The **context window** is the maximum number of tokens the model can look at in one go: instructions, the conversation so far, attached documents and the answer being written all share it. It is a working memory, different from what the model learned in training. Text that does not fit is simply not seen.

Seen running: [bpe-tokenizer](bpe-tokenizer.md) trains BPE on bytes, shows the tokens of a sentence with ids and boundaries, and tables how the count falls as merges grow.

## 8. Embeddings and similarity

A token id is only a label: token 512 is not "more" than token 511. To compute with meaning, each token receives a vector, called an **embedding**. It is a row of a big table with one row per token of the vocabulary, and the numbers in that table are parameters, learned like any other.

Where does the meaning come from? From the **distributional hypothesis**: words that appear in the same contexts have similar meanings. "Coffee" and "tea" both appear near "cup", "hot" and "drink". Count, for each word, which words appear near it, and the two rows of counts will be alike:

```text
            cup   hot   drink   engine   road
coffee       8     6     9        0       0
tea          7     5     8        0       0
car          0     1     0        9       7
```

Each row is a vector. The cosine similarity (section 3) between "coffee" and "tea" is close to 1, and between "coffee" and "car" it is close to 0. Methods such as word2vec and GloVe produce short, dense vectors from this same signal, and in them some directions carry meaning, which is why arithmetic like king - man + woman lands near queen.

Those vectors are **static**: one vector per word, so the "bank" of a river and the "bank" of money share one. Inside a transformer the vector of each token is updated by the tokens around it (section 9), giving **contextual** embeddings.

The same trick works for whole sentences and documents: a model maps a text to one vector, and texts with similar meaning land near each other. **Vector search** is then: turn the question into a vector and find the stored vectors nearest to it.

- **Brute force** compares the question with every stored vector. It is exact, and its cost grows with the number of vectors.
- An **approximate index** looks only at a promising part of the data. A simple one draws random planes through the space and records on which side of each plane a vector falls. Vectors pointing in similar directions tend to get the same pattern of sides, so they end up in the same bucket, and a query is compared only with its own bucket. It is much faster and sometimes misses the true nearest neighbour. The share of right answers it finds is its **recall**.

Seen running: [embeddings-vector-search](embeddings-vector-search.md) builds word vectors from co-occurrence counts, compares brute force with a random-plane index and retrieves the passages that answer a question.

## 9. Attention and the transformer

To predict the next word of "The animal did not cross the street because it was too tired", the model must work out that "it" is the animal. The vector of "it" needs information from another position. **Attention** is the operation that moves information between positions.

Each token produces three vectors from its embedding: a **query** ("what am I looking for?"), a **key** ("what do I offer?") and a **value** ("what I pass on if chosen"). For one token:

1. Its query is compared with the key of every token by a dot product. That gives one score per token.
2. Softmax turns the scores into weights that add up to 1.
3. The output is the average of the values, weighted by those weights.

```text
query q = (1, 0)
keys     k1 = (1, 0)   k2 = (0, 1)   k3 = (1, 1)
scores   q.k1 = 1      q.k2 = 0      q.k3 = 1
weights  softmax(1, 0, 1) = (0.422, 0.155, 0.422)
values   v1 = 10       v2 = 20       v3 = 30
output   0.422 x 10 + 0.155 x 20 + 0.422 x 30 = 20.0
```

The paper that introduced the transformer writes all of it in one line, `softmax(Q K^T / sqrt(d_k)) V`. The division by the square root of the size of the keys keeps the scores from growing with the vector size, which would push softmax into a nearly one-hot output with almost no gradient.

Three details complete the picture:

- **Multi-head attention** runs several attentions in parallel, each with its own query, key and value matrices, so one head can follow grammar while another follows who "it" is. Their outputs are joined.
- **Causal mask**: a model that predicts the next token must not see the future. Before softmax, the scores of later positions are set to minus infinity, so their weight is 0.

    ```text
    position can look at ->   1   2   3   4
    token 1                   x   .   .   .
    token 2                   x   x   .   .
    token 3                   x   x   x   .
    token 4                   x   x   x   x
    ```

- **Position information**: attention treats its input as a bag of tokens, with no order. So a vector that encodes the position is added to each token embedding.

A **transformer block** is attention followed by a small MLP applied to each position, each of the two wrapped in a residual connection and a normalisation. A model is a stack of such blocks:

```text
token ids
   |
[ token embedding + position embedding ]
   |
[ block 1: attention -> MLP ]     tokens exchange information, then each one "thinks"
[ block 2: attention -> MLP ]
   ...
[ final linear layer + softmax ]
   |
a probability for every token of the vocabulary
```

The original transformer had an **encoder** (reads the whole input, every token sees every other) and a **decoder** (writes the output one token at a time), and was built for translation. Models that only understand text, such as BERT, keep the encoder. Models that generate text, such as GPT, keep the decoder.

Compared with the recurrent networks used before, a transformer processes all positions at once during training, which fits parallel hardware. The price is that every token looks at every other one: with n tokens there are n x n pairs, so doubling the length of the text multiplies that work by four.

Seen running: [tiny-language-model](tiny-language-model.md) implements causal self-attention and a transformer block with NumPy, forward and backward.

## 10. How a language model predicts and samples

A language model does one thing: given the tokens so far, it outputs a **probability for each possible next token**. Text generation is a loop around that one thing:

```text
"The sky is"  -> model -> { blue: 0.62, clear: 0.11, falling: 0.02, ... }
                 choose one token ("blue"), append it
"The sky is blue" -> model -> { .: 0.41, and: 0.20, ... }
                 ... until an end token or a length limit
```

The simplest language model counts. A **bigram** model looks only at the previous token: count how often each token follows each other one, and divide each row by its total.

```text
after "the":  cat 3 times, dog 1 time   ->  P(cat | the) = 3/4 = 0.75   P(dog | the) = 0.25
```

A transformer does the same job with a much better memory: it conditions on the whole context window instead of one token, and it shares what it learned between similar contexts instead of keeping one table row per context.

**Training** needs no labels: take any text, hide the next token, ask for the prediction and use the cross-entropy against the token that really came. The usual report is the loss, or its exponential, the **perplexity**: a model that hesitates equally between 8 tokens at every step has perplexity 8. Lower is better, and it is measured on text held out from training.

**Sampling** is how one token is chosen from the distribution. The choice changes the style of the output more than people expect:

| Method | What it does |
| --- | --- |
| Greedy | always the most probable token. Deterministic, tends to be dull and repetitive |
| Sampling | draws a token with the probability the model gave it |
| Temperature T | divides the logits by T before softmax |
| Top-k | keeps the k most probable tokens, renormalises, then samples |
| Top-p (nucleus) | keeps the smallest set of tokens whose probabilities add up to p, renormalises, then samples |

The effect of temperature on the logits (2, 1, 0):

```text
T = 0.5   logits (4, 2, 0)      ->  (0.867, 0.117, 0.016)    sharper, safer
T = 1.0   logits (2, 1, 0)      ->  (0.665, 0.245, 0.090)    the model as trained
T = 2.0   logits (1, 0.5, 0)    ->  (0.506, 0.307, 0.186)    flatter, more varied
```

As T approaches 0 the result approaches greedy decoding. This is why the same question can receive different answers: the model is sampled, not looked up.

**Pre-training and fine-tuning.** Pre-training is the long, expensive phase on a huge amount of general text with the next-token objective, where the model picks up grammar, facts and patterns of reasoning. **Fine-tuning** continues the training on a smaller, specific dataset: conversations, to become an assistant, or the documents of one field. BERT is pre-trained with a different game: some tokens are masked and the model fills the gaps using both sides of the context, which is good for understanding and not suited to writing.

Seen running: [tiny-language-model](tiny-language-model.md) compares a bigram table with a small transformer on held-out text and tables how temperature changes the entropy of the samples.

## 11. Using LLMs

A large language model (LLM) is used through its context window. Everything it knows about your request is the text in that window plus what was stored in its weights during training.

- **Prompt**: the text given to the model. A **system prompt** sets the role and the rules, and the user messages follow. Clear, specific instructions with the needed context work better than short hints.
- **Few-shot prompting**: put some worked examples in the prompt and the model continues the pattern. Nothing is trained: the weights stay the same, the examples act only through the context (in-context learning).
- **The model has no memory between calls.** A chat application resends the whole conversation every time. When the conversation no longer fits the window, something must be cut or summarised.

**Retrieval-augmented generation (RAG)** answers "how can the model use documents it never saw in training?":

```text
question --> [ search: embed the question, find the nearest passages ] --> passages
                                                                              |
answer   <-- [ model: reads question + passages in its context ] <------------+
```

The search step is the vector search of section 8. The model then writes the answer from the passages, which can be cited and kept up to date without retraining.

**Tools** let a model act. The application describes functions (search, calculator, database query). When the model decides one is needed it writes a structured request, the application runs the function and puts the result back in the context, and the model continues. The model never executes anything by itself. An **agent** is this in a loop: the model chooses the next action, observes the result and repeats until the task is done. When the steps are fixed in code and the model only fills each step, it is a workflow, which is simpler and more predictable.

**Hallucination** is fluent text that is false: an invented quote, a reference that does not exist. It is a direct consequence of how the model works: it produces a plausible continuation, and plausible is not the same as true. What reduces it: giving the source text in the context and asking the model to answer only from it, allowing "I don't know", asking for citations, and checking the claims. Nothing removes it completely, so important outputs are verified.

**Evaluation** means measuring on examples the model did not see, with the answers defined beforehand. One impressive answer is an anecdote. Public test questions leak into training data over time (contamination), which makes a model look better than it is.

One risk to know: anything placed in the context can influence the model, including text written by someone else (a web page, an e-mail). Instructions hidden in such text are called **prompt injection**. The defence is to treat retrieved text as data, restrict what tools can do and keep a person in the loop for actions that matter.

Seen running: [embeddings-vector-search](embeddings-vector-search.md) implements the retrieval step: a question picks the most relevant passages.

## 12. Image generation

For a computer an **image** is a tensor of numbers: height x width x 3 colour channels. A small 64 x 64 colour picture is already 12,288 numbers.

**Convolution** is the layer made for images. A small filter (say 3 x 3 weights) slides over the image, and at each position computes a dot product with the patch under it. The same filter is used everywhere, so a pattern learned in one corner is recognised in any corner, and the layer needs few parameters.

```text
output size = (W - F + 2P) / S + 1        W input, F filter, P padding, S stride
28-pixel input, 3-pixel filter, no padding, stride 1:   (28 - 3 + 0) / 1 + 1 = 26
8 filters of 3 x 3 on a 1-channel image:   8 x (3 x 3 x 1) weights + 8 biases = 80 parameters
```

Early layers end up detecting edges, later layers shapes and objects. That is how a network sees. Generating is the reverse direction, and three families do it.

**Autoencoders.** An encoder squeezes the image into a short vector (the **latent**), and a decoder rebuilds the image from it. Trained to make output equal input, it learns a compressed description. A **variational autoencoder (VAE)** makes the encoder output a small cloud (a mean and a spread) instead of a point and keeps those clouds close to a standard normal. Then any random point drawn from a normal can be decoded into a new, plausible image.

**GANs (generative adversarial networks).** Two networks play against each other. The generator turns random noise into an image. The discriminator receives real and generated images and tries to tell which is which. Each improves by beating the other, and at the ideal end the discriminator can only guess (50%). GANs generate in one pass and can be very sharp, but the game is unstable to train and the generator may produce only a few kinds of image (mode collapse).

**Diffusion models**, which are behind most current image generators, split the problem into many easy steps.

```text
forward (fixed, no learning): add a little noise, many times
   image  ->  slightly noisy  ->  noisier  ->  ...  ->  pure noise

reverse (learned): remove a little noise, many times
   pure noise  ->  ...  ->  less noisy  ->  slightly noisy  ->  image
```

1. **Forward process.** Gaussian noise is added step by step until nothing of the image is left. There is a shortcut to any step t: `x_t = sqrt(a) x_0 + sqrt(1 - a) noise`, where `a` goes from almost 1 (first steps) to almost 0 (last step). With a = 0.5, a pixel worth 2 and a noise draw of -1 give 0.707 x 2 + 0.707 x (-1) = 0.707.
2. **Training.** Take an image, pick a random step, add the noise, and ask the network: "which noise was added?". The loss is the mean squared error between the true noise and the guess. It is plain supervised learning, with labels we created ourselves.
3. **Generation.** Start from pure random noise and repeat: ask the network for the noise, subtract a part of it, go to the previous step. After all the steps an image appears that was never in the training set.

Two additions turn this into a text-to-image system. **Latent diffusion** runs the whole process on the small latent of an autoencoder instead of on the pixels, and decodes only at the end, which costs much less computation. **Text conditioning** encodes the prompt with a text model and lets the denoising network look at it through cross-attention (section 9, with the image asking the questions and the text holding the keys and values), so each step is steered towards an image that matches the description.

Diffusion is slower to generate than a GAN, because it calls the network once per step instead of once, but it trains stably and covers the variety of the data well.

Seen running: [diffusion-toy](diffusion-toy.md) does all of this on two-dimensional points instead of pixels, so each step can be plotted.

## 13. Limits, bias, safety and cost

**Size and memory.** A model is its parameters. Memory is the number of parameters times the bytes of each one:

```text
7 billion parameters x 4 bytes (32-bit floats) = 28 GB
7 billion parameters x 1 byte  (8-bit integers) = 7 GB
```

Storing each weight with fewer bits is **quantisation**. The model becomes smaller and often faster, and loses a little accuracy, since each weight is rounded to one of only 256 values.

**Cost.** Training is paid once and is enormous: many specialised chips for weeks. Inference is paid on every use and grows with the number of tokens read and written, which is why APIs charge per token, and why a long prompt is more expensive and slower than a short one.

**What a language model is not.**

- It is not a database. It stores patterns, not records, so it can be wrong with full confidence (section 11).
- It has a **knowledge cutoff**: it knows nothing after the date its training data ends, unless the information is placed in the context.
- It is sensitive to the wording of the request, and the same request can give different answers.
- It is weak at exact work on its own (long arithmetic, counting characters), because it sees tokens and predicts likely text. Tools fix this: a calculator does not guess.

**Bias.** A model learns the patterns of its data, including the unfair ones. If the texts of the past associate a profession with one gender, the model repeats the association. Curating the data, testing the outputs across groups and correcting during fine-tuning reduce the problem and do not end it.

**Privacy and memorisation.** A model can reproduce pieces of its training data. Sensitive data should not be used for training without care, and should not be pasted into a service without knowing how it will be used.

**Safety, in one rule.** The more a system can do on its own (send messages, spend money, change files), the more its outputs need limits and review. A person stays responsible for decisions that affect people: health, law, money, hiring.

## 14. What a framework gives you: PyTorch

Sections 5 and 6 can be written by hand, and the first mini-projects do exactly that. Nobody trains a real model that way. A deep learning **framework** provides four things, and they are the same four in every framework:

| Piece | What it does | By hand it was |
| --- | --- | --- |
| **Tensor** | an array of numbers of any shape, with fast operations that also run on a GPU | Python lists and loops |
| **Automatic differentiation** | records the operations of the forward pass and computes every gradient | the backward function you wrote for each operation |
| **Modules (layers)** | ready-made blocks that own their parameters | your `Neuron` and `Layer` classes |
| **Optimisers** | apply the update rule to all the parameters | the loop `w = w - lr * grad` |

**Tensors.** A PyTorch tensor has a `shape`, a `dtype` (for example 32-bit floats) and a `device` (CPU or GPU). `a * b` multiplies element by element and `a @ b` is the matrix product of section 3.

**Automatic differentiation.** Mark a tensor with `requires_grad=True` and PyTorch records every operation made with it. Calling `backward()` on the result runs backpropagation and leaves each gradient in `.grad`:

```python
import torch

x = torch.tensor(2.0, requires_grad=True)
y = x**2 + 3 * x  # dy/dx = 2x + 3
y.backward()
print(x.grad)  # tensor(7.)
```

The graph is built while the code runs, so ordinary Python `if` and `for` can be part of a model. One detail surprises everybody once: **gradients accumulate**. A second `backward()` adds to `.grad` instead of replacing it, which is why a training loop clears the gradients at every step.

**Modules.** A model is a class that inherits from `nn.Module`: the layers are created in `__init__` and the computation is written in `forward`. The module finds its own parameters, so `model.parameters()` hands all of them to the optimiser. For a plain stack of layers `nn.Sequential` is enough.

**The training loop** is written by you, and it is always the same five lines:

```python
model = nn.Sequential(nn.Linear(2, 8), nn.Tanh(), nn.Linear(8, 1))
loss_fn = nn.BCEWithLogitsLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.5)

for epoch in range(200):
    logits = model(inputs)  # 1. forward pass
    loss = loss_fn(logits, targets)  # 2. how wrong?
    optimizer.zero_grad()  # 3. clear the old gradients
    loss.backward()  # 4. backpropagation
    optimizer.step()  # 5. update every parameter
```

That model is the 2-8-1 network of section 5, with its 33 parameters. Two switches are easy to confuse. `torch.no_grad()` stops recording operations: it is used when measuring or using a model, saves memory and computes nothing different. `model.eval()` changes the behaviour of layers that act differently in training, such as dropout: it does not stop gradients. Evaluation code uses both.

One more common mistake: `nn.CrossEntropyLoss` expects the raw scores (logits) and applies the softmax itself. Passing probabilities applies softmax twice and the model learns badly without any error message.

Seen running: [pytorch-basics](pytorch-basics.md) checks PyTorch's gradients against numerical gradients and against the hand-written backpropagation of [neural-network-from-scratch](neural-network-from-scratch.md), then trains the same network and compares lines of code and time.

## 15. TensorFlow and Keras

TensorFlow is the other large framework, and Keras is its high-level interface. The ideas are the ones of section 14 with other names.

**Tensors and variables.** A `tf.Tensor` cannot be changed after it is created. A `tf.Variable` holds a value that training updates, so the parameters of a model are variables.

**Gradients with a tape.** TensorFlow records operations only inside a `tf.GradientTape` block, and the tape is then asked for the gradient:

```python
import tensorflow as tf

x = tf.Variable(3.0)
with tf.GradientTape() as tape:
    y = x * x  # dy/dx = 2x
print(tape.gradient(y, x))  # 6.0
```

Trainable variables are watched automatically. A constant is not: its gradient comes back as `None` unless `tape.watch` is called. A tape serves one `gradient` call, unless it is created with `persistent=True`.

**Keras: the loop is already written.** With Keras the model is described, configured and trained in three calls:

```python
model = keras.Sequential(
    [
        keras.Input(shape=(2,)),
        layers.Dense(8, activation="tanh"),
        layers.Dense(1, activation="sigmoid"),
    ]
)
model.compile(optimizer="sgd", loss="binary_crossentropy", metrics=["accuracy"])
history = model.fit(inputs, targets, epochs=200, batch_size=32)
loss, accuracy = model.evaluate(test_inputs, test_targets)
```

`compile` chooses the optimiser, the loss and the metrics. `fit` runs the loop of section 14 (forward, loss, gradients, update) for the given number of epochs and returns a history with the loss of each epoch. `evaluate` measures on other data and `predict` returns outputs. This is convenient, and it hides the loop: when something unusual is needed (two networks training against each other, as in a GAN), the step is written by hand with a gradient tape, exactly like the PyTorch loop.

**Eager execution against graphs.** By default TensorFlow runs each operation immediately, as Python reaches it. This is **eager execution**: easy to debug, with the overhead of Python on every step. Decorating a function with `tf.function` makes TensorFlow run it once to record a **graph** of its operations (this is called tracing) and afterwards execute the graph directly. A graph is faster, can be optimised as a whole and can be saved and run where there is no Python, such as a phone or a server written in another language. The catch is that ordinary Python code inside the function, a `print` for example, runs only during tracing and not on later calls.

| Concept | PyTorch | TensorFlow and Keras |
| --- | --- | --- |
| Array of numbers | `torch.Tensor` | `tf.Tensor`, and `tf.Variable` for parameters |
| Gradient | `requires_grad=True`, `loss.backward()`, `.grad` | `with tf.GradientTape() as tape`, `tape.gradient(loss, variables)` |
| Fully connected layer | `nn.Linear(2, 8)` | `layers.Dense(8)` |
| Model | a class that inherits from `nn.Module` | `keras.Sequential` or `keras.Model` |
| Optimiser step | `optimizer.zero_grad()`, `optimizer.step()` | `optimizer.apply_gradients(...)` |
| Training loop | written by hand | `model.fit(...)`, or by hand with a tape |
| Execution | eager, the graph is rebuilt at every forward pass | eager by default, a graph with `tf.function` |

Learning one framework makes the other easy, because the concepts under the names are the ones of sections 3 to 6.

Seen running: [tensorflow-keras-basics](tensorflow-keras-basics.md) trains the same network with `fit` and with a gradient tape, and puts the two frameworks side by side.

## 16. Computer vision

Computer vision is the part of AI that works with images. Section 12 introduced convolution in order to explain image generation. This section is about the opposite direction: understanding an image.

**Images as tensors.** A greyscale image is a matrix of brightness values, usually from 0 (black) to 255 (white), scaled to the range 0 to 1 before entering a network. A colour image has three such matrices, one per channel (red, green, blue). A batch of 32 colour images of 64 x 64 pixels is a tensor of shape 32 x 3 x 64 x 64 in PyTorch (channels first) and 32 x 64 x 64 x 3 in TensorFlow (channels last). The numbers are the same, only the order of the dimensions is a convention.

**Why not a plain network?** Connecting every pixel to every neuron costs too much and ignores what an image is. A 64 x 64 colour image has 12,288 values, so one layer of 100 neurons already has 12,288 x 100 + 100 = 1,228,900 parameters. Worse, that layer treats a cat in the left corner and the same cat in the right corner as unrelated inputs.

**Convolution** fixes both problems. A small filter slides over the image and computes one dot product at each position:

```text
patch of the image       filter (vertical edge)       sum of the products
   0   0   9                -1   0   1
   0   0   9                -1   0   1                (0+0+9) + (0+0+9) + (0+0+9) = 27
   0   0   9                -1   0   1
```

The patch goes from dark on the left to bright on the right, and the filter answers with a large number: it found a vertical edge. On a flat patch (all values equal) the same filter answers 0. The output of a filter over the whole image is a **feature map**: a picture of where the pattern is.

- **Shared weights.** The same 9 numbers are used at every position, so the layer has few parameters and a pattern learned in one place is found everywhere. If the object moves, the response moves with it.
- **The filters are learned.** Nobody writes the edge filter. Training finds the filters that reduce the loss, and the first layer of almost every vision network ends up with edge and colour detectors.
- **Pooling** shrinks a feature map by keeping one value per region, usually the maximum of each 2 x 2 block. It halves each side, has no parameters and makes the result less sensitive to small shifts.
- **Receptive field.** Each layer sees a slightly larger part of the image than the one before: two 3 x 3 layers in a row see 5 x 5 pixels. Deep layers therefore react to whole shapes and objects.

A **convolutional network (CNN)** repeats convolution, activation and pooling, and ends with a small classifier:

```text
image -> [conv + ReLU + pool] -> [conv + ReLU + pool] -> flatten -> linear layer -> one score per class
         edges, colours          corners, textures, parts            decision
```

**The architectures to know**, each remembered for one idea:

| Network | Year | The idea |
| --- | --- | --- |
| LeNet-5 | 1998 | convolution and subsampling followed by fully connected layers, reading handwritten digits |
| AlexNet | 2012 | a much larger CNN trained on GPUs with ReLU, dropout and augmentation. Its win in the ImageNet competition started the deep learning era |
| VGG | 2014 | depth with only small 3 x 3 filters, stacked |
| ResNet | 2015 | shortcut connections: a block outputs its input plus a correction, which made networks of over a hundred layers trainable |

**Data augmentation.** A cat moved a few pixels, slightly rotated or mirrored is still a cat. Applying such random changes to the training images creates new examples for free and teaches the network to ignore them. It is applied only to the training set, and the changes must keep the label true: mirroring a "b" makes a "d".

**Transfer learning.** The first layers of a network trained on millions of images detect edges, textures and shapes that are useful for almost any image task. So instead of training from zero with little data, we take a pre-trained network and either freeze it and train only a new last layer, or continue training all of it with a small learning rate (fine-tuning, as in section 10). It is the same idea as pre-training a language model.

**Beyond classification.**

| Task | Output | Example |
| --- | --- | --- |
| Classification | one label for the image | "cat" |
| Detection | a box and a label for each object | YOLO predicts all the boxes and classes in a single pass over the image, which makes it fast enough for video |
| Segmentation | a label for each pixel | U-Net shrinks the image to understand it and expands it back to full size, with shortcut connections that bring the fine detail across |

The overlap between a predicted box and the true one is measured by the **intersection over union**: the area the two boxes share divided by the area they cover together, from 0 (no overlap) to 1 (identical).

Today transformers (section 9) are also used for images: the image is cut into patches and each patch is treated like a token. And the denoising network of a diffusion model (section 12) is usually a U-Net. The pieces of this page keep being recombined.

Seen running: [computer-vision-cnn](computer-vision-cnn.md) writes a convolution by hand, trains a small CNN on shapes it draws itself, compares it with a fully connected network on shifted images, and saves the learned filters as images.

## Where to go next

1. Run the mini-projects in this order: [bpe-tokenizer](bpe-tokenizer.md), [neural-network-from-scratch](neural-network-from-scratch.md), [embeddings-vector-search](embeddings-vector-search.md), [tiny-language-model](tiny-language-model.md), [diffusion-toy](diffusion-toy.md), and then the three that use a framework: [pytorch-basics](pytorch-basics.md), [tensorflow-keras-basics](tensorflow-keras-basics.md), [computer-vision-cnn](computer-vision-cnn.md).
2. Answer the quiz of the area (`quiz/content/artificial-intelligence/`), which follows the same sixteen sections.
3. Read and watch the material in [references.md](references.md), which says what each source is good for.
