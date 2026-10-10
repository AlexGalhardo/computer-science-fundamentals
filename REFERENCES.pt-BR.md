# Referências

> English version: [REFERENCES.md](REFERENCES.md) · Versión en español: [REFERENCES.es.md](REFERENCES.es.md)

As principais fontes para estudar e se aprofundar em cada área deste repositório, agrupadas por área na mesma ordem do índice de áreas do [PLAN.md](PLAN.md).

## Como esta lista foi construída

- Ela vem de uma busca na web em sites e documentações oficiais, cursos universitários com material público, livros-texto, artigos e especificações originais (RFCs e similares), livros gratuitos, séries de vídeo e comunidades.
- Fontes primárias e duradouras vêm primeiro: o artigo que apresentou uma ideia, a especificação que define um protocolo, o livro-texto que o quiz segue, o manual oficial de uma ferramenta.
- Cada link foi verificado quando a lista foi escrita: um script requisitou cada um, e ele precisou responder com sucesso e ser a página que diz ser. Os poucos sites que recusam scripts foram confirmados pelo feed ou pela API pública do site, ou abrindo a página. Links que não puderam ser verificados ficaram de fora.
- Livros apontam para a página do autor ou da editora, ou para um artigo de enciclopédia quando o livro saiu de catálogo, nunca para uma cópia não oficial. "Gratuito online, pago impresso" significa que o autor ou a editora oferece o texto legalmente na web.
- Artigos apontam para uma cópia de leitura aberta, no site de um autor, de uma editora, de uma instituição ou de uma disciplina universitária.
- As descrições foram escritas para este repositório. Nada é copiado das fontes.
- Fontes em português estão marcadas com "Em português". Todas as outras estão em inglês.
- As referências de segurança são defensivas: como as falhas acontecem e como preveni-las.

## Como usar

- Escolha uma área. Cada seção abaixo traz suas principais referências, e cada área com miniprojetos tem uma lista maior em `projects/<area>/README.pt-BR.md`, agrupada em: Comece por aqui, Livros, Cursos e aulas, Artigos e especificações, Documentação oficial, Vídeos, Prática e ferramentas, Comunidades.
- Comece por uma ou duas fontes, não por todas. Nos READMEs das áreas, "Comece por aqui" foi escolhido para um primeiro contato.
- Combine a leitura com o quiz em `quiz/` e com o miniprojeto da área: leia, responda, execute, meça.
- A lista é uma seleção, não é exaustiva, e links envelhecem. Se algum quebrar, abra uma issue ou um pull request.

## Geral e entre áreas

### Comece por aqui

