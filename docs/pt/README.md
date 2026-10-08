# Documentação (Português)

> English version: [docs/en](../en/README.md)

A documentação é organizada por área. Toda página aqui tem uma página equivalente em `docs/en/`. Esta página é gerada por `bun run docs:index`: não edite à mão.

## Guias

- [Decisões do projeto](decisions.md)
- [Desenho do quiz](quiz.md)
- [Como escrever questões do quiz](quiz-authoring.md)
- [Catálogo de mini-projetos](mini-project-catalog.md)
- [Ambiente: imagens Docker fixadas e formatadores](environment.md)
- [Contrato e runner de benchmark](benchmarks.md)
- [Registro do brainstorming](brainstorming.md)

## Status por área

1870 de 3384 questões escritas, 50 de 86 mini-projetos prontos. O roteiro é o [PLAN.md](../../PLAN.md).

| Área | Tipo | Questões | Revisão cega | Mini-projetos |
| --- | --- | ---: | --- | --- |
| Big O e análise de algoritmos | Teoria e prática | 100/100 | feita | [big-o-lab](big-o/big-o-lab.md), [master-theorem](big-o/master-theorem.md), [sorting-lower-bound](big-o/sorting-lower-bound.md) |
| Estruturas de dados | Teoria e prática | 100/100 | feita | [hash-map](data-structures/hash-map.md), [graph-algorithms](data-structures/graph-algorithms.md), [b-tree-on-disk](data-structures/b-tree-on-disk.md), [lru-bloom-trie](data-structures/lru-bloom-trie.md), [balanced-trees](data-structures/balanced-trees.md) |
| Sistemas operacionais | Teoria e prática | 100/100 | feita | [cpu-scheduling](operating-systems/cpu-scheduling.md), [paging-tlb](operating-systems/paging-tlb.md), [memory-allocator](operating-systems/memory-allocator.md), [deadlock-mini-shell](operating-systems/deadlock-mini-shell.md) |
| Redes | Teoria e prática | 100/100 | feita | [sliding-window-mini-tcp](networks/sliding-window-mini-tcp.md), [aloha-csma](networks/aloha-csma.md), [dns-subnet](networks/dns-subnet.md) |
| Bancos de dados (teoria) | Teoria e prática | 100/100 | feita | [mini-dbms](databases/mini-dbms.md), [normalisation-tool](databases/normalisation-tool.md) |
| Algoritmos | Teoria e prática | 100/100 | feita | [sorting-race](algorithms/sorting-race.md), [dynamic-programming](algorithms/dynamic-programming.md), [travelling-salesman](algorithms/travelling-salesman.md), [hybrid-quicksort](algorithms/hybrid-quicksort.md) |
| Concorrência | Teoria e prática | 100/100 | feita | [counter-race](concurrency/counter-race.md), [dining-philosophers](concurrency/dining-philosophers.md), [ten-thousand-connections](concurrency/ten-thousand-connections.md) |
| Paralelismo | Teoria e prática | 100/100 | feita | [scaling-by-cores](parallelism/scaling-by-cores.md) |
| Transações | Teoria e prática | 100/100 | feita | [isolation-levels](transactions/isolation-levels.md), [overselling-checkout](transactions/overselling-checkout.md), [orm-vs-sql](transactions/orm-vs-sql.md), [outbox-saga](transactions/outbox-saga.md) |
| Segurança | Teoria e prática | 100/100 | feita | [sql-injection-lab](security/sql-injection-lab.md), [xss-csp-lab](security/xss-csp-lab.md), [csrf-lab](security/csrf-lab.md), [access-control-lab](security/access-control-lab.md), [ssrf-lab](security/ssrf-lab.md), [passwords-sessions-lab](security/passwords-sessions-lab.md), [jwt-lab](security/jwt-lab.md), [upload-path-traversal-lab](security/upload-path-traversal-lab.md) |
| Compiladores | Teoria e prática | 100/100 | feita | [mini-language-parser](compilers/mini-language-parser.md), [tree-walking-interpreter](compilers/tree-walking-interpreter.md), [bytecode-vm](compilers/bytecode-vm.md), [regex-engine](compilers/regex-engine.md) |
| Máquinas de estado | Teoria e prática | 100/100 | feita | [order-state-machine](state-machines/order-state-machine.md) |
| Teoria da informação | Teoria e prática | 100/100 | feita | [huffman-lz77](information-theory/huffman-lz77.md), [error-detection-correction](information-theory/error-detection-correction.md) |
| Lógica digital | Teoria e prática | 100/100 | feita | [gates-karnaugh-adders](digital-logic/gates-karnaugh-adders.md), [nand-alu-cpu](digital-logic/nand-alu-cpu.md) |
| Eletrônica | Teoria | 170/170 | feita | nenhum |
| Programação orientada a objetos | Teoria e prática | 0/100 |  | oop-vs-functional (planejado), code-smells (planejado) |
| Programação funcional | Teoria e prática | 100/100 | feita | [pure-functions-properties](functional-programming/pure-functions-properties.md) |
| Padrões de projeto e SOLID | Teoria e prática | 100/100 | feita | [backend-patterns](design-patterns/backend-patterns.md), [solid-before-after](design-patterns/solid-before-after.md) |
| Arquitetura de software | Teoria e prática | 100/100 | feita | [clean-architecture-app](software-architecture/clean-architecture-app.md) |
| Testes | Teoria e prática | 0/100 |  | test-pyramid (planejado), tdd-kata (planejado), mutation-testing (planejado), flaky-tests (planejado), mini-xunit (planejado) |
| Protocolos | Teoria e prática | 0/100 |  | rest-graphql-jsonrpc (planejado), http-versions (planejado), http-server-raw-tcp (planejado) |
| Mensageria | Teoria e prática | 0/100 |  | queue-comparison (planejado), idempotency-dlq (planejado), pubsub-backpressure (planejado) |
| Balanceamento de carga | Teoria e prática | 0/100 |  | nginx-vs-caddy (planejado), l7-load-balancer (planejado) |
| Performance | Teoria e prática | 0/100 |  | bun-vs-node (planejado), k6-scenarios (planejado), cache-friendly-matrix (planejado) |
| Cache | Teoria e prática | 0/100 |  | cache-strategies (planejado) |
| Limitação de taxa | Teoria e prática | 0/100 |  | rate-limiter (planejado) |
| Sistemas de arquivos | Teoria e prática | 0/100 |  | file-organisation (planejado), external-sorting (planejado) |
| Observabilidade | Teoria e prática | 0/100 |  | three-signals (planejado), structured-logs (planejado), slo-alert (planejado), flame-graph (planejado) |
| Blockchain | Teoria e prática | 0/100 |  | didactic-blockchain (planejado) |
| Integração contínua | Teoria e prática | 0/100 |  | ci-pipeline (planejado) |
| Engenharia de software | Teoria | 0/150 |  | nenhum |
| Inteligência artificial e LLMs | Teoria e prática | 0/164 |  | bpe-tokenizer (planejado), neural-network-from-scratch (planejado), embeddings-vector-search (planejado), tiny-language-model (planejado), diffusion-toy (planejado), pytorch-basics (planejado), tensorflow-keras-basics (planejado), computer-vision-cnn (planejado) |
