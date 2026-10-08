# bun-vs-node

> English version: [README.md](README.md)

A mesma API HTTP, escrita uma vez, servida de três formas: pelo Bun, por um único processo Node.js, e pelo Node.js no modo cluster do PM2 com quatro workers. Um cenário local de k6 aplica carga em um endpoint CPU-bound e em um endpoint I/O-bound de cada configuração, e um relatório transforma as execuções em uma tabela de requisições por segundo, latência p95 e memória. A lição é que a vazão depende de duas coisas separadas: a velocidade com que o runtime executa o seu código, e quantos processos o modelo de processos deixa você usar.

Código: MP-PERF-1. Explicação completa: [docs/pt/performance/bun-vs-node.md](../../../docs/pt/performance/bun-vs-node.md).

> **Somente local.** O k6 roda em uma rede Docker interna, sem porta publicada, e o script de carga se recusa a rodar quando o alvo não é `localhost` ou um dos três serviços deste docker-compose. Nunca aponte um teste de carga para um host que não é seu.

## Resultados

Mediana das rodadas, com a menor e a maior rodada entre parênteses. Gerado pelo teste de carga. Não edite à mão.

<!-- results:start -->
| Configuração | Runtime | Rodadas | CPU-bound: requisições/s | CPU-bound: p95 (ms) | I/O-bound: requisições/s | I/O-bound: p95 (ms) | Pico de memória (MiB) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `bun` | Bun 1.4.2 | 3 | 84 (67 to 84) | 409 (406 to 585) | 9084 (5259 to 9515) | 26.0 (22.2 to 97.2) | 39 (35 to 39) |
| `node` | Node.js 24.21.0 | 3 | 71 (61 to 73) | 656 (655 to 829) | 8205 (6189 to 8486) | 29.2 (27.1 to 71.0) | 95 (70 to 98) |
| `node-pm2` | Node.js 24.21.0 | 3 | 249 (240 to 259) | 225 (220 to 242) | 9226 (8537 to 9274) | 23.7 (23.2 to 31.0) | 193 (193 to 194) |
<!-- results:end -->

Máquina, versões, carga de trabalho e a definição de cada coluna estão em [results/results.md](results/results.md). A máquina estava compartilhada com outros programas durante a medição, então os números têm ruído: leia a faixa antes de acreditar em uma diferença.

## Tópicos do quiz que ele demonstra

- `performance` / `runtime-performance`: o event loop de thread única, trabalho CPU-bound bloqueando todas as outras requisições, modo cluster e o seu custo de memória
- `performance` / `latency-throughput-percentiles`: requisições por segundo contra latência p95, e por que as duas são informadas
- `performance` / `benchmarking-methodology`: mesma carga e mesmo orçamento de CPU para todas as configurações, aquecimento que não é medido, várias rodadas, faixa informada
- `performance` / `k6-fundamentals`: cenários, o modelo fechado do `constant-vus`, checks com threshold, `handleSummary`
- `performance` / `capacity-planning-queueing`: o que adicionar workers consegue e não consegue comprar

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-bun-vs-node.sh        # Linux e macOS
./setup-windows-bun-vs-node.ps1    # Windows
```

O script constrói as duas imagens, roda a checagem de tipos e os testes de unidade, roda uma única suíte de testes de API contra os três servidores, confere que o k6 recusa um alvo que não é local, e remove os contêineres no fim.

## Teste de carga (o benchmark)

```sh
./load-test-unix.sh            # Linux e macOS, argumento opcional: número de rodadas
./load-test-windows.ps1        # Windows, opcional: -Rounds 3
```

Um comando, cerca de quatro minutos com três rodadas. Para cada configuração e cada rodada ele sobe um contêiner de servidor novo, roda o k6 (aquecimento, depois 8 s em `/cpu`, depois 8 s em `/io`), e para o servidor, então as configurações nunca competem entre si. Depois o relatório reescreve `results/` e a tabela acima. Os resumos brutos do k6 vão para `k6-results/`, que o git ignora.

Variáveis: `CPU_LIMIT` (CPUs por contêiner de servidor, padrão 4) e `WORKERS` (instâncias do PM2, padrão 4).

## Testes

```sh
docker compose run --rm ts-test           # checagem de tipos e testes de unidade, sem rede
docker compose run --rm api-test          # uma suíte contra os três servidores
docker compose run --rm k6-refusal-test   # o k6 precisa recusar https://example.com
docker compose down -v
```

| O que é provado | Onde |
| --- | --- |
| A API responde igual no Bun, no Node.js e no Node.js com PM2 (mesmos primos, mesmos erros) | `ts/tests/api/api.test.ts` |
| Um processo responde em `bun` e `node`, vários em `node-pm2` | `ts/tests/api/api.test.ts` |
| Cinquenta requisições I/O-bound se sobrepõem em um único event loop | `ts/tests/api/api.test.ts` |
| Trabalho CPU-bound impede um timer vencido de disparar | `ts/tests/unit/work.test.ts` |
| A regra de alvo local aceita loopback e os três nomes de serviço, e recusa parecidos como `http://localhost@example.com` | `ts/tests/unit/target.test.ts` |
| O k6 termina com erro e não envia nada quando `BASE_URL` não é local | `load/refusal-test.sh` |
| O relatório calcula mediana e faixa, e falha com configuração ausente ou requisições com erro | `ts/tests/unit/report.test.ts` |

## API

| Rota | O que faz |
| --- | --- |
| `GET /cpu?n=200000` | CPU-bound: conta os primos abaixo de `n` por divisão por tentativa (2 a 2.000.000) |
| `GET /io?ms=20` | I/O-bound: espera `ms` milissegundos em um timer, como uma consulta enviada a um banco (0 a 1000) |
| `GET /health` | Configuração, runtime, versão do runtime e o id do processo que respondeu |
| `GET /memory` | Memória do contêiner inteiro, lida dos arquivos de cgroup |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/app.ts` | A API, com validação Zod, independente do runtime |
| `ts/src/work.ts` | O trabalho CPU-bound e o I/O-bound |
| `ts/src/bun-server.ts` | A API no `Bun.serve` |
| `ts/src/node-server.ts` | A API no `node:http`, usada sozinha e pelo PM2 |
| `ts/ecosystem.config.cjs` | Modo cluster do PM2 |
| `ts/src/memory.ts` | Memória do contêiner pelo cgroup v2 |
| `ts/src/report.ts` | Agrega os resumos do k6 na tabela |
| `load/scenario.js` | O cenário do k6 |
| `load/target.js` | A regra que recusa alvos que não são locais |
| `results/` | Os resultados versionados |

`load/target.js` é uma cópia da regra usada por `projects/concurrency/ten-thousand-connections`, com os nomes de serviço deste projeto. Um mini-projeto nunca importa código de outro.

## Versões

| Componente | Versão |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| Node.js | `node:24.21.0-bookworm-slim` (LTS) |
| PM2 | 7.0.4, instalado com npm na imagem do Node.js |
| k6 | `grafana/k6:2.3.0` |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |

O Node.js executa o código TypeScript compilado em um único arquivo CommonJS pelo `bun build` (um estágio de build do `ts/node.Dockerfile`). O PM2 está fixado, mas o npm resolve as dependências dele na construção da imagem, porque uma instalação global não tem lockfile.
