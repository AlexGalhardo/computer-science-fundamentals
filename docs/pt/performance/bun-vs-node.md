# Bun contra Node (MP-PERF-1)

> English version: [docs/en/performance/bun-vs-node.md](../../en/performance/bun-vs-node.md) · Versión en español: [docs/es/performance/bun-vs-node.md](../../es/performance/bun-vs-node.md)

Mini-projeto: [`projects/performance/bun-vs-node`](../../../projects/performance/bun-vs-node/README.pt-BR.md). Tópicos do quiz: `runtime-performance`, `latency-throughput-percentiles`, `benchmarking-methodology`, `k6-fundamentals`, `capacity-planning-queueing`.

## A pergunta

"Qual é mais rápido, Bun ou Node?" não tem uma resposta única, porque duas coisas diferentes decidem a vazão de um servidor:

1. **O runtime**: a velocidade com que o motor executa o seu JavaScript (JavaScriptCore no Bun, V8 no Node.js) e quanto o servidor HTTP dele custa por requisição.
2. **O modelo de processos**: quantos processos executam o seu código. O JavaScript roda em uma thread por processo, então um processo usa um núcleo para o seu código, tenha a máquina quantos núcleos tiver.

O mini-projeto separa as duas. A API é escrita uma vez (`ts/src/app.ts`) e servida de três formas:

| Configuração | Runtime | Processos |
| --- | --- | --- |
| `bun` | Bun, `Bun.serve` | 1 |
| `node` | Node.js, `node:http` | 1 |
| `node-pm2` | Node.js, `node:http` | 4 workers no modo cluster do PM2 |

Todo contêiner tem o mesmo limite de CPU (4 CPUs), então `bun` contra `node` compara runtimes, e `node` contra `node-pm2` compara modelos de processos com o runtime fixo.

## CPU-bound e I/O-bound

```text
Requisição CPU-bound (GET /cpu)        Requisição I/O-bound (GET /io)

event loop: [conta primos........]     event loop: [inicia timer][livre.......][responde]
            ninguém mais roda aqui                  outras requisições rodam aqui
```

- `GET /cpu` conta primos. O event loop fica ocupado durante a requisição inteira, então as requisições são atendidas estritamente uma depois da outra em cada processo. Com 32 clientes esperando, uma requisição passa a maior parte do tempo na fila.
- `GET /io` espera 20 ms em um timer, que representa uma consulta enviada a um banco. Enquanto espera, o event loop fica livre, então um processo segura milhares delas ao mesmo tempo.

O teste de unidade "CPU-bound work blocks the event loop" mostra o primeiro caso sem servidor nenhum: um timer que venceria em 1 ms só dispara depois que a contagem de primos termina.

## O que o modo cluster faz

`pm2-runtime start ecosystem.config.cjs` inicia quatro cópias do mesmo servidor pelo módulo `cluster` do Node.js. O processo primário é dono do socket de escuta e entrega cada **conexão** nova a um worker. Consequências:

- A vazão CPU-bound cresce com o número de workers, até o número de núcleos disponíveis.
- A vazão I/O-bound quase não muda: um event loop não era o limite.
- Os workers não compartilham memória. Cada um tem o seu heap, então a memória cresce com o número de workers, e tudo que fica na memória do processo (sessões, caches, contadores) é diferente em cada worker.
- Uma conexão keep-alive fica no worker que a aceitou. O teste de API envia `Connection: close` para ver mais de um id de processo.

## Resultados medidos

