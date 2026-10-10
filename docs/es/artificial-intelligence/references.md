# Referencias: inteligencia artificial y LLMs

> English version: [docs/en/artificial-intelligence/references.md](../../en/artificial-intelligence/references.md) · Versão em português: [docs/pt/artificial-intelligence/references.md](../../pt/artificial-intelligence/references.md)

Las fuentes realmente leídas el 2026-10-07 para escribir la explicación, el quiz y los miniproyectos de esta área. No se copió nada: los textos del repositorio explican las ideas con sus propias palabras, y cada pregunta del quiz nombra su fuente en el campo `source`.

Cómo se usaron: de cada artículo se leyó la página del resumen (abstract), y los detalles que se enseñan aquí (fórmulas, tamaños, procedimientos) se contrastaron con al menos una nota de curso, una página de documentación o una página de enciclopedia de esta lista. Dos páginas no se pudieron leer y **no** figuran como fuentes: el artículo del centro de ayuda de OpenAI sobre tokens (el servidor rechazó la solicitud) y el PDF completo de los apuntes de clase de CS229 (no se pudo convertir a texto, así que solo se cita la página del curso).

Los hechos que cambian rápido (tamaños de los modelos actuales, tamaños de la ventana de contexto, precios) se dejaron fuera del texto didáctico y del quiz a propósito.

## Artículos

