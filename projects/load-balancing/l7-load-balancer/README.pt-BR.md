# l7-load-balancer

> English version: [README.md](README.md)

Um balanceador de carga de camada 7 escrito à mão em Go, só com a biblioteca padrão, em cerca de 350 linhas de código mais os comentários. Ele mostra o que um balanceador de carga faz a cada requisição: escolher um back end (round robin ou least connections), encaminhar a requisição em outra conexão, copiar a resposta de volta, descobrir quais back ends estão vivos (verificações de saúde ativas) e decidir quando uma requisição que falhou pode ser enviada a outro back end. Um benchmark local com k6 então o compara com o NGINX na frente dos mesmos três back ends.

A explicação dos conceitos está em [docs/pt/load-balancing/l7-load-balancer.md](../../../docs/pt/load-balancing/l7-load-balancer.md).

> **Somente local.** O script do k6 se recusa a rodar quando o alvo não é `localhost` ou um dos três proxies deste docker-compose. Nunca aponte um teste de carga para um host que não é seu.

## Tópicos do quiz que ele demonstra

- `load-balancing` / `layer-4-vs-layer-7`: o proxy encerra a conexão do cliente e abre outra com o back end
- `load-balancing` / `balancing-algorithms`: round robin e least connections, com um back end lento
- `load-balancing` / `health-checks-and-failover`: verificações ativa e passiva, tempo de detecção, nova tentativa só quando é seguro
- `load-balancing` / `reverse-proxy-load-balancer-api-gateway`: cabeçalhos hop-by-hop e `X-Forwarded-For`

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-l7-load-balancer.sh        # Linux e macOS
./setup-windows-l7-load-balancer.ps1    # Windows
```

O script constrói a imagem, roda `gofmt`, `go vet` e os testes do Go com o detector de corridas, manda 30 requisições por cada proxy dentro do docker-compose, confere que o k6 recusa um alvo que não é local e remove tudo. Leva cerca de um minuto.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `go/balancer/pool.go` | Os back ends e seus contadores: saudável, requisições em andamento, requisições atendidas |
| `go/balancer/strategy.go` | A escolha: `RoundRobin` e `LeastConnections` |
| `go/balancer/proxy.go` | Uma requisição: encaminhar, reescrever cabeçalhos, copiar a resposta, tentar de novo |
| `go/balancer/health.go` | A verificação de saúde ativa |
| `go/cmd/lb` | O balanceador como programa, configurado por variáveis de ambiente |
| `go/cmd/backend` | O back end trivial usado pelo benchmark |
| `go/cmd/report`, `go/report` | Transforma os resumos do k6 em `results/benchmark.md` |
| `load/bench.js`, `load/run-all.sh` | O cenário do k6 e as rodadas do benchmark |
| `load/target.js` | A regra que recusa alvos que não são locais |
| `nginx/nginx.conf` | A referência: NGINX com round robin sobre os mesmos back ends |

O balanceador é configurado com `BACKENDS` (lista de `http://host:porta` separada por vírgulas), `STRATEGY` (`round-robin` ou `least-connections`), `HEALTH_PATH`, `HEALTH_INTERVAL` e `HEALTH_TIMEOUT`. Ele mesmo responde `GET /lb/status`, com o estado de cada back end, e encaminha todo o resto.

Tudo roda em uma rede docker marcada como `internal`, sem rota para fora e sem porta publicada no host.

## Testes

```sh
docker compose run --rm go-test          # gofmt, go vet, 17 testes do Go com -race, sem rede
docker compose run --rm smoke-test       # 30 requisições por cada proxy, 10 por back end
docker compose run --rm k6-refusal-test  # o k6 precisa recusar 8 alvos que não são locais
docker compose --profile bench down -v
```

Os testes do Go são testes de integração em miniatura: servidores HTTP reais na interface de loopback fazem o papel dos back ends, e as requisições passam pelo handler real do proxy.

