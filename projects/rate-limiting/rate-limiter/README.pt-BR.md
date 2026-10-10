# rate-limiter

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

"No máximo 10 requisições por segundo" parece uma regra só, mas cinco algoritmos a aplicam de cinco jeitos diferentes, e a diferença só aparece quando o tráfego chega em rajadas. Este mini-projeto implementa janela fixa, janela deslizante (log e contador), token bucket e leaky bucket em memória, entrega a todos o mesmo tráfego e desenha o que cada um deixa passar. Depois leva o limitador para o Redis, onde duas instâncias da aplicação compartilham um contador por meio de um script Lua atômico, e mostra a corrida que aparece sem ele.

Código: MP-RL-1. Explicação completa: [docs/pt/rate-limiting/rate-limiter.md](../../../docs/pt/rate-limiting/rate-limiter.md).

## Resultados

As mesmas 80 requisições, com todos os algoritmos configurados para 10 requisições por segundo. Gerado pelo experimento em [results/burst.md](results/burst.md).

| Série | abaixo do limite (0-1 s) | rajada na fronteira (1-3 s) | sobrecarga contínua (3-6 s) | rajada instantânea após silêncio (6-8 s) | Total | pior intervalo de 1 s |
| --- | --- | --- | --- | --- | --- | --- |
| Tráfego oferecido | 5 | 20 | 40 | 15 | 80 | 20 |
| Janela fixa | 5 | 20 | 20 | 10 | 55 | 20 |
| Janela deslizante (log) | 5 | 10 | 20 | 10 | 45 | 10 |
| Janela deslizante (contador) | 5 | 11 | 20 | 10 | 46 | 11 |
| Token bucket | 5 | 11 | 29 | 10 | 55 | 19 |
| Leaky bucket (admitidas) | 5 | 11 | 29 | 10 | 55 | 19 |
| Leaky bucket (saindo da fila) | 5 | 11 | 29 | 10 | 55 | 10 |

![Requisições admitidas ao longo do tempo por cada algoritmo](results/burst.pt-BR.svg)

"Pior intervalo de 1 s" é o maior número de requisições que passou em qualquer intervalo de um segundo, comece onde começar. É a medida honesta de um limite de "10 por segundo":

- A **janela fixa** deixa passar 20 em 200 ms: 10 no fim de uma janela e 10 no começo da seguinte.
- O **log deslizante** nunca passa de 10, ao preço de guardar um instante por requisição admitida.
- O **contador deslizante** guarda dois números e erra por um aqui (11), porque supõe que a janela anterior foi uniforme.
- O **token bucket** permite uma rajada do tamanho da capacidade e depois a taxa de reposição, ou seja, até capacidade + taxa × tempo. Isso é proposital: a capacidade é a rajada que você decidiu tolerar.
- O **leaky bucket** admite as mesmas requisições que o token bucket, mas as libera uma a cada 100 ms. Entra uma rajada, sai um fluxo uniforme.

## Tópicos do quiz que ele demonstra

