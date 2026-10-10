# Ambiente

> English version: [docs/en/environment.md](../en/environment.md) · Versión en español: [docs/es/environment.md](../es/environment.md)

Tudo roda em Docker com imagens fixadas, então o único requisito na máquina é o Docker. Ter as linguagens instaladas localmente é opcional. As imagens base ficam em `docker/`, um Dockerfile por linguagem, e nenhuma usa `latest`.

| Linguagem | Dockerfile | Imagem base | Ferramentas adicionadas |
| --- | --- | --- | --- |
| TypeScript | `docker/ts.Dockerfile` | `oven/bun:1.4.2` | O Bun é runtime, gerenciador de pacotes e executor de testes. O Biome 2.5.15 e o markdownlint-cli2 0.23.3 vêm do `package.json` da raiz |
| Python | `docker/python.Dockerfile` | `python:3.14.8-slim-trixie` | ruff 0.16.10, pytest 9.1.1 |
| Go | `docker/go.Dockerfile` | `golang:1.27.1-bookworm` | golangci-lint 2.14.0 (o gofmt vem com o Go) |
| Rust | `docker/rust.Dockerfile` | `rust:1.99.0-slim-trixie` | rustfmt, clippy |
| C++ | `docker/cpp.Dockerfile` | `gcc:16.2.0-trixie` | CMake, clang-format |
| Java | `docker/java.Dockerfile` | `gradle:9.8.0-jdk25` | Spotless 8.10.3 com google-java-format, como plugin do Gradle (`docker/java/spotless.gradle`) |
| Elixir | `docker/elixir.Dockerfile` | `elixir:1.20.4-otp-28-slim` | Hex e Rebar (o `mix format` vem com o Elixir) |
| Benchmarks | `docker/bench.Dockerfile` | `debian:trixie-20261005-slim` | hyperfine 2.0.0, build estática |

## Configuração de formatadores e linters

| Ecossistema | Arquivo na raiz do repositório |
| --- | --- |
| JS/TS | `biome.json` |
| Python | `ruff.toml` |
| Rust | `rustfmt.toml` |
| C++ | `.clang-format` |
| Go | `.golangci.yml` |
| Elixir | `.formatter.exs` |
| Java | `docker/java/spotless.gradle` |
| Markdown | `.markdownlint-cli2.jsonc` |

## Como construir as imagens

```sh
for lang in ts python go rust cpp java elixir; do
	docker build -f docker/$lang.Dockerfile -t sef-$lang:local docker
done
```

## Como atualizar uma versão

Troque a tag no Dockerfile e nesta tabela (nos três idiomas) no mesmo commit, reconstrua a imagem e rode de novo os testes dos mini-projetos que a usam. Somente versões estáveis: nada de `latest`, `rc`, `beta` ou nightly.
