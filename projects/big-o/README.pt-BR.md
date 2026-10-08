# Big O e análise de algoritmos

> English version: [README.md](README.md)

A análise de algoritmos é a ferramenta para prever como o custo de um programa cresce com o tamanho da entrada, antes de executá-lo. Ela fornece o vocabulário (O, Ω, Θ), as técnicas (contagem de operações, recorrências, análise amortizada) e os limites (cotas inferiores, P e NP) em que todas as outras áreas deste repositório se apoiam quando dizem que algo é rápido ou lento.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Laboratório de Big O](big-o-lab/) | Como medir uma função e reconhecer sua curva de crescimento | disponível |
| [Teorema mestre interativo](master-theorem/) | Como os três casos do teorema mestre decidem o custo de uma recorrência | disponível |
| [A cota inferior da ordenação por comparação](sorting-lower-bound/) | Por que nenhuma ordenação por comparação vence Ω(n lg n) e como as ordenações por contagem escapam disso | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/big-o/](../../quiz/content/big-o/)
- Documentação: [docs/pt/big-o/](../../docs/pt/big-o/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Asymptotic notation](https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation), Khan Academy, with Thomas Cormen and Devin Balkcom. Gratuito. Uma primeira leitura suave sobre por que as constantes são descartadas e o que significam O, Ω e Θ.
- [Big-O Cheat Sheet](https://www.bigocheatsheet.com/), Eric Rowell. Gratuito. Uma página com o custo de tempo e espaço das operações comuns de estruturas de dados e dos algoritmos de ordenação.
- [Análise de Algoritmos](https://www.ime.usp.br/~pf/analise_de_algoritmos/), Paulo Feofiloff, IME-USP. Em português. Gratuito. Notas de aula em português que cobrem notação, recorrências, invariantes e provas de correção com rigor.

### Livros

- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. Pago. A referência padrão: capítulos 2 a 4 para notação e recorrências, 16 para análise amortizada, 34 para NP-completude.
- [Algorithms](https://jeffe.cs.illinois.edu/teaching/algorithms/), Jeff Erickson, University of Illinois. Gratuito online, pago impresso. Livro-texto gratuito com tratamento claro de recursão, recorrências e NP-dificuldade, além de muitos exercícios.
- [Algorithms, 4th edition: Analysis of Algorithms](https://algs4.cs.princeton.edu/14analysis/), Robert Sedgewick and Kevin Wayne, Princeton. Gratuito. O capítulo do site do livro sobre o método científico para tempo de execução: medir, formular hipótese, prever e verificar.

### Cursos e aulas

- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare, Demaine, Ku and Solomon. Gratuito. Aulas, notas e listas que aplicam análise assintótica a cada estrutura de dados e algoritmo.
- [MIT 6.042J Mathematics for Computer Science](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/), MIT OpenCourseWare, Tom Leighton and Marten van Dijk. Gratuito. A matemática por trás da análise: indução, somatórios, assintótica, recorrências e contagem.
- [MIT 6.046J Design and Analysis of Algorithms](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/), MIT OpenCourseWare, Demaine, Devadas and Lynch. Gratuito. O curso seguinte, com análise amortizada, aleatorização e classes de complexidade em profundidade.

### Artigos e especificações

- [Master theorem (analysis of algorithms)](https://en.wikipedia.org/wiki/Master_theorem_%28analysis_of_algorithms%29), Wikipedia. Gratuito. Enunciado compacto dos três casos, com exemplos resolvidos e os casos que o teorema não cobre.
- [P vs NP](https://www.claymath.org/millennium/p-vs-np/), Clay Mathematics Institute. Gratuito. O enunciado oficial do problema em aberto, com a descrição feita por Stephen Cook.

### Vídeos

- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Gratuito. As aulas gravadas do curso acima, partindo do modelo de computação e da notação assintótica.
- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Gratuito. Aulas no quadro que contam operações passo a passo e resolvem recorrências à mão.
- [P vs. NP and the Computational Complexity Zoo](https://www.youtube.com/watch?v=YX40hbAHx3s), hackerdashery. Gratuito. Introdução animada de dez minutos às classes de complexidade e por que P versus NP importa.

### Prática e ferramentas

- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Gratuito. Animações passo a passo em que se vê o custo de cada operação conforme a entrada muda.

### Comunidades

- [Computer Science Stack Exchange: asymptotics tag](https://cs.stackexchange.com/questions/tagged/asymptotics), Stack Exchange. Gratuito. Perguntas respondidas sobre notação e provas, incluindo os tópicos de referência sobre resolução de recorrências.
- [Stack Overflow: big-o tag](https://stackoverflow.com/questions/tagged/big-o), Stack Overflow. Gratuito. Dúvidas práticas sobre a complexidade de código real, com respostas canônicas muito detalhadas.