| O que é testado | Teste em `go/balancer/balancer_test.go` |
| --- | --- |
| Round robin: 300 requisições, exatamente 100 por back end, na ordem a, b, c | `TestRoundRobinSplitsRequestsEvenly` |
| Com um back end fora, os outros dois recebem 50 cada | `TestRoundRobinSkipsUnhealthyBackend` |
| O least connections escolhe quem tem menos requisições em andamento e faz rodízio nos empates | `TestLeastConnectionsPicksTheIdlestBackend`, `TestLeastConnectionsBreaksTiesInRotation` |
| Um back end quatro vezes mais lento: o least connections dá a ele 1/9, o round robin 1/3, com 5 pontos de tolerância | `TestDistributionWithOneSlowBackend` |
| Um back end parado é removido dentro do intervalo de verificação, sem tráfego de clientes | `TestActiveCheckRemovesStoppedBackendWithinTheInterval` |
| 3000 requisições enquanto um back end é parado: nenhuma falha | `TestNoRequestFailsWhileABackendStops` |
| Um back end volta depois do número configurado de sondas bem sucedidas | `TestBackendReturnsAfterASuccessfulProbe` |
| Depois que a requisição foi enviada, um GET é repetido e um POST não | `TestRetryAfterSendingOnlyForIdempotentRequests` |
| Um POST é repetido quando a conexão foi recusada | `TestPostIsRetriedWhenTheConnectionWasRefused` |
| Nenhum back end saudável: 503, e nada é encaminhado | `TestNoHealthyBackendAnswers503` |
| Cabeçalhos hop-by-hop são removidos nos dois sentidos, `X-Forwarded-For` recebe o cliente no fim | `TestHeadersAreRewrittenForTheNextHop` |

A primeira versão do round robin falhou em `TestRoundRobinSkipsUnhealthyBackend` com 34 contra 66: ela começava em `contador % tamanho` e pulava os back ends mortos, então o vizinho de um back end morto recebia a fatia dele também. O comentário em `strategy.go` guarda a história.

Linters: `gofmt` e `go vet` rodam em `go-test`. O golangci-lint usa a configuração da raiz do repositório:

```sh
docker run --rm --network none -v "$PWD/go:/app:ro" -v "$PWD/../../..:/repo:ro" -w /app sef-go:local golangci-lint run -c /repo/.golangci.yml ./...
```

## Benchmark

```sh
docker compose --profile bench run --rm report   # cerca de três minutos, escreve results/
docker compose --profile bench down -v
```

O k6 mantém 50 usuários virtuais mandando `GET /work` por 10 segundos através de um proxy de cada vez: este balanceador com round robin, este balanceador com least connections, e o NGINX com round robin. Depois de um aquecimento descartado por proxy, a rodada dos três é repetida cinco vezes. `REPETITIONS`, `VUS` e `DURATION_S` mudam o cenário.

Execução versionada, na máquina descrita em [results/benchmark.md](results/benchmark.md). Mediana de cinco execuções, menor e maior valor entre parênteses:

| Proxy | Vazão (requisições/s) | Latência p50 (ms) | Latência p99 (ms) | Requisições com falha |
| --- | ---: | ---: | ---: | ---: |
| Este balanceador, round robin | 10584 (7863 a 17198) | 3,08 (2,07 a 3,84) | 22,31 (12,15 a 34,70) | 0 |
| Este balanceador, least connections | 9405 (7561 a 11521) | 3,19 (2,81 a 4,19) | 28,72 (21,88 a 40,73) | 0 |
| NGINX, round robin | 10129 (9983 a 12968) | 2,60 (1,98 a 2,77) | 26,47 (18,83 a 30,52) | 0 |

Como ler:

- **Nenhuma diferença pode ser afirmada.** As faixas se sobrepõem por completo. A máquina estava compartilhada com outras cargas enquanto isto rodava, e o k6 disputa os mesmos 16 núcleos com os proxies. Duas execuções anteriores no mesmo dia deram medianas de 6185, 6579 e 9588 requisições por segundo (três repetições) e depois 5586, 4974 e 5461 (cinco repetições), na mesma ordem de linhas. A dispersão entre execuções é maior que qualquer distância entre os proxies.
- **A ordem de grandeza é o resultado.** Algumas centenas de linhas de Go sobre `net/http` encaminham milhares de requisições por segundo com p99 de dezenas de milissegundos, a mesma faixa do NGINX nesta montagem, sem nenhuma requisição com falha em nenhuma execução.
- **O que ele não mostra.** O back end não faz nada, então isto mede a sobrecarga do proxy com requisições pequenas e conexões reaproveitadas. Não diz nada sobre corpos grandes, TLS, milhares de conexões ociosas, memória, ou uma máquina tranquila com o gerador de carga em outro lugar, onde se esperaria que um NGINX ajustado fosse melhor.

Para comparar dois proxies a sério, rode em uma máquina ociosa, aumente `REPETITIONS` e trate qualquer diferença menor que a faixa como ruído.
