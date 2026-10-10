# EN: Rust database client of the benchmark, built in release mode with the committed Cargo.lock.
# PT: Cliente de banco em Rust do benchmark, compilado em modo release com o Cargo.lock versionado.
# ES: Cliente de base de datos en Rust del benchmark, compilado en modo release con el Cargo.lock versionado.
FROM rust:1.99.0-slim-trixie
WORKDIR /src
COPY . .
RUN cargo build --release --locked \
	&& mkdir -p /opt/client \
	&& cp target/release/client /opt/client/main \
	&& rm -rf target
USER 65534:65534
ENTRYPOINT ["/opt/client/main"]
