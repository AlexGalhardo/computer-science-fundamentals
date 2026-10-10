# Artificial intelligence and LLMs

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Modern artificial intelligence is machine learning at scale: models with many adjustable numbers that are trained on data instead of being programmed by hand. This area goes from the mathematics underneath (probability, linear algebra, gradient descent and backpropagation) to the pieces of a large language model (tokens, embeddings, attention, next-token prediction) and of image generators (diffusion), and to their limits and costs.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| BPE tokenizer (`bpe-tokenizer`) | How text becomes tokens, and why a model counts tokens and not words | planned |
| Neural network from scratch (`neural-network-from-scratch`) | What a neuron computes and how backpropagation finds the gradients | planned |
| Embeddings and vector search (`embeddings-vector-search`) | How meaning becomes a vector and how similar vectors are found | planned |
| Tiny language model (`tiny-language-model`) | How a language model predicts the next token, from counting to self-attention | planned |
| Diffusion toy (`diffusion-toy`) | How an image model learns to remove noise, on two-dimensional points instead of pixels | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/artificial-intelligence/`).
- Documentation: planned (`docs/en/artificial-intelligence/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Neural networks](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi), Grant Sanderson, 3Blue1Brown. Free. The best visual introduction: what a network is, gradient descent, backpropagation, then transformers and attention.
- [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html), Andrej Karpathy. Free. A video course that codes everything from scratch: an autograd engine, a character model, then a GPT.
- [Deep Learning Book](https://www.deeplearningbook.com.br/), Data Science Academy. In Portuguese. Free. A free online book in Portuguese with many short chapters, from the perceptron to transformers.

### Books

- [Deep Learning](https://www.deeplearningbook.org/), Ian Goodfellow, Yoshua Bengio and Aaron Courville. Free online, paid in print. The reference textbook, free to read online: the mathematics, optimisation, regularisation and the main architectures.
- [Dive into Deep Learning](https://d2l.ai/), Zhang, Lipton, Li and Smola. Free. A free interactive book where every concept comes with runnable code, including attention and transformers.
- [Speech and Language Processing, 3rd edition draft](https://web.stanford.edu/~jurafsky/slp3/), Dan Jurafsky and James Martin. Free. The free draft textbook of language processing: n-grams, embeddings, transformers and large language models.
- [Mathematics for Machine Learning](https://mml-book.github.io/), Deisenroth, Faisal and Ong. Free online, paid in print. A free PDF covering exactly the linear algebra, calculus and probability that machine learning needs.

### Courses and lectures

- [CS229 Machine Learning](https://cs229.stanford.edu/), Stanford University. Free. The classic course, with public lecture notes on supervised learning, generalisation and neural networks.
- [CS224N Natural Language Processing with Deep Learning](https://web.stanford.edu/class/cs224n/), Stanford University. Free. Slides, notes and assignments on word vectors, attention, transformers, pre-training and large models.
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1), Hugging Face. Free. A free course on transformers, tokenizers, fine-tuning and using language models in practice.

### Papers and specifications

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762), Vaswani and others (2017). Free. The paper that introduced the transformer, the architecture of today's language models.
- [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239), Ho, Jain and Abbeel (2020). Free. The paper that made diffusion models practical for image generation.
- [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909), Sennrich, Haddow and Birch (2015). Free. The paper that brought byte pair encoding to language models.
- [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781), Mikolov, Chen, Corrado and Dean (2013). Free. The word2vec paper: word vectors whose geometry captures meaning.
- [A Neural Probabilistic Language Model](https://www.jmlr.org/papers/v3/bengio03a.html), Bengio, Ducharme, Vincent and Jauvin (2003). Free. The first neural language model with learned word embeddings, the ancestor of the tiny model built here.

### Official documentation

- [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework), NIST. Free. A public framework for thinking about the risks, bias and trustworthiness of AI systems.

### Videos

- [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY), Andrej Karpathy. Free. Two hours that go from a bigram model to a working transformer, line by line.
- [Let's build the GPT Tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE), Andrej Karpathy. Free. Builds byte pair encoding from scratch and shows the odd behaviours that come from tokenisation.
- [How AI Image Generators Work (Stable Diffusion / Dall-E)](https://www.youtube.com/watch?v=1CIpzeNxIhU), Computerphile. Free. A plain explanation of diffusion: adding noise to images and training a network to remove it.
- [Programação Dinâmica](https://www.youtube.com/@pgdinamica), Hallison Paz and Kizzy Terra. In Portuguese. Free. A Brazilian channel on machine learning, data science and algorithms, in Portuguese.

### Practice and tools

- [micrograd](https://github.com/karpathy/micrograd), Andrej Karpathy. Free. A tiny autograd engine and neural network library, short enough to read in one sitting.
- [Transformer Explainer](https://poloclub.github.io/transformer-explainer/), Polo Club of Data Science, Georgia Tech. Free. A small GPT running in the browser, with every step from tokens to the next-token probabilities visible.
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/), Jay Alammar. Free. The most cited step-by-step picture of self-attention and the encoder and decoder stacks.
- [What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/), Lilian Weng. Free. A careful derivation of the forward and reverse processes, with the links between the main papers.

### Communities

- [Hugging Face Forums](https://discuss.huggingface.co/), Hugging Face. Free. Questions on models, tokenizers and training answered by the community.
