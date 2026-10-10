# Estruturas de dados

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Estruturas de dados são as formas de organizar dados na memória e em disco para que as operações de que um programa precisa sejam baratas. Escolher entre um vetor, uma lista ligada, uma tabela hash, uma árvore balanceada ou um grafo costuma ser a decisão que mais muda o custo de um programa, e é a base de bancos de dados, compiladores, sistemas operacionais e redes.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Tabela hash do zero](hash-map/) | Como as colisões são resolvidas e por que o fator de carga importa | disponível |
| [Algoritmos em grafos](graph-algorithms/) | Caminhos mínimos, ordenação topológica e árvores geradoras sobre a mesma biblioteca de grafos | disponível |
| [Árvore B em disco](b-tree-on-disk/) | Por que bancos de dados usam árvores largas: menos leituras de página | disponível |
| [Cache LRU, filtro de Bloom e trie](lru-bloom-trie/) | Três estruturas por trás de caches, testes de pertinência e busca por prefixo | disponível |
| [Árvores de busca balanceadas](balanced-trees/) | Como uma árvore desbalanceada degenera e como as rotações evitam isso | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/data-structures/](../../quiz/content/data-structures/)
- Documentação: [docs/pt/data-structures/](../../docs/pt/data-structures/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Gratuito. Animações de listas, heaps, tabelas hash, árvores de busca e percursos em grafos, com questionários.
- [Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html), David Galles, University of San Francisco. Gratuito. Páginas interativas em que você insere e remove chaves e vê árvores AVL, rubro-negras e B se rebalancearem.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. Em português. Gratuito. Notas em português sobre listas, pilhas, filas, árvores, heaps e hashing, com código C curto.

### Livros

- [Open Data Structures](https://opendatastructures.org/), Pat Morin. Gratuito. Livro-texto gratuito que implementa e analisa cada estrutura, com edições em Java, C++ e pseudocódigo.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Gratuito online, pago impresso. O site do livro traz resumos, código Java e exercícios de tabelas de símbolos, árvores balanceadas, hashing e grafos.
- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. Pago. A referência para as provas: heaps, tabelas hash, árvores rubro-negras, árvores B e representações de grafos.

### Cursos e aulas

- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Gratuito. A primeira metade é um curso de estruturas de dados: sequências, conjuntos, hashing, árvores binárias, AVL e heaps.
- [CS 61B Data Structures (Spring 2021)](https://sp21.datastructur.es/), Josh Hug, UC Berkeley. Gratuito. Curso completo com vídeos, livro online e projetos em Java com correção automática.
- [Estrutura de Dados](https://www.youtube.com/playlist?list=PLxI8Can9yAHf8k8LrUePyj0y3lLpigGcl), UNIVESP. Em português. Gratuito. Disciplina completa de graduação em português usando C: listas, pilhas, filas, árvores e ordenação.
- [MIT 6.851 Advanced Data Structures](https://ocw.mit.edu/courses/6-851-advanced-data-structures-spring-2012/), MIT OpenCourseWare, Erik Demaine. Gratuito. Para se aprofundar: estruturas persistentes, árvores cache-oblivious, estruturas sucintas e grafos dinâmicos.

### Artigos e especificações

- [Organization and Maintenance of Large Ordered Indices](https://infolab.usc.edu/csci585/Spring2010/den_ar/indexing.pdf), Rudolf Bayer and Edward McCreight (1970). Gratuito. O relatório de pesquisa da Boeing, publicado como artigo em 1972, que apresentou a árvore B, a origem de todo índice de banco de dados.
- [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter), Wikipedia. Gratuito. Bom panorama da estrutura do artigo de Burton Bloom de 1970, com a fórmula de falsos positivos e variantes.

### Documentação oficial

- [Rust std::collections](https://doc.rust-lang.org/std/collections/index.html), The Rust Project. Gratuito. Orientação oficial sobre quando usar cada coleção, com o custo de cada operação em tabela.

### Vídeos

- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Gratuito. Aulas gravadas sobre vetores dinâmicos, hashing, heaps binários, árvores AVL e busca em grafos.
- [Data Structures](https://www.youtube.com/playlist?list=PL2_aWCzGMAwI3W_JlcBbtYTwiQSsOTa6P), mycodeschool. Gratuito. Vídeos pacientes no quadro sobre listas ligadas, pilhas, filas, árvores e grafos em C e C++.

### Prática e ferramentas

- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Gratuito. Artigos claros com código sobre árvores de segmentos, árvores de Fenwick, union-find, tries e algoritmos em grafos.

### Comunidades

- [Stack Overflow: data-structures tag](https://stackoverflow.com/questions/tagged/data-structures), Stack Overflow. Gratuito. Grande acervo de dúvidas práticas sobre como escolher e implementar estruturas.
- [r/algorithms](https://www.reddit.com/r/algorithms/), Reddit. Gratuito. Discussão sobre algoritmos e estruturas de dados, de dúvidas de exercícios a resultados de pesquisa.
