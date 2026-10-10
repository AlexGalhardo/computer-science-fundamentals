# Entorno

> English version: [docs/en/environment.md](../en/environment.md) · Versão em português: [docs/pt/environment.md](../pt/environment.md)

Todo corre en Docker con imágenes fijadas, así que el único requisito en el host es Docker. Tener las herramientas instaladas localmente es opcional. Las imágenes base están en `docker/`, un Dockerfile por lenguaje, y ninguna usa `latest`.

| Lenguaje | Dockerfile | Imagen base | Herramientas añadidas |
| --- | --- | --- | --- |
| TypeScript | `docker/ts.Dockerfile` | `oven/bun:1.4.2` | Bun es runtime, gestor de paquetes y ejecutor de pruebas. Biome 2.5.15 y markdownlint-cli2 0.23.3 vienen del `package.json` de la raíz |
| Python | `docker/python.Dockerfile` | `python:3.14.8-slim-trixie` | ruff 0.16.10, pytest 9.1.1 |
| Go | `docker/go.Dockerfile` | `golang:1.27.1-bookworm` | golangci-lint 2.14.0 (gofmt viene con Go) |
| Rust | `docker/rust.Dockerfile` | `rust:1.99.0-slim-trixie` | rustfmt, clippy |
| C++ | `docker/cpp.Dockerfile` | `gcc:16.2.0-trixie` | CMake, clang-format |
| Java | `docker/java.Dockerfile` | `gradle:9.8.0-jdk25` | Spotless 8.10.3 con google-java-format, como plugin de Gradle (`docker/java/spotless.gradle`) |
| Elixir | `docker/elixir.Dockerfile` | `elixir:1.20.4-otp-28-slim` | Hex y Rebar (`mix format` viene con Elixir) |
| Benchmarks | `docker/bench.Dockerfile` | `debian:trixie-20261005-slim` | hyperfine 2.0.0, build estático |

## Configuración de formateadores y linters

| Ecosistema | Archivo en la raíz del repositorio |
| --- | --- |
| JS/TS | `biome.json` |
| Python | `ruff.toml` |
| Rust | `rustfmt.toml` |
| C++ | `.clang-format` |
| Go | `.golangci.yml` |
| Elixir | `.formatter.exs` |
| Java | `docker/java/spotless.gradle` |
| Markdown | `.markdownlint-cli2.jsonc` |

## Construir las imágenes

```sh
for lang in ts python go rust cpp java elixir; do
	docker build -f docker/$lang.Dockerfile -t sef-$lang:local docker
done
```

## Actualizar una versión

Cambia la etiqueta en el Dockerfile y en esta tabla (en los tres idiomas) en el mismo commit, reconstruye, y vuelve a ejecutar las pruebas de los mini-proyectos que usan la imagen. Solo versiones estables: sin etiquetas `latest`, `rc`, `beta` ni nightly.