| Fuente | Autores, año | Sirve para |
| --- | --- | --- |
| [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser and Polosukhin, 2017 | El transformer: atención sin recurrencia y sin convolución. El origen de las secciones 9 y 10 |
| [Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf) (GPT) | Radford, Narasimhan, Salimans and Sutskever, 2018 | Transformer solo decodificador, preentrenamiento por predicción del siguiente token y luego ajuste fino. Leído a través de la página de Wikipedia listada más abajo |
| [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) | Devlin, Chang, Lee and Toutanova, 2018 | Modelo solo codificador, modelado de lenguaje enmascarado, ajuste fino con una capa extra |
| [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781) (word2vec) | Mikolov, Chen, Corrado and Dean, 2013 | Vectores de palabras aprendidos de forma barata a partir de un corpus enorme: CBOW y skip-gram |
| [GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/projects/glove/) | Pennington, Socher and Manning, 2014 | Vectores de palabras a partir de conteos globales de coocurrencia, la idea detrás del miniproyecto `embeddings-vector-search` |
| [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) | Sennrich, Haddow and Birch, 2016 | El byte-pair encoding como respuesta al problema del vocabulario abierto |
| [The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751) | Holtzman, Buys, Du, Forbes and Choi, 2020 | Por qué elegir siempre el token más probable da texto aburrido, y el muestreo por núcleo (top-p) |
| [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) | Lewis, Perez, Piktus and others, 2020 | Un generador unido a un índice de documentos con búsqueda: el nombre y la idea de RAG |
| [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) | Yao, Zhao, Yu, Du, Shafran, Narasimhan and Cao, 2022 | Intercalar razonamiento y acciones sobre herramientas, la base de los agentes |
| [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) | Ho, Jain and Abbeel, 2020 | El modelo de difusión tal como se enseña aquí: añadir ruido, entrenar una red para predecirlo. Seguido por el miniproyecto `diffusion-toy` |
| [High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) | Rombach, Blattmann, Lorenz, Esser and Ommer, 2022 | Difusión en el espacio latente de un autoencoder, condicionamiento por texto mediante atención cruzada |
| [Generative Adversarial Networks](https://arxiv.org/abs/1406.2661) | Goodfellow, Pouget-Abadie, Mirza, Xu, Warde-Farley, Ozair, Courville and Bengio, 2014 | El generador contra el discriminador, y el equilibrio donde el discriminador responde 1/2 |
| [Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980) | Kingma and Ba, 2015 | El optimizador usado en los miniproyectos `tiny-language-model` y `diffusion-toy` |
| [Dropout: A Simple Way to Prevent Neural Networks from Overfitting](https://jmlr.org/papers/v15/srivastava14a.html) | Srivastava, Hinton, Krizhevsky, Sutskever and Salakhutdinov, 2014 | Dropout: unidades eliminadas al azar en el entrenamiento, red completa en la prueba |
| [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385) (ResNet) | He, Zhang, Ren and Sun, 2015 | Conexiones residuales, que hicieron entrenables las redes de visión muy profundas y que usa todo bloque de transformer |
| [Gradient-Based Learning Applied to Document Recognition](http://yann.lecun.com/exdb/publis/pdf/lecun-01a.pdf) (LeNet-5) | LeCun, Bottou, Bengio and Haffner, 1998 | La primera red convolucional ampliamente usada: convolución, submuestreo y capas totalmente conectadas leyendo dígitos. Leído a través de la página de Wikipedia listada más abajo |
| [ImageNet Classification with Deep Convolutional Neural Networks](https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html) (AlexNet) | Krizhevsky, Sutskever and Hinton, 2012 | La gran CNN entrenada en GPUs que inició la era del deep learning en visión. Leído a través de la página de Wikipedia listada más abajo |
| [Very Deep Convolutional Networks for Large-Scale Image Recognition](https://arxiv.org/abs/1409.1556) (VGG) | Simonyan and Zisserman, 2014 | Profundidad obtenida apilando filtros pequeños de 3 x 3 |
| [U-Net: Convolutional Networks for Biomedical Image Segmentation](https://arxiv.org/abs/1505.04597) | Ronneberger, Fischer and Brox, 2015 | Segmentación con un camino que contrae y otro que expande unidos por conexiones de salto. Nivel de visión general |
| [You Only Look Once: Unified, Real-Time Object Detection](https://arxiv.org/abs/1506.02640) (YOLO) | Redmon, Divvala, Girshick and Farhadi, 2015 | Detección de objetos como una sola pasada sobre la imagen. Nivel de visión general |

## Libros y cursos universitarios

| Fuente | Autores | Sirve para |
| --- | --- | --- |
| [Deep Learning](https://www.deeplearningbook.org/) (MIT Press, 2016) | Goodfellow, Bengio and Courville | El libro de texto de referencia, gratis en línea. Su tabla de contenidos dio forma a los primeros seis temas del quiz: álgebra lineal (cap. 2), probabilidad (cap. 3), fundamentos del aprendizaje automático (cap. 5), redes feedforward (cap. 6), regularización (cap. 7), optimización (cap. 8), convolución (cap. 9), autoencoders (cap. 14), modelos generativos (cap. 20) |
| [CS229: Machine Learning](https://cs229.stanford.edu/) | Stanford University | El curso clásico: aprendizaje supervisado y no supervisado, teoría del aprendizaje, sesgo y varianza |
| [CS231n: Deep Learning for Computer Vision](https://cs231n.stanford.edu/) y sus apuntes sobre [redes neuronales](https://cs231n.github.io/neural-networks-1/), [retropropagación](https://cs231n.github.io/optimization-2/), [entrenamiento](https://cs231n.github.io/neural-networks-3/), [redes convolucionales](https://cs231n.github.io/convolutional-networks/) y [transfer learning](https://cs231n.github.io/transfer-learning/) | Stanford University | Los apuntes escritos más claros sobre neuronas, funciones de activación, la regla de la cadena sobre un grafo, comprobaciones de gradiente, optimizadores, la aritmética de la convolución, y cuándo congelar o ajustar una red preentrenada |
| [CS224n: Natural Language Processing with Deep Learning](https://web.stanford.edu/class/cs224n/) | Stanford University | El camino desde los vectores de palabras hasta los transformers, el preentrenamiento, el prompting, la recuperación, los agentes y la evaluación |
| [Practical Deep Learning for Coders](https://course.fast.ai/) | Jeremy Howard and Rachel Thomas (fast.ai) | Un curso de arriba hacia abajo y centrado en el código. Su segunda parte construye un modelo de difusión desde cero |

## Videos, tutoriales y código

| Fuente | Autor | Sirve para |
| --- | --- | --- |
| [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) | Andrej Karpathy | Curso en video que construye todo en código: retropropagación, un modelo de bigramas, una MLP, un GPT y un tokenizador. Los miniproyectos de esta área siguen el mismo orden |
| [micrograd](https://github.com/karpathy/micrograd) | Andrej Karpathy | Un motor de diferenciación automática escalar en unas cien líneas. El modelo de `neural-network-from-scratch` |
| [minbpe](https://github.com/karpathy/minbpe) | Andrej Karpathy | BPE a nivel de byte en código mínimo: 256 tokens de byte más un token por fusión. El modelo de `bpe-tokenizer` |
| [nanoGPT](https://github.com/karpathy/nanoGPT) | Andrej Karpathy | Un GPT pequeño y legible con un ejemplo a nivel de carácter. El modelo de `tiny-language-model` |
| [But what is a neural network?](https://www.3blue1brown.com/lessons/neural-networks) y el resto de la serie Neural Networks | Grant Sanderson (3Blue1Brown) | La mejor intuición visual de neuronas, capas, descenso de gradiente, retropropagación, atención y transformers |
| [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) | Jay Alammar | La autoatención dibujada paso a paso: query, key, value, cabezas, posiciones, codificador y decodificador |
| [The Illustrated Word2vec](https://jalammar.github.io/illustrated-word2vec/) | Jay Alammar | Embeddings, similitud del coseno, skip-gram y muestreo negativo en imágenes |
| [The Illustrated Stable Diffusion](https://jalammar.github.io/illustrated-stable-diffusion/) | Jay Alammar | Las tres partes de un sistema de texto a imagen: codificador de texto, eliminador de ruido en el espacio latente, decodificador de imagen |
| [What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/) | Lilian Weng | Las matemáticas de los procesos directo e inverso, con los algoritmos de entrenamiento y de muestreo |
| [What is the rationale behind square root scaling in attention](https://community.deeplearning.ai/t/what-is-the-rationale-behind-square-root-scaling-in-attention/441193) | Foro de la comunidad de DeepLearning.AI | Un hilo de foro con la pregunta que se hacen los principiantes sobre la división entre la raíz cuadrada de d_k, y el argumento de la varianza que la responde |

## Documentación oficial

| Fuente | Editor | Sirve para |
| --- | --- | --- |
| [Glossary](https://platform.claude.com/docs/en/about-claude/glossary) | Anthropic | Definiciones breves de token, ventana de contexto, temperatura, preentrenamiento, ajuste fino y RAG |
| [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows) | Anthropic | Qué cuenta para la ventana de contexto y por qué más contexto no siempre es mejor |
| [Reduce hallucinations](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations) | Anthropic | Técnicas prácticas: permitir "no lo sé", citar primero, referenciar, verificar |
| [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) | Anthropic | Flujos de trabajo frente a agentes, y el consejo de empezar con el diseño más simple |
| [tiktoken](https://github.com/openai/tiktoken) y [How to count tokens with tiktoken](https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken) | OpenAI | Por qué BPE es reversible y sin pérdida, y por qué el mismo texto da conteos de tokens distintos en codificaciones distintas |
| [Tokenization algorithms](https://huggingface.co/docs/transformers/tokenizer_summary) | Hugging Face | Tokenización por palabras, por caracteres y por subpalabras comparadas, y BPE, WordPiece, Unigram y SentencePiece lado a lado |
| [Generation strategies](https://huggingface.co/docs/transformers/generation_strategies) y [How to generate text](https://huggingface.co/blog/how-to-generate) | Hugging Face | Búsqueda voraz, búsqueda por haz (beam search), muestreo, temperatura, top-k y top-p |
| [Quantization](https://huggingface.co/docs/optimum/concept_guides/quantization) | Hugging Face | Qué es la cuantización, con la correspondencia de escala y punto cero de floats de 32 bits a enteros de 8 bits |

## Documentación de frameworks

| Fuente | Editor | Sirve para |
| --- | --- | --- |
| Learn the Basics: [Tensors](https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html), [Build the Neural Network](https://docs.pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html), [Automatic Differentiation](https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html), [Optimizing Model Parameters](https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html) | PyTorch | El camino oficial para principiantes: tensores, `nn.Module`, `requires_grad` y `backward`, y el bucle de entrenamiento con `zero_grad`, `backward` y `step` |
| [Introduction to gradients and automatic differentiation](https://www.tensorflow.org/guide/autodiff) | TensorFlow | `tf.GradientTape`: qué se vigila, cintas de un solo uso frente a persistentes, por qué un gradiente puede ser `None` |
| [Introduction to graphs and tf.function](https://www.tensorflow.org/guide/intro_to_graphs) | TensorFlow | Ejecución eager frente a grafos, trazado (tracing), y por qué un `print` de Python corre solo durante el trazado |
| [The Sequential model](https://keras.io/guides/sequential_model/) | Keras | Construir un modelo como una pila de capas, y cuándo una pila no basta |
| [Training and evaluation with the built-in methods](https://keras.io/guides/training_with_built_in_methods/) | Keras | `compile`, `fit`, `evaluate` y `predict`, y qué recibe y qué devuelve cada uno |

## Wikipedia

Usada para contrastar definiciones y hechos históricos.

| Página | Sirve para |
| --- | --- |
| [Transformer (deep learning)](https://en.wikipedia.org/wiki/Transformer_(deep_learning)) | Modelos solo codificador, solo decodificador y codificador-decodificador, la máscara causal, el costo cuadrático |
| [Generative pre-trained transformer](https://en.wikipedia.org/wiki/Generative_pre-trained_transformer) | La historia de la familia GPT y el contenido del primer artículo de GPT |
| [BERT (language model)](https://en.wikipedia.org/wiki/BERT_(language_model)) | La regla de enmascaramiento (80% máscara, 10% aleatorio, 10% sin cambio) y los tamaños de los modelos originales |
| [Word2vec](https://en.wikipedia.org/wiki/Word2vec) | CBOW frente a skip-gram, y el límite de los vectores estáticos |
| [Byte-pair encoding](https://en.wikipedia.org/wiki/Byte-pair_encoding) | El algoritmo de compresión original de Philip Gage (1994) y su adaptación a la tokenización |
| [Large language model](https://en.wikipedia.org/wiki/Large_language_model) | Una visión general del entrenamiento, el prompting, las herramientas, la recuperación, la evaluación y el sesgo |
| [Softmax function](https://en.wikipedia.org/wiki/Softmax_function) | La fórmula, la forma con temperatura y la invariancia a sumar una constante |
| [Cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity) | La fórmula, el rango y la relación con la distancia euclidiana en vectores unitarios |
| [Perplexity](https://en.wikipedia.org/wiki/Perplexity) | La perplejidad como un número efectivo de opciones igualmente probables |
| [Locality-sensitive hashing](https://en.wikipedia.org/wiki/Locality-sensitive_hashing) | Hiperplanos aleatorios para la similitud del coseno, el índice usado en `embeddings-vector-search` |
| [Variational autoencoder](https://en.wikipedia.org/wiki/Variational_autoencoder) | El codificador que produce una distribución, los dos términos de la pérdida, el truco de reparametrización (Kingma y Welling, 2013) |
| [Diffusion model](https://en.wikipedia.org/wiki/Diffusion_model) | Las fórmulas del proceso directo y de la pérdida de predicción de ruido |
| [Convolutional neural network](https://en.wikipedia.org/wiki/Convolutional_neural_network) | Conectividad local, pesos compartidos, pooling y la historia del campo |
| [LeNet](https://en.wikipedia.org/wiki/LeNet) | La arquitectura LeNet-5, su tamaño y su uso para leer cheques |
| [AlexNet](https://en.wikipedia.org/wiki/AlexNet) | La arquitectura, el resultado en ImageNet 2012 y las técnicas que la hicieron funcionar |
| [Hallucination (artificial intelligence)](https://en.wikipedia.org/wiki/Hallucination_(artificial_intelligence)) | Definición, causas y mitigación de las alucinaciones |
