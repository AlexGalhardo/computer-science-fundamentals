# Referências: inteligência artificial e LLMs

> English version: [docs/en/artificial-intelligence/references.md](../../en/artificial-intelligence/references.md) · Versión en español: [docs/es/artificial-intelligence/references.md](../../es/artificial-intelligence/references.md)

As fontes de fato lidas em 2026-10-07 para escrever a explicação, o quiz e os mini-projetos desta área. Nada foi copiado: os textos do repositório explicam as ideias com as próprias palavras, e cada questão do quiz indica a sua fonte no campo `source`.

Como foram usadas: de cada artigo foi lida a página do resumo, e os detalhes ensinados aqui (fórmulas, tamanhos, procedimentos) foram conferidos com pelo menos uma nota de curso, página de documentação ou página de enciclopédia desta lista. Duas páginas não puderam ser lidas e **não** estão listadas como fontes: o artigo da central de ajuda da OpenAI sobre tokens (o servidor recusou a requisição) e o PDF completo das notas de aula do CS229 (não pôde ser convertido em texto, então só a página do curso é citada).

Fatos que mudam rápido (tamanhos dos modelos atuais, tamanhos de janela de contexto, preços) ficaram de fora do texto didático e do quiz de propósito.

## Artigos

| Fonte | Autores, ano | Serve para |
| --- | --- | --- |
| [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser e Polosukhin, 2017 | O transformer: atenção sem recorrência e sem convolução. A origem das seções 9 e 10 |
| [Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) (GPT) | Radford, Narasimhan, Salimans e Sutskever, 2018 | Transformer só com decodificador, pré-treinamento prevendo o próximo token e depois ajuste fino. Lido por meio da página da Wikipédia listada abaixo |
| [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) | Devlin, Chang, Lee e Toutanova, 2018 | Modelo só com codificador, modelagem de linguagem mascarada, ajuste fino com uma camada a mais |
| [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781) (word2vec) | Mikolov, Chen, Corrado e Dean, 2013 | Vetores de palavras aprendidos com baixo custo em um corpus enorme: CBOW e skip-gram |
| [GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/projects/glove/) | Pennington, Socher e Manning, 2014 | Vetores de palavras a partir de contagens globais de coocorrência, a ideia por trás do mini-projeto `embeddings-vector-search` |
| [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) | Sennrich, Haddow e Birch, 2016 | O byte-pair encoding como resposta ao problema do vocabulário aberto |
| [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751) | Holtzman, Buys, Du, Forbes e Choi, 2020 | Por que escolher sempre o token mais provável dá texto monótono, e a amostragem nucleus (top-p) |
| [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) | Lewis, Perez, Piktus e outros, 2020 | Um gerador ligado a um índice de documentos pesquisável: o nome e a ideia de RAG |
| [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) | Yao, Zhao, Yu, Du, Shafran, Narasimhan e Cao, 2022 | Intercalar raciocínio e ações com ferramentas, a base dos agentes |
| [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) | Ho, Jain e Abbeel, 2020 | O modelo de difusão como é ensinado aqui: somar ruído, treinar uma rede para prevê-lo. Seguido pelo mini-projeto `diffusion-toy` |
| [High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) | Rombach, Blattmann, Lorenz, Esser e Ommer, 2022 | Difusão no espaço latente de um autoencoder, condicionamento por texto com atenção cruzada |
| [Generative Adversarial Networks](https://arxiv.org/abs/1406.2661) | Goodfellow, Pouget-Abadie, Mirza, Xu, Warde-Farley, Ozair, Courville e Bengio, 2014 | O gerador contra o discriminador, e o equilíbrio em que o discriminador responde 1/2 |
| [Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980) | Kingma e Ba, 2015 | O otimizador usado nos mini-projetos `tiny-language-model` e `diffusion-toy` |
| [Dropout: A Simple Way to Prevent Neural Networks from Overfitting](https://jmlr.org/papers/v15/srivastava14a.html) | Srivastava, Hinton, Krizhevsky, Sutskever e Salakhutdinov, 2014 | Dropout: unidades removidas ao acaso no treino, rede inteira no teste |
| [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385) (ResNet) | He, Zhang, Ren e Sun, 2015 | Conexões residuais, que tornaram treináveis redes de visão muito profundas e que todo bloco transformer usa |
| [Gradient-Based Learning Applied to Document Recognition](http://yann.lecun.com/exdb/publis/pdf/lecun-01a.pdf) (LeNet-5) | LeCun, Bottou, Bengio e Haffner, 1998 | A primeira rede convolucional de uso amplo: convolução, subamostragem e camadas totalmente conectadas lendo dígitos. Lido por meio da página da Wikipédia listada abaixo |
| [ImageNet Classification with Deep Convolutional Neural Networks](https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html) (AlexNet) | Krizhevsky, Sutskever e Hinton, 2012 | A grande CNN treinada em GPUs que deu início à era do aprendizado profundo em visão. Lido por meio da página da Wikipédia listada abaixo |
| [Very Deep Convolutional Networks for Large-Scale Image Recognition](https://arxiv.org/abs/1409.1556) (VGG) | Simonyan e Zisserman, 2014 | Profundidade obtida empilhando filtros pequenos de 3 x 3 |
| [U-Net: Convolutional Networks for Biomedical Image Segmentation](https://arxiv.org/abs/1505.04597) | Ronneberger, Fischer e Brox, 2015 | Segmentação com um caminho de contração e um de expansão unidos por conexões de atalho. Nível de visão geral |
| [You Only Look Once: Unified, Real-Time Object Detection](https://arxiv.org/abs/1506.02640) (YOLO) | Redmon, Divvala, Girshick e Farhadi, 2015 | Detecção de objetos em uma única passada pela imagem. Nível de visão geral |

## Livros e cursos universitários

| Fonte | Autores | Serve para |
| --- | --- | --- |
| [Deep Learning](https://www.deeplearningbook.org/) (MIT Press, 2016) | Goodfellow, Bengio e Courville | O livro-texto de referência, gratuito online. O seu sumário deu forma aos seis primeiros tópicos do quiz: álgebra linear (cap. 2), probabilidade (cap. 3), fundamentos de aprendizado de máquina (cap. 5), redes feedforward (cap. 6), regularização (cap. 7), otimização (cap. 8), convolução (cap. 9), autoencoders (cap. 14), modelos generativos (cap. 20) |
| [CS229: Machine Learning](https://cs229.stanford.edu/) | Universidade Stanford | O curso clássico: aprendizado supervisionado e não supervisionado, teoria do aprendizado, viés e variância |
| [CS231n: Deep Learning for Computer Vision](https://cs231n.stanford.edu/) e as suas notas sobre [redes neurais](https://cs231n.github.io/neural-networks-1/), [retropropagação](https://cs231n.github.io/optimization-2/), [treinamento](https://cs231n.github.io/neural-networks-3/), [redes convolucionais](https://cs231n.github.io/convolutional-networks/) e [transferência de aprendizado](https://cs231n.github.io/transfer-learning/) | Universidade Stanford | As notas escritas mais claras sobre neurônios, funções de ativação, a regra da cadeia em um grafo, conferência de gradientes, otimizadores, a aritmética da convolução, e quando congelar ou ajustar uma rede pré-treinada |
| [CS224n: Natural Language Processing with Deep Learning](https://web.stanford.edu/class/cs224n/) | Universidade Stanford | O caminho dos vetores de palavras aos transformers, pré-treinamento, prompts, recuperação, agentes e avaliação |
| [Practical Deep Learning for Coders](https://course.fast.ai/) | Jeremy Howard e Rachel Thomas (fast.ai) | Um curso de cima para baixo, com o código primeiro. A segunda parte constrói um modelo de difusão do zero |

## Vídeos, tutoriais e código

| Fonte | Autor | Serve para |
| --- | --- | --- |
| [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) | Andrej Karpathy | Curso em vídeo que constrói tudo em código: retropropagação, um modelo de bigramas, um MLP, um GPT e um tokenizador. Os mini-projetos desta área seguem a mesma ordem |
| [micrograd](https://github.com/karpathy/micrograd) | Andrej Karpathy | Um motor de diferenciação automática escalar em cerca de cem linhas. O modelo para o `neural-network-from-scratch` |
| [minbpe](https://github.com/karpathy/minbpe) | Andrej Karpathy | BPE sobre bytes em código mínimo: 256 tokens de byte mais um token por fusão. O modelo para o `bpe-tokenizer` |
| [nanoGPT](https://github.com/karpathy/nanoGPT) | Andrej Karpathy | Um GPT pequeno e legível, com um exemplo no nível de caracteres. O modelo para o `tiny-language-model` |
| [But what is a neural network?](https://www.3blue1brown.com/lessons/neural-networks) e o restante da série Neural Networks | Grant Sanderson (3Blue1Brown) | A melhor intuição visual para neurônios, camadas, descida do gradiente, retropropagação, atenção e transformers |
| [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) | Jay Alammar | A autoatenção desenhada passo a passo: consulta, chave, valor, cabeças, posições, codificador e decodificador |
| [The Illustrated Word2vec](https://jalammar.github.io/illustrated-word2vec/) | Jay Alammar | Embeddings, similaridade do cosseno, skip-gram e amostragem negativa em figuras |
| [The Illustrated Stable Diffusion](https://jalammar.github.io/illustrated-stable-diffusion/) | Jay Alammar | As três partes de um sistema de texto para imagem: codificador de texto, removedor de ruído no espaço latente, decodificador de imagem |
| [What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/) | Lilian Weng | A matemática dos processos direto e reverso, com os algoritmos de treino e de amostragem |
| [What is the rationale behind square root scaling in attention](https://community.deeplearning.ai/t/what-is-the-rationale-behind-square-root-scaling-in-attention/441193) | Fórum da comunidade DeepLearning.AI | Uma discussão de fórum com a pergunta que iniciantes fazem sobre a divisão pela raiz quadrada de d_k, e o argumento da variância que a responde |

## Documentação oficial

| Fonte | Quem publica | Serve para |
| --- | --- | --- |
| [Glossary](https://platform.claude.com/docs/en/about-claude/glossary) | Anthropic | Definições curtas de token, janela de contexto, temperatura, pré-treinamento, ajuste fino e RAG |
| [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) | Anthropic | O que conta para a janela de contexto e por que mais contexto nem sempre é melhor |
| [Reduce hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations) | Anthropic | Técnicas práticas: permitir o "não sei", citar trechos primeiro, dar as fontes, verificar |
| [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) | Anthropic | Fluxos de trabalho contra agentes, e o conselho de começar pelo desenho mais simples |
| [tiktoken](https://github.com/openai/tiktoken) e [How to count tokens with tiktoken](https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken) | OpenAI | Por que o BPE é reversível e sem perdas, e por que o mesmo texto dá contagens de tokens diferentes em codificações diferentes |
| [Tokenization algorithms](https://huggingface.co/docs/transformers/tokenizer_summary) | Hugging Face | Tokenização por palavra, por caractere e por subpalavra comparadas, e BPE, WordPiece, Unigram e SentencePiece lado a lado |
| [Generation strategies](https://huggingface.co/docs/transformers/generation_strategies) e [How to generate text](https://huggingface.co/blog/how-to-generate) | Hugging Face | Busca gulosa, beam search, amostragem, temperatura, top-k e top-p |
| [Quantization](https://huggingface.co/docs/optimum/concept_guides/quantization) | Hugging Face | O que é quantização, com o mapeamento de escala e ponto zero de ponto flutuante de 32 bits para inteiros de 8 bits |

## Documentação dos frameworks

| Fonte | Quem publica | Serve para |
| --- | --- | --- |
| Learn the Basics: [Tensors](https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html), [Build the Neural Network](https://docs.pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html), [Automatic Differentiation](https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html), [Optimizing Model Parameters](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html) | PyTorch | O caminho oficial para iniciantes: tensores, `nn.Module`, `requires_grad` e `backward`, e o laço de treinamento com `zero_grad`, `backward` e `step` |
| [Introduction to gradients and automatic differentiation](https://www.tensorflow.org/guide/autodiff) | TensorFlow | `tf.GradientTape`: o que é observado, fitas de uso único e persistentes, por que um gradiente pode ser `None` |
| [Introduction to graphs and tf.function](https://www.tensorflow.org/guide/intro_to_graphs) | TensorFlow | Execução imediata contra grafos, rastreamento, e por que um `print` do Python roda só durante o rastreamento |
| [The Sequential model](https://keras.io/guides/sequential_model/) | Keras | Construir um modelo como uma pilha de camadas, e quando uma pilha não basta |
| [Training and evaluation with the built-in methods](https://keras.io/guides/training_with_built_in_methods/) | Keras | `compile`, `fit`, `evaluate` e `predict`, e o que cada um recebe e devolve |

## Wikipédia

Usada para conferir definições e fatos históricos.

| Página | Serve para |
| --- | --- |
| [Transformer (deep learning)](https://en.wikipedia.org/wiki/Transformer_(deep_learning)) | Modelos só com codificador, só com decodificador e com os dois, a máscara causal, o custo quadrático |
| [Generative pre-trained transformer](https://en.wikipedia.org/wiki/Generative_pre-trained_transformer) | A história da família GPT e o conteúdo do primeiro artigo do GPT |
| [BERT (language model)](https://en.wikipedia.org/wiki/BERT_(language_model)) | A regra de mascaramento (80% máscara, 10% aleatório, 10% inalterado) e os tamanhos dos modelos originais |
| [Word2vec](https://en.wikipedia.org/wiki/Word2vec) | CBOW contra skip-gram, e o limite dos vetores estáticos |
| [Byte-pair encoding](https://en.wikipedia.org/wiki/Byte-pair_encoding) | O algoritmo de compressão original de Philip Gage (1994) e a sua adaptação à tokenização |
| [Large language model](https://en.wikipedia.org/wiki/Large_language_model) | Uma visão geral de treinamento, prompts, ferramentas, recuperação, avaliação e viés |
| [Softmax function](https://en.wikipedia.org/wiki/Softmax_function) | A fórmula, a forma com temperatura e a invariância à soma de uma constante |
| [Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity) | A fórmula, a faixa de valores e a relação com a distância euclidiana em vetores unitários |
| [Perplexity](https://en.wikipedia.org/wiki/Perplexity) | A perplexidade como um número efetivo de escolhas igualmente prováveis |
| [Locality-sensitive hashing](https://en.wikipedia.org/wiki/Locality-sensitive_hashing) | Hiperplanos aleatórios para a similaridade do cosseno, o índice usado no `embeddings-vector-search` |
| [Variational autoencoder](https://en.wikipedia.org/wiki/Variational_autoencoder) | O codificador que devolve uma distribuição, os dois termos da perda, o truque da reparametrização (Kingma e Welling, 2013) |
| [Diffusion model](https://en.wikipedia.org/wiki/Diffusion_model) | As fórmulas do processo direto e da perda de previsão do ruído |
| [Convolutional neural network](https://en.wikipedia.org/wiki/Convolutional_neural_network) | Conectividade local, pesos compartilhados, pooling e a história da área |
| [LeNet](https://en.wikipedia.org/wiki/LeNet) | A arquitetura da LeNet-5, o seu tamanho e o seu uso na leitura de cheques |
| [AlexNet](https://en.wikipedia.org/wiki/AlexNet) | A arquitetura, o resultado na ImageNet de 2012 e as técnicas que a fizeram funcionar |
| [Hallucination (artificial intelligence)](https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)) | Definição, causas e mitigação das alucinações |
