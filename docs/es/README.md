# Documentación (Español)

> English version: [docs/en](../en/README.md) · Versão em português: [docs/pt](../pt/README.md)

La documentación está organizada por área. Cada página aquí tiene una página equivalente en `docs/en/` y `docs/pt/`. Esta página la genera `bun run docs:index`: no la edites a mano.

## Guías

- [Referencias de estudio de cada área](../../REFERENCES.es.md)
- [Decisiones del proyecto](decisions.md)
- [Diseño del quiz](quiz.md)
- [Cómo escribir preguntas del quiz](quiz-authoring.md)
- [Catálogo de mini-proyectos](mini-project-catalog.md)
- [Entorno: imágenes Docker fijadas y formateadores](environment.md)
- [Contrato y runner de benchmark](benchmarks.md)
- [Registro del brainstorming](brainstorming.md)

## Estado por área

3384 de 3384 preguntas escritas, 86 de 86 mini-proyectos listos. La hoja de ruta es [PLAN.md](../../PLAN.md).

| Área | Tipo | Preguntas | Revisión ciega | Mini-proyectos |
| --- | --- | ---: | --- | --- |
| Big O y análisis de algoritmos | Teoría y práctica | 100/100 | hecha | [big-o-lab](big-o/big-o-lab.md), [master-theorem](big-o/master-theorem.md), [sorting-lower-bound](big-o/sorting-lower-bound.md) |
| Estructuras de datos | Teoría y práctica | 100/100 | hecha | [hash-map](data-structures/hash-map.md), [graph-algorithms](data-structures/graph-algorithms.md), [b-tree-on-disk](data-structures/b-tree-on-disk.md), [lru-bloom-trie](data-structures/lru-bloom-trie.md), [balanced-trees](data-structures/balanced-trees.md) |
| Sistemas operativos | Teoría y práctica | 100/100 | hecha | [cpu-scheduling](operating-systems/cpu-scheduling.md), [paging-tlb](operating-systems/paging-tlb.md), [memory-allocator](operating-systems/memory-allocator.md), [deadlock-mini-shell](operating-systems/deadlock-mini-shell.md) |
| Redes | Teoría y práctica | 100/100 | hecha | [sliding-window-mini-tcp](networks/sliding-window-mini-tcp.md), [aloha-csma](networks/aloha-csma.md), [dns-subnet](networks/dns-subnet.md) |
| Bases de datos (teoría) | Teoría y práctica | 100/100 | hecha | [mini-dbms](databases/mini-dbms.md), [normalisation-tool](databases/normalisation-tool.md) |
| Algoritmos | Teoría y práctica | 100/100 | hecha | [sorting-race](algorithms/sorting-race.md), [dynamic-programming](algorithms/dynamic-programming.md), [travelling-salesman](algorithms/travelling-salesman.md), [hybrid-quicksort](algorithms/hybrid-quicksort.md) |
| Concurrencia | Teoría y práctica | 100/100 | hecha | [counter-race](concurrency/counter-race.md), [dining-philosophers](concurrency/dining-philosophers.md), [ten-thousand-connections](concurrency/ten-thousand-connections.md) |
| Paralelismo | Teoría y práctica | 100/100 | hecha | [scaling-by-cores](parallelism/scaling-by-cores.md) |
| Transacciones | Teoría y práctica | 100/100 | hecha | [isolation-levels](transactions/isolation-levels.md), [overselling-checkout](transactions/overselling-checkout.md), [orm-vs-sql](transactions/orm-vs-sql.md), [outbox-saga](transactions/outbox-saga.md) |
| Seguridad | Teoría y práctica | 100/100 | hecha | [sql-injection-lab](security/sql-injection-lab.md), [xss-csp-lab](security/xss-csp-lab.md), [csrf-lab](security/csrf-lab.md), [access-control-lab](security/access-control-lab.md), [ssrf-lab](security/ssrf-lab.md), [passwords-sessions-lab](security/passwords-sessions-lab.md), [jwt-lab](security/jwt-lab.md), [upload-path-traversal-lab](security/upload-path-traversal-lab.md) |
| Compiladores | Teoría y práctica | 100/100 | hecha | [mini-language-parser](compilers/mini-language-parser.md), [tree-walking-interpreter](compilers/tree-walking-interpreter.md), [bytecode-vm](compilers/bytecode-vm.md), [regex-engine](compilers/regex-engine.md) |
| Máquinas de estados | Teoría y práctica | 100/100 | hecha | [order-state-machine](state-machines/order-state-machine.md) |
| Teoría de la información | Teoría y práctica | 100/100 | hecha | [huffman-lz77](information-theory/huffman-lz77.md), [error-detection-correction](information-theory/error-detection-correction.md) |
| Lógica digital | Teoría y práctica | 100/100 | hecha | [gates-karnaugh-adders](digital-logic/gates-karnaugh-adders.md), [nand-alu-cpu](digital-logic/nand-alu-cpu.md) |
| Electrónica | Teoría | 170/170 | hecha | ninguno |
| Programación orientada a objetos | Teoría y práctica | 100/100 | hecha | [oop-vs-functional](oop/oop-vs-functional.md), [code-smells](oop/code-smells.md) |
| Programación funcional | Teoría y práctica | 100/100 | hecha | [pure-functions-properties](functional-programming/pure-functions-properties.md) |
| Patrones de diseño y SOLID | Teoría y práctica | 100/100 | hecha | [backend-patterns](design-patterns/backend-patterns.md), [solid-before-after](design-patterns/solid-before-after.md) |
| Arquitectura de software | Teoría y práctica | 100/100 | hecha | [clean-architecture-app](software-architecture/clean-architecture-app.md) |
| Pruebas | Teoría y práctica | 100/100 | hecha | [test-pyramid](testing/test-pyramid.md), [tdd-kata](testing/tdd-kata.md), [mutation-testing](testing/mutation-testing.md), [flaky-tests](testing/flaky-tests.md), [mini-xunit](testing/mini-xunit.md) |
| Protocolos | Teoría y práctica | 100/100 | hecha | [rest-graphql-jsonrpc](protocols/rest-graphql-jsonrpc.md), [http-versions](protocols/http-versions.md), [http-server-raw-tcp](protocols/http-server-raw-tcp.md) |
| Mensajería | Teoría y práctica | 100/100 | hecha | [queue-comparison](messaging/queue-comparison.md), [idempotency-dlq](messaging/idempotency-dlq.md), [pubsub-backpressure](messaging/pubsub-backpressure.md) |
| Balanceo de carga | Teoría y práctica | 100/100 | hecha | [nginx-vs-caddy](load-balancing/nginx-vs-caddy.md), [l7-load-balancer](load-balancing/l7-load-balancer.md) |
| Rendimiento | Teoría y práctica | 100/100 | hecha | [bun-vs-node](performance/bun-vs-node.md), [k6-scenarios](performance/k6-scenarios.md), [cache-friendly-matrix](performance/cache-friendly-matrix.md) |
| Caché | Teoría y práctica | 100/100 | hecha | [cache-strategies](cache/cache-strategies.md) |
| Limitación de tasa (rate limiting) | Teoría y práctica | 100/100 | hecha | [rate-limiter](rate-limiting/rate-limiter.md) |
| Sistemas de archivos | Teoría y práctica | 100/100 | hecha | [file-organisation](file-systems/file-organisation.md), [external-sorting](file-systems/external-sorting.md) |
| Observabilidad | Teoría y práctica | 100/100 | hecha | [three-signals](observability/three-signals.md), [structured-logs](observability/structured-logs.md), [slo-alert](observability/slo-alert.md), [flame-graph](observability/flame-graph.md) |
| Blockchain | Teoría y práctica | 100/100 | hecha | [didactic-blockchain](blockchain/didactic-blockchain.md) |
| Integración continua | Teoría y práctica | 100/100 | hecha | [ci-pipeline](continuous-integration/ci-pipeline.md) |
| Ingeniería de software | Teoría | 150/150 | hecha | ninguno |
| Inteligencia artificial y LLMs | Teoría y práctica | 164/164 | hecha | [bpe-tokenizer](artificial-intelligence/bpe-tokenizer.md), [neural-network-from-scratch](artificial-intelligence/neural-network-from-scratch.md), [embeddings-vector-search](artificial-intelligence/embeddings-vector-search.md), [tiny-language-model](artificial-intelligence/tiny-language-model.md), [diffusion-toy](artificial-intelligence/diffusion-toy.md), [pytorch-basics](artificial-intelligence/pytorch-basics.md), [tensorflow-keras-basics](artificial-intelligence/tensorflow-keras-basics.md), [computer-vision-cnn](artificial-intelligence/computer-vision-cnn.md) |
