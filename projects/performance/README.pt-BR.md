# Performance

> English version: [README.md](README.md)

Engenharia de desempenho é medir antes de mudar: definir o que significa rápido (percentis de latência, vazão), produzir uma carga realista, descobrir para onde vai o tempo com um profiler e só então otimizar. Ela liga várias camadas, dos caches de CPU e da localidade de memória ao comportamento do runtime, às consultas ao banco e à capacidade de um serviço inteiro, e depende de um método sólido de benchmark para não se enganar.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Bun contra Node (`bun-vs-node`) | Como o runtime e o modelo de processos mudam a vazão | planejado |
| Cenários de teste de carga com k6 (`k6-scenarios`) | O que os testes de carga, estresse, pico e resistência revelam | planejado |
| Multiplicação de matrizes amigável ao cache (`cache-friendly-matrix`) | Como a localidade de memória muda a velocidade com o mesmo Big O | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/performance/`).
- Documentação: planejada (`docs/pt/performance/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/), Grafana Labs. Gratuito. O guia oficial de usuários virtuais, estágios, limiares e checks, com uma página para cada tipo de teste.
- [The USE Method](https://www.brendangregg.com/usemethod.html), Brendan Gregg. Gratuito. Um roteiro para qualquer recurso: utilização, saturação e erros, um primeiro método para achar gargalos.
- [How NOT to Measure Latency](https://www.youtube.com/watch?v=lJ8ydIuPFeU), Gil Tene. Gratuito. A palestra sobre percentis, por que médias escondem o problema e o erro da omissão coordenada.

### Livros

- [Systems Performance, 2nd edition](https://www.brendangregg.com/systems-performance-2nd-edition-book.html), Brendan Gregg. Pago. A referência em metodologia e em análise de CPU, memória, sistema de arquivos, disco e rede no Linux.
- [Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/), Sergey Slotin. Gratuito. Livro online gratuito sobre caches de CPU, disposição de memória, SIMD e benchmarks, com multiplicação de matrizes como caso.
- [Performance Analysis and Tuning on Modern CPUs](https://github.com/dendibakh/perf-book), Denis Bakhvalov. Gratuito. Livro gratuito sobre medição com contadores de hardware, profiling e correção de faltas de cache e erros de predição de desvio.
- [Use The Index, Luke](https://use-the-index-luke.com/), Markus Winand. Gratuito. O guia prático de índices de banco de dados e de leitura de planos de execução.

### Cursos e aulas

- [MIT 6.172 Performance Engineering of Software Systems](https://ocw.mit.edu/courses/6-172-performance-engineering-of-software-systems-fall-2018/), MIT OpenCourseWare. Gratuito. Começa acelerando a multiplicação de matrizes passo a passo e depois cobre medição e caches.

### Artigos e especificações

- [What Every Programmer Should Know About Memory](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf), Ulrich Drepper (2007). Gratuito. A referência profunda sobre caches de CPU, TLBs e como a disposição dos dados decide a velocidade.
- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html), Brendan Gregg. Gratuito. A página do autor sobre como os flame graphs são construídos e lidos, com links para seu artigo e suas palestras.
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), Jeffrey Dean and Luiz André Barroso (2013). Gratuito. Por que os percentis altos importam mais à medida que um sistema cresce, e técnicas para domá-los.
- [Producing Wrong Data Without Doing Anything Obviously Wrong!](https://users.cs.northwestern.edu/~robby/courses/322-2013-spring/mytkowicz-wrong-data.pdf), Mytkowicz, Diwan, Hauswirth and Sweeney (2009). Gratuito. Mostra como o tamanho do ambiente e a ordem de ligação enviesam benchmarks, uma lição de método de medição.
- [Latency Numbers Every Programmer Should Know](https://gist.github.com/jboner/2841832), Jonas Bonér, after Jeff Dean and Peter Norvig. Gratuito. A tabela de ordens de grandeza, de uma referência ao cache a um pacote que cruza o oceano.

### Documentação oficial

- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), PostgreSQL Global Development Group. Gratuito. Como ler um plano de consulta e achar um índice que falta.
- [Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop), OpenJS Foundation. Gratuito. A explicação oficial de por que um callback lento prejudica todos os clientes de um servidor Node.js.
- [PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/), PM2. Gratuito. Como uma aplicação Node.js é distribuída por todos os núcleos de CPU.
- [Bun documentation](https://bun.sh/docs), Oven. Gratuito. O runtime comparado com o Node.js no miniprojeto.
- [perf: Linux profiling with performance counters](https://perfwiki.github.io/main/), Linux perf community. Gratuito. A wiki da ferramenta perf do Linux, com um tutorial de amostragem e contagem de eventos.

### Vídeos

- [Performance Matters](https://www.youtube.com/watch?v=r-TLSBdHe1A), Emery Berger, Strange Loop. Gratuito. Palestra sobre por que benchmarks ingênuos enganam e como medir e fazer profiling com solidez.
- [MIT 6.172 Performance Engineering of Software Systems (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63VIBQVWguXxZZi0566y7Wf), MIT OpenCourseWare. Gratuito. As aulas gravadas do curso acima.

### Prática e ferramentas

- [hyperfine](https://github.com/sharkdp/hyperfine), David Peter. Gratuito. A ferramenta de benchmark deste repositório: execuções de aquecimento, repetições e resumo estatístico.
- [FlameGraph](https://github.com/brendangregg/FlameGraph), Brendan Gregg. Gratuito. Os scripts originais que transformam amostras de pilha do profiler em um flame graph.

### Comunidades

- [Stack Overflow: performance tag](https://stackoverflow.com/questions/tagged/performance), Stack Overflow. Gratuito. Respostas canônicas famosas sobre predição de desvios, efeitos de cache e medição.
- [Brendan Gregg's Blog](https://www.brendangregg.com/blog/), Brendan Gregg. Gratuito. Textos sobre análise de desempenho, ferramentas e metodologia do autor dos flame graphs.
