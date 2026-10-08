# Paralelismo

> English version: [README.md](README.md)

Paralelismo é executar computações ao mesmo tempo em vários núcleos, faixas vetoriais ou máquinas para terminar mais cedo. Os processadores pararam de ficar mais rápidos um núcleo por vez, então a velocidade hoje vem de dividir bem o trabalho. A lei de Amdahl, o falso compartilhamento e a largura de banda de memória explicam por que dobrar os núcleos raramente dobra a velocidade, e como chegar mais perto disso.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Escalabilidade por núcleos](scaling-by-cores/) | Quanto um programa acelera com mais núcleos, e por que não linearmente | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/parallelism/](../../quiz/content/parallelism/)
- Documentação: [docs/pt/parallelism/](../../docs/pt/parallelism/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Introduction to Parallel Computing Tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial), Lawrence Livermore National Laboratory. Gratuito. Tutorial longo e direto sobre os conceitos: arquiteturas de memória, modelos de programação, speed-up e seus limites.
- [Concurrency is not parallelism](https://go.dev/blog/waza-talk), Rob Pike, The Go Blog. Gratuito. Esclarece a diferença entre estruturar um programa de forma concorrente e executá-lo em paralelo.
- [Amdahl's law](https://en.wikipedia.org/wiki/Amdahl%27s_law), Wikipedia. Gratuito. A fórmula, sua dedução e a relação com a lei de Gustafson, com o gráfico de sempre.

### Livros

- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Gratuito. Livro online gratuito sobre caches de CPU, SIMD, predição de desvios e como medi-los.
- [Is Parallel Programming Hard, And, If So, What Can You Do About It?](https://mirrors.edge.kernel.org/pub/linux/kernel/people/paulmck/perfbook/perfbook.html), Paul E. McKenney. Gratuito. Livro gratuito de um desenvolvedor do kernel Linux sobre contagem, travas, particionamento e escalabilidade.
- [An Introduction to Parallel Programming, 2nd edition](https://shop.elsevier.com/books/an-introduction-to-parallel-programming/pacheco/978-0-12-804605-0), Peter Pacheco and Matthew Malensek. Pago. Um primeiro livro-texto de programação com memória compartilhada e distribuída usando Pthreads, OpenMP e MPI.

### Cursos e aulas

- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare, Charles Leiserson and Julian Shun. Gratuito. Aulas sobre programação multicore, corridas, work stealing, algoritmos eficientes em cache e medição.
- [CS 149 Parallel Computing](https://gfxcourses.stanford.edu/cs149/fall23), Stanford University, Kayvon Fatahalian and Kunle Olukotun. Gratuito. Slides sobre paralelismo de tarefas e de dados, SIMD, GPUs, escalonamento e análise de desempenho.
- [CMU 15-418 Parallel Computer Architecture and Programming](https://www.cs.cmu.edu/afs/cs/academic/class/15418-s18/www/), Carnegie Mellon University. Gratuito. O curso que liga cada abstração ao hardware abaixo dela, com slides das aulas online.

### Artigos e especificações

- [MapReduce: Simplified Data Processing on Large Clusters](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/), Jeffrey Dean and Sanjay Ghemawat, Google (2004). Gratuito. O artigo que fez de map e reduce o modelo para processar dados em milhares de máquinas.
- [What Every Programmer Should Know About Memory](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf), Ulrich Drepper (2007). Gratuito. Referência profunda sobre caches de CPU, linhas de cache e falso compartilhamento em código multithread.
- [The Free Lunch Is Over](http://www.gotw.ca/publications/concurrency-ddj.htm), Herb Sutter (2005). Gratuito. O artigo que anunciou o fim dos ganhos gratuitos de um só núcleo e a virada para o multicore.
- [Cilk: An Efficient Multithreaded Runtime System](https://dspace.mit.edu/handle/1721.1/149259), Blumofe, Joerg, Kuszmaul, Leiserson, Randall and Zhou (1995). Gratuito. O artigo sobre o runtime cujo escalonador com work stealing foi depois adotado por Go, Rayon e pelo pool fork-join do Java.

### Documentação oficial

- [Rayon](https://docs.rs/rayon/latest/rayon/), Rayon developers. Gratuito. Documentação da biblioteca de paralelismo de dados para Rust: iteradores paralelos e join.
- [The Java Tutorials: Fork/Join](https://docs.oracle.com/javase/tutorial/essential/concurrency/forkjoin.html), Oracle. Gratuito. Exemplo oficial curto de divisão recursiva de uma tarefa em um pool com work stealing.
- [OpenMP specifications](https://www.openmp.org/specifications/), OpenMP Architecture Review Board. Gratuito. O padrão para laços e tarefas paralelas em C, C++ e Fortran, com documentos de exemplos.
- [Rust core::arch](https://doc.rust-lang.org/core/arch/index.html), The Rust Project. Gratuito. A referência oficial de intrínsecos SIMD em Rust, com uma visão geral de como detectar recursos da CPU.

### Vídeos

- [MIT 6.172 Performance Engineering of Software Systems (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63VIBQVWguXxZZi0566y7Wf), MIT OpenCourseWare. Gratuito. As aulas gravadas, incluindo as de Cilk, corridas e análise de algoritmos multithread.

### Prática e ferramentas

- [hyperfine](https://github.com/sharkdp/hyperfine), David Peter. Gratuito. A ferramenta de benchmark de linha de comando usada neste repositório: aquecimento, várias execuções e estatísticas.
- [Compiler Explorer](https://godbolt.org/), Matt Godbolt. Gratuito. Mostra o assembly gerado pelo compilador, o jeito mais rápido de ver se um laço foi vetorizado.

### Comunidades

- [Stack Overflow: parallel-processing tag](https://stackoverflow.com/questions/tagged/parallel-processing), Stack Overflow. Gratuito. Dúvidas práticas sobre por que código paralelo não escala e como corrigir.
- [r/HPC](https://www.reddit.com/r/HPC/), Reddit. Gratuito. Comunidade de computação de alto desempenho, clusters e programação paralela.
