# ten-thousand-connections

> English version: [README.md](README.md)

O mesmo pequeno servidor HTTP escrito três vezes: em um event loop (TypeScript no Bun), com uma goroutine por conexão (Go) e com um processo da BEAM por conexão (Elixir). Depois, um cenário local do k6 abre 10.000 conexões contra cada um, mantém todas abertas e ociosas por 30 segundos e mede quanta memória cada conexão custa e se o servidor continua respondendo rápido enquanto isso.

A lição: uma conexão esperando não precisa de uma thread. Os três runtimes chegam a esse resultado por três caminhos diferentes, explicados em [docs/pt/concurrency/ten-thousand-connections.md](../../../docs/pt/concurrency/ten-thousand-connections.md).

> **Somente local.** O script de carga se recusa a rodar quando o alvo não é `localhost` ou um dos três serviços deste docker-compose. Nunca aponte um teste de carga para um host que não é seu.

## Tópicos do quiz que ele demonstra

- `concurrency` / `async-and-event-loop`: uma thread atendendo milhares de conexões ociosas
- `concurrency` / `actor-model-and-beam`: um processo barato da BEAM por conexão
- `concurrency` / `concurrency-vs-parallelism`: goroutines e processos comparados a threads do sistema operacional

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-ten-thousand-connections.sh        # Linux e macOS
./setup-windows-ten-thousand-connections.ps1    # Windows
```

O script constrói as imagens, roda os testes unitários de cada linguagem, roda a suíte de protocolo contra os três servidores e confere que o k6 recusa um alvo que não é local. Leva cerca de um minuto.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/` | Servidor em `Bun.serve`: uma thread, um event loop, `await Bun.sleep(ms)` |
| `go/` | Servidor em `net/http`: uma goroutine por conexão, `time.After(ms)` |
| `elixir/` | Servidor escrito sobre `:gen_tcp`, sem biblioteca: um processo por conexão, `Process.sleep(ms)` |
| `protocol/` | Uma única suíte de testes de protocolo, executada contra os três servidores |
| `load/hold.js` | O cenário do k6 |
| `load/target.js` | A regra que recusa alvos que não são locais |
| `load/report.ts` | Transforma os três resumos do k6 em `results/results.md` |

Os três servidores não têm dependências e falam o mesmo protocolo na porta 8080:

| Rota | Resposta |
| --- | --- |
| `GET /health` | `200`, corpo `ok` |
| `POST /echo` | `200`, o mesmo corpo e o mesmo `Content-Type` |
| `GET /delay?ms=N` | espera `N` milissegundos (0 a 60000) e responde `200` com `{"waitedMs":N}`. Qualquer outra coisa é `400` |
| `GET /stats` | `200` com `{"runtime", "inFlight", "rssKb"}`: requisições em andamento agora e memória residente do processo |
| outro caminho, outro método | `404`, `405` |

Tudo roda em uma rede docker marcada como `internal`, sem rota para fora e sem porta publicada no host.

## Testes

```sh
docker compose run --rm ts-test          # testes unitários, também: go-test, elixir-test
docker compose run --rm protocol-test    # os mesmos 8 testes contra cada um dos 3 servidores
docker compose run --rm k6-refusal-test  # o k6 precisa recusar https://example.com
docker compose --profile load down       # para os servidores
```

| O que é testado | Onde |
| --- | --- |
| Os três servidores respondem ao mesmo protocolo: 24 testes, 8 por servidor | `protocol/protocol.test.ts` |
| 300 requisições que esperam 500 ms cada são atendidas ao mesmo tempo, em todos os servidores | mesmo arquivo |
| Rotas, validação de entrada e esperas sobrepostas, sem socket | `ts/tests/app.test.ts`, `go/server_test.go`, `elixir/test/` |
| A regra de alvo local aceita loopback e os três nomes de serviço, e recusa parecidos como `http://localhost@example.com` | `ts/tests/target.test.ts` |
| O k6 termina com erro e não abre conexão quando `TARGET` não é local | `load/refusal-test.sh` |

Formatadores e linters: `gofmt` e `go vet` rodam em `go-test`, `mix format --check-formatted` roda em `elixir-test`. O Biome e o golangci-lint usam a configuração da raiz do repositório:

```sh
bunx biome check projects/concurrency/ten-thousand-connections
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Teste de carga

```sh
docker compose --profile load down               # servidores novos, para a memória ociosa ser uma linha de base real
docker compose --profile load run --rm report    # ts, depois go, depois elixir, depois a tabela
docker compose --profile load down               # para os servidores
```

O segundo comando roda o k6 contra um servidor por vez e escreve [results/results.md](results/results.md). Leva cerca de dois minutos e meio. Em uma máquina pequena, diminua o número definindo antes a variável de ambiente `CONNECTIONS`, por exemplo `CONNECTIONS=2000 docker compose --profile load run --rm report` em um shell Unix.

A linha do tempo de uma execução:

```
0s          10s                                  40s
hold  |-- 10.000 conexões abrem, 500 por vez, e cada uma fica aberta por 30 s --|
echo            |-- 50 POST /echo por segundo durante 12 s, latência registrada --|
probe                     | GET /stats: requisições em andamento e memória |
```

O k6 mantém as 10.000 conexões com 20 usuários virtuais que abrem 500 conexões cada (`http.batch`). Dez mil usuários virtuais precisariam de mais memória do que os servidores testados.

## Resultados

Medido na máquina descrita em [results/results.md](results/results.md), com 10.000 conexões pedidas e 10.000 mantidas por todos os servidores:

| Servidor | Memória ociosa (MiB) | Memória mantendo as conexões (MiB) | Memória por conexão (KiB) | echo p50 (ms) | echo p95 (ms) | echo p99 (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ts (Bun, event loop) | 18,9 | 58,6 | 4,1 | 0,49 | 3,53 | 11,07 |
| go (goroutines) | 7,9 | 167,1 | 16,3 | 0,53 | 3,82 | 10,57 |
| elixir (processos da BEAM) | 86,1 | 182,7 | 9,9 | 0,56 | 2,57 | 6,24 |

O que a tabela mostra:

- Todos os modelos mantêm 10.000 conexões ociosas com poucos kibibytes cada. Para comparar, o Linux normalmente reserva 8 MiB de espaço de endereçamento para a pilha de cada thread do sistema operacional, e uma thread bloqueada ainda precisa ser escalonada pelo kernel.
- O event loop é o mais barato por conexão: uma requisição esperando é um socket, um timer e uma promise, sem pilha nenhuma. Uma goroutine mantém uma pilha (que começa com poucos kibibytes) e o `net/http` mantém buffers de leitura e de escrita por conexão. Um processo da BEAM mantém seu próprio heap e sua pilha, ambos pequenos.
- A latência de requisições novas fica abaixo de um milissegundo na mediana com 10.000 conexões abertas. Conexões ociosas custam memória, não tempo de processador.
- A BEAM começa com a maior memória ociosa: a própria máquina virtual é o custo fixo.

O que ela **não** mostra: esta carga só espera. Com trabalho pesado de processador no handler o quadro muda, porque um callback ocupado bloqueia o event loop inteiro, enquanto Go e a BEAM espalham o trabalho por todos os núcleos e interrompem código demorado.

Leia os números como ordens de grandeza. A memória foi a mesma em duas execuções seguidas (diferença menor que 2 MiB). A latência não: na primeira execução, com outros contêineres ocupados na máquina, o servidor Go mostrou p95 de 238 ms e p99 de 361 ms, e na segunda, a que está versionada, 3,82 ms e 10,57 ms.
