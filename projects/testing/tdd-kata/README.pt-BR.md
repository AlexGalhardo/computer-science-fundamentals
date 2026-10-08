# tdd-kata

> English version: [README.md](README.md)

TODO: um parágrafo dizendo o que este mini-projeto ensina.

## Tópicos do quiz que ele demonstra

- TODO: `testing` / slug do tópico

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-tdd-kata.sh        # Linux e macOS
./setup-windows-tdd-kata.ps1    # Windows
```

## Estrutura

Implementações: `ts/`. Cada pasta tem seu próprio Dockerfile em uma imagem fixada e seus próprios testes.

## Testes

```sh
docker compose run --rm ts-test
```

## Benchmark ou demo

TODO: o comando único que roda a demo ou o benchmark, e onde está o dashboard.
