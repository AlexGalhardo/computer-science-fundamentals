# Documentação (Português)

> English version: [docs/en](../en/README.md) · Versión en español: [docs/es](../es/README.md)

A documentação é organizada por área. Toda página aqui tem uma página equivalente em `docs/en/` e `docs/es/`. Esta página é gerada por `bun run docs:index`: não edite à mão.

## Guias

- [Referências de estudo de cada área](../../REFERENCES.pt-BR.md)
- [Decisões do projeto](decisions.md)
- [Desenho do quiz](quiz.md)
- [Como escrever questões do quiz](quiz-authoring.md)
- [Catálogo de mini-projetos](mini-project-catalog.md)
- [Ambiente: imagens Docker fixadas e formatadores](environment.md)
- [Contrato e runner de benchmark](benchmarks.md)
- [Registro do brainstorming](brainstorming.md)

## Status por área

3384 de 3384 questões escritas, 86 de 86 mini-projetos prontos. O roteiro é o [PLAN.md](../../PLAN.md).

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
| Programação orientada a objetos | Teoria e prática | 100/100 | feita | [oop-vs-functional](oop/oop-vs-functional.md), [code-smells](oop/code-smells.md) |
| Programação funcional | Teoria e prática | 100/100 | feita | [pure-functions-properties](functional-programming/pure-functions-properties.md) |
| Padrões de projeto e SOLID | Teoria e prática | 100/100 | feita | [backend-patterns](design-patterns/backend-patterns.md), [solid-before-after](design-patterns/solid-before-after.md) |
| Arquitetura de software | Teoria e prática | 100/100 | feita | [clean-architecture-app](software-architecture/clean-architecture-app.md) |
| Testes | Teoria e prática | 100/100 | feita | [test-pyramid](testing/test-pyramid.md), [tdd-kata](testing/tdd-kata.md), [mutation-testing](testing/mutation-testing.md), [flaky-tests](testing/flaky-tests.md), [mini-xunit](testing/mini-xunit.md) |
| Protocolos | Teoria e prática | 100/100 | feita | [rest-graphql-jsonrpc](protocols/rest-graphql-jsonrpc.md), [http-versions](protocols/http-versions.md), [http-server-raw-tcp](protocols/http-server-raw-tcp.md) |
| Mensageria | Teoria e prática | 100/100 | feita | [queue-comparison](messaging/queue-comparison.md), [idempotency-dlq](messaging/idempotency-dlq.md), [pubsub-backpressure](messaging/pubsub-backpressure.md) |
| Balanceamento de carga | Teoria e prática | 100/100 | feita | [nginx-vs-caddy](load-balancing/nginx-vs-caddy.md), [l7-load-balancer](load-balancing/l7-load-balancer.md) |
| Performance | Teoria e prática | 100/100 | feita | [bun-vs-node](performance/bun-vs-node.md), [k6-scenarios](performance/k6-scenarios.md), [cache-friendly-matrix](performance/cache-friendly-matrix.md) |
| Cache | Teoria e prática | 100/100 | feita | [cache-strategies](cache/cache-strategies.md) |
| Limitação de taxa | Teoria e prática | 100/100 | feita | [rate-limiter](rate-limiting/rate-limiter.md) |
| Sistemas de arquivos | Teoria e prática | 100/100 | feita | [file-organisation](file-systems/file-organisation.md), [external-sorting](file-systems/external-sorting.md) |
| Observabilidade | Teoria e prática | 100/100 | feita | [three-signals](observability/three-signals.md), [structured-logs](observability/structured-logs.md), [slo-alert](observability/slo-alert.md), [flame-graph](observability/flame-graph.md) |
| Blockchain | Teoria e prática | 100/100 | feita | [didactic-blockchain](blockchain/didactic-blockchain.md) |
| Integração contínua | Teoria e prática | 100/100 | feita | [ci-pipeline](continuous-integration/ci-pipeline.md) |
| Engenharia de software | Teoria | 150/150 | feita | nenhum |
| Inteligência artificial e LLMs | Teoria e prática | 164/164 | feita | [bpe-tokenizer](artificial-intelligence/bpe-tokenizer.md), [neural-network-from-scratch](artificial-intelligence/neural-network-from-scratch.md), [embeddings-vector-search](artificial-intelligence/embeddings-vector-search.md), [tiny-language-model](artificial-intelligence/tiny-language-model.md), [diffusion-toy](artificial-intelligence/diffusion-toy.md), [pytorch-basics](artificial-intelligence/pytorch-basics.md), [tensorflow-keras-basics](artificial-intelligence/tensorflow-keras-basics.md), [computer-vision-cnn](artificial-intelligence/computer-vision-cnn.md) |
