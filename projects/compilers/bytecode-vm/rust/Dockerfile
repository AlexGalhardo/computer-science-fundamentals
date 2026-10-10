# EN: The build context is the project folder, because the tests run the example programs in
#     `examples/`. The crate has no dependency, so nothing is downloaded and the container runs
#     with no network.
# PT: O contexto de build é a pasta do projeto, porque os testes executam os programas de exemplo
#     em `examples/`. O crate não tem dependências, então nada é baixado e o contêiner roda sem
#     rede.
# ES: El contexto de build es la carpeta del proyecto, porque las pruebas ejecutan los programas
#     de ejemplo en `examples/`. El crate no tiene dependencias, así que no se descarga nada y el
#     contenedor corre sin red.
FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
COPY examples ./examples
COPY bench ./bench
COPY rust ./rust
WORKDIR /app/rust
RUN cargo build --release --quiet
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test"]
