# counter-race

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Oito workers somam 1 ao mesmo contador, 125.000 vezes cada um. A resposta deveria ser 1.000.000. Sem sincronização ela não é, porque `counter++` são três passos (ler, somar, gravar) e dois workers podem ler o mesmo valor antigo. Este mini-projeto mostra essa atualização perdida em Go, Rust, Java e TypeScript, e depois a corrige de quatro formas: mutex, operação atômica, troca de mensagens e ator.

A explicação mais longa está em [docs/pt/concurrency/counter-race.md](../../../docs/pt/concurrency/counter-race.md).

> Os contadores com bug são **propositalmente errados** e estão marcados assim no código. O de Rust usa `unsafe` para desligar a verificação do compilador que, sem isso, se recusaria a compilá-lo.

## Tópicos do quiz que ele demonstra

- `concurrency` / `race-conditions`: atualizações perdidas, seções críticas, detectores de corrida
- `concurrency` / `mutexes-and-locks`: a correção com mutex
- `concurrency` / `atomics-and-memory-models`: a correção atômica, e por que `volatile` não é uma
- `concurrency` / `message-passing-and-channels`: um único dono do estado atrás de um canal
- `concurrency` / `actor-model-and-beam`: um processo Elixir como dono do estado

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-counter-race.sh        # Linux e macOS
./setup-windows-counter-race.ps1    # Windows
```

O script constrói as cinco imagens e roda todos os testes. Leva alguns minutos, porque cada correção é executada 100 vezes.

## Estrutura

| Pasta | Versão com bug | Correções |
| --- | --- | --- |
| `go/` | `BuggyCounter` (`c.n++`) | `sync.Mutex`, `atomic.Int64`, uma goroutine dona do número atrás de um canal |
| `rust/` | `BuggyCounter` (`UnsafeCell` e um `unsafe impl Sync` falso) | `Mutex<u64>`, `AtomicU64`, uma thread dona do número atrás de um canal `mpsc` |
| `java/` | `BuggyCounter` (`count++` em um campo `volatile`) | `synchronized`, `AtomicLong`, uma thread dona do número atrás de uma `BlockingQueue` |
| `ts/` | `incBuggy` em um `SharedArrayBuffer` compartilhado por worker threads | um mutex feito com `Atomics.compareExchange` e `Atomics.wait`, `Atomics.add`, `postMessage` para a thread principal |
| `elixir/` | `get_then_set` (duas mensagens, então a atualização se perde de novo) | `inc`: um processo é dono do número e trata uma mensagem por vez |

Cada pasta tem seu próprio Dockerfile em uma imagem fixada. Os contêineres rodam sem rede.

## Testes

```sh
docker compose run --rm go-test      # também: rust-test, java-test, ts-test, elixir-test
```

| O que é testado | Onde |
| --- | --- |
| O contador com bug termina abaixo de 1.000.000 em pelo menos 24 de 30 execuções | Go, Rust, Java, TypeScript |
| Toda correção chega a exatamente 1.000.000 em 100 execuções seguidas | as cinco linguagens |
| O detector de corrida do Go (`-race`) acusa o contador com bug e fica calado nas três correções | `go/counter_test.go` |
| O Error Prone (verificação `GuardedBy`) acusa o contador com bug em Java e fica calado nas três correções | `java/check-guarded-by.sh` |
| Em Elixir, `get` seguido de `set` perde atualizações mesmo com um ator | `elixir/test/` |

`FIXED_RUNS=10` diminui o número de repetições em uma máquina lenta, por exemplo `docker compose run --rm -e FIXED_RUNS=10 ts-test`.

A saída dos detectores nos dois casos fica no log de teste, e uma cópia está versionada em [results/race-detector-go.txt](results/race-detector-go.txt) e [results/race-detector-java.txt](results/race-detector-java.txt).

Linters e formatadores rodam dentro dos mesmos contêineres, antes dos testes: `gofmt` e `go vet`, `cargo fmt` e `clippy`, Spotless com google-java-format e `javac -Xlint:all -Werror`, `mix format`. O Biome e o golangci-lint usam a configuração da raiz do repositório:

```sh
bunx biome check projects/concurrency/counter-race
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Demo

```sh
docker compose run --rm go-demo      # também: rust-demo, java-demo, ts-demo, elixir-demo
```

Saída da demo em Go na máquina descrita em [results/results.md](results/results.md):

```text
variant       final       lost         ms
buggy        230786     769214        5.4
mutex       1000000          0       30.7
atomic      1000000          0       13.1
channel     1000000          0      393.6
```

A versão com bug é a mais rápida e perde três quartos do trabalho.

## Benchmark

```sh
bun run bench -- --project projects/concurrency/counter-race
bun run projects/concurrency/counter-race/throughput.ts
```

O primeiro comando mede cada implementação com 1, 2, 4 e 8 workers e escreve [results/results.md](results/results.md). O segundo deriva [results/throughput.md](results/throughput.md), em milhões de incrementos por segundo. O `dashboard/index.html` mostra os mesmos dados em gráfico e abre direto do disco.

O que a tabela mostra:

- Mais workers **não** deixam um contador compartilhado mais rápido. Todos disputam uma única posição de memória, então os núcleos gastam o tempo passando essa linha de cache de um para o outro. A vazão cai de 1 para 8 workers em quase todas as linhas.
- Uma operação atômica ganha de um mutex na maioria das linhas, e a troca de mensagens é a correção mais lenta em todas as linguagens, por até duas ordens de grandeza. Uma mensagem custa uma operação de fila e, muitas vezes, uma troca de contexto.
- Troca de mensagens e atores compensam o custo quando o estado é maior que um número e as regras para alterá-lo são mais do que uma soma.

Os números são de uma máquina compartilhada, com outros contêineres rodando, então leia-os como ordens de grandeza.