A tabela versionada está no [README](../../../projects/performance/bun-vs-node/README.pt-BR.md#resultados) e em `results/results.md`, com a máquina e as versões. Na execução versionada (mediana de 3 rodadas, da menor à maior entre parênteses):

| Configuração | Requisições/s CPU-bound | p95 CPU-bound | Requisições/s I/O-bound | Pico de memória |
| --- | --- | --- | --- | --- |
| `bun` | 84 (67 a 84) | 409 ms | 9084 (5259 a 9515) | 39 MiB |
| `node` | 71 (61 a 73) | 656 ms | 8205 (6189 a 8486) | 95 MiB |
| `node-pm2` | 249 (240 a 259) | 225 ms | 9226 (8537 a 9274) | 193 MiB |

Como ler sem se enganar:

- **Modelo de processos, CPU-bound**: quatro workers atenderam cerca de 3,5 vezes as requisições de um processo Node.js (249 contra 71), e o p95 caiu de 656 ms para 225 ms. Não 4 vezes: o processo primário, o trabalho de HTTP e o k6 também precisam de CPU, e a máquina estava compartilhada.
- **Modelo de processos, I/O-bound**: as três ficam perto do mesmo teto. 200 usuários virtuais esperando 20 ms cada não conseguem enviar mais que 200 / 0,020 = 10.000 requisições por segundo, seja qual for o servidor. As faixas se sobrepõem, então não há diferença a relatar. Adicionar workers não compra nada quando o processador não é o gargalo.
- **Runtime, CPU-bound**: o Bun atendeu mais requisições que um processo Node.js nesta carga (84 contra 71), e as faixas (67 a 84, 61 a 73) se sobrepõem. É uma diferença pequena em um laço apertado em uma máquina, não uma lei sobre os dois runtimes.
- **Memória**: o cluster usou cerca do dobro da memória de um processo Node.js (193 MiB contra 95 MiB), para o daemon do PM2 e quatro heaps. O Bun usou menos. Vazão comprada com processos é paga em memória.
- **O p95 acompanha a fila**: em `/cpu` o p95 é aproximadamente o número de clientes dividido pela vazão (32 / 84 ≈ 0,38 s no Bun), porque toda requisição espera as que estão na frente. É a lei de Little na forma do modelo fechado.

## Método

- Uma configuração roda por vez, em um contêiner novo a cada rodada, com o mesmo limite de CPU.
- Uma fase de aquecimento roda antes da medição e não é contada, então o compilador JIT e as conexões já estão prontos.
- Três rodadas por configuração, informadas como mediana com a faixa. A máquina estava executando outros trabalhos, e as faixas mostram isso (uma rodada I/O do Bun caiu para 5259 requisições/s).
- O k6 roda na mesma máquina que o servidor e disputa a CPU com ele. Isso serve para comparar as configurações entre si e não serve para números absolutos.
- A execução falha quando qualquer requisição falha (threshold de `checks`), porque um servidor que devolve erros depressa parece rápido.

## Regras do teste de carga

O k6 roda da imagem fixada `grafana/k6:2.3.0` na rede interna do docker-compose. Nenhuma porta é publicada, e `load/target.js` lança um erro antes de qualquer requisição quando `BASE_URL` não é `localhost`, `127.0.0.1`, `[::1]` ou um dos três serviços. `docker compose run --rm k6-refusal-test` prova isso com `https://example.com`. A saída bruta do k6 vai para `k6-results/`, que o git ignora.

## Critérios de aceite

| Item | Como é verificado |
| --- | --- |
| MP-PERF-1.1 mesma API no Bun, no Node e no Node com cluster PM2: uma suíte passa contra os três | `docker compose run --rm api-test` (`ts/tests/api/api.test.ts`, 7 testes por configuração) |
| MP-PERF-1.2 cenário local de k6 com um endpoint CPU-bound e um I/O-bound, recusando alvos não locais | `docker compose run --rm k6-refusal-test` e `ts/tests/unit/target.test.ts` |
| MP-PERF-1.3 tabela de requisições por segundo, latência p95 e memória para cada configuração | `./load-test-unix.sh` (ou `.ps1`), que grava `results/results.md` |

## Como rodar

```sh
cd projects/performance/bun-vs-node
./setup-unix-bun-vs-node.sh     # testes
./load-test-unix.sh             # k6 e a tabela de resultados
```
