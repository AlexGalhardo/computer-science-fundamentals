# Inteligencia artificial y LLMs

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

La inteligencia artificial moderna es aprendizaje automático a gran escala: modelos con muchos números ajustables que se entrenan con datos en lugar de programarse a mano. Esta área va desde las matemáticas de base (probabilidad, álgebra lineal, descenso de gradiente y retropropagación) hasta las piezas de un gran modelo de lenguaje (tokens, embeddings, atención, predicción del siguiente token) y de los generadores de imágenes (difusión), y hasta sus límites y costos.

## Miniproyectos

| Miniproyecto | Qué enseña | Estado |
| --- | --- | --- |
| Tokenizador BPE (`bpe-tokenizer`) | Cómo el texto se convierte en tokens, y por qué un modelo cuenta tokens y no palabras | planificado |
| Red neuronal desde cero (`neural-network-from-scratch`) | Qué calcula una neurona y cómo la retropropagación encuentra los gradientes | planificado |
| Embeddings y búsqueda vectorial (`embeddings-vector-search`) | Cómo el significado se convierte en un vector y cómo se encuentran vectores parecidos | planificado |
| Modelo de lenguaje diminuto (`tiny-language-model`) | Cómo un modelo de lenguaje predice el siguiente token, desde el conteo hasta la autoatención | planificado |
| Difusión de juguete (`diffusion-toy`) | Cómo un modelo de imágenes aprende a quitar ruido, con puntos bidimensionales en lugar de píxeles | planificado |

## Quiz y documentación

- Preguntas del quiz: planificadas (`quiz/content/artificial-intelligence/`).
- Documentación: planificada (`docs/es/artificial-intelligence/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza por aquí

- [Neural networks](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi), Grant Sanderson, 3Blue1Brown. Gratis. La mejor introducción visual: qué es una red, descenso de gradiente, retropropagación y luego transformers y atención.
- [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html), Andrej Karpathy. Gratis. Un curso en video que programa todo desde cero: un motor de autograd, un modelo de caracteres y luego un GPT.
- [Deep Learning Book](https://www.deeplearningbook.com.br/), Data Science Academy. En portugués. Gratis. Un libro en línea gratuito en portugués con muchos capítulos cortos, desde el perceptrón hasta los transformers.

### Libros

- [Deep Learning](https://www.deeplearningbook.org/), Ian Goodfellow, Yoshua Bengio and Aaron Courville. Gratis en línea, de pago impreso. El libro de texto de referencia, de lectura en línea gratuita: las matemáticas, la optimización, la regularización y las principales arquitecturas.
- [Dive into Deep Learning](https://d2l.ai/), Zhang, Lipton, Li and Smola. Gratis. Un libro interactivo gratuito donde cada concepto viene con código ejecutable, incluyendo atención y transformers.
- [Speech and Language Processing, 3rd edition draft](https://web.stanford.edu/~jurafsky/slp3/), Dan Jurafsky and James Martin. Gratis. El borrador gratuito del libro de texto de procesamiento del lenguaje: n-gramas, embeddings, transformers y grandes modelos de lenguaje.
- [Mathematics for Machine Learning](https://mml-book.github.io/), Deisenroth, Faisal and Ong. Gratis en línea, de pago impreso. Un PDF gratuito que cubre exactamente el álgebra lineal, el cálculo y la probabilidad que necesita el aprendizaje automático.

### Cursos y clases

- [CS229 Machine Learning](https://cs229.stanford.edu/), Stanford University. Gratis. El curso clásico, con apuntes de clase públicos sobre aprendizaje supervisado, generalización y redes neuronales.
- [CS224N Natural Language Processing with Deep Learning](https://web.stanford.edu/class/cs224n/), Stanford University. Gratis. Diapositivas, apuntes y tareas sobre vectores de palabras, atención, transformers, preentrenamiento y modelos grandes.
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1), Hugging Face. Gratis. Un curso gratuito sobre transformers, tokenizadores, fine-tuning y el uso práctico de modelos de lenguaje.

### Artículos y especificaciones

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762), Vaswani and others (2017). Gratis. El artículo que presentó el transformer, la arquitectura de los modelos de lenguaje de hoy.
- [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239), Ho, Jain and Abbeel (2020). Gratis. El artículo que hizo viables los modelos de difusión para la generación de imágenes.
- [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909), Sennrich, Haddow and Birch (2015). Gratis. El artículo que llevó el byte pair encoding a los modelos de lenguaje.
- [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781), Mikolov, Chen, Corrado and Dean (2013). Gratis. El artículo de word2vec: vectores de palabras cuya geometría captura el significado.
- [A Neural Probabilistic Language Model](https://www.jmlr.org/papers/v3/bengio03a.html), Bengio, Ducharme, Vincent and Jauvin (2003). Gratis. El primer modelo de lenguaje neuronal con embeddings aprendidos, el ancestro del modelo diminuto construido aquí.

### Documentación oficial

- [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework), NIST. Gratis. Un marco público para pensar en los riesgos, los sesgos y la confiabilidad de los sistemas de IA.

### Videos

- [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY), Andrej Karpathy. Gratis. Dos horas que van de un modelo de bigramas a un transformer funcional, línea por línea.
- [Let's build the GPT Tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE), Andrej Karpathy. Gratis. Construye el byte pair encoding desde cero y muestra los comportamientos extraños que vienen de la tokenización.
- [How AI Image Generators Work (Stable Diffusion / Dall-E)](https://www.youtube.com/watch?v=1CIpzeNxIhU), Computerphile. Gratis. Una explicación directa de la difusión: añadir ruido a las imágenes y entrenar una red para quitarlo.
- [Programação Dinâmica](https://www.youtube.com/@pgdinamica), Hallison Paz and Kizzy Terra. En portugués. Gratis. Un canal brasileño sobre aprendizaje automático, ciencia de datos y algoritmos, en portugués.

### Práctica y herramientas

- [micrograd](https://github.com/karpathy/micrograd), Andrej Karpathy. Gratis. Un motor de autograd y una biblioteca de redes neuronales diminutos, lo bastante cortos para leerlos de una sentada.
- [Transformer Explainer](https://poloclub.github.io/transformer-explainer/), Polo Club of Data Science, Georgia Tech. Gratis. Un GPT pequeño que corre en el navegador, con cada paso visible, desde los tokens hasta las probabilidades del siguiente token.
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/), Jay Alammar. Gratis. La ilustración paso a paso más citada de la autoatención y de las pilas de codificador y decodificador.
- [What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/), Lilian Weng. Gratis. Una deducción cuidadosa de los procesos directo e inverso, con los vínculos entre los principales artículos.

### Comunidades

- [Hugging Face Forums](https://discuss.huggingface.co/), Hugging Face. Gratis. Dudas sobre modelos, tokenizadores y entrenamiento respondidas por la comunidad.
