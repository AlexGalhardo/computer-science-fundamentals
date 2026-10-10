# Inteligência artificial e LLMs

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

A inteligência artificial moderna é aprendizado de máquina em escala: modelos com muitos números ajustáveis que são treinados com dados em vez de programados à mão. Esta área vai da matemática por baixo (probabilidade, álgebra linear, descida de gradiente e retropropagação) às peças de um grande modelo de linguagem (tokens, embeddings, atenção, previsão do próximo token) e dos geradores de imagem (difusão), e aos seus limites e custos.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Tokenizador BPE (`bpe-tokenizer`) | Como o texto vira tokens, e por que um modelo conta tokens e não palavras | planejado |
| Rede neural do zero (`neural-network-from-scratch`) | O que um neurônio calcula e como a retropropagação encontra os gradientes | planejado |
| Embeddings e busca vetorial (`embeddings-vector-search`) | Como o significado vira um vetor e como vetores parecidos são encontrados | planejado |
| Modelo de linguagem minúsculo (`tiny-language-model`) | Como um modelo de linguagem prevê o próximo token, da contagem à autoatenção | planejado |
| Difusão de brinquedo (`diffusion-toy`) | Como um modelo de imagem aprende a remover ruído, em pontos bidimensionais em vez de pixels | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/artificial-intelligence/`).
- Documentação: planejada (`docs/pt/artificial-intelligence/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Neural networks](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi), Grant Sanderson, 3Blue1Brown. Gratuito. A melhor introdução visual: o que é uma rede, descida de gradiente, retropropagação e depois transformers e atenção.
- [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html), Andrej Karpathy. Gratuito. Curso em vídeo que programa tudo do zero: um motor de autograd, um modelo de caracteres e depois um GPT.
- [Deep Learning Book](https://www.deeplearningbook.com.br/), Data Science Academy. Em português. Gratuito. Livro online gratuito em português com muitos capítulos curtos, do perceptron aos transformers.

### Livros

- [Deep Learning](https://www.deeplearningbook.org/), Ian Goodfellow, Yoshua Bengio and Aaron Courville. Gratuito online, pago impresso. O livro-texto de referência, de leitura online gratuita: a matemática, otimização, regularização e as principais arquiteturas.
- [Dive into Deep Learning](https://d2l.ai/), Zhang, Lipton, Li and Smola. Gratuito. Livro interativo gratuito em que cada conceito vem com código executável, incluindo atenção e transformers.
- [Speech and Language Processing, 3rd edition draft](https://web.stanford.edu/~jurafsky/slp3/), Dan Jurafsky and James Martin. Gratuito. O rascunho gratuito do livro-texto de processamento de linguagem: n-gramas, embeddings, transformers e grandes modelos de linguagem.
- [Mathematics for Machine Learning](https://mml-book.github.io/), Deisenroth, Faisal and Ong. Gratuito online, pago impresso. PDF gratuito que cobre exatamente a álgebra linear, o cálculo e a probabilidade de que o aprendizado de máquina precisa.

### Cursos e aulas

- [CS229 Machine Learning](https://cs229.stanford.edu/), Stanford University. Gratuito. O curso clássico, com notas de aula públicas sobre aprendizado supervisionado, generalização e redes neurais.
- [CS224N Natural Language Processing with Deep Learning](https://web.stanford.edu/class/cs224n/), Stanford University. Gratuito. Slides, notas e trabalhos sobre vetores de palavras, atenção, transformers, pré-treinamento e modelos grandes.
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1), Hugging Face. Gratuito. Curso gratuito sobre transformers, tokenizadores, fine-tuning e uso prático de modelos de linguagem.

### Artigos e especificações

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762), Vaswani and others (2017). Gratuito. O artigo que apresentou o transformer, a arquitetura dos modelos de linguagem de hoje.
- [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239), Ho, Jain and Abbeel (2020). Gratuito. O artigo que tornou os modelos de difusão viáveis para geração de imagens.
- [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909), Sennrich, Haddow and Birch (2015). Gratuito. O artigo que levou o byte pair encoding aos modelos de linguagem.
- [Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781), Mikolov, Chen, Corrado and Dean (2013). Gratuito. O artigo do word2vec: vetores de palavras cuja geometria captura o significado.
- [A Neural Probabilistic Language Model](https://www.jmlr.org/papers/v3/bengio03a.html), Bengio, Ducharme, Vincent and Jauvin (2003). Gratuito. O primeiro modelo de linguagem neural com embeddings aprendidos, o ancestral do modelo minúsculo construído aqui.

### Documentação oficial

- [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework), NIST. Gratuito. Estrutura pública para pensar sobre riscos, vieses e confiabilidade de sistemas de IA.

### Vídeos

- [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY), Andrej Karpathy. Gratuito. Duas horas que vão de um modelo de bigramas a um transformer funcional, linha por linha.
- [Let's build the GPT Tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE), Andrej Karpathy. Gratuito. Constrói o byte pair encoding do zero e mostra os comportamentos estranhos que vêm da tokenização.
- [How AI Image Generators Work (Stable Diffusion / Dall-E)](https://www.youtube.com/watch?v=1CIpzeNxIhU), Computerphile. Gratuito. Explicação direta da difusão: acrescentar ruído a imagens e treinar uma rede para removê-lo.
- [Programação Dinâmica](https://www.youtube.com/@pgdinamica), Hallison Paz and Kizzy Terra. Em português. Gratuito. Canal brasileiro sobre aprendizado de máquina, ciência de dados e algoritmos, em português.

### Prática e ferramentas

- [micrograd](https://github.com/karpathy/micrograd), Andrej Karpathy. Gratuito. Um motor de autograd e uma biblioteca de redes neurais minúsculos, curtos o bastante para ler de uma vez.
- [Transformer Explainer](https://poloclub.github.io/transformer-explainer/), Polo Club of Data Science, Georgia Tech. Gratuito. Um GPT pequeno rodando no navegador, com cada passo dos tokens às probabilidades do próximo token visível.
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/), Jay Alammar. Gratuito. A ilustração passo a passo mais citada da autoatenção e das pilhas de codificador e decodificador.
- [What are Diffusion Models?](https://lilianweng.github.io/posts/2021-07-11-diffusion-models/), Lilian Weng. Gratuito. Dedução cuidadosa dos processos direto e reverso, com as ligações entre os principais artigos.

### Comunidades

- [Hugging Face Forums](https://discuss.huggingface.co/), Hugging Face. Gratuito. Dúvidas sobre modelos, tokenizadores e treinamento respondidas pela comunidade.
