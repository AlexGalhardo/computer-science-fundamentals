# References: artificial intelligence and LLMs

> Versão em português: [docs/pt/artificial-intelligence/references.md](../../pt/artificial-intelligence/references.md)

The sources actually read on 2026-10-07 to write the explanation, the quiz and the mini-projects of this area. Nothing was copied: the texts of the repository explain the ideas in their own words, and each quiz question names its source in the `source` field.

How they were used: for each paper the abstract page was read, and the details taught here (formulas, sizes, procedures) were cross-checked against at least one course note, documentation page or encyclopaedia page of this list. Two pages could not be read and are **not** listed as sources: the OpenAI help-centre article on tokens (the server refused the request) and the full PDF of the CS229 lecture notes (it could not be converted to text, so only the course page is cited).

Facts that change quickly (sizes of current models, context-window sizes, prices) were left out of the teaching text and of the quiz on purpose.

## Papers

| Source | Authors, year | Good for |
| --- | --- | --- |
| [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser and Polosukhin, 2017 | The transformer: attention with no recurrence and no convolution. The origin of sections 9 and 10 |
| [Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) (GPT) | Radford, Narasimhan, Salimans and Sutskever, 2018 | Decoder-only transformer, pre-training by next-token prediction and then fine-tuning. Read through the Wikipedia page listed below |
| [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) | Devlin, Chang, Lee and Toutanova, 2018 | Encoder-only model, masked language modelling, fine-tuning with one extra layer |
| [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781) (word2vec) | Mikolov, Chen, Corrado and Dean, 2013 | Word vectors learned cheaply from a huge corpus: CBOW and skip-gram |
| [GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/projects/glove/) | Pennington, Socher and Manning, 2014 | Word vectors from global co-occurrence counts, the idea behind the `embeddings-vector-search` mini-project |
| [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) | Sennrich, Haddow and Birch, 2016 | Byte-pair encoding as the answer to the open-vocabulary problem |
| [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751) | Holtzman, Buys, Du, Forbes and Choi, 2020 | Why always choosing the most probable token gives dull text, and nucleus (top-p) sampling |
| [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) | Lewis, Perez, Piktus and others, 2020 | A generator joined to a searchable index of documents: the name and the idea of RAG |
| [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) | Yao, Zhao, Yu, Du, Shafran, Narasimhan and Cao, 2022 | Interleaving reasoning and actions on tools, the basis of agents |
| [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) | Ho, Jain and Abbeel, 2020 | The diffusion model as it is taught here: add noise, train a network to predict it. Followed by the `diffusion-toy` mini-project |
| [High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) | Rombach, Blattmann, Lorenz, Esser and Ommer, 2022 | Diffusion in the latent space of an autoencoder, text conditioning through cross-attention |
| [Generative Adversarial Networks](https://arxiv.org/abs/1406.2661) | Goodfellow, Pouget-Abadie, Mirza, Xu, Warde-Farley, Ozair, Courville and Bengio, 2014 | The generator against the discriminator, and the equilibrium where the discriminator answers 1/2 |
| [Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980) | Kingma and Ba, 2015 | The optimiser used in the `tiny-language-model` and `diffusion-toy` mini-projects |
| [Dropout: A Simple Way to Prevent Neural Networks from Overfitting](https://jmlr.org/papers/v15/srivastava14a.html) | Srivastava, Hinton, Krizhevsky, Sutskever and Salakhutdinov, 2014 | Dropout: units removed at random in training, whole network at test time |
| [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385) (ResNet) | He, Zhang, Ren and Sun, 2015 | Residual connections, which made very deep vision networks trainable and which every transformer block uses |
| [Gradient-Based Learning Applied to Document Recognition](http://yann.lecun.com/exdb/publis/pdf/lecun-01a.pdf) (LeNet-5) | LeCun, Bottou, Bengio and Haffner, 1998 | The first widely used convolutional network: convolution, subsampling and fully connected layers reading digits. Read through the Wikipedia page listed below |
| [ImageNet Classification with Deep Convolutional Neural Networks](https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html) (AlexNet) | Krizhevsky, Sutskever and Hinton, 2012 | The large CNN trained on GPUs that started the deep learning era in vision. Read through the Wikipedia page listed below |
| [Very Deep Convolutional Networks for Large-Scale Image Recognition](https://arxiv.org/abs/1409.1556) (VGG) | Simonyan and Zisserman, 2014 | Depth obtained by stacking small 3 x 3 filters |
| [U-Net: Convolutional Networks for Biomedical Image Segmentation](https://arxiv.org/abs/1505.04597) | Ronneberger, Fischer and Brox, 2015 | Segmentation with a contracting and an expanding path joined by skip connections. Overview level |
| [You Only Look Once: Unified, Real-Time Object Detection](https://arxiv.org/abs/1506.02640) (YOLO) | Redmon, Divvala, Girshick and Farhadi, 2015 | Object detection as a single pass over the image. Overview level |

## Books and university courses

| Source | Authors | Good for |
| --- | --- | --- |
| [Deep Learning](https://www.deeplearningbook.org/) (MIT Press, 2016) | Goodfellow, Bengio and Courville | The reference textbook, free online. Its table of contents shaped the first six quiz topics: linear algebra (ch. 2), probability (ch. 3), machine learning basics (ch. 5), feedforward networks (ch. 6), regularisation (ch. 7), optimisation (ch. 8), convolution (ch. 9), autoencoders (ch. 14), generative models (ch. 20) |
| [CS229: Machine Learning](https://cs229.stanford.edu/) | Stanford University | The classical course: supervised and unsupervised learning, learning theory, bias and variance |
| [CS231n: Deep Learning for Computer Vision](https://cs231n.stanford.edu/) and its notes on [neural networks](https://cs231n.github.io/neural-networks-1/), [backpropagation](https://cs231n.github.io/optimization-2/), [training](https://cs231n.github.io/neural-networks-3/), [convolutional networks](https://cs231n.github.io/convolutional-networks/) and [transfer learning](https://cs231n.github.io/transfer-learning/) | Stanford University | The clearest written notes on neurons, activation functions, the chain rule on a graph, gradient checks, optimisers, the arithmetic of convolution, and when to freeze or fine-tune a pre-trained network |
| [CS224n: Natural Language Processing with Deep Learning](https://web.stanford.edu/class/cs224n/) | Stanford University | The path from word vectors to transformers, pre-training, prompting, retrieval, agents and evaluation |
| [Practical Deep Learning for Coders](https://course.fast.ai/) | Jeremy Howard and Rachel Thomas (fast.ai) | A top-down, code-first course. Its second part builds a diffusion model from scratch |

## Videos, tutorials and code

| Source | Author | Good for |
| --- | --- | --- |
| [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) | Andrej Karpathy | Video course that builds everything in code: backpropagation, a bigram model, an MLP, a GPT and a tokenizer. The mini-projects of this area follow the same order |
| [micrograd](https://github.com/karpathy/micrograd) | Andrej Karpathy | A scalar automatic differentiation engine in about a hundred lines. The model for `neural-network-from-scratch` |
| [minbpe](https://github.com/karpathy/minbpe) | Andrej Karpathy | Byte-level BPE in minimal code: 256 byte tokens plus one token per merge. The model for `bpe-tokenizer` |
| [nanoGPT](https://github.com/karpathy/nanoGPT) | Andrej Karpathy | A small, readable GPT with a character-level example. The model for `tiny-language-model` |
| [But what is a neural network?](https://www.3blue1brown.com/lessons/neural-networks) and the rest of the Neural Networks series | Grant Sanderson (3Blue1Brown) | The best visual intuition for neurons, layers, gradient descent, backpropagation, attention and transformers |
| [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) | Jay Alammar | Self-attention drawn step by step: query, key, value, heads, positions, encoder and decoder |
| [The Illustrated Word2vec](https://jalammar.github.io/illustrated-word2vec/) | Jay Alammar | Embeddings, cosine similarity, skip-gram and negative sampling in pictures |
| [The Illustrated Stable Diffusion](https://jalammar.github.io/illustrated-stable-diffusion/) | Jay Alammar | The three parts of a text-to-image system: text encoder, denoiser in latent space, image decoder |
| [What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/) | Lilian Weng | The mathematics of the forward and reverse processes, with the training and sampling algorithms |
| [What is the rationale behind square root scaling in attention](https://community.deeplearning.ai/t/what-is-the-rationale-behind-square-root-scaling-in-attention/441193) | DeepLearning.AI community forum | A forum thread with the question beginners ask about the division by the square root of d_k, and the variance argument that answers it |

## Official documentation

| Source | Publisher | Good for |
| --- | --- | --- |
| [Glossary](https://platform.claude.com/docs/en/about-claude/glossary) | Anthropic | Short definitions of token, context window, temperature, pre-training, fine-tuning and RAG |
| [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) | Anthropic | What counts towards the context window and why more context is not always better |
| [Reduce hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations) | Anthropic | Practical techniques: allow "I don't know", quote first, cite, verify |
| [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) | Anthropic | Workflows against agents, and the advice to start with the simplest design |
| [tiktoken](https://github.com/openai/tiktoken) and [How to count tokens with tiktoken](https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken) | OpenAI | Why BPE is reversible and lossless, and why the same text gives different token counts in different encodings |
| [Tokenization algorithms](https://huggingface.co/docs/transformers/tokenizer_summary) | Hugging Face | Word, character and subword tokenisation compared, and BPE, WordPiece, Unigram and SentencePiece side by side |
| [Generation strategies](https://huggingface.co/docs/transformers/generation_strategies) and [How to generate text](https://huggingface.co/blog/how-to-generate) | Hugging Face | Greedy search, beam search, sampling, temperature, top-k and top-p |
| [Quantization](https://huggingface.co/docs/optimum/concept_guides/quantization) | Hugging Face | What quantisation is, with the scale and zero-point mapping from 32-bit floats to 8-bit integers |

## Framework documentation

| Source | Publisher | Good for |
| --- | --- | --- |
| Learn the Basics: [Tensors](https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html), [Build the Neural Network](https://docs.pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html), [Automatic Differentiation](https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html), [Optimizing Model Parameters](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html) | PyTorch | The official beginner path: tensors, `nn.Module`, `requires_grad` and `backward`, and the training loop with `zero_grad`, `backward` and `step` |
| [Introduction to gradients and automatic differentiation](https://www.tensorflow.org/guide/autodiff) | TensorFlow | `tf.GradientTape`: what is watched, single use against persistent tapes, why a gradient can be `None` |
| [Introduction to graphs and tf.function](https://www.tensorflow.org/guide/intro_to_graphs) | TensorFlow | Eager execution against graphs, tracing, and why a Python `print` runs only while tracing |
| [The Sequential model](https://keras.io/guides/sequential_model/) | Keras | Building a model as a stack of layers, and when a stack is not enough |
| [Training and evaluation with the built-in methods](https://keras.io/guides/training_with_built_in_methods/) | Keras | `compile`, `fit`, `evaluate` and `predict`, and what each one takes and returns |

## Wikipedia

Used to cross-check definitions and historical facts.

| Page | Good for |
| --- | --- |
| [Transformer (deep learning)](https://en.wikipedia.org/wiki/Transformer_(deep_learning)) | Encoder-only, decoder-only and encoder-decoder models, the causal mask, the quadratic cost |
| [Generative pre-trained transformer](https://en.wikipedia.org/wiki/Generative_pre-trained_transformer) | The history of the GPT family and the content of the first GPT paper |
| [BERT (language model)](https://en.wikipedia.org/wiki/BERT_(language_model)) | The masking rule (80% mask, 10% random, 10% unchanged) and the sizes of the original models |
| [Word2vec](https://en.wikipedia.org/wiki/Word2vec) | CBOW against skip-gram, and the limit of static vectors |
| [Byte-pair encoding](https://en.wikipedia.org/wiki/Byte-pair_encoding) | The original compression algorithm of Philip Gage (1994) and its adaptation to tokenisation |
| [Large language model](https://en.wikipedia.org/wiki/Large_language_model) | An overview of training, prompting, tools, retrieval, evaluation and bias |
| [Softmax function](https://en.wikipedia.org/wiki/Softmax_function) | The formula, the temperature form and the invariance to adding a constant |
| [Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity) | The formula, the range and the relation to Euclidean distance on unit vectors |
| [Perplexity](https://en.wikipedia.org/wiki/Perplexity) | Perplexity as an effective number of equally likely choices |
| [Locality-sensitive hashing](https://en.wikipedia.org/wiki/Locality-sensitive_hashing) | Random hyperplanes for cosine similarity, the index used in `embeddings-vector-search` |
| [Variational autoencoder](https://en.wikipedia.org/wiki/Variational_autoencoder) | The encoder that outputs a distribution, the two terms of the loss, the reparameterisation trick (Kingma and Welling, 2013) |
| [Diffusion model](https://en.wikipedia.org/wiki/Diffusion_model) | The formulas of the forward process and of the noise-prediction loss |
| [Convolutional neural network](https://en.wikipedia.org/wiki/Convolutional_neural_network) | Local connectivity, shared weights, pooling and the history of the field |
| [LeNet](https://en.wikipedia.org/wiki/LeNet) | The LeNet-5 architecture, its size and its use in reading cheques |
| [AlexNet](https://en.wikipedia.org/wiki/AlexNet) | The architecture, the ImageNet 2012 result and the techniques that made it work |
| [Hallucination (artificial intelligence)](https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)) | Definition, causes and mitigation of hallucinations |
