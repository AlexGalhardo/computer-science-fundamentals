# Algoritmos

> English version: [README.md](README.md)

Algoritmos são os métodos passo a passo para resolver um problema: ordenar, buscar, achar o caminho mais curto, escolher a melhor combinação. Estudá-los ensina um pequeno conjunto de técnicas de projeto (divisão e conquista, escolha gulosa, programação dinâmica, backtracking) que transformam problemas que parecem impossíveis em escala em programas que terminam.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Corrida de ordenação](sorting-race/) | Como os mesmos algoritmos se comportam entre linguagens e formatos de entrada, e como o tempo medido se relaciona com o Big O | disponível |
| [Programação dinâmica](dynamic-programming/) | Como a memoização e a tabulação eliminam trabalho repetido | disponível |
| [Caixeiro-viajante](travelling-salesman/) | Onde a força bruta deixa de ser viável e o que uma heurística sacrifica | disponível |
| [Quicksort híbrido](hybrid-quicksort/) | Como o pivô e o limiar para vetores pequenos mudam o quicksort na prática | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/algorithms/](../../quiz/content/algorithms/)
- Documentação: [docs/pt/algorithms/](../../docs/pt/algorithms/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Algorithms](https://www.khanacademy.org/computing/computer-science/algorithms), Khan Academy, with Thomas Cormen and Devin Balkcom. Gratuito. Unidade suave com textos e exercícios sobre busca binária, as ordenações clássicas, recursão e busca em grafos.
- [VisuAlgo: Sorting](https://visualgo.net/en/sorting), Steven Halim, National University of Singapore. Gratuito. Anima cada algoritmo de ordenação com a sua entrada e conta comparações e trocas.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. Em português. Gratuito. Notas em português sobre busca, as ordenações clássicas, heapsort, quicksort e backtracking, com invariantes.

### Livros

- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. Pago. A referência padrão para ordenação, programação dinâmica, algoritmos gulosos e algoritmos em grafos.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Gratuito online, pago impresso. Muito prático em ordenação: o site do livro compara os algoritmos e traz código Java testado.
- [The Algorithm Design Manual, 3rd edition](https://www.algorist.com/), Steven Skiena. Pago. Ensina a reconhecer qual técnica serve a um problema, com um catálogo de problemas clássicos.
- [Algorithms](https://jeffe.cs.illinois.edu/teaching/algorithms/), Jeff Erickson, University of Illinois. Gratuito online, pago impresso. Livro-texto gratuito com capítulos excelentes sobre backtracking, programação dinâmica e algoritmos gulosos.
- [Competitive Programmer's Handbook](https://cses.fi/book/book.pdf), Antti Laaksonen. Gratuito. Livro compacto que vai da ordenação à programação dinâmica e aos grafos por meio de problemas.

### Cursos e aulas

- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Gratuito. Aulas e listas sobre ordenação, caminhos mínimos e um método claro para programação dinâmica.
- [Algorithms, Part I](https://www.coursera.org/learn/algorithms-part1), Robert Sedgewick and Kevin Wayne, Princeton (Coursera). Gratuito como ouvinte, certificado pago. Curso em vídeo sobre union-find, os algoritmos de ordenação, filas de prioridade e árvores de busca, com tarefas de programação corrigidas.
- [Algorithms Illuminated](https://www.algorithmsilluminated.org/), Tim Roughgarden, Stanford. Gratuito online, pago impresso. O site da série de livros reúne as videoaulas gratuitas sobre divisão e conquista, algoritmos gulosos e programação dinâmica.

### Artigos e especificações

- [Timsort: listsort.txt](https://github.com/python/cpython/blob/main/Objects/listsort.txt), Tim Peters, CPython. Gratuito. A descrição feita pelo próprio autor da ordenação híbrida usada pelo Python, com medições.
- [Pattern-defeating Quicksort](https://arxiv.org/abs/2106.05123), Orson Peters (2021). Gratuito. Um quicksort híbrido moderno, usado em bibliotecas de Rust e C++, explicado pelo autor.
- [A Note on Two Problems in Connexion with Graphs](https://ir.cwi.nl/pub/9256/9256D.pdf), Edsger W. Dijkstra (1959). Gratuito. O artigo de três páginas com o algoritmo de caminho mínimo e um algoritmo de árvore geradora mínima.

### Vídeos

- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Gratuito. Aulas no quadro sobre divisão e conquista, método guloso, programação dinâmica e backtracking.
- [15 Sorting Algorithms in 6 Minutes](https://www.youtube.com/watch?v=kPRA0W1kECg), Timo Bingmann. Gratuito. Visualização famosa com som que torna reconhecível o comportamento de cada ordenação.
- [Graph Theory Playlist](https://www.youtube.com/playlist?list=PLDV1Zeh2NRsDGO4--qE8yH72HFL1Km93P), William Fiset. Gratuito. Explicações animadas de caminhos mínimos, árvores geradoras, ordenação topológica e caixeiro-viajante.

### Prática e ferramentas

- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Gratuito. Artigos de referência com provas e código para algoritmos em grafos, programação dinâmica e mais.
- [CSES Problem Set](https://cses.fi/problemset/), Antti Laaksonen, University of Helsinki. Gratuito. Coleção graduada de problemas por técnica, com juiz online.
- [beecrowd](https://beecrowd.com/), beecrowd. Em português. Gratuito. Juiz online brasileiro com enunciados em português, muito usado em disciplinas de graduação.
- [Advent of Code](https://adventofcode.com/), Eric Wastl. Gratuito. Quebra-cabeças anuais que recompensam escolher o algoritmo certo em vez da força bruta.

### Comunidades

- [Codeforces](https://codeforces.com/), Mike Mirzayanov. Gratuito. Competições e uma comunidade muito ativa, com editoriais que explicam cada solução.
- [Stack Overflow: algorithm tag](https://stackoverflow.com/questions/tagged/algorithm), Stack Overflow. Gratuito. Grande acervo de perguntas respondidas sobre como escolher e implementar algoritmos.
- [r/algorithms](https://www.reddit.com/r/algorithms/), Reddit. Gratuito. Discussão sobre algoritmos, de dúvidas de estudo a resultados recentes.