- `rate-limiting` / `fixed-window`: janelas alinhadas, um contador por cliente, a rajada dupla na fronteira
- `rate-limiting` / `sliding-window`: o log deslizante e seu custo de memória, a fórmula do contador deslizante e sua aproximação
- `rate-limiting` / `token-bucket`: capacidade como tamanho da rajada, taxa de reposição como taxa média, reposição preguiçosa, o teto
- `rate-limiting` / `leaky-bucket`: a leitura como fila, saída constante, comparação com o token bucket
- `rate-limiting` / `redis-distributed`: contador compartilhado, a corrida de verificar e depois agir, o script Lua atômico, `EVALSHA` e `NOSCRIPT`, o relógio do Redis
- `rate-limiting` / `http-429-and-backoff`: `429 Too Many Requests` com `Retry-After`

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-rate-limiter.sh        # Linux e macOS
./setup-windows-rate-limiter.ps1    # Windows
```

O script constrói as imagens e roda três suítes de teste: os algoritmos em memória em TypeScript, os mesmos em Go (com o detector de corridas), e duas instâncias da aplicação compartilhando um Redis sob 400 requisições concorrentes. No fim ele remove os contêineres e a rede.

## Experimento de rajada (a demonstração)

```sh
./experiment-unix.sh            # Linux e macOS
./experiment-windows.ps1        # Windows
```

Um comando: ele roda o experimento e regrava `results/burst.json`, `results/burst.md`, `results/burst.svg`, `results/burst.pt-BR.svg` e `results/burst.es.svg`. O gráfico é um arquivo SVG puro, sem script e sem referência externa, então abre do disco em qualquer navegador. O experimento é uma simulação com relógio injetado: leva milissegundos, não envia nada a lugar nenhum e dá os mesmos números em qualquer máquina. Um teste falha quando `results/` está desatualizado.

A implementação em Go imprime a mesma tabela: `docker compose run --rm go-test go run ./cmd/experiment`.

## Testes

```sh
docker compose run --rm ts-test             # checagem de tipos, tabela de casos, experimento, respostas HTTP
docker compose run --rm go-test             # gofmt, go vet, golangci-lint, go test -race
docker compose run --rm distributed-test    # duas instâncias e o Redis
docker compose down -v
```

- **Tabela de casos.** `cases/cases.json` tem 15 linhas do tempo ("uma requisição chega neste milissegundo e deve ser admitida ou rejeitada"), resolvidas à mão a partir da definição de cada algoritmo. TypeScript e Go leem o mesmo arquivo.
- **Relógio determinístico.** Todo limitador recebe o tempo como argumento (`allow(nowMs)`), então nenhum teste espera.
- **Duas instâncias.** `limiter-a` e `limiter-b` rodam a mesma imagem contra um único Redis. Com o script atômico elas admitem exatamente 50 de 400 requisições concorrentes, em cinco rodadas. Com o `GET` seguido de `INCR` ingênuo, a mesma multidão faz passar mais de 50: até 192 nas rodadas medidas, e exatamente 50 em algumas delas. Uma corrida é questão de tempo, e por isso o teste repete a rodada até uma ultrapassar o limite.

## Regras do laboratório

O Redis e as duas instâncias conversam em uma rede interna do docker-compose: nenhum contêiner alcança a internet e nenhuma porta é publicada no host. O teste concorrente lê seus alvos de `TARGETS`, cujo padrão são os dois serviços do compose, e se recusa a começar quando algum host não é local.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `cases/cases.json` | Tabela de requisições admitidas e rejeitadas ao longo do tempo, compartilhada pelas duas linguagens |
| `ts/src/fixed-window.ts`, `sliding-log.ts`, `sliding-counter.ts`, `token-bucket.ts`, `leaky-bucket.ts` | Os cinco algoritmos, um arquivo para cada |
| `ts/src/experiment.ts`, `chart.ts`, `report.ts` | O experimento de rajada, o gráfico SVG e a tabela |
| `lua/fixed-window.lua`, `lua/token-bucket.lua` | Os scripts atômicos que rodam dentro do Redis |
| `ts/src/redis-limiter.ts`, `app.ts`, `server.ts` | O limitador distribuído e seu serviço HTTP (`GET /hit?strategy=...&key=...`) |
| `go/` | Os mesmos algoritmos protegidos por um mutex, com um teste de concorrência |
| `results/` | Saída do experimento |

## Observações

- Um objeto limitador guarda o estado de um cliente. Um serviço real mantém um mapa da chave do cliente para o seu limitador.
- O leaky bucket é implementado como fila: `schedule(nowMs)` devolve quando uma requisição admitida sai. A primeira requisição em um balde vazio sai na hora. Alguns textos a fazem esperar um intervalo; o espaçamento entre as saídas é o mesmo.
- O cliente Redis é o embutido no Bun (`RedisClient`), então a única dependência é o Zod, usado para validar o arquivo de casos, o ambiente, a query string e as respostas dos scripts.
- Nenhum código é importado de outro mini-projeto.
