# Environment

> Versão em português: [docs/pt/environment.md](../pt/environment.md)

Everything runs in Docker with pinned images, so the only requirement on the host is Docker. A local toolchain is optional. The base images live in `docker/`, one Dockerfile per language, and no image uses `latest`.

| Language | Dockerfile | Base image | Tools added |
| --- | --- | --- | --- |
| TypeScript | `docker/ts.Dockerfile` | `oven/bun:1.4.2` | Bun is runtime, package manager and test runner. Biome 2.5.15 comes from the root `package.json` |
| Python | `docker/python.Dockerfile` | `python:3.14.8-slim-trixie` | ruff 0.16.10, pytest 9.1.1 |
| Go | `docker/go.Dockerfile` | `golang:1.27.1-bookworm` | golangci-lint 2.14.0 (gofmt ships with Go) |
| Rust | `docker/rust.Dockerfile` | `rust:1.99.0-slim-trixie` | rustfmt, clippy |
| C++ | `docker/cpp.Dockerfile` | `gcc:16.2.0-trixie` | CMake, clang-format |
| Java | `docker/java.Dockerfile` | `gradle:9.8.0-jdk25` | Spotless 8.10.3 with google-java-format, as a Gradle plugin (`docker/java/spotless.gradle`) |
| Elixir | `docker/elixir.Dockerfile` | `elixir:1.20.4-otp-28-slim` | Hex and Rebar (`mix format` ships with Elixir) |
| Benchmarks | `docker/bench.Dockerfile` | `debian:trixie-20261005-slim` | hyperfine 2.0.0, static build |

## Formatter and linter configuration

| Ecosystem | File at the repository root |
| --- | --- |
| JS/TS | `biome.json` |
| Python | `ruff.toml` |
| Rust | `rustfmt.toml` |
| C++ | `.clang-format` |
| Go | `.golangci.yml` |
| Elixir | `.formatter.exs` |
| Java | `docker/java/spotless.gradle` |

## Building the images

```sh
for lang in ts python go rust cpp java elixir; do
	docker build -f docker/$lang.Dockerfile -t sef-$lang:local docker
done
```

## Upgrading a version

Change the tag in the Dockerfile and in this table (both languages) in the same commit, rebuild, and rerun the tests of the mini-projects that use the image. Only stable releases: no `latest`, `rc`, `beta` or nightly tags.
