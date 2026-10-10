# EN: Builds the Rust implementation of one workload in release mode. Crates are downloaded
#     here, at build time, because the benchmark containers run with no network. `--locked`
#     makes the build fail if Cargo.lock does not match Cargo.toml.
# PT: Compila a implementação em Rust de uma carga de trabalho em modo release. As crates são
#     baixadas aqui, na hora do build, porque os contêineres de benchmark rodam sem rede. O
#     `--locked` faz o build falhar se o Cargo.lock não bater com o Cargo.toml.
# ES: Compila la implementación en Rust de una carga de trabajo en modo release. Los crates se
#     descargan aquí, al momento del build, porque los contenedores de benchmark corren sin red.
#     `--locked` hace que el build falle si Cargo.lock no coincide con Cargo.toml.
FROM rust:1.99.0-slim-trixie
WORKDIR /src
COPY rust/ .
RUN cargo build --release --locked \
	&& mkdir -p /opt/bench \
	&& cp target/release/bench /opt/bench/main \
	&& rm -rf target
