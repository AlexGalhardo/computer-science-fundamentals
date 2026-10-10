# sliding-window-mini-tcp

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Como a confiabilidade é construída em cima de um canal que perde, duplica e reordena pacotes. O mini-projeto tem duas partes:

1. Um **canal simulado**, determinístico com semente fixa, e os três protocolos ARQ clássicos sobre ele: stop-and-wait, go-back-N e retransmissão seletiva. Escrito em Go e em Elixir.
2. Um **mini TCP sobre UDP** em Go: acordo de três vias, números de sequência por byte, confirmações cumulativas, tempo limite de retransmissão adaptativo e encerramento ordenado, transferindo um arquivo de 10 MB entre dois sockets UDP reais com perda injetada.

Explicação completa: [docs/pt/networks/sliding-window-mini-tcp.md](../../../docs/pt/networks/sliding-window-mini-tcp.md).

## Tópicos do quiz que ele demonstra

- `networks` / `data-link-layer`: stop-and-wait, números de sequência, go-back-N, retransmissão seletiva, limites do tamanho da janela, utilização do enlace
- `networks` / `transport-layer`: acordo de três vias, números de sequência e de confirmação, tempo limite de retransmissão, encerramento da conexão

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-sliding-window-mini-tcp.sh        # Linux e macOS
./setup-windows-sliding-window-mini-tcp.ps1    # Windows
```

O script constrói as imagens e roda os testes das duas linguagens.

## Demonstração

```sh
docker compose run --rm -T go-demo        # protocolos simulados + transferência de 10 MB do mini TCP
docker compose run --rm -T elixir-demo    # protocolos simulados em Elixir
```

Cada comando imprime um relatório em Markdown. As cópias versionadas são [results/results.md](results/results.md) e [results/results-elixir.md](results/results-elixir.md). A demonstração em Go leva cerca de meio minuto e termina com erro se alguma transferência não chegar íntegra (SHA-256). Flags: `-mb`, `-loss`, `-runs`, `-window`, por exemplo `docker compose run --rm -T go-demo go run ./cmd/demo -mb 2 -loss 0.1`.

Nada usa a rede: os contêineres rodam com `network_mode: none` e o mini TCP conversa pela interface de loopback do próprio contêiner.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `go/channel` | o canal simulado: perda, duplicação, reordenação, uma semente |
| `go/arq` | stop-and-wait, go-back-N e retransmissão seletiva como um motor só, com duas janelas |
| `go/minitcp` | o mini TCP sobre sockets UDP, com perda injetada em cada socket |
| `go/cmd/demo` | o gerador do relatório |
| `elixir/lib` | canal e protocolos ARQ de novo, como função pura sobre estado imutável |
| `results/` | relatórios versionados |

Go é a implementação principal. Elixir repete apenas a simulação, porque é ali que a lição muda: o mesmo protocolo escrito sem estado mutável, com o gerador aleatório passado adiante como um valor. O mini TCP existe só em Go.

## Testes

```sh
docker compose run --rm -T go-test
docker compose run --rm -T elixir-test
```

O serviço de Go verifica `gofmt`, `go vet` e `go test`; o de Elixir verifica `mix format` e `mix test --warnings-as-errors`. Os testes cobrem o determinismo do canal, a entrega íntegra por todos os protocolos com 20% de perda, os limites de janela e o mini TCP com 5% e 30% de perda.

## O que os números mostram

- O stop-and-wait usa uma fração pequena do enlace, porque fica parado uma ida e volta inteira por quadro.
- O go-back-N mantém o enlace ocupado, mas paga cada perda, e cada quadro reordenado, com uma janela inteira de retransmissões.
- A retransmissão seletiva envia o mesmo número de quadros que o stop-and-wait (só o que se perdeu é reenviado) e mantém a janela andando.
- A simulação é exatamente repetível. O mini TCP não é: ele roda em sockets reais e em um relógio real, então a tabela dele traz média, desvio e faixa de várias execuções.
