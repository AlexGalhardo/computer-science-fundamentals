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

600 de 3220 questões escritas, 16 de 78 mini-projetos prontos. O roteiro é o [PLAN.md](../../PLAN.md).

| Área | Tipo | Questões | Revisão cega | Mini-projetos |
| --- | --- | ---: | --- | --- |
| Big O e análise de algoritmos | Teoria e prática | 100/100 | feita | [big-o-lab](big-o/big-o-lab.md), [master-theorem](big-o/master-theorem.md), [sorting-lower-bound](big-o/sorting-lower-bound.md) |
| Estruturas de dados | Teoria e prática | 100/100 | feita | hash-map (planejado), graph-algorithms (planejado), b-tree-on-disk (planejado), lru-bloom-trie (planejado), balanced-trees (planejado) |
| Sistemas operacionais | Teoria e prática | 100/100 | feita | [cpu-scheduling](operating-systems/cpu-scheduling.md), [paging-tlb](operating-systems/paging-tlb.md), [memory-allocator](operating-systems/memory-allocator.md), [deadlock-mini-shell](operating-systems/deadlock-mini-shell.md) |
| Redes | Teoria e prática | 100/100 | feita | [sliding-window-mini-tcp](networks/sliding-window-mini-tcp.md), [aloha-csma](networks/aloha-csma.md), [dns-subnet](networks/dns-subnet.md) |
| Bancos de dados (teoria) | Teoria e prática | 100/100 | feita | [mini-dbms](databases/mini-dbms.md), [normalisation-tool](databases/normalisation-tool.md) |
| Algoritmos | Teoria e prática | 0/100 |  | sorting-race (planejado), dynamic-programming (planejado), travelling-salesman (planejado), hybrid-quicksort (planejado) |
| Concorrência | Teoria e prática | 0/100 |  | counter-race (planejado), dining-philosophers (planejado), ten-thousand-connections (planejado) |
| Paralelismo | Teoria e prática | 0/100 |  | scaling-by-cores (planejado) |
| Transações | Teoria e prática | 100/100 | feita | [isolation-levels](transactions/isolation-levels.md), [overselling-checkout](transactions/overselling-checkout.md), [orm-vs-sql](transactions/orm-vs-sql.md), [outbox-saga](transactions/outbox-saga.md) |
| Segurança | Teoria e prática | 0/100 |  | sql-injection-lab (planejado), xss-csp-lab (planejado), csrf-lab (planejado), access-control-lab (planejado), ssrf-lab (planejado), passwords-sessions-lab (planejado), jwt-lab (planejado), upload-path-traversal-lab (planejado) |
| Compiladores | Teoria e prática | 0/100 |  | mini-language-parser (planejado), tree-walking-interpreter (planejado), bytecode-vm (planejado), regex-engine (planejado) |
| Máquinas de estado | Teoria e prática | 0/100 |  | order-state-machine (planejado) |
| Teoria da informação | Teoria e prática | 0/100 |  | huffman-lz77 (planejado), error-detection-correction (planejado) |
| Lógica digital | Teoria e prática | 0/100 |  | gates-karnaugh-adders (planejado), nand-alu-cpu (planejado) |
| Eletrônica | Teoria | 0/170 |  | nenhum |
| Programação orientada a objetos | Teoria e prática | 0/100 |  | oop-vs-functional (planejado), code-smells (planejado) |
| Programação funcional | Teoria e prática | 0/100 |  | pure-functions-properties (planejado) |
| Padrões de projeto e SOLID | Teoria e prática | 0/100 |  | backend-patterns (planejado), solid-before-after (planejado) |
| Arquitetura de software | Teoria e prática | 0/100 |  | clean-architecture-app (planejado) |
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