- [CS50x: Introduction to Computer Science](https://cs50.harvard.edu/x/), Harvard University, David J. Malan. Gratuito. O primeiro curso de ciência da computação mais conhecido, com aulas, listas de exercícios e notas públicas.
- [Teach Yourself Computer Science](https://teachyourselfcs.com/), Oz Nova and Myles Byrne. Gratuito. Lista curta e opinativa com um livro e um curso em vídeo para cada um de nove assuntos centrais.
- [The Missing Semester of Your CS Education](https://missing.csail.mit.edu/), MIT CSAIL. Gratuito. Shell, editores, Git, depuração e profiling: as ferramentas que os cursos pressupõem e quase nunca ensinam.
- [Computer Science Roadmap](https://roadmap.sh/computer-science), roadmap.sh. Gratuito. Mapa visual dos tópicos de uma graduação em computação, útil para ver o que ainda falta.

### Livros

- [Computer Systems: A Programmer's Perspective, 3rd edition](https://csapp.cs.cmu.edu/), Randal E. Bryant and David R. O'Hallaron. Pago. O livro padrão sobre como os programas realmente executam: representação de dados, código de máquina, memória, ligação e concorrência.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Pago. O livro de referência sobre armazenamento, replicação, transações, streams e os dilemas de sistemas de dados distribuídos.
- [The Architecture of Open Source Applications](https://aosabook.org/en/), edited by Amy Brown and Greg Wilson. Gratuito. Autores de sistemas de código aberto reais explicam como eles são construídos e o que mudariam.
- [Free Programming Books](https://github.com/EbookFoundation/free-programming-books), Free Ebook Foundation. Gratuito. Grande índice comunitário de livros e cursos legalmente gratuitos, em vários idiomas, incluindo português.

### Cursos e aulas

- [OSSU Computer Science curriculum](https://github.com/ossu/computer-science), Open Source Society University. Gratuito. Um caminho completo, parecido com uma graduação, feito só de cursos online gratuitos e em ordem sugerida.
- [Universidade Brasileira Livre: Ciência da Computação](https://github.com/Universidade-Livre/ciencia-da-computacao), Universidade Brasileira Livre. Em português. Gratuito. Grade curricular brasileira no espírito do OSSU, montada com cursos gratuitos em português.
- [MIT OpenCourseWare](https://ocw.mit.edu/), Massachusetts Institute of Technology. Gratuito. Vídeos, notas e provas de disciplinas reais do MIT, origem de muitos cursos listados abaixo.
- [UNIVESP on YouTube](https://www.youtube.com/@univesptv), Universidade Virtual do Estado de São Paulo. Em português. Gratuito. Disciplinas completas de graduação em português, incluindo estruturas de dados, sistemas operacionais, redes e bancos de dados.
- [Curso em Vídeo](https://www.cursoemvideo.com/), Gustavo Guanabara. Em português. Gratuito. Cursos gratuitos para iniciantes em português sobre lógica de programação, Python, Java, Git e redes.

### Artigos e especificações

- [Papers We Love](https://paperswelove.org/), Papers We Love community. Gratuito. Comunidade que reúne e discute artigos clássicos de computação, uma boa porta de entrada para fontes primárias.

### Vídeos

- [Crash Course Computer Science](https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo), Carrie Anne Philbin, Crash Course. Gratuito. Quarenta episódios curtos que vão de transistores a sistemas operacionais, redes e inteligência artificial.
- [Computerphile](https://www.youtube.com/@Computerphile), University of Nottingham. Gratuito. Pesquisadores explicam ideias isoladas de computação em vídeos de dez minutos.
- [Akitando](https://www.youtube.com/@Akitando), Fabio Akita. Em português. Gratuito. Vídeos longos e profundos em português sobre fundamentos: back-end, concorrência, memória, redes, criptografia e carreira.
- [Código Fonte TV](https://www.youtube.com/@codigofontetv), Gabriel Fróes and Vanessa Weber. Em português. Gratuito. Vídeos curtos em português que definem termos e tecnologias, bons para um primeiro contato com um assunto.
- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Gratuito. Explicações animadas de temas de projeto de sistemas, como caches, filas, balanceadores e protocolos.

### Prática e ferramentas

- [Build your own X](https://github.com/codecrafters-io/build-your-own-x), CodeCrafters community. Gratuito. Índice de tutoriais para reconstruir do zero um banco de dados, um shell, um interpretador e muitas outras ferramentas.
- [The System Design Primer](https://github.com/donnemartin/system-design-primer), Donne Martin. Gratuito. Resumo estruturado de temas de escalabilidade, com diagramas e exercícios de projeto resolvidos.
- [AkitaOnRails](https://akitaonrails.com/), Fabio Akita. Em português. Gratuito. O blog por trás do canal Akitando, com as transcrições e referências de cada vídeo.

### Comunidades

- [Hacker News](https://news.ycombinator.com/), Y Combinator. Gratuito. Links e discussões diárias entre profissionais, onde muitos artigos e textos clássicos reaparecem.
- [Lobsters](https://lobste.rs/), Lobsters community. Gratuito. Comunidade menor de links, organizada por tags e focada em programação e computação.
- [Computer Science Stack Exchange](https://cs.stackexchange.com/), Stack Exchange. Gratuito. Perguntas e respostas do lado teórico: algoritmos, complexidade, autômatos e estruturas de dados.
- [r/compsci](https://www.reddit.com/r/compsci/), Reddit. Gratuito. Subreddit geral de ciência da computação, bom para indicações de leitura e dúvidas conceituais.
- [TabNews](https://www.tabnews.com.br/), Filipe Deschamps and community. Em português. Gratuito. Comunidade brasileira de publicações e discussões sobre programação, em português.

## Big O e análise de algoritmos

A análise de algoritmos é a ferramenta para prever como o custo de um programa cresce com o tamanho da entrada, antes de executá-lo. Ela fornece o vocabulário (O, Ω, Θ), as técnicas (contagem de operações, recorrências, análise amortizada) e os limites (cotas inferiores, P e NP) em que todas as outras áreas deste repositório se apoiam quando dizem que algo é rápido ou lento.

- [Asymptotic notation](https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation), Khan Academy, with Thomas Cormen and Devin Balkcom. Gratuito. Uma primeira leitura suave sobre por que as constantes são descartadas e o que significam O, Ω e Θ.
- [Big-O Cheat Sheet](https://www.bigocheatsheet.com/), Eric Rowell. Gratuito. Uma página com o custo de tempo e espaço das operações comuns de estruturas de dados e dos algoritmos de ordenação.
- [Análise de Algoritmos](https://www.ime.usp.br/~pf/analise_de_algoritmos/), Paulo Feofiloff, IME-USP. Em português. Gratuito. Notas de aula em português que cobrem notação, recorrências, invariantes e provas de correção com rigor.
- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. Pago. A referência padrão: capítulos 2 a 4 para notação e recorrências, 16 para análise amortizada, 34 para NP-completude.
- [Algorithms](https://jeffe.cs.illinois.edu/teaching/algorithms/), Jeff Erickson, University of Illinois. Gratuito online, pago impresso. Livro-texto gratuito com tratamento claro de recursão, recorrências e NP-dificuldade, além de muitos exercícios.
- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare, Demaine, Ku and Solomon. Gratuito. Aulas, notas e listas que aplicam análise assintótica a cada estrutura de dados e algoritmo.
- [Master theorem (analysis of algorithms)](https://en.wikipedia.org/wiki/Master_theorem_%28analysis_of_algorithms%29), Wikipedia. Gratuito. Enunciado compacto dos três casos, com exemplos resolvidos e os casos que o teorema não cobre.
- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Gratuito. As aulas gravadas do curso acima, partindo do modelo de computação e da notação assintótica.
- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Gratuito. Aulas no quadro que contam operações passo a passo e resolvem recorrências à mão.
- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Gratuito. Animações passo a passo em que se vê o custo de cada operação conforme a entrada muda.
- [Computer Science Stack Exchange: asymptotics tag](https://cs.stackexchange.com/questions/tagged/asymptotics), Stack Exchange. Gratuito. Perguntas respondidas sobre notação e provas, incluindo os tópicos de referência sobre resolução de recorrências.

Lista completa e miniprojetos: [projects/big-o/README.pt-BR.md](projects/big-o/README.pt-BR.md)

## Estruturas de dados

Estruturas de dados são as formas de organizar dados na memória e em disco para que as operações de que um programa precisa sejam baratas. Escolher entre um vetor, uma lista ligada, uma tabela hash, uma árvore balanceada ou um grafo costuma ser a decisão que mais muda o custo de um programa, e é a base de bancos de dados, compiladores, sistemas operacionais e redes.

- [VisuAlgo](https://visualgo.net/en), Steven Halim, National University of Singapore. Gratuito. Animações de listas, heaps, tabelas hash, árvores de busca e percursos em grafos, com questionários.
- [Data Structure Visualizations](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html), David Galles, University of San Francisco. Gratuito. Páginas interativas em que você insere e remove chaves e vê árvores AVL, rubro-negras e B se rebalancearem.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. Em português. Gratuito. Notas em português sobre listas, pilhas, filas, árvores, heaps e hashing, com código C curto.
- [Open Data Structures](https://opendatastructures.org/), Pat Morin. Gratuito. Livro-texto gratuito que implementa e analisa cada estrutura, com edições em Java, C++ e pseudocódigo.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Gratuito online, pago impresso. O site do livro traz resumos, código Java e exercícios de tabelas de símbolos, árvores balanceadas, hashing e grafos.
- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Gratuito. A primeira metade é um curso de estruturas de dados: sequências, conjuntos, hashing, árvores binárias, AVL e heaps.
- [CS 61B Data Structures (Spring 2021)](https://sp21.datastructur.es/), Josh Hug, UC Berkeley. Gratuito. Curso completo com vídeos, livro online e projetos em Java com correção automática.
- [Estrutura de Dados](https://www.youtube.com/playlist?list=PLxI8Can9yAHf8k8LrUePyj0y3lLpigGcl), UNIVESP. Em português. Gratuito. Disciplina completa de graduação em português usando C: listas, pilhas, filas, árvores e ordenação.
- [Organization and Maintenance of Large Ordered Indices](https://infolab.usc.edu/csci585/Spring2010/den_ar/indexing.pdf), Rudolf Bayer and Edward McCreight (1970). Gratuito. O relatório de pesquisa da Boeing, publicado como artigo em 1972, que apresentou a árvore B, a origem de todo índice de banco de dados.
- [MIT 6.006 Introduction to Algorithms, Spring 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63EdVPNLG3ToM6LaEUuStEY), MIT OpenCourseWare. Gratuito. Aulas gravadas sobre vetores dinâmicos, hashing, heaps binários, árvores AVL e busca em grafos.
- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Gratuito. Artigos claros com código sobre árvores de segmentos, árvores de Fenwick, union-find, tries e algoritmos em grafos.
- [Stack Overflow: data-structures tag](https://stackoverflow.com/questions/tagged/data-structures), Stack Overflow. Gratuito. Grande acervo de dúvidas práticas sobre como escolher e implementar estruturas.

Lista completa e miniprojetos: [projects/data-structures/README.pt-BR.md](projects/data-structures/README.pt-BR.md)

## Sistemas operacionais

Um sistema operacional é o programa que divide uma máquina entre muitos programas: dá a cada processo a ilusão de ter sua própria CPU e memória, intermedeia o acesso a arquivos e dispositivos e impede que os programas prejudiquem uns aos outros. Entender processos, escalonamento, memória virtual, sistemas de arquivos e deadlocks explica a maior parte do comportamento, e dos problemas de desempenho, de software real.

- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau, University of Wisconsin. Gratuito online, pago impresso. O livro de SO mais acessível: capítulos curtos sobre virtualização, concorrência e persistência, com simuladores de exercício.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. Em português. Gratuito. Livro-texto completo e gratuito em português, com slides e exercícios para cada capítulo.
- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. Pago. O livro-texto que o quiz segue (na 4ª edição): processos, memória, sistemas de arquivos, E/S, deadlocks e virtualização.
- [Operating System Concepts, 10th edition](https://www.os-book.com/OS10/), Silberschatz, Galvin and Gagne. Pago. O outro livro-texto clássico; o site oferece gratuitamente os slides e exercícios de prática.
- [CS 162 Operating Systems and Systems Programming](https://cs162.org/), UC Berkeley. Gratuito. Slides, leituras e os projetos Pintos de um curso completo de SO.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Gratuito. Curso guiado por laboratórios em torno do xv6, um pequeno kernel didático tipo Unix para RISC-V.
- [The UNIX Time-Sharing System](https://dsf.berkeley.edu/cs262/unix.pdf), Dennis Ritchie and Ken Thompson (1974). Gratuito. O artigo que apresentou arquivos como fluxos de bytes, o shell, pipes e fork, em poucas páginas legíveis.
- [Linux man-pages online](https://man7.org/linux/man-pages/), Michael Kerrisk and the man-pages project. Gratuito. A descrição oficial de cada chamada de sistema e função de biblioteca, como fork, mmap e pipe.
- [OSTEP homework simulators](https://github.com/remzi-arpacidusseau/ostep-homework), Remzi Arpaci-Dusseau. Gratuito. Pequenos simuladores em Python de escalonamento, paginação, TLB e discos, próximos dos miniprojetos desta área.
- [r/osdev](https://www.reddit.com/r/osdev/), Reddit. Gratuito. Comunidade de quem escreve o próprio kernel, boa para dúvidas de baixo nível.

Lista completa e miniprojetos: [projects/operating-systems/README.pt-BR.md](projects/operating-systems/README.pt-BR.md)

## Redes

Redes de computadores são as camadas de protocolos que movem bytes entre máquinas: dos sinais em um fio, passando por quadros, pacotes e rotas, até conexões confiáveis e as aplicações construídas sobre elas. Quase todo programa hoje conversa com outro, então saber o que TCP, IP, DNS e Ethernet realmente garantem é o que separa adivinhar de diagnosticar.

- [Computer Networks: A Systems Approach](https://book.systemsapproach.org/), Larry Peterson and Bruce Davie. Gratuito. Livro-texto completo e aberto que explica cada camada pelos problemas de projeto que ela resolve.
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/), Brian "Beej" Hall. Gratuito. A introdução prática clássica a sockets em C: endereços, TCP, UDP e select.
- [How DNS works](https://howdns.works/), DNSimple. Gratuito. Quadrinho curto que acompanha uma resolução de nome do navegador até os servidores raiz.
- [Computer Networking: A Top-Down Approach, 9th edition](https://gaia.cs.umass.edu/kurose_ross/index.php), Jim Kurose and Keith Ross. Gratuito online, pago impresso. O livro-texto mais usado; o site dos autores oferece gratuitamente videoaulas, slides e laboratórios de Wireshark.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. Pago. O livro-texto de baixo para cima que o quiz segue (na 5ª edição), forte nas camadas de enlace e de acesso ao meio.
- [CS 144 Introduction to Computer Networking](https://cs144.github.io/), Stanford University. Gratuito. Notas de aula e laboratórios em que você constrói uma implementação funcional de TCP passo a passo.
- [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), IETF. Gratuito. A especificação atual do TCP: cabeçalho, máquina de estados, números de sequência e retransmissão.
- [RFC 1034: Domain Names, Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034), Paul Mockapetris, IETF. Gratuito. O projeto do DNS: o espaço de nomes, zonas, resolvedores e consultas iterativas e recursivas.
- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/), Wireshark Foundation. Gratuito. Guia oficial para capturar e ler pacotes, a melhor forma de ver os protocolos de verdade.
- [Networking tutorial](https://www.youtube.com/playlist?list=PLowKtXNTBypH19whXTVoG3oKSuOcw_XeW), Ben Eater. Gratuito. Treze vídeos curtos que vão de bits em um fio a Ethernet, IP, roteamento e TCP.
- [Network Engineering Stack Exchange](https://networkengineering.stackexchange.com/), Stack Exchange. Gratuito. Perguntas e respostas sobre protocolos, sub-redes, comutação e roteamento.

Lista completa e miniprojetos: [projects/networks/README.pt-BR.md](projects/networks/README.pt-BR.md)

## Bancos de dados (teoria)

A teoria de bancos de dados explica como os dados são modelados como relações, consultados com uma linguagem declarativa e armazenados de modo que as consultas continuem rápidas e os dados continuem corretos. O modelo relacional, a álgebra relacional, a normalização, os índices e a otimização de consultas são as ideias por trás de todo banco SQL, e são o que permite projetar um esquema e ler um plano de consulta em vez de adivinhar.

- [SQLBolt](https://sqlbolt.com/), SQLBolt. Gratuito. Lições interativas curtas que ensinam SQL executando consultas no navegador.
- [Use The Index, Luke](https://use-the-index-luke.com/), Markus Winand. Gratuito. Livro online gratuito sobre como funcionam os índices em árvore B e como escrever consultas que os usam.
- [Let's Build a Simple Database](https://cstack.github.io/db_tutorial/), Connor Stack. Gratuito. Tutorial que escreve um pequeno clone do SQLite em C, do REPL à árvore B em disco.
- [Database System Concepts, 7th edition](https://db-book.com/), Silberschatz, Korth and Sudarshan. Pago. Livro-texto completo; o site oferece gratuitamente slides e exercícios de prática de cada capítulo.
- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. Slides, notas, vídeos e projetos sobre armazenamento, índices, execução de consultas, otimização e concorrência.
- [CS 186 Introduction to Database Systems](https://cs186berkeley.net/), UC Berkeley. Gratuito. Notas de curso e exercícios sobre álgebra relacional, junções, otimização de consultas e normalização.
- [A Relational Model of Data for Large Shared Data Banks](https://www.engineering.upenn.edu/~zives/03f/cis550/codd.pdf), Edgar F. Codd (1970). Gratuito. O artigo que propôs relações, chaves e formas normais e deu início aos bancos relacionais.
- [Architecture of a Database System](https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf), Hellerstein, Stonebraker and Hamilton (2007). Gratuito. Um longo panorama de como um SGBD relacional real é organizado, do analisador ao gerenciador de armazenamento.
- [PostgreSQL documentation](https://www.postgresql.org/docs/current/), PostgreSQL Global Development Group. Gratuito. O manual mais claro de um sistema real: SQL, índices, o planejador e o EXPLAIN.
- [CMU Database Group](https://www.youtube.com/@CMUDatabaseGroup), Carnegie Mellon University. Gratuito. As aulas gravadas de 15-445 e 15-721, além de palestras de engenheiros de bancos de dados.
- [RelaX: relational algebra calculator](https://dbis-uibk.github.io/relax/), University of Innsbruck. Gratuito. Executa expressões de álgebra relacional sobre dados de exemplo e mostra a árvore de operadores.
- [Database Administrators Stack Exchange](https://dba.stackexchange.com/), Stack Exchange. Gratuito. Perguntas e respostas sobre projeto de esquema, normalização, índices e planos de consulta.

Lista completa e miniprojetos: [projects/databases/README.pt-BR.md](projects/databases/README.pt-BR.md)

## Algoritmos

Algoritmos são os métodos passo a passo para resolver um problema: ordenar, buscar, achar o caminho mais curto, escolher a melhor combinação. Estudá-los ensina um pequeno conjunto de técnicas de projeto (divisão e conquista, escolha gulosa, programação dinâmica, backtracking) que transformam problemas que parecem impossíveis em escala em programas que terminam.

- [Algorithms](https://www.khanacademy.org/computing/computer-science/algorithms), Khan Academy, with Thomas Cormen and Devin Balkcom. Gratuito. Unidade suave com textos e exercícios sobre busca binária, as ordenações clássicas, recursão e busca em grafos.
- [VisuAlgo: Sorting](https://visualgo.net/en/sorting), Steven Halim, National University of Singapore. Gratuito. Anima cada algoritmo de ordenação com a sua entrada e conta comparações e trocas.
- [Projeto de Algoritmos em C](https://www.ime.usp.br/~pf/algoritmos/), Paulo Feofiloff, IME-USP. Em português. Gratuito. Notas em português sobre busca, as ordenações clássicas, heapsort, quicksort e backtracking, com invariantes.
- [Introduction to Algorithms, 4th edition](https://www.penguinrandomhouse.com/books/isbn/9780262046305), Cormen, Leiserson, Rivest and Stein. Pago. A referência padrão para ordenação, programação dinâmica, algoritmos gulosos e algoritmos em grafos.
- [Algorithms, 4th edition](https://algs4.cs.princeton.edu/home/), Robert Sedgewick and Kevin Wayne, Princeton. Gratuito online, pago impresso. Muito prático em ordenação: o site do livro compara os algoritmos e traz código Java testado.
- [The Algorithm Design Manual, 3rd edition](https://www.algorist.com/), Steven Skiena. Pago. Ensina a reconhecer qual técnica serve a um problema, com um catálogo de problemas clássicos.
- [MIT 6.006 Introduction to Algorithms (Spring 2020)](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/), MIT OpenCourseWare. Gratuito. Aulas e listas sobre ordenação, caminhos mínimos e um método claro para programação dinâmica.
- [Algorithms, Part I](https://www.coursera.org/learn/algorithms-part1), Robert Sedgewick and Kevin Wayne, Princeton (Coursera). Gratuito como ouvinte, certificado pago. Curso em vídeo sobre union-find, os algoritmos de ordenação, filas de prioridade e árvores de busca, com tarefas de programação corrigidas.
- [Timsort: listsort.txt](https://github.com/python/cpython/blob/main/Objects/listsort.txt), Tim Peters, CPython. Gratuito. A descrição feita pelo próprio autor da ordenação híbrida usada pelo Python, com medições.
- [Algorithms](https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O), Abdul Bari. Gratuito. Aulas no quadro sobre divisão e conquista, método guloso, programação dinâmica e backtracking.
- [CP-Algorithms](https://cp-algorithms.com/), e-maxx community translation project. Gratuito. Artigos de referência com provas e código para algoritmos em grafos, programação dinâmica e mais.
- [Codeforces](https://codeforces.com/), Mike Mirzayanov. Gratuito. Competições e uma comunidade muito ativa, com editoriais que explicam cada solução.

Lista completa e miniprojetos: [projects/algorithms/README.pt-BR.md](projects/algorithms/README.pt-BR.md)

## Concorrência

Concorrência é a arte de estruturar um programa como várias atividades que avançam em tempos sobrepostos e compartilham estado com segurança. É onde vivem os bugs mais difíceis (condições de corrida, deadlocks, inanição), e cada linguagem responde de um jeito: travas e operações atômicas, canais, atores ou um laço de eventos. Conhecer os modelos permite escolher um deles de propósito.

- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Gratuito. A palestra e os slides que separam as duas ideias: concorrência é estrutura, paralelismo é execução.
- [The Little Book of Semaphores](https://greenteapress.com/wp/semaphores/), Allen B. Downey. Gratuito. Livro gratuito de quebra-cabeças de sincronização, do mutex ao jantar dos filósofos e leitores-escritores.
- [Concorrência e Paralelismo (Parte 1)](https://akitaonrails.com/2019/03/13/akitando-43-concorrencia-e-paralelismo-parte-1-entendendo-back-end-para-iniciantes-parte-3/), Fabio Akita, Akitando. Em português. Gratuito. Vídeo com transcrição completa em português sobre processos, threads e quanto custam ao sistema operacional.
- [Operating Systems: Three Easy Pieces (Concurrency part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Gratuito online, pago impresso. Capítulos gratuitos sobre threads, travas, variáveis de condição, semáforos e bugs comuns de concorrência.
- [Java Concurrency in Practice](https://jcip.net/), Brian Goetz and others. Pago. O clássico sobre segurança entre threads, visibilidade, modelo de memória e pools de threads.
- [Rust Atomics and Locks](https://mara.nl/atomics/), Mara Bos. Gratuito online, pago impresso. Leitura online gratuita: operações atômicas, ordenação de memória e como construir um mutex e um canal do zero.
- [Communicating Sequential Processes](https://www.cs.cmu.edu/~crary/819-f09/Hoare78.pdf), C. A. R. Hoare (1978). Gratuito. O artigo por trás dos canais de Go e de muitas outras linguagens: processos que só se comunicam por mensagens.
- [Making reliable distributed systems in the presence of software errors](https://erlang.org/download/armstrong_thesis_2003.pdf), Joe Armstrong (2003). Gratuito. A tese que explica o projeto do Erlang e da BEAM: processos isolados, mensagens e supervisão.
- [The Go Memory Model](https://go.dev/ref/mem), The Go Authors. Gratuito. As regras oficiais de quando uma goroutine tem a garantia de ver o que outra escreveu.
- [The Rust Programming Language: Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html), The Rust Project. Gratuito. Como a posse e as traits Send e Sync transformam corridas de dados em erros de compilação.
- [What the heck is the event loop anyway?](https://www.youtube.com/watch?v=8aGhZQkoFbQ), Philip Roberts, JSConf EU. Gratuito. A explicação visual mais clara da pilha de chamadas, da fila de tarefas e do laço de eventos do JavaScript.
- [Stack Overflow: concurrency tag](https://stackoverflow.com/questions/tagged/concurrency), Stack Overflow. Gratuito. Perguntas respondidas sobre travas, visibilidade e deadlocks em todas as linguagens.

Lista completa e miniprojetos: [projects/concurrency/README.pt-BR.md](projects/concurrency/README.pt-BR.md)

## Paralelismo

Paralelismo é executar computações ao mesmo tempo em vários núcleos, faixas vetoriais ou máquinas para terminar mais cedo. Os processadores pararam de ficar mais rápidos um núcleo por vez, então a velocidade hoje vem de dividir bem o trabalho. A lei de Amdahl, o falso compartilhamento e a largura de banda de memória explicam por que dobrar os núcleos raramente dobra a velocidade, e como chegar mais perto disso.

- [Introduction to Parallel Computing Tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial), Lawrence Livermore National Laboratory. Gratuito. Tutorial longo e direto sobre os conceitos: arquiteturas de memória, modelos de programação, speed-up e seus limites.
- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Gratuito. Esclarece a diferença entre estruturar um programa de forma concorrente e executá-lo em paralelo.
- [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law), Wikipedia. Gratuito. A fórmula, sua dedução e a relação com a lei de Gustafson, com o gráfico de sempre.
- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Gratuito. Livro online gratuito sobre caches de CPU, SIMD, predição de desvios e como medi-los.
- [Is Parallel Programming Hard, And, If So, What Can You Do About It?](https://mirrors.edge.kernel.org/pub/linux/kernel/people/paulmck/perfbook/perfbook.html), Paul E. McKenney. Gratuito. Livro gratuito de um desenvolvedor do kernel Linux sobre contagem, travas, particionamento e escalabilidade.
- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare, Charles Leiserson and Julian Shun. Gratuito. Aulas sobre programação multicore, corridas, work stealing, algoritmos eficientes em cache e medição.
- [CS 149 Parallel Computing](https://gfxcourses.stanford.edu/cs149/fall23), Stanford University, Kayvon Fatahalian and Kunle Olukotun. Gratuito. Slides sobre paralelismo de tarefas e de dados, SIMD, GPUs, escalonamento e análise de desempenho.
- [MapReduce: Simplified Data Processing on Large Clusters](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/), Jeffrey Dean and Sanjay Ghemawat, Google (2004). Gratuito. O artigo que fez de map e reduce o modelo para processar dados em milhares de máquinas.
- [Rayon](https://docs.rs/rayon/latest/rayon/), Rayon developers. Gratuito. Documentação da biblioteca de paralelismo de dados para Rust: iteradores paralelos e join.
- [MIT 6.172 Performance Engineering of Software Systems (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63VIBQVWguXxZZi0566y7Wf), MIT OpenCourseWare. Gratuito. As aulas gravadas, incluindo as de Cilk, corridas e análise de algoritmos multithread.
- [Stack Overflow: parallel-processing tag](https://stackoverflow.com/questions/tagged/parallel-processing), Stack Overflow. Gratuito. Dúvidas práticas sobre por que código paralelo não escala e como corrigir.
- [Cilk: An Efficient Multithreaded Runtime System](https://dspace.mit.edu/handle/1721.1/149259), Blumofe, Joerg, Kuszmaul, Leiserson, Randall and Zhou (1995). Gratuito. O artigo sobre o runtime cujo escalonador com work stealing foi depois adotado por Go, Rayon e pelo pool fork-join do Java.

Lista completa e miniprojetos: [projects/parallelism/README.pt-BR.md](projects/parallelism/README.pt-BR.md)

## Transações

Uma transação agrupa várias operações para que tenham sucesso ou falhem juntas e não corrompam umas às outras quando executam ao mesmo tempo. ACID, níveis de isolamento, travas, concorrência multiversão e o log de escrita antecipada são como os bancos cumprem essa promessa, e sagas, o padrão outbox e a idempotência são como as aplicações a cumprem entre serviços, onde uma única transação de banco já não está disponível.

- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL Global Development Group. Gratuito. A tabela oficial de quais anomalias cada nível impede, com exemplos do que realmente acontece.
- [Consistency Models](https://jepsen.io/consistency), Kyle Kingsbury, Jepsen. Gratuito. Mapa clicável de modelos de consistência e isolamento, cada um com uma definição curta e precisa.
- [Transactions: myths, surprises and opportunities](https://www.youtube.com/watch?v=5ZjhNTM8XU8), Martin Kleppmann, Strange Loop. Gratuito. Palestra que mostra o que ACID e os nomes dos níveis de isolamento realmente significam em bancos diferentes.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Pago. Os capítulos sobre transações, problemas de sistemas distribuídos e consistência são o melhor resumo moderno.
- [Concurrency Control and Recovery in Database Systems](https://www.microsoft.com/en-us/research/people/philbe/book/), Bernstein, Hadzilacos and Goodman. Gratuito. O texto clássico sobre serializabilidade, bloqueio em duas fases, controle multiversão e recuperação, gratuito pelo autor.
- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. Aulas sobre teoria de controle de concorrência, bloqueio em duas fases, MVCC, log e recuperação.
- [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/), MIT PDOS, Robert Morris and Frans Kaashoek. Gratuito. Aulas, artigos e laboratórios sobre replicação, commit em duas fases e consistência, com Raft feito à mão.
- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/publication/a-critique-of-ansi-sql-isolation-levels/), Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil (1995). Gratuito. O artigo que mostrou que os níveis do padrão são ambíguos e definiu snapshot isolation e write skew.
- [Sagas](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf), Hector Garcia-Molina and Kenneth Salem (1987). Gratuito. A origem da saga: uma transação longa dividida em passos, cada um com uma ação de compensação.
- [PostgreSQL: Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html), PostgreSQL Global Development Group. Gratuito. O capítulo sobre MVCC, travas explícitas, deadlocks e tratamento de falhas de serialização.
- [Hermitage: testing transaction isolation levels](https://github.com/ept/hermitage), Martin Kleppmann. Gratuito. Conjunto de testes que mostra quais anomalias cada nível de isolamento de bancos reais realmente permite.
- [Database Administrators Stack Exchange: transaction tag](https://dba.stackexchange.com/questions/tagged/transaction), Stack Exchange. Gratuito. Perguntas respondidas sobre isolamento, travas e deadlocks em sistemas reais.

Lista completa e miniprojetos: [projects/transactions/README.pt-BR.md](projects/transactions/README.pt-BR.md)

## Segurança

Segurança de aplicações é entender como o software falha quando alguém tenta usá-lo de forma indevida, para construí-lo de modo que não falhe. Esta área é defensiva: cada falha (injeção, cross-site scripting, controle de acesso quebrado, armazenamento fraco de senhas) é estudada para explicar por que acontece e como preveni-la, seguindo as orientações da OWASP. Os laboratórios rodam apenas localmente, em Docker, e sempre trazem a correção junto com a falha.

- [OWASP Top 10](https://top10.owasp.org/), OWASP Foundation. Gratuito. A lista de referência dos riscos mais críticos de aplicações web, com a edição atual e as anteriores, cada risco com exemplos e orientações de prevenção.
- [OWASP Top 10 (2021), tradução em português](https://top10.owasp.org/2021/pt-BR/), OWASP Foundation. Em português. Gratuito. A tradução oficial em português do Brasil da edição de 2021, a que o quiz segue.
- [MDN: Security on the web](https://developer.mozilla.org/en-US/docs/Web/Security), Mozilla. Gratuito. Porta de entrada para o modelo de segurança do navegador: política de mesma origem, HTTPS, CSP, cookies e ataques contra os quais se defender.
- [Security Engineering, 3rd edition](https://www.cl.cam.ac.uk/archive/rja14/book.html), Ross Anderson. Gratuito online, pago impresso. Livro-texto amplo e agradável sobre como sistemas seguros são projetados e por que falham, com capítulos gratuitos online.
- [CS 253 Web Security](https://web.stanford.edu/class/cs253/), Feross Aboukhadijeh, Stanford University. Gratuito. Slides e aulas gravadas sobre política de mesma origem, XSS, CSRF, sessões, injeção e HTTPS, com foco nas defesas.
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/), OWASP Foundation. Gratuito. Guias de prevenção concisos e práticos por tema: injeção, XSS, CSRF, sessões, armazenamento de senhas, upload de arquivos e mais.
- [OWASP Application Security Verification Standard (ASVS)](https://owasp.org/projects/asvs), OWASP Foundation. Gratuito. Lista de requisitos de segurança verificáveis, útil para transformar orientações em testes.
- [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725), IETF. Gratuito. A lista oficial de armadilhas do JWT e das regras que as evitam, como fixar o algoritmo.
- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), OWASP Foundation. Gratuito. Por que consultas parametrizadas são a defesa principal, com exemplos em várias linguagens.
- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), OWASP Foundation. Gratuito. Quais algoritmos de hash usar (Argon2id primeiro) e com quais parâmetros.
- [OWASP Juice Shop](https://owasp.org/projects/juice-shop), OWASP Foundation. Gratuito. Aplicação de treinamento deliberadamente insegura para rodar localmente, o modelo para os laboratórios desta área.
- [Information Security Stack Exchange](https://security.stackexchange.com/), Stack Exchange. Gratuito. Respostas cuidadosas sobre autenticação, uso de criptografia e defesa de aplicações web.

Lista completa e miniprojetos: [projects/security/README.pt-BR.md](projects/security/README.pt-BR.md)

## Compiladores

Um compilador traduz um programa de uma linguagem para outra, e um interpretador o executa diretamente. Ambos passam pelas mesmas etapas: dividir o texto em tokens, construir uma árvore a partir de uma gramática, verificá-la e então gerar código ou executá-lo. Conhecer essas etapas tira o mistério das mensagens de erro, do desempenho, da coleta de lixo e de toda ferramenta que lê código.

- [Crafting Interpreters](https://craftinginterpreters.com/), Robert Nystrom. Gratuito online, pago impresso. Gratuito online: constrói a mesma linguagem duas vezes, como interpretador de árvore e como máquina virtual de bytecode.
- [Let's Build A Simple Interpreter](https://ruslanspivak.com/lsbasi-part1/), Ruslan Spivak. Gratuito. Série de blog paciente que faz crescer um interpretador de Pascal um pequeno passo por vez.
- [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html), Russ Cox. Gratuito. Explica a construção de Thompson e por que o casamento baseado em autômatos evita tempo exponencial.
- [Compilers: Principles, Techniques, and Tools, 2nd edition (the Dragon Book)](https://www.pearson.com/en-us/subject-catalog/p/compilers-principles-techniques-and-tools/P200000003472), Aho, Lam, Sethi and Ullman. Pago. O livro-texto que o quiz segue: análise léxica, parsing LL e LR, tradução, geração de código e otimização.
- [Introduction to Compilers and Language Design](https://dthain.github.io/books/compiler/), Douglas Thain, University of Notre Dame. Gratuito online, pago impresso. Livro-texto gratuito de um semestre que vai da análise léxica à geração de código x86.
- [CS 143 Compilers](https://web.stanford.edu/class/cs143/), Stanford University. Gratuito. Slides e trabalhos em que um compilador para a linguagem COOL é construído fase a fase.
- [CS 6120 Advanced Compilers: The Self-Guided Online Course](https://www.cs.cornell.edu/courses/cs6120/2020fa/self-guided/), Adrian Sampson, Cornell University. Gratuito. Vídeos e tarefas sobre representações intermediárias, análise de fluxo de dados, SSA e otimização.
- [The Implementation of Lua 5.0](https://www.lua.org/doc/jucs05.pdf), Ierusalimschy, de Figueiredo and Celes (2005). Gratuito. Como uma máquina virtual real e pequena é projetada: registradores, closures e tabelas, por seus autores brasileiros.
- [LLVM Tutorial: Kaleidoscope](https://llvm.org/docs/tutorial/), LLVM Project. Gratuito. O tutorial oficial que implementa uma linguagem pequena com gerador de código e JIT reais.
- [Compiler Explorer](https://godbolt.org/), Matt Godbolt. Gratuito. Digite código à esquerda e leia o assembly gerado à direita, para muitos compiladores.
- [AST Explorer](https://astexplorer.net/), Felix Kling. Gratuito. Mostra a árvore sintática que parsers reais constroem para um trecho de código.
- [r/ProgrammingLanguages](https://www.reddit.com/r/ProgrammingLanguages/), Reddit. Gratuito. Comunidade ativa de quem projeta e implementa linguagens.

Lista completa e miniprojetos: [projects/compilers/README.pt-BR.md](projects/compilers/README.pt-BR.md)

## Máquinas de estado

Uma máquina de estados descreve o comportamento como um conjunto finito de estados e as transições entre eles. É ao mesmo tempo um modelo teórico (autômatos, linguagens regulares, máquinas de Turing e os limites da computação) e uma ferramenta prática de projeto: protocolos, parsers, interfaces e fluxos de negócio ficam mais fáceis de entender, e situações inválidas ficam impossíveis de representar, quando os estados são explícitos.

- [Welcome to the world of Statecharts](https://statecharts.dev/), statecharts community. Gratuito. Introdução direta a máquinas de estados e statecharts, com os problemas que cada conceito resolve.
- [Game Programming Patterns: State](https://gameprogrammingpatterns.com/state.html), Robert Nystrom. Gratuito. Parte de um emaranhado de flags e chega a máquinas de estados finitos, hierarquias e autômatos com pilha.
- [State pattern](https://refactoring.guru/design-patterns/state), Refactoring Guru. Gratuito. O padrão State orientado a objetos com diagramas e código, também disponível em português no site.
- [Introduction to the Theory of Computation, 3rd edition](https://math.mit.edu/~sipser/book.html), Michael Sipser. Pago. O livro-texto padrão sobre autômatos, linguagens regulares e livres de contexto, máquinas de Turing e computabilidade.
- [MIT 18.404J Theory of Computation](https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/), Michael Sipser, MIT OpenCourseWare. Gratuito. Videoaulas do autor do livro-texto, de autômatos finitos a indecidibilidade e complexidade.
- [On Computable Numbers, with an Application to the Entscheidungsproblem](https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf), Alan Turing (1936). Gratuito. O artigo que definiu a máquina de Turing e provou que alguns problemas não podem ser decididos.
- [XState and Stately documentation](https://stately.ai/docs), Stately. Gratuito. A documentação da principal biblioteca de statecharts para TypeScript: estados, eventos, guardas, ações e atores.
- [gen_statem](https://www.erlang.org/doc/apps/stdlib/gen_statem.html), Erlang/OTP. Gratuito. O comportamento padrão de máquina de estados da BEAM, usado a partir do Elixir em protocolos e fluxos.
- [MIT 18.404J Theory of Computation, Fall 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP60_JNv2MmK3wkOt9syvfQWY), Michael Sipser, MIT OpenCourseWare. Gratuito. As aulas gravadas do curso acima.
- [JFLAP](https://www.jflap.org/), Susan Rodger, Duke University. Gratuito. Ferramenta para construir e simular autômatos, gramáticas e máquinas de Turing, e converter entre eles.
- [Computer Science Stack Exchange: automata tag](https://cs.stackexchange.com/questions/tagged/automata), Stack Exchange. Gratuito. Perguntas respondidas sobre construções de autômatos, provas e linguagens regulares.
- [Statecharts in the Making: A Personal Account](https://weizmann.ac.il/math/harel/sites/math.harel/files/users/user50/Statecharts.History.pdf), David Harel (2007). Gratuito. O inventor dos statecharts conta como hierarquia, estados paralelos e comunicação por difusão foram acrescentados aos diagramas de estados, e por quê.

Lista completa e miniprojetos: [projects/state-machines/README.pt-BR.md](projects/state-machines/README.pt-BR.md)

## Teoria da informação

A teoria da informação mede a informação em bits e prova até onde os dados podem ser comprimidos e com que confiabilidade podem ser enviados por um canal com ruído. A entropia de Shannon define o limite do qual Huffman e LZ77 se aproximam, e a redundância acrescentada de propósito (paridade, CRC, códigos de Hamming) é o que permite a redes e discos detectar e reparar erros. As mesmas ideias explicam codificações de texto como UTF-8 e base64.

- [Journey into information theory](https://www.khanacademy.org/computing/computer-science/informationtheory), Brit Cruise, Khan Academy. Gratuito. Vídeos curtos que vão da sinalização antiga até entropia, compressão e correção de erros.
- [Visual Information Theory](https://colah.github.io/posts/2015-09-Visual-Information/), Christopher Olah. Gratuito. Explica entropia, comprimentos ótimos de código e entropia cruzada com figuras em vez de fórmulas.
- [But what are Hamming codes? The origin of error correction](https://www.youtube.com/watch?v=X8jsijhllIA), Grant Sanderson, 3Blue1Brown. Gratuito. Dedução visual dos códigos de Hamming como um jogo de verificações de paridade.
- [Information Theory, Inference, and Learning Algorithms](https://www.inference.org.uk/mackay/itila/), David MacKay. Gratuito online, pago impresso. Livro-texto completo de leitura online gratuita, cobrindo codificação de fonte, de canal e códigos corretores de erros.
- [MIT 6.050J Information and Entropy](https://ocw.mit.edu/courses/6-050j-information-and-entropy-spring-2008/), MIT OpenCourseWare, Paul Penfield and Seth Lloyd. Gratuito. Curso de primeiro ano com notas sobre bits, códigos, compressão, erros, probabilidade e entropia.
- [EE 274 Data Compression: Theory and Applications (notes)](https://stanforddatacompressionclass.github.io/notes/), Stanford University. Gratuito. Notas de aula sobre códigos de prefixo, Huffman, codificação aritmética, LZ77 e compressores modernos.
- [A Mathematical Theory of Communication](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf), Claude Shannon (1948). Gratuito. O artigo fundador: entropia, o teorema da codificação de fonte e a capacidade de canal, ainda legível hoje.
- [RFC 1951: DEFLATE Compressed Data Format Specification](https://www.rfc-editor.org/rfc/rfc1951), Peter Deutsch, IETF. Gratuito. O formato por trás de gzip, zip e PNG: LZ77 seguido de codificação de Huffman, especificado em poucas páginas.
- [A Painless Guide to CRC Error Detection Algorithms](https://www.zlib.net/crc_v3.txt), Ross Williams (1993). Gratuito. A explicação clássica de CRCs, da divisão polinomial à mão até a implementação com tabela.
- [Solving Wordle using information theory](https://www.youtube.com/watch?v=v68zYyaEmEA), Grant Sanderson, 3Blue1Brown. Gratuito. Usa um jogo de palavras para tornar intuitivos os bits de informação e a entropia.
- [The Absolute Minimum Every Software Developer Must Know About Unicode and Character Sets](https://www.joelonsoftware.com/2003/10/08/the-absolute-minimum-every-software-developer-absolutely-positively-must-know-about-unicode-and-character-sets-no-excuses/), Joel Spolsky. Gratuito. O ensaio curto que explica code points, codificações e por que não existe texto puro.
- [Computer Science Stack Exchange: information-theory tag](https://cs.stackexchange.com/questions/tagged/information-theory), Stack Exchange. Gratuito. Perguntas respondidas sobre entropia, codificação e limites de compressão.

Lista completa e miniprojetos: [projects/information-theory/README.pt-BR.md](projects/information-theory/README.pt-BR.md)

## Lógica digital

Lógica digital é o nível em que a computação se torna física: números em binário, funções booleanas, portas lógicas e os circuitos feitos com elas, primeiro combinacionais (somadores, multiplexadores) e depois sequenciais (flip-flops, registradores, contadores). Construir um somador e depois uma pequena CPU a partir de portas mostra que um computador é uma pilha de ideias simples, cada uma feita com a anterior.

- [Nand to Tetris](https://www.nand2tetris.org/), Noam Nisan and Shimon Schocken. Gratuito. O curso que constrói um computador inteiro a partir da porta NAND, com ferramentas e material de projeto gratuitos.
- [NandGame](https://nandgame.com/), Olav Junker Kjær. Gratuito. Jogo de navegador com o mesmo caminho: de uma porta NAND a um somador, uma ULA e um processador.
- [Build an 8-bit computer from scratch](https://eater.net/8bit), Ben Eater. Gratuito. Série de vídeos que constrói um computador funcional em protoboards, um módulo por vez.
- [The Elements of Computing Systems, 2nd edition](https://www.nand2tetris.org/book), Noam Nisan and Shimon Schocken. Pago. O livro do Nand to Tetris: lógica booleana, aritmética, memória, a CPU e o software acima dela.
- [Code: The Hidden Language of Computer Hardware and Software, 2nd edition](https://codehiddenlanguage.com/), Charles Petzold. Pago. Um caminho paciente e não acadêmico do código Morse e dos relés a portas, somadores, memória e processador.
- [MIT 6.004 Computation Structures](https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/), MIT OpenCourseWare, Chris Terman. Gratuito. Vídeos e exercícios sobre informação, portas, lógica combinacional e sequencial e projeto de processadores.
- [Build a Modern Computer from First Principles: From Nand to Tetris](https://www.coursera.org/learn/build-a-computer), Hebrew University of Jerusalem (Coursera). Gratuito como ouvinte, certificado pago. A versão guiada da parte I do Nand to Tetris, com aulas e projetos verificados automaticamente.
- [A Symbolic Analysis of Relay and Switching Circuits](https://dspace.mit.edu/handle/1721.1/11173), Claude Shannon (1937 master's thesis). Gratuito. A dissertação que mostrou que a álgebra booleana descreve circuitos de chaveamento, o início do projeto digital.
- [Building an 8-bit breadboard computer!](https://www.youtube.com/playlist?list=PLowKtXNTBypGqImE405J2565dvjafglHU), Ben Eater. Gratuito. A playlist completa: relógio, registradores, ULA, memória, contador de programa e lógica de controle.
- [Exploring How Computers Work](https://www.youtube.com/watch?v=QZwneRb-zqA), Sebastian Lague. Gratuito. Caminhada lindamente animada de portas lógicas a um somador e uma pequena ULA em um simulador.
- [Digital](https://github.com/hneemann/Digital), Helmut Neemann. Gratuito. Simulador didático de circuitos digitais que também gera tabelas-verdade e expressões minimizadas.
- [Electrical Engineering Stack Exchange: digital-logic tag](https://electronics.stackexchange.com/questions/tagged/digital-logic), Stack Exchange. Gratuito. Perguntas respondidas sobre portas, minimização, flip-flops e temporização.

Lista completa e miniprojetos: [projects/digital-logic/README.pt-BR.md](projects/digital-logic/README.pt-BR.md)

## Eletrônica

Eletrônica é a camada abaixo da lógica digital: tensão, corrente, resistência e potência, as leis que as relacionam, os componentes (resistores, capacitores, bobinas, diodos, transistores) e os instrumentos usados para medi-los. Para quem desenvolve software, ela explica o que é fisicamente um nível lógico, como funciona uma fonte de alimentação ou um sensor e como ler um esquema e um datasheet.

Área só de teoria: não tem miniprojeto, então a lista completa está aqui.

### Comece por aqui

- [Lessons In Electric Circuits](https://www.ibiblio.org/kuphaldt/electricCircuits/), Tony Kuphaldt. Gratuito. Livro-texto gratuito e completo: corrente contínua e alternada, semicondutores, circuitos digitais e tabelas de referência.
- [Electrical engineering](https://www.khanacademy.org/science/electrical-engineering), Khan Academy. Gratuito. Vídeos e exercícios de análise de circuitos, das leis de Ohm e de Kirchhoff aos amplificadores.
- [SparkFun tutorials: concepts](https://learn.sparkfun.com/tutorials/tags/concepts), SparkFun Electronics. Gratuito. Tutoriais curtos e ilustrados sobre tensão, corrente, resistores, capacitores, diodos e transistores.
- [Instituto Newton C. Braga](https://www.newtoncbraga.com.br/), Newton C. Braga. Em português. Gratuito. Site muito amplo em português com cursos, artigos e circuitos práticos de um autor brasileiro clássico.

### Livros

- [Eletrônica, 3rd edition](https://www.clubedohardware.com.br/livros/disponiveis/eletr%C3%B4nica-3%C2%AA-edi%C3%A7%C3%A3o-r34/), Gabriel Torres, Clube do Hardware. Em português. Pago. A edição atual, na página da editora, do livro que o quiz segue capítulo a capítulo (na 2ª edição).
- [The Art of Electronics, 3rd edition](https://artofelectronics.net/), Paul Horowitz and Winfield Hill. Pago. O livro de referência de projeto prático de circuitos, escrito do ponto de vista de quem projeta.
- [Make: Electronics, 3rd edition](https://www.makershed.com/products/make-electronics-3rd-edition-print), Charles Platt. Pago. Livro para iniciantes que ensina por experimentos, de uma pilha e um resistor a transistores e circuitos integrados.

### Cursos e aulas

- [MIT 6.002 Circuits and Electronics](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/), MIT OpenCourseWare, Anant Agarwal. Gratuito. Videoaulas sobre análise de circuitos, equivalentes de Thévenin e Norton, transistores, capacitores e indutores.
- [Engenharia elétrica](https://pt.khanacademy.org/science/electrical-engineering), Khan Academy. Em português. Gratuito. O curso de análise de circuitos da Khan Academy traduzido para o português.

### Artigos e especificações

- [The International System of Units (SI Brochure)](https://www.bipm.org/en/publications/si-brochure), BIPM. Gratuito. A definição oficial das unidades e prefixos usados em toda medição.
- [Thévenin's theorem](https://en.wikipedia.org/wiki/Th%C3%A9venin%27s_theorem), Wikipedia. Gratuito. Enunciado compacto com exemplo resolvido e a ligação com o teorema de Norton.

### Vídeos

- [EEVblog](https://www.youtube.com/@EEVblog), Dave Jones. Gratuito. Canal de longa data com tutoriais de fundamentos, análises de instrumentos e desmontagens.
- [w2aew](https://www.youtube.com/@w2aew), Alan Wolke. Gratuito. Tutoriais claros de bancada sobre osciloscópios, pontas de prova, transistores e circuitos básicos.
- [Ben Eater](https://www.youtube.com/@BenEater), Ben Eater. Gratuito. Monta circuitos em protoboards e explica cada sinal com multímetro e osciloscópio.
- [WR Kits](https://www.youtube.com/@canalwrkits), Wagner Rambo. Em português. Gratuito. Canal brasileiro com milhares de aulas de eletrônica analógica e digital e de microcontroladores.

### Prática e ferramentas

- [Circuit Simulator Applet](https://www.falstad.com/circuit/), Paul Falstad. Gratuito. Simulador animado no navegador em que o fluxo de corrente é visível e os valores mudam ao vivo.
- [Kit para Montar Circuito DC](https://phet.colorado.edu/pt_BR/simulations/circuit-construction-kit-dc), PhET, University of Colorado Boulder. Em português. Gratuito. Simulação de circuitos em português para experimentar a lei de Ohm, série e paralelo.
- [Tinkercad Circuits](https://www.tinkercad.com/circuits), Autodesk. Gratuito. Uma protoboard virtual com componentes, multímetro e osciloscópio.
- [KiCad](https://www.kicad.org/), KiCad project. Gratuito. Software de código aberto para desenhar esquemas e placas de circuito.

### Comunidades

- [Electrical Engineering Stack Exchange](https://electronics.stackexchange.com/), Stack Exchange. Gratuito. Respostas detalhadas de engenheiros em atividade sobre circuitos, componentes e medição.
- [r/AskElectronics](https://www.reddit.com/r/AskElectronics/), Reddit. Gratuito. Lugar acolhedor a iniciantes para perguntar sobre circuitos e reparos.
- [EEVblog Electronics Community Forum](https://www.eevblog.com/forum/), EEVblog. Gratuito. Fórum grande sobre equipamentos de teste, projetos e dúvidas de iniciantes.

## Programação orientada a objetos

A programação orientada a objetos organiza um programa como objetos que guardam seu próprio estado e expõem comportamento por meio de uma interface. Encapsulamento, polimorfismo, herança e composição são ferramentas para controlar como uma mudança em uma parte se espalha para as outras. A maior parte do código de negócio é escrita assim, então saber onde as ideias ajudam, e onde produzem acoplamento e code smells, importa todos os dias.

- [The Java Tutorials: Object-Oriented Programming Concepts](https://docs.oracle.com/javase/tutorial/java/concepts/), Oracle. Gratuito. Lição oficial curta sobre objetos, classes, herança, interfaces e pacotes.
- [Curso de Java: Programação Orientada a Objetos](https://www.cursoemvideo.com/curso/java-poo/), Gustavo Guanabara, Curso em Vídeo. Em português. Gratuito. Curso em vídeo para iniciantes em português sobre classes, encapsulamento, herança e polimorfismo.
- [Code Smells](https://refactoring.guru/refactoring/smells), Refactoring Guru. Gratuito. Catálogo ilustrado de smells, cada um com suas causas e as refatorações que o tratam.
- [Effective Java, 3rd edition](https://www.informit.com/store/effective-java-9780134685991), Joshua Bloch. Pago. Conselhos concretos sobre projeto de classes, preferência por composição, genéricos, exceções e imutabilidade.
- [Refactoring, 2nd edition](https://martinfowler.com/books/refactoring.html), Martin Fowler. Pago. O livro que deu nome aos code smells e catalogou as refatorações que os removem.
- [Practical Object-Oriented Design, 2nd edition](https://sandimetz.com/products), Sandi Metz. Pago. O livro mais legível sobre dependências, duck typing e composição em vez de herança.
- [Java Programming MOOC](https://java-programming.mooc.fi/), University of Helsinki. Gratuito. Curso gratuito em duas partes com centenas de exercícios corrigidos sobre objetos, interfaces, coleções e streams.
- [MIT 6.031 Software Construction](https://web.mit.edu/6.031/www/sp22/), MIT. Gratuito. Leituras públicas sobre especificações, tipos abstratos de dados, interfaces, igualdade e mutabilidade.
- [The Early History of Smalltalk](https://worrydream.com/EarlyHistoryOfSmalltalk/), Alan Kay (1993). Gratuito. Quem cunhou o termo explica o que objetos e mensagens deveriam ser.
- [TypeScript Handbook: Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html), Microsoft. Gratuito. Classes, visibilidade, classes abstratas e interfaces na linguagem de referência deste repositório.
- [Nothing is Something](https://www.youtube.com/watch?v=OMPfEXIlTVE), Sandi Metz, RailsConf. Gratuito. Palestra sobre trocar condicionais e herança por composição e objetos pequenos.
- [Software Engineering Stack Exchange: object-oriented tag](https://softwareengineering.stackexchange.com/questions/tagged/object-oriented), Stack Exchange. Gratuito. Discussões de projeto sobre herança, composição, encapsulamento e acoplamento.

Lista completa e miniprojetos: [projects/oop/README.pt-BR.md](projects/oop/README.pt-BR.md)

## Programação funcional

A programação funcional constrói programas com funções puras e dados imutáveis, empurrando os efeitos colaterais para as bordas. Código escrito assim é mais fácil de testar, de entender e de executar de forma concorrente, porque o resultado de uma função depende só dos argumentos. Funções de ordem superior, closures, casamento de padrões e tipos como Option e Result saíram de Haskell e Elixir e chegaram a TypeScript, Rust e Java.

- [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS), Kyle Simpson. Gratuito. Livro gratuito e pragmático sobre funções puras, closures, composição e imutabilidade sem teoria pesada.
- [Elixir School](https://elixirschool.com/pt), Elixir School contributors. Em português. Gratuito. Lições gratuitas de Elixir em português (e em muitos outros idiomas): casamento de padrões, pipes, recursão, processos.
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/), Scott Wlaschin. Gratuito. A explicação mais conhecida de tratamento de erros com tipos Result, como uma figura de dois trilhos.
- [Structure and Interpretation of Computer Programs, 2nd edition](https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/6515/sicp.zip/index.html), Harold Abelson and Gerald Jay Sussman. Gratuito. O clássico sobre abstração com funções, recursão, procedimentos de ordem superior e interpretadores.
- [Learn You a Haskell for Great Good!](https://learnyouahaskell.github.io/), Miran Lipovača, community edition. Gratuito. Introdução gratuita e amigável a tipos, currying, avaliação preguiçosa, functores e mônadas.
- [Grokking Simplicity](https://www.manning.com/books/grokking-simplicity), Eric Normand. Pago. Ensina o pensamento funcional em JavaScript separando ações, cálculos e dados.
- [Programming Languages, Part A](https://www.coursera.org/learn/programming-languages), Dan Grossman, University of Washington (Coursera). Gratuito como ouvinte, certificado pago. Curso exigente de programação funcional em ML: recursão, casamento de padrões, closures e inferência de tipos.
- [Why Functional Programming Matters](https://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf), John Hughes (1990). Gratuito. O artigo que defende funções de ordem superior e avaliação preguiçosa como ferramentas de modularidade.
- [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf), Koen Claessen and John Hughes (2000). Gratuito. A origem dos testes baseados em propriedades: declare uma propriedade e deixe a ferramenta procurar um contraexemplo.
- [Elixir: Getting Started](https://hexdocs.pm/elixir/introduction.html), The Elixir Team. Gratuito. O guia oficial: imutabilidade, casamento de padrões, recursão, enumeráveis e streams.
- [Learning Functional Programming with JavaScript](https://www.youtube.com/watch?v=e-5obm1G_FY), Anjana Vakil, JSUnconf. Gratuito. Palestra de trinta minutos para iniciantes sobre funções puras, funções de ordem superior e imutabilidade.
- [fast-check](https://fast-check.dev/), Nicolas Dubien. Gratuito. A biblioteca de testes baseados em propriedades para TypeScript, com um guia para escrever boas propriedades.

Lista completa e miniprojetos: [projects/functional-programming/README.pt-BR.md](projects/functional-programming/README.pt-BR.md)

## Padrões de projeto e SOLID

Padrões de projeto são soluções com nome para problemas de projeto que sempre voltam, e os princípios SOLID são cinco regras práticas para manter classes e módulos fáceis de mudar. Juntos eles dão um vocabulário comum (Strategy, Adapter, Observer, inversão de dependência) para discutir projeto, e o discernimento para ver quando um padrão se paga e quando é só cerimônia.

- [Design Patterns](https://refactoring.guru/design-patterns), Alexander Shvets, Refactoring Guru. Gratuito. O catálogo online mais claro: cada padrão com o problema, a estrutura, prós e contras e código.
- [Padrões de Projeto](https://refactoring.guru/pt-br/design-patterns), Alexander Shvets, Refactoring Guru. Em português. Gratuito. O mesmo catálogo traduzido para o português do Brasil.
- [Game Programming Patterns](https://gameprogrammingpatterns.com/), Robert Nystrom. Gratuito online, pago impresso. Gratuito online: revisita Command, Observer, State e Singleton com notas honestas sobre quando não usá-los.
- [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.informit.com/store/design-patterns-elements-of-reusable-object-oriented-9780201633610), Gamma, Helm, Johnson and Vlissides. Pago. O catálogo original de 23 padrões da "Gang of Four", ainda a referência para nomes e intenção.
- [Head First Design Patterns, 2nd edition](https://wickedlysmart.com/head-first-design-patterns/), Eric Freeman and Elisabeth Robson. Pago. A página dos autores do livro mais acessível: cada padrão nasce de um problema de projeto que primeiro piora.
- [Catalog of Patterns of Enterprise Application Architecture](https://martinfowler.com/eaaCatalog/), Martin Fowler. Gratuito. Resumos curtos dos padrões de back-end: Repository, Unit of Work, Data Mapper, Service Layer.
- [The Principles of OOD](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod), Robert C. Martin. Gratuito. O índice do autor com os artigos originais sobre cada um dos princípios depois chamados de SOLID.
- [A Behavioral Notion of Subtyping](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf), Barbara Liskov and Jeannette Wing (1994). Gratuito. O enunciado formal do princípio da substituição: o que um subtipo precisa preservar.
- [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html), Martin Fowler (2004). Gratuito. O artigo que deu nome à injeção de dependência e a comparou com o service locator.
- [Design Patterns in TypeScript](https://refactoring.guru/design-patterns/typescript), Refactoring Guru. Gratuito. Um exemplo executável em TypeScript de cada padrão do catálogo.
- [Design Patterns in Object Oriented Programming](https://www.youtube.com/playlist?list=PLrhzvIcii6GNjpARdnO4ueTUAVR9eMBpc), Christopher Okhravi. Gratuito. Explicações animadas no quadro dos principais padrões, seguindo o Head First Design Patterns.
- [Software Engineering Stack Exchange: design-patterns tag](https://softwareengineering.stackexchange.com/questions/tagged/design-patterns), Stack Exchange. Gratuito. Discussões sobre quando um padrão cabe e quando é excesso de engenharia.

Lista completa e miniprojetos: [projects/design-patterns/README.pt-BR.md](projects/design-patterns/README.pt-BR.md)

## Arquitetura de software

Arquitetura de software é o conjunto das decisões caras de mudar: como um sistema é dividido em partes, para que lado apontam as dependências e quais atributos de qualidade (desempenho, disponibilidade, facilidade de mudança) são favorecidos. Arquiteturas em camadas, hexagonal e limpa, monólitos e microsserviços, eventos e CQRS são respostas à mesma pergunta: como manter as regras de negócio independentes dos detalhes ao redor.

- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), Robert C. Martin. Gratuito. O texto original com os círculos concêntricos e a regra de dependência.
- [Software Architecture Guide](https://martinfowler.com/architecture/), Martin Fowler. Gratuito. Índice de artigos sobre o que é arquitetura, fronteiras de aplicação, microsserviços e evolução.
- [Engenharia de Software Moderna, capítulo 7: Arquitetura](https://engsoftmoderna.info/cap7.html), Marco Tulio Valente, UFMG. Em português. Gratuito. Capítulo gratuito em português sobre camadas, MVC, microsserviços, filas de mensagens e publish/subscribe.
- [Clean Architecture](https://www.informit.com/store/clean-architecture-a-craftsmans-guide-to-software-structure-9780134494166), Robert C. Martin. Pago. O livro sobre entidades, casos de uso, adaptadores de interface e princípios de componentes.
- [Fundamentals of Software Architecture](https://fundamentalsofsoftwarearchitecture.com/), Mark Richards and Neal Ford. Pago. Panorama de estilos e características arquiteturais, com os prós e contras de cada estilo avaliados.
- [MIT 6.033 Computer System Engineering](https://ocw.mit.edu/courses/6-033-computer-system-engineering-spring-2018/), MIT OpenCourseWare. Gratuito. Aulas sobre modularidade, abstração, camadas e projeto de sistemas grandes, com artigos clássicos.
- [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/), Alistair Cockburn. Gratuito. O artigo original sobre portas e adaptadores, pelo próprio autor.
- [Microservices](https://martinfowler.com/articles/microservices.html), James Lewis and Martin Fowler (2014). Gratuito. O artigo que definiu o estilo e suas características, incluindo os custos.
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), Michael Nygard (2011). Gratuito. O texto curto que propôs os registros de decisão de arquitetura e seu formato.
- [Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/), Microsoft Azure Architecture Center. Gratuito. Catálogo de padrões de sistemas distribuídos com o problema, a solução e as considerações.
- [Visualising software architecture with the C4 model](https://www.youtube.com/watch?v=x2-rSnhpw0g), Simon Brown. Gratuito. Palestra sobre por que a maioria dos diagramas de arquitetura falha e como desenhar diagramas úteis.
- [Software Engineering Stack Exchange: architecture tag](https://softwareengineering.stackexchange.com/questions/tagged/architecture), Stack Exchange. Gratuito. Discussões de dilemas concretos de arquitetura.

Lista completa e miniprojetos: [projects/software-architecture/README.pt-BR.md](projects/software-architecture/README.pt-BR.md)

## Testes

Testes automatizados são como um time sabe que o software continua funcionando depois de cada mudança. O assunto cobre os níveis de teste (unidade, integração, ponta a ponta), as técnicas para escrevê-los (dublês de teste, desenvolvimento guiado por testes, testes baseados em propriedades e de mutação) e seus modos de falha, como testes instáveis e números de cobertura que não provam nada. Bons testes são o que torna seguras a refatoração e a entrega contínua.

- [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), Ham Vocke. Gratuito. Um longo exemplo resolvido de testes de unidade, integração, contrato e ponta a ponta em uma aplicação.
- [Engenharia de Software Moderna, capítulo 8: Testes](https://engsoftmoderna.info/cap8.html), Marco Tulio Valente, UFMG. Em português. Gratuito. Capítulo gratuito em português sobre a pirâmide, testes de unidade, mocks, TDD, cobertura e testes instáveis.
- [Test Desiderata](https://testdesiderata.com/), Kent Beck. Gratuito. Doze propriedades de um bom teste, cada uma com um vídeo curto, e as trocas entre elas.
- [Test-Driven Development: By Example](https://www.informit.com/store/test-driven-development-by-example-9780321146533), Kent Beck. Pago. A fonte do kata de dinheiro em várias moedas e do exemplo de xUnit refeito nesta área.
- [Software Engineering at Google: Testing Overview](https://abseil.io/resources/swe-book/html/ch11.html), Winters, Manshreck and Wright. Gratuito. Capítulos gratuitos sobre tamanhos de teste, testes de unidade, dublês e testes maiores, a partir de uma base de código enorme.
- [Unit Testing Principles, Practices, and Patterns](https://www.manning.com/books/unit-testing), Vladimir Khorikov. Pago. Define o que torna valioso um teste de unidade e quando mocks ajudam ou atrapalham.
- [MIT 6.031 Reading 3: Testing](https://web.mit.edu/6.031/www/sp22/classes/03-testing/), MIT. Gratuito. Leitura clara sobre a escolha de casos de teste particionando o espaço de entrada e cobrindo os limites.
- [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html), Martin Fowler. Gratuito. O artigo que separa os tipos de dublês de teste e os estilos clássico e mockista.
- [Flaky Tests at Google and How We Mitigate Them](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html), John Micco, Google Testing Blog. Gratuito. Números e causas da instabilidade em grande escala, e o que se faz a respeito.
- [Playwright documentation](https://playwright.dev/docs/intro), Microsoft. Gratuito. O guia oficial da ferramenta de ponta a ponta deste repositório: localizadores, espera automática e visualizador de traces.
- [TDD, Where Did It All Go Wrong](https://www.youtube.com/watch?v=EZ05e7EMOLM), Ian Cooper. Gratuito. Palestra sobre testar comportamento em vez de detalhes de implementação, voltando ao livro de Kent Beck.
- [Software Quality Assurance and Testing Stack Exchange](https://sqa.stackexchange.com/), Stack Exchange. Gratuito. Perguntas e respostas sobre projeto de testes, automação e estratégia.

Lista completa e miniprojetos: [projects/testing/README.pt-BR.md](projects/testing/README.pt-BR.md)

## Protocolos

Protocolos de aplicação são os acordos que permitem a programas escritos por pessoas diferentes conversarem entre si. Esta área acompanha o HTTP desde a semântica (métodos, códigos de status, cabeçalhos, cache, cookies), passando por seus três formatos de transmissão (HTTP/1.1, HTTP/2 e HTTP/3 sobre QUIC), pelo handshake TLS por baixo e pelos estilos de API construídos em cima: REST, GraphQL, JSON-RPC, gRPC, WebSocket e server-sent events.

- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP), Mozilla. Gratuito. O melhor ponto de partida: visão geral, mensagens, métodos, códigos de status, cabeçalhos, cache, cookies e CORS.
- [MDN: HTTP (em português)](https://developer.mozilla.org/pt-BR/docs/Web/HTTP), Mozilla. Em português. Gratuito. A tradução para o português do Brasil dos guias e da referência de HTTP da MDN.
- [HTTP/3 explained](https://http3-explained.haxx.se/), Daniel Stenberg. Gratuito. Livro curto e gratuito do autor do curl sobre por que o QUIC existe e como o HTTP/3 funciona.
- [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/), Michael Driscoll. Gratuito. Cada byte de um handshake TLS 1.3 real, anotado e explicado.
- [High Performance Browser Networking](https://hpbn.co/), Ilya Grigorik. Gratuito online, pago impresso. Gratuito online: TCP, TLS, HTTP/1.x, HTTP/2, WebSocket e server-sent events do ponto de vista de desempenho.
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham and Reschke, IETF. Gratuito. A definição atual de métodos, códigos de status, cabeçalhos e negociação de conteúdo para todas as versões do HTTP.
- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113), Thomson and Benfield, IETF. Gratuito. Quadros, streams, controle de fluxo e compressão de cabeçalhos no HTTP/2.
- [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114), Mike Bishop, IETF. Gratuito. Como a semântica do HTTP é mapeada sobre streams QUIC.
- [Architectural Styles and the Design of Network-based Software Architectures](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm), Roy Fielding (2000). Gratuito. A tese que definiu o REST e suas restrições.
- [GraphQL Specification](https://spec.graphql.org/), GraphQL Foundation. Gratuito. A definição oficial do sistema de tipos, das consultas, da validação e da execução.
- [Learn GraphQL](https://graphql.org/learn/), GraphQL Foundation. Gratuito. A introdução oficial a esquemas, consultas, mutações e boas práticas.
- [Stack Overflow: http tag](https://stackoverflow.com/questions/tagged/http), Stack Overflow. Gratuito. Respostas canônicas sobre códigos de status, cabeçalhos, cache e CORS.

Lista completa e miniprojetos: [projects/protocols/README.pt-BR.md](projects/protocols/README.pt-BR.md)

## Mensageria

A mensageria permite que serviços cooperem sem chamar uns aos outros diretamente: um lado publica uma mensagem e outro a processa depois. Filas, publish/subscribe e logs diferem em quem recebe uma mensagem, em que ordem e quantas vezes, e essas diferenças decidem se um sistema sobrevive a uma queda ou a um consumidor lento. Garantias de entrega, confirmações, retentativas, filas de mensagens mortas e consumidores idempotentes são o centro do assunto.

- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials), RabbitMQ. Gratuito. Seis tutoriais curtos, em várias linguagens, de uma fila simples a roteamento, tópicos e RPC.
- [Apache Kafka: Introduction](https://kafka.apache.org/intro), Apache Software Foundation. Gratuito. A visão geral oficial de eventos, tópicos, partições, produtores e consumidores.
- [The Log: What every software engineer should know about real-time data's unifying abstraction](https://www.linkedin.com/blog/engineering/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying), Jay Kreps, LinkedIn. Gratuito. O ensaio que explica o log somente de acréscimo como a ideia por trás do Kafka e do processamento de streams.
- [Enterprise Integration Patterns: Messaging Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/), Gregor Hohpe and Bobby Woolf. Gratuito online, pago impresso. O resumo online gratuito dos 65 padrões do livro: canais, roteadores, canal de mensagens mortas, receptor idempotente.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Pago. O capítulo sobre processamento de streams compara brokers de mensagens com logs e explica a semântica de entrega.
- [The Optimal RabbitMQ Guide](https://www.cloudamqp.com/rabbitmq-ebook/), CloudAMQP. Gratuito. E-book gratuito sobre exchanges, filas, bindings e boas práticas, uma das fontes do quiz.
- [AMQP 0-9-1 Model Explained](https://www.rabbitmq.com/tutorials/amqp-concepts), RabbitMQ. Gratuito. O modelo do protocolo em linguagem simples: exchanges, filas, bindings, confirmações e prefetch.
- [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/), Tyler Treat. Gratuito. Texto curto sobre por que a entrega é no máximo uma vez ou pelo menos uma vez, e o que a idempotência compra.
- [RabbitMQ documentation](https://www.rabbitmq.com/docs), RabbitMQ. Gratuito. Guias sobre filas, confirmações de consumidores, confirmações de publicação e dead-letter exchanges.
- [Apache Kafka documentation](https://kafka.apache.org/documentation/), Apache Software Foundation. Gratuito. A seção de projeto explica o log, a replicação, os grupos de consumidores, os offsets e as garantias de entrega.
- [BullMQ documentation](https://docs.bullmq.io/), Taskforce.sh. Gratuito. Filas de jobs sobre Redis: workers, retentativas com backoff, limitação de taxa e fluxos.
- [Stack Overflow: rabbitmq tag](https://stackoverflow.com/questions/tagged/rabbitmq), Stack Overflow. Gratuito. Perguntas respondidas sobre exchanges, confirmações e reentrega.

Lista completa e miniprojetos: [projects/messaging/README.pt-BR.md](projects/messaging/README.pt-BR.md)

## Balanceamento de carga

Um balanceador de carga distribui requisições entre vários servidores para que um serviço aguente mais tráfego do que uma máquina e sobreviva à perda de uma delas. O tema cobre onde o balanceamento acontece (camada de transporte ou de aplicação), como um servidor é escolhido (round robin, menos conexões, hashing), como servidores mortos são detectados e evitados, e os papéis relacionados de proxy reverso, terminação TLS e gateway de API.

- [Load Balancing](https://samwho.dev/load-balancing/), Sam Rose. Gratuito. Ensaio visual interativo que mostra round robin, menos conexões e seu efeito na latência.
- [What is load balancing?](https://www.cloudflare.com/learning/performance/what-is-load-balancing/), Cloudflare Learning Center. Gratuito. Definição curta e direta com os algoritmos comuns e a ideia de health checks.
- [Using nginx as HTTP load balancer](https://nginx.org/en/docs/http/load_balancing.html), NGINX. Gratuito. A introdução oficial: um bloco upstream, os métodos de balanceamento, pesos e health checks passivos.
- [Site Reliability Engineering: Load Balancing at the Frontend](https://sre.google/sre-book/load-balancing-frontend/), Google. Gratuito. Como o tráfego chega a um datacenter: DNS, IPs virtuais e hashing consistente no nível de rede.
- [Site Reliability Engineering: Load Balancing in the Datacenter](https://sre.google/sre-book/load-balancing-datacenter/), Google. Gratuito. Por que políticas simples falham em escala, com subconjuntos e round robin ponderado.
- [Consistent Hashing and Random Trees](https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf), Karger and others (1997). Gratuito. O artigo que apresentou o hashing consistente, para que acrescentar um servidor mova poucas chaves.
- [Maglev: A Fast and Reliable Software Network Load Balancer](https://research.google/pubs/maglev-a-fast-and-reliable-software-network-load-balancer/), Eisenbud and others, Google (2016). Gratuito. Como um balanceador de camada 4 é construído com servidores comuns, com seu próprio hashing consistente.
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), Jeffrey Dean and Luiz André Barroso (2013). Gratuito. Por que as requisições mais lentas dominam sistemas grandes e como requisições redundantes e balanceamento as reduzem.
- [nginx: ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html), NGINX. Gratuito. A referência de cada diretiva: least_conn, ip_hash, hash, max_fails, fail_timeout, keepalive.
- [Caddy: reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), Caddy project. Gratuito. Políticas de balanceamento, health checks ativos e passivos e retentativas no Caddyfile.
- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Gratuito. Vídeos sobre balanceamento de camada 4 e de camada 7, proxies, NGINX e HAProxy.
- [Server Fault: load-balancing tag](https://serverfault.com/questions/tagged/load-balancing), Stack Exchange. Gratuito. Dúvidas operacionais respondidas por administradores de sistemas.

Lista completa e miniprojetos: [projects/load-balancing/README.pt-BR.md](projects/load-balancing/README.pt-BR.md)

## Performance

Engenharia de desempenho é medir antes de mudar: definir o que significa rápido (percentis de latência, vazão), produzir uma carga realista, descobrir para onde vai o tempo com um profiler e só então otimizar. Ela liga várias camadas, dos caches de CPU e da localidade de memória ao comportamento do runtime, às consultas ao banco e à capacidade de um serviço inteiro, e depende de um método sólido de benchmark para não se enganar.

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/), Grafana Labs. Gratuito. O guia oficial de usuários virtuais, estágios, limiares e checks, com uma página para cada tipo de teste.
- [The USE Method](https://www.brendangregg.com/usemethod.html), Brendan Gregg. Gratuito. Um roteiro para qualquer recurso: utilização, saturação e erros, um primeiro método para achar gargalos.
- [How NOT to Measure Latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU), Gil Tene. Gratuito. A palestra sobre percentis, por que médias escondem o problema e o erro da omissão coordenada.
- [Systems Performance, 2nd edition](https://www.brendangregg.com/systems-performance-2nd-edition-book.html), Brendan Gregg. Pago. A referência em metodologia e em análise de CPU, memória, sistema de arquivos, disco e rede no Linux.
- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Gratuito. Livro online gratuito sobre caches de CPU, disposição de memória, SIMD e benchmarks, com multiplicação de matrizes como caso.
- [Performance Analysis and Tuning on Modern CPUs](https://github.com/dendibakh/perf-book), Denis Bakhvalov. Gratuito. Livro gratuito sobre medição com contadores de hardware, profiling e correção de faltas de cache e erros de predição de desvio.
- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare. Gratuito. Começa acelerando a multiplicação de matrizes passo a passo e depois cobre medição e caches.
- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html), Brendan Gregg. Gratuito. A página do autor sobre como os flame graphs são construídos e lidos, com links para seu artigo e suas palestras.
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), PostgreSQL Global Development Group. Gratuito. Como ler um plano de consulta e achar um índice que falta.
- [Performance Matters](https://www.youtube.com/watch?v=r-TLSBdHe1A), Emery Berger, Strange Loop. Gratuito. Palestra sobre por que benchmarks ingênuos enganam e como medir e fazer profiling com solidez.
- [hyperfine](https://github.com/sharkdp/hyperfine), David Peter. Gratuito. A ferramenta de benchmark deste repositório: execuções de aquecimento, repetições e resumo estatístico.
- [Stack Overflow: performance tag](https://stackoverflow.com/questions/tagged/performance), Stack Overflow. Gratuito. Respostas canônicas famosas sobre predição de desvios, efeitos de cache e medição.

Lista completa e miniprojetos: [projects/performance/README.pt-BR.md](projects/performance/README.pt-BR.md)

## Cache

Um cache guarda uma cópia de algo caro de calcular ou de buscar, para que a próxima requisição seja atendida mais rápido. Há caches em todos os níveis (navegador, CDN, aplicação, banco de dados, CPU), e todos levantam as mesmas perguntas: o que guardar, quando descartar, como saber que está desatualizado e o que acontece quando muitos clientes erram ao mesmo tempo. Errar nessas respostas troca um sistema lento por um incorreto.

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), Mozilla. Gratuito. O guia mais claro sobre caches privados e compartilhados, validade, validação e as diretivas de Cache-Control.
- [Caching Best Practices](https://aws.amazon.com/caching/best-practices/), Amazon Web Services. Gratuito. Visão geral curta de carga preguiçosa, write-through, tempo de vida e descarte.
- [Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), Microsoft Azure Architecture Center. Gratuito. O padrão de aplicação mais comum descrito com seus problemas de consistência e quando usá-lo.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Pago. Trata caches como dados derivados e explica os problemas de consistência de manter duas cópias.
- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111), Fielding, Nottingham and Reschke, IETF. Gratuito. A especificação de validade, validação, invalidação e de cada diretiva de cache.
- [Scaling Memcache at Facebook](https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala), Nishtala and others (2013). Gratuito. Como uma camada de cache muito grande lida com gravações obsoletas, manadas e consistência entre regiões.
- [Optimal Probabilistic Cache Stampede Prevention](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf), Vattani, Chierichetti and Lowenstein (2015). Gratuito. O artigo por trás da expiração antecipada probabilística, uma correção simples para o stampede.
- [Redis documentation](https://redis.io/docs/latest/), Redis. Gratuito. A referência oficial de tipos de dados, comandos, expiração e cache no cliente.
- [Redis: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/), Redis. Gratuito. Como funcionam as políticas de maxmemory e como o Redis aproxima LRU e LFU.
- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Gratuito. Vídeos curtos e animados sobre estratégias de cache, descarte e os modos clássicos de falha de cache.
- [Stack Overflow: caching tag](https://stackoverflow.com/questions/tagged/caching), Stack Overflow. Gratuito. Perguntas respondidas sobre invalidação, cabeçalhos e projeto de cache.

Lista completa e miniprojetos: [projects/cache/README.pt-BR.md](projects/cache/README.pt-BR.md)

## Limitação de taxa

A limitação de taxa restringe quantas requisições um cliente pode fazer em um período, para proteger um serviço de sobrecarga, abuso e uso injusto. Os algoritmos (janela fixa, janela deslizante, token bucket, leaky bucket) diferem em como tratam rajadas e em quanto estado exigem, e executá-los em vários servidores levanta questões de atomicidade. A outra metade do assunto é o cliente: o status 429, os cabeçalhos de retentativa e o backoff.

- [Visualizing algorithms for rate limiting](https://smudge.ai/blog/ratelimit-algorithms), smudge.ai. Gratuito. Demonstrações interativas de janela fixa, janela deslizante e token bucket, lado a lado.
- [Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters), Paul Tarjan, Stripe. Gratuito. Os quatro tipos de limitador que uma API de pagamentos roda em produção, e por que cada um existe.
- [What is rate limiting?](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/), Cloudflare Learning Center. Gratuito. Definição curta e direta da ideia e do que ela protege.
- [Site Reliability Engineering: Handling Overload](https://sre.google/sre-book/handling-overload/), Google. Gratuito. Limites por cliente, limitação no lado do cliente e degradação graciosa em um serviço grande.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. Pago. A fonte do quiz para a modelagem de tráfego com leaky bucket e token bucket.
- [RFC 6585: Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585), Fielding and Nottingham, IETF. Gratuito. A definição de 429 Too Many Requests e de seu uso com Retry-After.
- [Token bucket](https://en.wikipedia.org/wiki/Token_bucket), Wikipedia. Gratuito. O algoritmo, seus parâmetros, a fórmula do tamanho de rajada e a relação com o leaky bucket.
- [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/), Marc Brooker, AWS Architecture Blog. Gratuito. Simulações que mostram por que clientes que tentam de novo precisam de aleatoriedade, não só de esperas crescentes.
- [nginx: ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html), NGINX. Gratuito. A referência do limitador leaky bucket do NGINX: rate, burst, nodelay e delay.
- [Redis: INCR](https://redis.io/docs/latest/commands/incr/), Redis. Gratuito. A página do comando inclui os padrões clássicos de limitador de taxa e a corrida que precisam evitar.
- [Redis: Scripting with Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/), Redis. Gratuito. Como tornar atômica no servidor a lógica de ler e depois escrever, a base dos limitadores distribuídos.
- [Stack Overflow: rate-limiting tag](https://stackoverflow.com/questions/tagged/rate-limiting), Stack Overflow. Gratuito. Perguntas respondidas sobre implementação e configuração de limitadores.

Lista completa e miniprojetos: [projects/rate-limiting/README.pt-BR.md](projects/rate-limiting/README.pt-BR.md)

## Sistemas de arquivos

Um sistema de arquivos transforma um dispositivo de blocos bruto em arquivos e diretórios com nome que sobrevivem a uma queda de energia. Abaixo da interface conhecida estão os métodos de alocação, os i-nodes, a gerência de espaço livre e o journaling, e acima dela estão as organizações de arquivo que os bancos de dados usam: registros, índices, árvores B e ordenação externa para dados que não cabem na memória. As duas metades são moldadas por um fato: o armazenamento é lento, então o que conta é o número de acessos.

- [Operating Systems: Three Easy Pieces (Persistence part)](https://pages.cs.wisc.edu/~remzi/OSTEP/), Remzi and Andrea Arpaci-Dusseau. Gratuito online, pago impresso. Capítulos gratuitos sobre discos, RAID, arquivos e diretórios, implementação de sistemas de arquivos, journaling e flash.
- [Sistemas Operacionais: Conceitos e Mecanismos](https://wiki.inf.ufpr.br/maziero/doku.php?id=socm:start), Carlos Maziero, UFPR. Em português. Gratuito. O livro-texto gratuito em português tem uma parte inteira sobre arquivos, diretórios e alocação.
- [Files are hard](https://danluu.com/file-consistency/), Dan Luu. Gratuito. Um panorama de como é difícil gravar um arquivo com segurança, com as pesquisas que acharam os bugs.
- [Modern Operating Systems, 5th edition](https://www.pearson.com/en-us/subject-catalog/p/modern-operating-systems/P200000003295), Andrew S. Tanenbaum and Herbert Bos. Pago. A fonte do quiz para arquivos, diretórios, alocação, espaço livre e journaling.
- [Database Internals](https://www.databass.dev/), Alex Petrov. Pago. A primeira metade trata de estruturas em disco: formatos de arquivo, variantes de árvore B e armazenamento em log.
- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. As aulas sobre armazenamento, árvores B+ e merge sort externo correspondem à segunda metade desta área.
- [MIT 6.1810 Operating System Engineering](https://pdos.csail.mit.edu/6.1810/), MIT PDOS. Gratuito. Laboratórios sobre o sistema de arquivos do xv6: i-nodes, diretórios, cache de buffers e log.
- [A Fast File System for UNIX](https://dsf.berkeley.edu/cs262/FFS.pdf), McKusick, Joy, Leffler and Fabry (1984). Gratuito. O artigo que apresentou os grupos de cilindros e as políticas de disposição, o ancestral do ext2 ao ext4.
- [The Ubiquitous B-Tree](https://carlosproal.com/ir/papers/p121-comer.pdf), Douglas Comer (1979). Gratuito. O panorama clássico das árvores B e B+ e de por que elas se ajustam a discos.
- [ext4 Data Structures and Algorithms](https://docs.kernel.org/filesystems/ext4/), kernel.org. Gratuito. A disposição em disco de um sistema de arquivos de produção: grupos de blocos, i-nodes, extents e o journal.
- [SQLite Database File Format](https://www.sqlite.org/fileformat2.html), SQLite. Gratuito. Descrição completa e legível de como tabelas e índices são guardados como páginas de árvore B em um arquivo.
- [Unix and Linux Stack Exchange: filesystems tag](https://unix.stackexchange.com/questions/tagged/filesystems), Stack Exchange. Gratuito. Perguntas respondidas sobre i-nodes, links, journaling e comportamento de sistemas de arquivos.

Lista completa e miniprojetos: [projects/file-systems/README.pt-BR.md](projects/file-systems/README.pt-BR.md)

## Observabilidade

Observabilidade é a capacidade de entender o que um sistema em execução está fazendo a partir dos dados que ele emite. Logs, métricas e traces respondem a perguntas diferentes, e juntos permitem explicar uma requisição lenta entre vários serviços sem adivinhar. O assunto também cobre o que medir (indicadores de nível de serviço), o que prometer (objetivos e orçamentos de erro) e quando acordar uma pessoa (alertas).

- [Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/), OpenTelemetry. Gratuito. Introdução curta ao vocabulário: telemetria, confiabilidade, logs, spans e traces distribuídos.
- [Site Reliability Engineering: Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/), Google. Gratuito. O capítulo com os quatro sinais de ouro e a diferença entre sintomas e causas.
- [Metrics, tracing, and logging](https://peter.bourgon.org/blog/2017/02/21/metrics-tracing-and-logging.html), Peter Bourgon. Gratuito. Diagrama e texto de uma página que separam os três sinais pelo que cada um faz bem.
- [Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/), Beyer, Jones, Petoff and Murphy (editors), Google. Gratuito. Gratuito online: objetivos de nível de serviço, orçamentos de erro, monitoramento e alertas como praticados no Google.
- [The Site Reliability Workbook](https://sre.google/workbook/table-of-contents/), Beyer, Murphy, Rensin, Kawahara and Thorne (editors), Google. Gratuito. A continuação prática, com exemplos resolvidos de implementação de SLOs e de alertas sobre eles.
- [Dapper, a Large-Scale Distributed Systems Tracing Infrastructure](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/), Sigelman and others, Google (2010). Gratuito. O artigo que definiu traces, spans e amostragem, o modelo por trás de todo sistema de tracing.
- [Trace Context](https://w3c.github.io/trace-context/), W3C. Gratuito. Os cabeçalhos padrão traceparent e tracestate que levam um trace entre serviços.
- [The Site Reliability Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/), Google. Gratuito. Seis formas de alertar sobre um objetivo, terminando em alertas de múltiplas janelas e taxas de queima.
- [OpenTelemetry documentation](https://opentelemetry.io/docs/), OpenTelemetry. Gratuito. Conceitos, SDKs por linguagem, o Collector e as convenções semânticas.
- [Prometheus documentation](https://prometheus.io/docs/introduction/overview/), Prometheus Authors. Gratuito. O modelo de dados, os tipos de métrica, PromQL, regras de alerta e boas práticas de instrumentação.
- [OpenTelemetry Demo](https://opentelemetry.io/docs/demo/), OpenTelemetry. Gratuito. Uma loja completa de microsserviços instrumentada com traces, métricas e logs, para rodar localmente.
- [Observability Engineering, 2nd edition](https://www.honeycomb.io/observability-engineering-oreilly-book), Charity Majors, Liz Fong-Jones, George Miranda and Austin Parker. Gratuito. O livro que o quiz segue (na primeira edição), oferecido como e-book gratuito pela Honeycomb mediante cadastro.

Lista completa e miniprojetos: [projects/observability/README.pt-BR.md](projects/observability/README.pt-BR.md)

## Blockchain

Uma blockchain é um livro-razão sobre o qual muitas partes que não confiam umas nas outras conseguem concordar sem uma autoridade central. Ela combina ideias estudadas em outras partes deste repositório: funções hash e árvores de Merkle tornam o histórico evidente contra adulteração, assinaturas digitais provam quem pode gastar, e a prova de trabalho transforma o acordo em uma questão de esforço computacional. Estudá-la como estrutura de dados e protocolo separa a engenharia do exagero.

- [But how does bitcoin actually work?](https://www.youtube.com/watch?v=bBC-nXj3Ng4), Grant Sanderson, 3Blue1Brown. Gratuito. Constrói a ideia passo a passo: um livro-razão público, assinaturas, hashes, blocos e prova de trabalho.
- [Blockchain Demo](https://andersbrownworth.com/blockchain/), Anders Brownworth. Gratuito. Página interativa em que você altera um bloco e vê os hashes da cadeia se quebrarem.
- [Learn Me A Bitcoin](https://learnmeabitcoin.com/), Greg Walker. Gratuito. Guia técnico direto com diagramas e ferramentas para chaves, transações, blocos e mineração.
- [Bitcoin and Cryptocurrency Technologies](https://bitcoinbook.cs.princeton.edu/), Narayanan, Bonneau, Felten, Miller and Goldfeder, Princeton. Gratuito online, pago impresso. Livro-texto universitário com rascunho gratuito online: criptografia, consenso, mineração e alternativas.
- [Mastering Bitcoin, 3rd edition](https://github.com/bitcoinbook/bitcoinbook), Andreas Antonopoulos and David Harding. Gratuito online, pago impresso. O livro técnico detalhado, com o texto completo aberto no GitHub: chaves, transações, a rede e mineração.
- [Bitcoin and Cryptocurrency Technologies](https://www.coursera.org/learn/cryptocurrency), Princeton University (Coursera). Gratuito como ouvinte, certificado pago. O curso em vídeo do livro-texto de Princeton.
- [MIT 15.S12 Blockchain and Money](https://ocw.mit.edu/courses/15-s12-blockchain-and-money-fall-2018/), Gary Gensler, MIT OpenCourseWare. Gratuito. Aulas que cobrem a tecnologia e depois avaliam com sobriedade onde ela é e onde não é útil.
- [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf), Satoshi Nakamoto (2008). Gratuito. O artigo de nove páginas que o quiz segue: transações, servidor de carimbo de tempo, prova de trabalho e incentivos.
- [Bitcoin: Um Sistema de Dinheiro Eletrônico Peer-to-Peer](https://bitcoin.org/files/bitcoin-paper/bitcoin_pt_br.pdf), Satoshi Nakamoto, tradução para o português. Em português. Gratuito. A tradução do artigo para o português do Brasil, hospedada em bitcoin.org.
- [Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/), Bitcoin.org developer documentation. Gratuito. A cadeia de blocos, transações, contratos, carteiras e a rede ponto a ponto, com referências.
- [Naivecoin: a tutorial for building a cryptocurrency](https://lhartikk.github.io/), Lauri Hartikka. Gratuito. Tutorial em TypeScript que faz uma cadeia mínima crescer até ter prova de trabalho e transações.
- [Bitcoin Stack Exchange](https://bitcoin.stackexchange.com/), Stack Exchange. Gratuito. Dúvidas técnicas respondidas por desenvolvedores do protocolo.

Lista completa e miniprojetos: [projects/blockchain/README.pt-BR.md](projects/blockchain/README.pt-BR.md)

## Integração contínua

Integração contínua significa integrar mudanças pequenas com frequência e deixar um pipeline automatizado compilar, analisar e testar cada uma, para que os problemas sejam achados minutos depois de introduzidos. Em torno dessa ideia ficam as práticas que este próprio repositório usa: workflows no GitHub Actions, cache e artefatos, segredos e permissões, barreiras de qualidade, estratégias de implantação, versionamento semântico e um changelog.

- [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html), Martin Fowler. Gratuito. O artigo de referência sobre a prática: uma linha principal, builds que se testam, retorno rápido, correção imediata.
- [Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions), GitHub. Gratuito. A introdução oficial a workflows, eventos, jobs, steps, actions e runners.
- [Engenharia de Software Moderna, capítulo 10: DevOps](https://engsoftmoderna.info/cap10.html), Marco Tulio Valente, UFMG. Em português. Gratuito. Capítulo gratuito em português sobre controle de versões, integração contínua, implantação e feature flags.
- [Continuous Delivery](https://continuousdelivery.com/), Jez Humble and David Farley. Gratuito online, pago impresso. O site do livro resume seus princípios: o pipeline de implantação, automação e lotes pequenos.
- [Software Engineering at Google: Continuous Integration](https://abseil.io/resources/swe-book/html/ch23.html), Winters, Manshreck and Wright. Gratuito. Capítulo gratuito sobre ciclos rápidos de retorno, testes antes e depois da submissão e instabilidade.
- [Semantic Versioning 2.0.0](https://semver.org/), Tom Preston-Werner. Gratuito. A especificação dos números de versão usada por este repositório, também disponível em português.
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), Conventional Commits contributors. Gratuito. A convenção de mensagens de commit que permite a ferramentas derivar versões e changelogs.
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), Olivier Lacan. Gratuito. O formato de changelog deste repositório e os motivos por trás dele.
- [GitHub Actions documentation](https://docs.github.com/en/actions), GitHub. Gratuito. A referência completa: sintaxe de workflow, contextos, cache, artefatos, matrizes e workflows reutilizáveis.
- [Secure use reference for GitHub Actions](https://docs.github.com/en/actions/reference/security/secure-use), GitHub. Gratuito. Orientação oficial de endurecimento: tokens com privilégio mínimo, fixação de actions e tratamento de entrada não confiável.
- [Modern Software Engineering](https://www.youtube.com/@ModernSoftwareEngineeringYT), Dave Farley. Gratuito. Vídeos semanais do coautor do livro Continuous Delivery sobre pipelines, desenvolvimento na linha principal e testes.
- [GitHub Community: Actions](https://github.com/orgs/community/discussions/categories/actions), GitHub. Gratuito. O fórum oficial para dúvidas sobre workflows e runners.

Lista completa e miniprojetos: [projects/continuous-integration/README.pt-BR.md](projects/continuous-integration/README.pt-BR.md)

## Engenharia de software

Engenharia de software é tudo o que está em volta do código e decide se um projeto dá certo: entender o que construir, organizar o trabalho, modelar e projetar, manter a qualidade, estimar e evoluir o sistema por anos. Seus textos clássicos, de Brooks aos movimentos ágil e lean, tratam principalmente de pessoas e de escolhas, e explicam por que acrescentar programadores a um projeto atrasado o atrasa mais.

Área só de teoria: não tem miniprojeto, então a lista completa está aqui.

### Comece por aqui

- [Engenharia de Software Moderna](https://engsoftmoderna.info/), Marco Tulio Valente, UFMG. Em português. Gratuito. Livro-texto completo em português, gratuito online: processos, requisitos, modelos, projeto, testes, refatoração e DevOps.
- [Software Engineering at Google](https://abseil.io/resources/swe-book), Titus Winters, Tom Manshreck and Hyrum Wright. Gratuito. Gratuito online: como cultura, processos e ferramentas mantêm uma base de código saudável ao longo do tempo.
- [Manifesto para Desenvolvimento Ágil de Software](https://agilemanifesto.org/iso/ptbr/manifesto.html), Beck and others (2001). Em português. Gratuito. Os quatro valores do Manifesto Ágil em português, com link para seus doze princípios.

### Livros

- [Software Engineering, 10th edition](https://software-engineering-book.com/), Ian Sommerville. Pago. O livro-texto que o quiz segue (na 9ª edição); o site do autor tem slides, vídeos e estudos de caso.
- [The Mythical Man-Month, anniversary edition](https://www.informit.com/store/mythical-man-month-essays-on-software-engineering-anniversary-9780201835953), Frederick P. Brooks Jr.. Pago. Os ensaios clássicos sobre por que projetos grandes atrasam, com "No Silver Bullet" incluído.
- [Clean Code](https://www.informit.com/store/clean-code-a-handbook-of-agile-software-craftsmanship-9780132350884), Robert C. Martin. Pago. Uma fonte do quiz para nomes, funções, comentários e qualidade de código em pequena escala.
- [Code Simplicity](https://www.codesimplicity.com/), Max Kanat-Alexander. Gratuito online, pago impresso. O site do autor, com os ensaios por trás do livro curto sobre simplicidade e o custo da mudança.
- [The Lean Startup](https://theleanstartup.com/), Eric Ries. Pago. O site do livro resume o ciclo construir, medir, aprender e o produto mínimo viável.
- [The Pragmatic Programmer, 20th anniversary edition](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/), David Thomas and Andrew Hunt. Pago. Hábitos práticos de quem desenvolve, de DRY e ortogonalidade a estimativas.
- [Guide to the Software Engineering Body of Knowledge (SWEBOK)](https://www.computer.org/education/bodies-of-knowledge/software-engineering), IEEE Computer Society. Gratuito. O mapa das áreas de conhecimento feito pela própria profissão, com download gratuito.

### Cursos e aulas

- [MIT 6.031 Software Construction](https://web.mit.edu/6.031/www/sp22/), MIT. Gratuito. Leituras públicas sobre escrever código protegido contra bugs, fácil de entender e pronto para mudar.
- [UNIVESP on YouTube](https://www.youtube.com/@univesptv), Universidade Virtual do Estado de São Paulo. Em português. Gratuito. Tem disciplinas completas em português de engenharia de software e gestão de projetos.

### Artigos e especificações

- [No Silver Bullet: Essence and Accident in Software Engineering](https://www.cs.unc.edu/techreports/86-020.pdf), Frederick P. Brooks Jr. (1986). Gratuito. O ensaio que separa a complexidade essencial da acidental, como relatório técnico da universidade do autor.
- [The WyCash Portfolio Management System](https://c2.com/doc/oopsla92.html), Ward Cunningham (1992). Gratuito. O relato de experiência em que apareceu pela primeira vez a metáfora da dívida para projeto inacabado.
- [TechnicalDebtQuadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html), Martin Fowler. Gratuito. Nota curta que classifica a dívida técnica como deliberada ou inadvertida, prudente ou imprudente.
- [The Scrum Guide](https://scrumguides.org/), Ken Schwaber and Jeff Sutherland. Gratuito. A definição oficial e curta do Scrum, com tradução para o português disponível no site.
- [Unified Modeling Language specification](https://www.omg.org/spec/UML/), Object Management Group. Gratuito. O padrão que define os diagramas de classes, de sequência, de estados e de casos de uso.
- [Therac-25](https://en.wikipedia.org/wiki/Therac-25), Wikipedia. Gratuito. Resumo da máquina de radioterapia cujas falhas de software mataram pacientes, com as referências à investigação de Leveson e Turner.

### Vídeos

- [Agile is Dead](https://www.youtube.com/watch?v=a-BOSpxYJ9M), Dave Thomas, GOTO. Gratuito. Um signatário do manifesto sobre a diferença entre os valores ágeis e a indústria ao redor deles.
- [Código Fonte TV](https://www.youtube.com/@codigofontetv), Gabriel Fróes and Vanessa Weber. Em português. Gratuito. Vídeos curtos em português explicando Scrum, Kanban, requisitos, dívida técnica e outros termos.

### Prática e ferramentas

- [PlantUML](https://plantuml.com/), PlantUML. Gratuito. Desenha diagramas UML a partir de texto, bom para praticar a notação.
- [Mermaid](https://mermaid.js.org/), Mermaid. Gratuito. Diagramas em texto que são renderizados direto no Markdown do GitHub.

### Comunidades

- [Software Engineering Stack Exchange](https://softwareengineering.stackexchange.com/), Stack Exchange. Gratuito. Perguntas e respostas sobre processo, projeto, requisitos e prática profissional.
- [r/ExperiencedDevs](https://www.reddit.com/r/ExperiencedDevs/), Reddit. Gratuito. Discussão entre profissionais sobre processo, equipes e escolhas.

## Inteligência artificial e LLMs

A inteligência artificial moderna é aprendizado de máquina em escala: modelos com muitos números ajustáveis que são treinados com dados em vez de programados à mão. Esta área vai da matemática por baixo (probabilidade, álgebra linear, descida de gradiente e retropropagação) às peças de um grande modelo de linguagem (tokens, embeddings, atenção, previsão do próximo token) e dos geradores de imagem (difusão), e aos seus limites e custos.

- [Neural networks](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi), Grant Sanderson, 3Blue1Brown. Gratuito. A melhor introdução visual: o que é uma rede, descida de gradiente, retropropagação e depois transformers e atenção.
- [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html), Andrej Karpathy. Gratuito. Curso em vídeo que programa tudo do zero: um motor de autograd, um modelo de caracteres e depois um GPT.
- [Deep Learning Book](https://www.deeplearningbook.com.br/), Data Science Academy. Em português. Gratuito. Livro online gratuito em português com muitos capítulos curtos, do perceptron aos transformers.
- [Deep Learning](https://www.deeplearningbook.org/), Ian Goodfellow, Yoshua Bengio and Aaron Courville. Gratuito online, pago impresso. O livro-texto de referência, de leitura online gratuita: a matemática, otimização, regularização e as principais arquiteturas.
- [Dive into Deep Learning](https://d2l.ai/), Zhang, Lipton, Li and Smola. Gratuito. Livro interativo gratuito em que cada conceito vem com código executável, incluindo atenção e transformers.
- [Speech and Language Processing, 3rd edition draft](https://web.stanford.edu/~jurafsky/slp3/), Dan Jurafsky and James Martin. Gratuito. O rascunho gratuito do livro-texto de processamento de linguagem: n-gramas, embeddings, transformers e grandes modelos de linguagem.
- [CS224N Natural Language Processing with Deep Learning](https://web.stanford.edu/class/cs224n/), Stanford University. Gratuito. Slides, notas e trabalhos sobre vetores de palavras, atenção, transformers, pré-treinamento e modelos grandes.
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762), Vaswani and others (2017). Gratuito. O artigo que apresentou o transformer, a arquitetura dos modelos de linguagem de hoje.
- [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239), Ho, Jain and Abbeel (2020). Gratuito. O artigo que tornou os modelos de difusão viáveis para geração de imagens.
- [Let's build GPT: from scratch, in code, spelled out](https://www.youtube.com/watch?v=kCc8FmEb1nY), Andrej Karpathy. Gratuito. Duas horas que vão de um modelo de bigramas a um transformer funcional, linha por linha.
- [micrograd](https://github.com/karpathy/micrograd), Andrej Karpathy. Gratuito. Um motor de autograd e uma biblioteca de redes neurais minúsculos, curtos o bastante para ler de uma vez.
- [Transformer Explainer](https://poloclub.github.io/transformer-explainer/), Polo Club of Data Science, Georgia Tech. Gratuito. Um GPT pequeno rodando no navegador, com cada passo dos tokens às probabilidades do próximo token visível.

Lista completa e miniprojetos: [projects/artificial-intelligence/README.pt-BR.md](projects/artificial-intelligence/README.pt-BR.md)
