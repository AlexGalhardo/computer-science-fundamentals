# deadlock-mini-shell

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Dois programas pequenos sobre processos e os recursos que eles compartilham. O primeiro, em Go, encontra impasses (deadlocks) em um grafo de alocação de recursos e aplica o algoritmo do banqueiro para decidir se um estado é seguro. O segundo, em C++, é um mini shell que executa pipelines com `fork`, `exec`, `pipe` e `dup2`, aceita redirecionamento e sobrevive ao Ctrl-C. Juntos, eles ensinam como os processos são criados e conectados, e o que dá errado quando eles esperam uns pelos outros.

Explicação completa: [docs/pt/operating-systems/deadlock-mini-shell.md](../../../docs/pt/operating-systems/deadlock-mini-shell.md).

## Tópicos do quiz que ele demonstra

- `operating-systems` / `deadlocks`: as quatro condições, grafos de alocação de recursos, detecção, estados seguros e inseguros, o algoritmo do banqueiro.
- `operating-systems` / `introduction-and-system-calls`: `fork`, `exec`, por que `cd` é um comando embutido do shell.
- `operating-systems` / `processes-and-threads`: criação de processos, espaços de endereçamento separados depois do `fork`, espera pelos filhos.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-deadlock-mini-shell.sh        # Linux e macOS
./setup-windows-deadlock-mini-shell.ps1    # Windows
```

O script constrói as imagens, roda os testes das duas linguagens e roda as duas demos.

## Demos

```sh
docker compose run --rm demo          # classifica os grafos e estados documentados, grava results/results.md
docker compose run --rm shell-demo    # executa cpp/demo.msh no mini shell
docker compose run --rm shell         # um mini shell interativo (saia com exit ou Ctrl-D)
```

```text
textbook, 7 processes  DEADLOCK     deadlocked: D, E, G    blocked behind the cycle: B
single resource        safe         one safe sequence: P1, P2, P0
  P0 asks for 1 unit                   denied: the resulting state would be unsafe
```

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `go/graph.go` | grafo de alocação de recursos: processos em um ciclo e processos bloqueados atrás dele |
| `go/banker.go` | sequência segura, a decisão do banqueiro sobre um pedido, detecção com várias instâncias |
| `go/examples.go` | os grafos e estados documentados, usados pelos testes e pela demo |
| `go/cmd/demo/main.go` | imprime a classificação |
| `cpp/parser.hpp` | transforma uma linha de comando em um pipeline (sem envolver processos) |
| `cpp/msh.cpp` | o shell: `fork`, `exec`, `pipe`, `dup2`, `waitpid`, `SIGINT` |
| `cpp/test_parser.cpp`, `cpp/test_shell.sh` | testes de unidade do analisador e o script de teste de integração |
| `results/` | saída versionada da demo de impasses |

Cada linguagem faz a parte para a qual é mais adequada: Go para os algoritmos de grafo e de matrizes, C++ para as chamadas de sistema POSIX. As imagens são fixadas (`golang:1.27.1-bookworm`, `gcc:16.2.0-trixie`), e não há nenhuma biblioteca como dependência.

## Testes

```sh
docker compose run --rm go-test     # gofmt, go vet, golangci-lint e depois os testes
docker compose run --rm cpp-test    # checagem do clang-format, testes do analisador e depois test_shell.sh
```

Os testes em Go classificam grafos conhecidos, com e sem impasse, e os estados de livro do algoritmo do banqueiro. O script de teste do shell executa pipelines de três comandos, com e sem redirecionamento, e interrompe um `sleep 30 | cat | cat` em execução com SIGINT, conferindo que o pipeline morre na hora e que o shell executa o comando seguinte.

## Escopo do shell

O mini shell é uma ferramenta de ensino, não um substituto do `sh`. Ele não tem variáveis, curingas, `&&` nem jobs em segundo plano. Ele não cria um grupo de processos por job, então depende de o terminal enviar o Ctrl-C a todo o grupo em primeiro plano.
