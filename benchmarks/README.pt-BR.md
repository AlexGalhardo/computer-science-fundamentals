# Benchmark das linguagens

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

As mesmas oito cargas de trabalho nas sete linguagens do repositório (C++, Rust, Go, Java, TypeScript no Bun, Elixir e Python), medidas no Docker em imagens fixadas, com um dashboard estático que explica cada gráfico em palavras simples.

Ele ensina como cada linguagem roda código (compilada, máquina virtual, interpretador), como faz muitas coisas ao mesmo tempo (threads, goroutines, processos da BEAM, virtual threads, event loop) e o que isso custa em tempo, memória e CPU. **Não** é um ranking: leia [Limites da comparação](#limites-da-comparação) antes de citar qualquer número.

- Dashboard: abra [`dashboard/index.html`](dashboard/index.html) em um navegador. Funciona direto do disco, sem servidor e sem rede.
- Contrato e runner compartilhados com os mini-projetos: [docs/pt/benchmarks.md](../docs/pt/benchmarks.md).

## Como rodar

Requisitos: Docker e Bun. Nada mais é instalado no host.

```sh
./setup-unix-benchmarks.sh          # Linux e macOS
./setup-windows-benchmarks.ps1      # Windows
```

O script constrói todas as imagens, roda os testes de concordância, roda as oito cargas, reescreve `*/results/`, as tabelas deste README e `dashboard/results/results.js`, e testa o dashboard. Leva cerca de uma hora. `--quick` (`-Quick` no Windows) pula as medições.

Etapas isoladas, a partir de `benchmarks/`:

| Comando | O que faz |
| --- | --- |
| `bun run images` | constrói a imagem de cada linguagem para as quatro cargas do runner |
| `bun run bench -- --project cpu-single` | roda uma carga do runner (`cpu-single`, `parallelism`, `concurrency`, `memory`) |
| `bun run sections parallelism` | coleta os tempos de trecho usados no speed-up |
| `bun run http` | roda a carga HTTP (k6 contra os sete servidores) |
| `bun run build-time`, `bun run binary-size`, `bun run database` | rodam os outros três coletores |
| `bun run all [etapa...]` | roda todas as etapas em ordem, repetindo a que falhar |
| `bun run data` | reconstrói os dados do dashboard e as tabelas abaixo |
| `bun run test` | as implementações concordam no checksum, os resultados versionados estão completos |
| `bun run test:http` | os sete servidores passam em uma suíte de protocolo, o k6 recusa alvos não locais |
| `bun run test:database` | os sete clientes de banco leem de volta os mesmos dados |
| `bun run test:dashboard` | Playwright, no Docker e sem rede: todo gráfico é desenhado |

## Estrutura

```text
benchmarks/
├── docker/            um Dockerfile por linguagem, compartilhado pelas cargas do runner
├── cpu-single/        n-body e crivo de primos, uma thread
├── parallelism/       contagem de primos com 1, 2, 4, 8 e 16 workers
├── concurrency/       100.000 tarefas esperando em um portão
├── memory/            árvores binárias e um processo ocioso
├── http/              sete servidores, k6, coletor, testes de protocolo
├── build-time/       tempo de build, frio e quente
├── binary-size/       tamanho do artefato e do runtime de que ele precisa
├── database/          sete clientes PostgreSQL, coletor, testes
├── scripts/           construtor de imagens, coletores extras, dados do dashboard
├── tests/             testes de concordância e de resultados
└── dashboard/         o site estático e seus testes Playwright
```

Cada pasta de carga tem uma subpasta por linguagem, um `bench.json` onde o runner compartilhado se aplica, e um `results/` versionado com `results.md`, `results.json` e `results.js`.

## As cargas

| Carga | O que mede | O que não mede |
| --- | --- | --- |
| `cpu-single` | Velocidade de aritmética simples e laços em arrays em um núcleo: uma simulação n-body (ponto flutuante) e um crivo de Eratóstenes (inteiros, memória) | Bibliotecas que fazem a parte pesada em código nativo (NumPy, SIMD), programas de longa duração em que o JIT está totalmente aquecido |
| `parallelism` | Quanto mais rápido o mesmo trabalho fica com 1, 2, 4, 8 e 16 workers, usando o mecanismo próprio de cada linguagem | Velocidade absoluta (veja `cpu-single`), trabalhos que compartilham dados entre workers |
| `concurrency` | Custo em tempo e memória de 100.000 tarefas que esperam e passam uma mensagem | A velocidade com que as tarefas calculariam, o comportamento de um servidor aquecido e de longa duração |
| `http` | Requisições por segundo, percentis de latência, CPU e memória de um servidor pequeno sob carga local, em um eco de JSON e em um endpoint preso à CPU | A linguagem sozinha: cada pilha é uma biblioteca de servidor diferente. Distância de rede, TLS, bancos de dados |
| `memory` | Pico de memória e tempo de um programa que aloca muito, tempo de inicialização e memória de base de um programa ocioso | Coletores ou alocadores ajustados, fragmentação de longo prazo |
| `build-time` | Tempo do fonte até aquilo que a linguagem roda, a partir do nada (frio) e depois de editar uma linha (quente) | Projetos grandes, em que builds incrementais e caches importam mais |
| `binary-size` | Tamanho em disco do que você entrega e do runtime de que ele precisa | Tamanho da imagem de contêiner, o sistema operacional e sua biblioteca C |
| `database` | Operações por segundo e latência das mesmas consultas contra um PostgreSQL local, em uma conexão e em um pool | A linguagem: isto é principalmente o driver e a ida e volta ao servidor |

Todas as implementações de uma carga imprimem o mesmo checksum para a mesma entrada. O `bun run test` prova isso rodando cada programa na sua imagem, e compara o resultado com uma referência calculada de forma independente (a energia publicada do sistema n-body, um crivo no próprio teste, a fórmula fechada do número de nós das árvores).

## Como cada linguagem lida com threads

O modelo de escalonamento é a principal coisa que estas cargas mostram. Esta tabela diz o que cada implementação usa.

| Linguagem | Trabalho de CPU em vários núcleos (`parallelism`) | Muitas tarefas esperando (`concurrency`) | O modelo em uma frase |
| --- | --- | --- | --- |
| C++ | `std::thread`, uma thread do SO por worker, um contador atômico distribui os pedaços | Corrotinas do C++20 com escalonador escrito à mão, e `std::thread` limitado a 10.000 para comparação | O kernel escalona threads do SO (1:1). A linguagem dá o mecanismo de corrotina, mas nenhum escalonador |
| Rust | pool de threads do rayon com work stealing | tarefas do tokio em um runtime multi-thread | Threads do SO para calcular. Blocos `async` são compilados para máquinas de estado que um runtime de biblioteca executa em poucas threads |
| Go | goroutines lendo números de pedaço de um canal, `GOMAXPROCS` = workers | goroutines bloqueadas em um canal | M:N: o runtime do Go multiplexa muitas goroutines (pilhas pequenas que crescem) sobre poucas threads do SO e as preempta |
| Java | parallel stream submetido a um `ForkJoinPool` de threads de plataforma | virtual threads esperando em um `CountDownLatch`, mensagens por uma `LinkedBlockingQueue` | Threads de plataforma são threads do SO. Virtual threads são escalonadas pela JVM em um pool pequeno de threads carregadoras e desmontadas quando bloqueiam |
| TypeScript (Bun) | threads `Worker`, cada uma com seu heap, alimentadas por mensagens | funções `async` aguardando uma promise | Uma thread e um event loop por isolate. Nada é compartilhado, então mais núcleos significa mais isolates |
| Elixir | `Task.async_stream` com `max_concurrency` = workers | processos da BEAM bloqueados em `receive` | A VM roda processos leves em uma thread escalonadora por núcleo, os preempta por contagem de reduções, e eles só compartilham por troca de mensagens |
| Python | `multiprocessing.Pool` de processos (spawn) | tarefas asyncio em um event loop | A GIL deixa uma thread rodar bytecode por vez, então trabalho de CPU precisa de processos e esperar usa um event loop de uma thread |

## Bibliotecas e por que foram escolhidas

As quatro cargas do runner usam só a biblioteca padrão, exceto onde a linguagem não tem nada para o trabalho: o Rust usa rayon 1.12.0 (a crate usual de paralelismo de dados) em `parallelism` e tokio 1.53.2 (o runtime assíncrono usual) em `concurrency`.

| Linguagem | Servidor HTTP | Por quê | Driver de banco | Por quê |
| --- | --- | --- | --- | --- |
| C++ | cpp-httplib 0.60.0 e nlohmann/json 3.12.0 | A biblioteca padrão não tem rede nem JSON. Este é o par de header único mais usado, e evita um framework grande | libpq, do Debian trixie | O cliente C oficial. Não tem pool, então a fase de pool abre 8 conexões e dá uma a cada thread |
| Rust | axum 0.8.9 sobre tokio 1.53.2, serde_json 1.0.151 | Não há servidor HTTP na biblioteca padrão. O axum é o framework mais usado | sqlx 0.9.0 | A biblioteca assíncrona de banco mais usada, com pool embutido |
| Go | `net/http`, `encoding/json` | Biblioteca padrão | pgx 5.11.0 com pgxpool | O driver PostgreSQL mais usado em Go |
| Java | `com.sun.net.httpserver` com executor de virtual threads, Jackson 3.2.3 | O servidor vem com o JDK. O JDK não tem parser de JSON e o Jackson é o mais usado | PostgreSQL JDBC 42.7.14 e HikariCP 7.1.0 | O driver oficial e o pool mais usado |
| TypeScript | `Bun.serve` | Embutido no Bun | `Bun.sql` | Embutido no Bun, com pool |
| Elixir | Bandit 1.12.5 e Plug 1.20.3, `JSON` da biblioteca padrão | O Plug é a interface web padrão e o Bandit o servidor padrão do Phoenix | Postgrex 0.22.4 | O driver usado pelo Ecto, com pool embutido |
| Python | FastAPI 0.142.4 no uvicorn 0.54.0, um worker | O `http.server` é só para desenvolvimento. O FastAPI é o framework mais usado | psycopg 3.3.6 e psycopg-pool 3.3.3 | O driver PostgreSQL mais usado |

Toda versão é fixada exatamente: tags de imagem, `Cargo.lock`, `go.sum`, `mix.lock`, `requirements.txt` (congelado, incluindo pacotes transitivos) e URLs de download fixas para os jars do Java e os headers do C++. Estas bibliotecas não estão na stack combinada para os mini-projetos (`.claude/rules/mini-project.md`), então ficam listadas aqui para o dono confirmar ou trocar.

## Método

- Tudo roda em contêineres de imagens fixadas. As quatro cargas do runner e o `build-time` rodam com `--network none`. Os programas são compilados dentro da imagem, então nenhuma execução lê o programa por um bind mount.
- `cpu-single`, `parallelism`, `concurrency` e `memory` usam o runner compartilhado (`tools/bench`): o hyperfine 2.0.0 roda cada comando 5 vezes depois de 1 execução de aquecimento descartada e registra tempo de relógio, tempo de CPU e pico de memória residente do processo inteiro. O próprio programa imprime o tempo do seu trecho medido.
- O speed-up é calculado sobre o trecho medido (a inicialização não é trabalho paralelo), a partir de 5 amostras extras por caso coletadas por `scripts/collect-sections.ts`. A eficiência é o speed-up dividido pelos workers.
- A memória por tarefa é (pico de memória com n tarefas − pico de memória com 0 tarefas) / n.
- `http`: um servidor por vez, limitado a 4 CPUs e 2 GiB, em uma rede Docker `internal` sem porta publicada. O k6 2.3.0 (também 4 CPUs) roda 32 usuários virtuais por 10 s, 3 vezes, cada uma depois de um aquecimento de 3 s. O `http/collect.ts` amostra o contêiner do servidor pelo `docker stats` enquanto o k6 envia carga e descarta a primeira e a última amostra de cada execução. O script do k6 recusa qualquer alvo que não seja `localhost` ou um serviço do arquivo compose.
- `build-time`: hyperfine com `--prepare`. O frio remove a saída e o cache do compilador antes de cada execução. O quente acrescenta uma linha de comentário ao fonte antes de cada execução.
- `binary-size`: tamanhos exatos de `stat` e `du` dentro das imagens.
- `database`: PostgreSQL 18.6 com os dados em tmpfs, em uma rede `internal`. Cada cliente roda uma vez como aquecimento e 3 vezes medido, com 5.000 linhas e 8 workers na fase de pool. O tempo de CPU e o pico de memória são informados pelo próprio processo cliente, a partir da contabilidade do kernel.

## Resultados

As tabelas abaixo são reescritas pelo `bun run data` a partir dos arquivos `results/` versionados. As tabelas brutas, com os comandos exatos, estão em cada `results/results.md`.

<!-- results:start -->

### Máquina

- host CPU: AMD Ryzen 7 5700X3D 8-Core Processor
- host logical cores: 16
- host memory: 31.9 GiB
- host OS: win32 x64
- Docker engine: 29.8.1 on Docker Desktop (kernel 6.18.33.2-microsoft-standard-WSL2)
- Docker CPUs: 16
- Docker memory: 15.6 GiB

### Runtimes

- cpp: g++ (GCC) 16.2.0 (sef-bench-cpu-single-cpp:local). HTTP: 16.2.0, cpp-httplib 0.60.0 + nlohmann/json 3.12.0 (sef-bd-http-cpp:local). Banco: libpq (official C client, from Debian trixie) 17.11-0+deb13u1 (sef-bd-database-cpp:local)
- rust: rustc 1.99.0 (b940084d7 2026-09-28) (sef-bench-cpu-single-rust:local). HTTP: rustc 1.99.0 (b940084d7 2026-09-28), axum 0.8.9 + tokio 1.53.2 (sef-bd-http-rust:local). Banco: sqlx 0.9.0 on tokio 1.53.2 (sef-bd-database-rust:local)
- go: go version go1.27.1 linux/amd64 (sef-bench-cpu-single-go:local). HTTP: go version go1.27.1 linux/amd64, net/http (standard library) (sef-bd-http-go:local). Banco: pgx 5.11.0 (pgxpool) (sef-bd-database-go:local)
- java: openjdk 25.0.4.1 2026-08-18 LTS (sef-bench-cpu-single-java:local). HTTP: openjdk 25.0.4.1 2026-08-18 LTS, JDK HttpServer + virtual threads + Jackson 3.2.3 (sef-bd-http-java:local). Banco: PostgreSQL JDBC 42.7.14 + HikariCP 7.1.0 (sef-bd-database-java:local)
- ts: 1.4.2 (sef-bench-cpu-single-ts:local). HTTP: 1.4.2, Bun.serve (built in) (sef-bd-http-ts:local). Banco: Bun.sql (built into Bun 1.4.2) (sef-bd-database-ts:local)
- elixir: 1.20.4 (sef-bench-cpu-single-elixir:local). HTTP: 1.20.4, Bandit 1.12.5 + Plug 1.20.3 (sef-bd-http-elixir:local). Banco: Postgrex 0.22.4 (sef-bd-database-elixir:local)
- python: Python 3.14.8 (sef-bench-cpu-single-python:local). HTTP: Python 3.14.8, FastAPI 0.142.4 + uvicorn 0.54.0 (1 worker) (sef-bd-http-python:local). Banco: psycopg 3.3.6 + psycopg-pool 3.3.3 (sef-bd-database-python:local)

### CPU, uma thread: n-body, 1,000,000 passos

`processo` é o programa inteiro (média ± desvio padrão de 5 execuções), `trecho` é só o núcleo, sem a inicialização.

| Linguagem | processo (ms) | intervalo (ms) | trecho (ms) | CPU (ms) | pico de memória (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 102 ± 14.1 | 83.5 – 119 | 95.6 | 101 | 3.68 |
| rust | 48.7 ± 3.29 | 44.4 – 53.4 | 49.2 | 48.6 | 2.04 |
| go | 98.2 ± 11.0 | 82.6 – 112 | 100 | 99.6 | 2.09 |
| java | 151 ± 8.84 | 140 – 163 | 123 | 199 | 44.2 |
| ts | 220 ± 23.8 | 181 – 244 | 234 | 228 | 30.5 |
| elixir | 3660 ± 803 | 2864 – 4742 | 2900 | 4595 | 84.3 |
| python | 9159 ± 861 | 8398 – 10338 | 9178 | 9157 | 14.9 |

### CPU, uma thread: crivo de primos até 10,000,000

`processo` é o programa inteiro (média ± desvio padrão de 5 execuções), `trecho` é só o núcleo, sem a inicialização.

| Linguagem | processo (ms) | intervalo (ms) | trecho (ms) | CPU (ms) | pico de memória (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 42.4 ± 5.08 | 37.8 – 48.7 | 29.2 | 42.2 | 12.9 |
| rust | 35.9 ± 5.32 | 29.1 – 41.1 | 25.5 | 35.8 | 11.6 |
| go | 45.8 ± 5.57 | 40.3 – 54.3 | 36.6 | 47.3 | 12.0 |
| java | 119 ± 12.9 | 101 – 136 | 51.9 | 158 | 53.8 |
| ts | 56.1 ± 4.88 | 48.4 – 61.2 | 37.3 | 60.6 | 38.7 |
| elixir | 1586 ± 141 | 1417 – 1770 | 1203 | 2645 | 160 |
| python | 1931 ± 191 | 1792 – 2243 | 1701 | 1930 | 24.5 |

### Paralelismo: speed-up (primos abaixo de 2,000,000)

Tempo do trecho medido com 1 worker dividido pelo tempo com w workers (média de 5 execuções cada). O ideal é w.

| Linguagem | tempo, 1 worker (ms) | 2 workers | 4 workers | 8 workers | 16 workers |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 212 ± 21.5 | 1.93× | 3.14× | 4.31× | 4.59× |
| rust | 217 ± 31.4 | 2.62× | 4.10× | 5.96× | 7.55× |
| go | 178 ± 8.66 | 1.95× | 2.91× | 5.01× | 5.20× |
| java | 271 ± 23.6 | 1.52× | 1.99× | 2.36× | 1.80× |
| ts | 345 ± 67.9 | 1.41× | 2.36× | 2.76× | 1.81× |
| elixir | 685 ± 113 | 1.21× | 1.77× | 3.14× | 2.66× |
| python | 10502 ± 1356 | 1.86× | 2.77× | 4.34× | 4.13× |

### Paralelismo: eficiência

Speed-up dividido pelo número de workers. 100 % significa que nenhum tempo foi perdido.

| Linguagem | 2 workers | 4 workers | 8 workers | 16 workers |
| --- | ---: | ---: | ---: | ---: |
| cpp | 97 % | 79 % | 54 % | 29 % |
| rust | 131 % | 102 % | 75 % | 47 % |
| go | 98 % | 73 % | 63 % | 33 % |
| java | 76 % | 50 % | 29 % | 11 % |
| ts | 71 % | 59 % | 34 % | 11 % |
| elixir | 60 % | 44 % | 39 % | 17 % |
| python | 93 % | 69 % | 54 % | 26 % |

### Paralelismo: tempo de CPU do processo inteiro (ms)

Tempo de usuário mais sistema somado em todos os núcleos, medido pelo hyperfine. Cresce com os workers quando os núcleos esperam, giram em falso ou dividem um núcleo físico.

| Linguagem | 1 | 2 | 4 | 8 | 16 |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 228 | 181 | 189 | 232 | 280 |
| rust | 193 | 188 | 267 | 284 | 310 |
| go | 185 | 213 | 195 | 243 | 298 |
| java | 322 | 326 | 363 | 457 | 617 |
| ts | 234 | 273 | 388 | 538 | 697 |
| elixir | 2428 | 2631 | 2374 | 2495 | 2780 |
| python | 9839 | 12243 | 12800 | 19230 | 26853 |

### Concorrência: tarefas esperando ao mesmo tempo

`memória por tarefa` = (pico com n tarefas − pico com 0 tarefas) / n. As threads de SO em C++ são limitadas a 10.000 (veja os limites abaixo).

| Linguagem | modelo | tarefas | tempo total (ms) | pico de memória (MiB) | memória por tarefa (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | coroutines | 100,000 | 63.4 ± 13.7 | 14.0 | 108 |
| cpp | os-threads | 10,000 | 1694 ± 290 | 85.6 | 8,586 |
| rust | tokio-tasks | 100,000 | 192 ± 29.3 | 52.0 | 514 |
| go | goroutines | 100,000 | 460 ± 33.8 | 265 | 2,762 |
| java | virtual-threads | 100,000 | 4476 ± 708 | 259 | 2,264 |
| ts | promises | 100,000 | 250 ± 42.5 | 70.1 | 542 |
| elixir | processes | 100,000 | 1270 ± 521 | 372 | 3,009 |
| python | asyncio-tasks | 100,000 | 2095 ± 334 | 148 | 1,291 |

### HTTP: eco de JSON (`POST /echo`)

32 usuários virtuais, 3 execuções de 10 s. CPU: 100 % é um núcleo, o limite é 400 %. `CPU do k6` perto de 400 % significa que o limite foi o gerador de carga, não o servidor.

| Linguagem | req/s | p50 (ms) | p95 (ms) | p99 (ms) | pico de memória (MiB) | CPU média (%) | CPU do k6 (%) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 14,346 ± 2,295 | 1.35 | 6.51 | 12.7 | 6.61 | 188 | 378 |
| rust | 12,694 ± 3,143 | 1.58 | 7.53 | 14.2 | 5.45 | 107 | 280 |
| go | 16,119 ± 1,116 | 1.25 | 5.55 | 10.1 | 12.2 | 214 | 338 |
| java | 12,939 ± 1,923 | 1.54 | 7.06 | 13.6 | 173 | 168 | 283 |
| ts | 18,719 ± 5,605 | 1.32 | 4.27 | 7.63 | 17.8 | 96 | 306 |
| elixir | 16,470 ± 3,265 | 1.42 | 4.91 | 8.66 | 147 | 329 | 340 |
| python | 2,170 ± 260 | 13.3 | 26.7 | 38.6 | 45.6 | 101 | 110 |

### HTTP: preso à CPU (`GET /primes?limit=5000`)

32 usuários virtuais, 3 execuções de 10 s. CPU: 100 % é um núcleo, o limite é 400 %. `CPU do k6` perto de 400 % significa que o limite foi o gerador de carga, não o servidor.

| Linguagem | req/s | p50 (ms) | p95 (ms) | p99 (ms) | pico de memória (MiB) | CPU média (%) | CPU do k6 (%) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 13,884 ± 2,447 | 1.35 | 6.88 | 13.8 | 6.42 | 239 | 321 |
| rust | 17,625 ± 1,974 | 1.20 | 4.78 | 9.22 | 6.43 | 236 | 342 |
| go | 21,080 ± 3,670 | 0.99 | 4.24 | 8.20 | 12.7 | 312 | 354 |
| java | 9,594 ± 1,588 | 2.11 | 9.74 | 17.6 | 176 | 221 | 270 |
| ts | 7,645 ± 757 | 3.60 | 8.00 | 13.0 | 19.4 | 98 | 175 |
| elixir | 6,927 ± 860 | 3.79 | 10.1 | 16.2 | 147 | 369 | 193 |
| python | 345 ± 16 | 90.9 | 127 | 150 | 47.9 | 106 | 16 |

### Memória: árvores binárias, profundidade 18

GC = com coletor de lixo. `CPU` acima de `tempo` significa que threads auxiliares (em geral o coletor) trabalharam em outros núcleos.

| Linguagem | memória | pico de memória (MiB) | tempo (ms) | CPU (ms) |
| --- | ---: | ---: | ---: | ---: |
| cpp | manual | 35.6 | 2494 ± 269 | 2492 |
| rust | manual | 34.1 | 2406 ± 361 | 2388 |
| go | GC | 38.5 | 2723 ± 359 | 5484 |
| java | GC | 459 | 1029 ± 177 | 1177 |
| ts | GC | 171 | 1809 ± 366 | 3204 |
| elixir | GC | 196 | 2000 ± 199 | 3173 |
| python | GC | 46.1 | 12936 ± 1349 | 12913 |

### Memória: processo ocioso (sobe e sai)

O que todo programa na linguagem paga antes de fazer qualquer coisa.

| Linguagem | memória | tempo de inicialização (ms) | pico de memória (MiB) |
| --- | ---: | ---: | ---: |
| cpp | manual | 1.86 ± 0.23 | 3.78 |
| rust | manual | 1.33 ± 0.10 | 2.14 |
| go | GC | 2.41 ± 0.44 | 2.09 |
| java | GC | 170 ± 26.5 | 43.6 |
| ts | GC | 21.6 ± 4.09 | 17.6 |
| elixir | GC | 453 ± 50.7 | 85.6 |
| python | GC | 157 ± 14.0 | 14.7 |

### Tempo de build do programa do `cpu-single`

`frio` começa sem saída e sem cache do compilador. `quente` muda uma linha e constrói de novo. `etapa` diz o que é realmente medido: Python, Elixir, Java e Bun não têm etapa que produza código de máquina antes da hora.

| Linguagem | etapa | frio (ms) | quente (ms) | comando |
| --- | ---: | ---: | ---: | ---: |
| cpp | compile-and-link | 4512 ± 2676 | 4698 ± 1680 | `g++ -std=c++23 -O2 -ffp-contract=off -pthread main.cpp -o main` |
| rust | compile-and-link | 417 ± 54.8 | 551 ± 265 | `cargo build --release --locked --offline --quiet` |
| go | compile-and-link | 7439 ± 3568 | 335 ± 132 | `go build -o main .` |
| java | compile-to-bytecode | 768 ± 114 | 768 ± 127 | `javac -d out Main.java` |
| ts | bundle-no-typecheck | 8.49 ± 1.72 | 11.3 ± 7.07 | `bun build main.ts --target bun --outfile out/main.js` |
| elixir | compile-to-bytecode | 765 ± 84.3 | 1020 ± 148 | `elixirc --ignore-module-conflict -o out main.ex` |
| python | bytecode-automatic | 75.9 ± 6.72 | 74.4 ± 15.9 | `python -m py_compile main.py` |

### Tamanho em disco do que você entrega

`runtime` é o que precisa estar na máquina além do artefato, sem contar o sistema operacional e a glibc. Os tamanhos são exatos, então não há dispersão.

| Linguagem | artefato (KiB) | runtime (KiB) | total (KiB) | artefato | runtime |
| --- | ---: | ---: | ---: | ---: | ---: |
| cpp | 20.6 | 3,625.7 | 3,646.4 | executable, g++ -O2, dynamically linked, not stripped | libstdc++ and libgcc_s shared libraries |
| rust | 483.5 | 178.6 | 662.1 | executable, cargo build --release, standard library linked in, not stripped | libgcc_s shared library |
| go | 2,327.8 | 0 | 2,327.8 | executable, CGO_ENABLED=0 go build, statically linked, not stripped | nothing |
| java | 3.8 | 42,894.3 | 42,898.1 | jar with the compiled classes | smallest Java runtime made by jlink (module java.base only, compressed) |
| ts | 2 | 77,637.3 | 77,639.4 | one JavaScript file made by bun build --minify | the bun executable |
| elixir | 7.5 | 65,892.9 | 65,900.4 | the application's compiled modules inside a mix release | the rest of the release: the Erlang runtime (ERTS) and the Erlang and Elixir libraries |
| python | 5.5 | 31,023.7 | 31,029.2 | the source file (Python ships source, bytecode is made on the first run) | the CPython interpreter, its shared library and the standard library |

### Banco de dados: inserir linhas uma a uma

5000 linhas, 3 execuções. Cada operação é uma ida e volta ao PostgreSQL. A CPU e a memória do cliente são da execução inteira do cliente (todas as fases).

| Linguagem | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | CPU do cliente (ms) | memória do cliente (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 4,817 ± 272 | 0.19 | 0.28 | 0.44 | 1,134 | 11.5 |
| rust | 1,463 ± 96 | 0.62 | 0.95 | 2.19 | 5,233 | 5.76 |
| go | 4,415 ± 285 | 0.22 | 0.28 | 0.34 | 2,042 | 13.9 |
| java | 5,713 ± 282 | 0.16 | 0.24 | 0.34 | 3,877 | 128 |
| ts | 4,189 ± 204 | 0.23 | 0.32 | 0.46 | 2,654 | 53.0 |
| elixir | 2,699 ± 174 | 0.35 | 0.47 | 0.68 | 4,286 | 112 |
| python | 4,239 ± 694 | 0.23 | 0.32 | 0.45 | 5,663 | 41.5 |

### Banco de dados: ler pela chave primária

5000 linhas, 3 execuções. Cada operação é uma ida e volta ao PostgreSQL. A CPU e a memória do cliente são da execução inteira do cliente (todas as fases).

| Linguagem | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | CPU do cliente (ms) | memória do cliente (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 4,965 ± 344 | 0.19 | 0.27 | 0.39 | 1,134 | 11.5 |
| rust | 1,594 ± 100 | 0.59 | 0.81 | 1.22 | 5,233 | 5.76 |
| go | 4,852 ± 129 | 0.20 | 0.24 | 0.28 | 2,042 | 13.9 |
| java | 6,452 ± 520 | 0.14 | 0.20 | 0.31 | 3,877 | 128 |
| ts | 4,173 ± 300 | 0.22 | 0.32 | 0.60 | 2,654 | 53.0 |
| elixir | 2,761 ± 124 | 0.35 | 0.45 | 0.55 | 4,286 | 112 |
| python | 4,239 ± 492 | 0.22 | 0.31 | 0.58 | 5,663 | 41.5 |

### Banco de dados: filtro e agregação

5000 linhas, 3 execuções. Cada operação é uma ida e volta ao PostgreSQL. A CPU e a memória do cliente são da execução inteira do cliente (todas as fases).

| Linguagem | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | CPU do cliente (ms) | memória do cliente (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 1,919 ± 315 | 0.51 | 0.82 | 1.00 | 1,134 | 11.5 |
| rust | 1,131 ± 93 | 0.85 | 1.12 | 1.63 | 5,233 | 5.76 |
| go | 2,187 ± 204 | 0.43 | 0.58 | 0.82 | 2,042 | 13.9 |
| java | 2,545 ± 29 | 0.37 | 0.48 | 0.64 | 3,877 | 128 |
| ts | 2,020 ± 130 | 0.46 | 0.66 | 1.17 | 2,654 | 53.0 |
| elixir | 1,392 ± 247 | 0.69 | 1.05 | 1.76 | 4,286 | 112 |
| python | 2,081 ± 57 | 0.45 | 0.67 | 0.80 | 5,663 | 41.5 |

### Banco de dados: ler pela chave, 8 workers em um pool

5000 linhas, 3 execuções. Cada operação é uma ida e volta ao PostgreSQL. A CPU e a memória do cliente são da execução inteira do cliente (todas as fases).

| Linguagem | ops/s | p50 (ms) | p95 (ms) | p99 (ms) | CPU do cliente (ms) | memória do cliente (MiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| cpp | 23,546 ± 3,998 | 0.23 | 0.60 | 1.78 | 1,134 | 11.5 |
| rust | 13,456 ± 3,505 | 0.55 | 1.03 | 1.78 | 5,233 | 5.76 |
| go | 32,674 ± 1,644 | 0.22 | 0.32 | 0.41 | 2,042 | 13.9 |
| java | 14,681 ± 644 | 0.23 | 0.60 | 6.75 | 3,877 | 128 |
| ts | 9,226 ± 1,626 | 0.64 | 1.69 | 2.71 | 2,654 | 53.0 |
| elixir | 12,187 ± 4,557 | 0.60 | 1.39 | 2.29 | 4,286 | 112 |
| python | 2,259 ± 250 | 3.44 | 5.87 | 7.93 | 5,663 | 41.5 |

<!-- results:end -->

## Limites da comparação

- **Ruído.** Os números versionados foram medidos enquanto outros contêineres rodavam na mesma máquina, dentro do Docker Desktop no WSL 2. As execuções são poucas (5, ou 3 em HTTP e banco) e curtas. Uma diferença menor que a dispersão informada não é uma diferença, e linguagens com números próximos não devem ser ranqueadas.
- **Uma máquina, um dia, configurações padrão.** Sem flags da JVM, sem ajuste de `GOGC`, sem alocador alternativo, sem otimização guiada por perfil, sem otimização em tempo de link.
- **Programas pequenos escritos do jeito simples.** Eles mostram o runtime em uma tarefa estreita. Programas reais usam bibliotecas que mudam o quadro por completo (NumPy em Python, arenas em C++ e Rust).
- **A inicialização está incluída** em todo tempo de processo inteiro e domina as execuções curtas das linguagens rápidas. A coluna `trecho` a exclui.
- **Paralelismo** usa um trabalho que leva uma fração de segundo nas linguagens compiladas, então criar os workers é uma parte visível dele. O host tem 8 núcleos físicos com SMT: 16 workers não conseguem dar 16 vezes.
- **Concorrência** mede um início a frio. O número da JVM é dominado por código que o JIT ainda não compilou: o mesmo laço repetido em uma JVM aquecida levou mais de 10 vezes menos em uma verificação manual. As threads de SO em C++ param em 10.000 porque 100.000 threads chegariam perto do limite de threads da máquina virtual do Docker (`kernel.threads-max` era 127.543), compartilhada com outros trabalhos.
- **HTTP** compara pilhas, não linguagens. Python e Bun rodam um processo, o padrão deles, enquanto os outros usam os 4 núcleos. Cliente e servidor dividem a máquina, o modelo de carga é fechado (a latência sob sobrecarga é subestimada), e quando a coluna de CPU do k6 está perto de 400 % o limite é o gerador de carga.
- **Banco de dados** mede principalmente o driver e a ida e volta. Os drivers diferem em padrões que pesam mais que a linguagem, como preparar um comando uma vez ou a cada chamada. O PostgreSQL mantém os dados em memória aqui.
- **Build** usa um programa de um arquivo. Python, Bun, Java e Elixir não produzem código de máquina antes da hora, então as linhas deles medem outra etapa, nomeada na tabela.
- **Tamanho do binário** não conta o sistema operacional nem a glibc, e nada passa por strip.
- Velocidade, memória e tamanho são só algumas das razões para escolher uma linguagem. Segurança, facilidade de escrever, bibliotecas e a experiência do time não estão em tabela nenhuma.

## Lacunas encontradas no runner compartilhado

Nada em `tools/` foi alterado. Estas foram contornadas dentro de `benchmarks/`:

- O runner só acha um projeto por caminho ou em `projects/<area>/`. O `benchmarks/package.json` tem seu próprio script `bench`, então `bun run bench -- --project cpu-single` funciona a partir de `benchmarks/`.
- O trecho medido é lido uma vez por linha, o que é ruidoso demais para o speed-up. O `scripts/collect-sections.ts` coleta 5 amostras.
- Não há etapa antes de cada execução cronometrada (necessária para builds frios), nem modo de serviço de longa duração (HTTP, banco), nem métrica de tamanho. Cada um tem seu coletor, que escreve os mesmos três arquivos de resultado.
- O runner reconstrói a imagem do hyperfine a cada chamada, o que consulta o registry e falha em um timeout. O `bun run all` repete a etapa que falhar.

## Tópicos do quiz que ele demonstra

As áreas do quiz que estas cargas ilustram são concorrência e paralelismo, sistemas operacionais (processos, threads, escalonamento), gerência de memória, compiladores e interpretadores, redes (HTTP) e bancos de dados. Os links são adicionados quando essas áreas do quiz forem escritas.
