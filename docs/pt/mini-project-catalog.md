# Catálogo de miniprojetos

> English version: [docs/en/mini-project-catalog.md](../en/mini-project-catalog.md)

Ideias acordadas no brainstorming da Fase 2, agrupadas por área. Este é o backlog que o `PLAN.md` transforma em tarefas com critérios de aceite. TypeScript é a linguagem de referência, a menos que outra apareça primeiro na lista.

## Algoritmos e Big O

| Miniprojeto | Linguagens | Demo ou benchmark |
| --- | --- | --- |
| Corrida de ordenação (bubble, insertion, merge, quick, heap, radix) | as 7 | tempo por `n` com entrada aleatória, ordenada e invertida |
| Laboratório de Big O | TS | mede uma função, ajusta a curva e mostra a complexidade empírica |
| Programação dinâmica (mochila, LCS, troco) | TS, Python | recursão ingênua, memoização e tabulação lado a lado |
| Caixeiro viajante | TS, Rust | força bruta contra heurística, mostrando onde `n!` fica inviável |

## Estruturas de dados

| Miniprojeto | Linguagens | Demo ou benchmark |
| --- | --- | --- |
| Hash map do zero | C++, Rust, TS | encadeamento contra endereçamento aberto, por fator de carga |
| Grafos (Dijkstra, Bellman-Ford, ordenação topológica, árvore geradora) | C++, Go | os 10 casos `.in/.out` de `references/usp/data-structures-2` viram testes automatizados |
| Árvore B em disco | C++, Rust | leituras de página contra uma árvore binária |
| LRU cache, bloom filter e trie | TS, Go | taxa de acerto e falsos positivos medidos |

## Compiladores

| Miniprojeto | Linguagens | Demo ou benchmark |
| --- | --- | --- |
| Mini linguagem: lexer, parser, AST e interpretador | TS | REPL que mostra tokens e árvore a cada linha |
| VM de bytecode para a mesma linguagem | Rust | interpretador de árvore contra bytecode |
| Motor de regex (NFA para DFA) | Go | visualização do autômato |

## Máquinas de estado e teoria da informação

| Miniprojeto | Linguagens | Demo ou benchmark |
| --- | --- | --- |
| Máquina de estados de um pedido (pago, enviado, cancelado) | TS, Elixir | transições inválidas rejeitadas, diagrama gerado do código |
| Huffman e LZ77 | Rust, Python | taxa de compressão contra a entropia de Shannon do arquivo |
| Detecção e correção de erros (CRC, Hamming) | C++ | inverte bits e mostra o que é detectado e corrigido |

## Concorrência e paralelismo

| Miniprojeto | Linguagens | Demo ou benchmark |
| --- | --- | --- |
| Race condition do contador: versão com bug e correção | Go, Rust, Java, Elixir, TS | mutex, atômico, canal e ator resolvendo o mesmo problema |
| Deadlock: jantar dos filósofos | Go, Java | trava de propósito, depois resolve com ordenação de locks |
| Escala por núcleos (primos, Mandelbrot) | Rust, Go, C++ | ganho real contra a lei de Amdahl |
| 10 mil conexões | TS, Go, Elixir | event loop, goroutines e processos BEAM sob k6 local |

## Transações e bancos de dados

| Miniprojeto | Linguagens | Demo ou benchmark |
| --- | --- | --- |
| Níveis de isolamento no PostgreSQL | TS + SQL | dirty read, phantom e lost update reproduzidos em testes |
| Venda acima do estoque no checkout | TS | lock otimista, lock pessimista e `SERIALIZABLE` sob carga |
| Prisma, Drizzle e SQL puro | TS | mesma consulta, latência e SQL gerado |
| Outbox e saga | TS | falha injetada no meio, consistência verificada |

## Load balancing, performance e protocolos

