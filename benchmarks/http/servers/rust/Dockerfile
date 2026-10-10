# EN: Rust HTTP server of the benchmark, built in release mode. `--locked` makes the build fail
#     if Cargo.lock does not match Cargo.toml, so every crate version is the committed one.
# PT: Servidor HTTP em Rust do benchmark, compilado em modo release. O `--locked` faz o build
#     falhar se o Cargo.lock não bater com o Cargo.toml, então toda versão de crate é a versionada.
# ES: Servidor HTTP en Rust del benchmark, compilado en modo release. `--locked` hace que el build
#     falle si Cargo.lock no coincide con Cargo.toml, así toda versión de crate es la versionada.
FROM rust:1.99.0-slim-trixie
WORKDIR /src
COPY . .
RUN cargo build --release --locked \
	&& mkdir -p /opt/server \
	&& cp target/release/server /opt/server/main \
	&& rm -rf target
USER 65534:65534
EXPOSE 8080
CMD ["/opt/server/main"]