| Miniprojeto | Linguagens | Demo ou benchmark |
| --- | --- | --- |
| NGINX contra Caddy (round-robin, least-conn, ip-hash) | config + TS | distribuição de requisições e queda de um nó |
| Load balancer L7 escrito à mão | Go | health check e retry, comparado ao NGINX |
| REST, GraphQL e JSON-RPC na mesma API | TS (Elysia) | latência e tamanho de payload, problema N+1 no GraphQL |
| HTTP/1.1, HTTP/2 e HTTP/3 | Caddy + TS | cascata de requisições com muitas imagens pequenas |
| Servidor HTTP em cima de TCP puro | Go ou Rust | parser do protocolo escrito à mão |
| Bun contra Node, com e sem cluster PM2 | TS | requisições por segundo e memória |

## Mensageria

| Miniprojeto | Linguagens | Demo ou benchmark |
| --- | --- | --- |
| Mesma tarefa em BullMQ, RabbitMQ, Kafka e SQS (LocalStack) | TS | vazão, ordenação e reentrega |
| Idempotência e fila de mensagens mortas | TS, Go | consumidor que falha, efeito aplicado exatamente uma vez |
| Fila contra pub/sub, com contrapressão | TS, Elixir | produtor mais rápido que o consumidor |

## POO, programação funcional, patterns e SOLID

| Miniprojeto | Linguagens | Demo ou benchmark |
| --- | --- | --- |
| Mesmo domínio (carrinho) em POO e em estilo funcional | Java, Elixir, TS | linhas, testabilidade e mutação comparadas |
| SOLID antes e depois | TS, Java | código que viola, refatoração, mesmos testes passando |
| Cerca de 10 patterns de back end | TS | um exemplo pequeno por padrão |
| Funções puras com testes baseados em propriedades | TS, Elixir | uma propriedade encontra o bug que o teste de exemplo não acha |

## Segurança

Um lab isolado por falha: versão vulnerável, versão corrigida e um teste que prova a correção. Somente local, em Docker, em rede interna.

| Lab | O que ensina |
| --- | --- |
| SQL injection | concatenação contra consultas parametrizadas |
| XSS (armazenado, refletido, DOM) e CSP | escape de saída e política de conteúdo |
| CSRF | token e cookies `SameSite` |
| Controle de acesso quebrado (IDOR) | checagem de dono no servidor |
| SSRF | lista de destinos permitidos, dentro da rede interna do Docker |
| Senhas e sessão | MD5 contra Argon2, limite de tentativas |
| Erros comuns de JWT | algoritmo fixo, segredo forte, expiração |
| Upload e path traversal | validação de caminho e tipo |

## Testes

| Miniprojeto | Demo |
| --- | --- |
| Pirâmide completa em um app (unitário, integração, e2e com Playwright, smoke, regressão) | tempo e custo de cada camada |
| Kata de TDD com histórico de commits vermelho, verde, refatora | o histórico é a aula |
| Teste de mutação | cobertura de 100% que não pega o bug |
| Lab de testes instáveis | causas (tempo, ordem, rede) e correções |

## Observabilidade

Stack: OpenTelemetry, Prometheus, Grafana, Loki e Tempo, tudo local.

| Miniprojeto | Demo |
| --- | --- |
| Três serviços com traces, métricas e logs | uma requisição lenta rastreada de ponta a ponta |
| Logs estruturados e id de correlação | busca de um erro pelo id da requisição |
| SLO e alerta | o k6 local provoca a violação e o alerta dispara |
| Profiling com flame graph | gargalo encontrado e corrigido, antes e depois |

## Áreas extras

| Área | Ideia de miniprojeto |
| --- | --- |
| Cache | Redis, estratégias de invalidação, cache stampede, cache-aside contra write-through, medido com k6 local |
| Rate limiter | token bucket, leaky bucket e janela deslizante, em memória e no Redis |
| Sistemas de arquivos | organização de arquivos, índices, compressão e desfragmentação |
| Lógica digital | portas lógicas, somador, flip-flop e um simulador de circuitos |
| Redes | sockets TCP e UDP, handshake, DNS e um protocolo simples feito à mão |
| Sistemas operacionais | escalonador de processos, memória virtual e paginação, semáforos, simulados e visualizados |
| Blockchain | cadeia de blocos com hash, prova de trabalho e validação |
| CI | GitHub Actions rodando lint, testes e benchmarks de cada miniprojeto |
