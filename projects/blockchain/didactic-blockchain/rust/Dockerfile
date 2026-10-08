# EN: No crates are downloaded: the project has no dependencies, SHA-256 included. The release
#     binary is built into the image for the demo and the benchmark. The default command is the
#     gate: formatter, linter, then tests.
# PT: Nenhum crate é baixado: o projeto não tem dependências, nem para o SHA-256. O binário de
#     release é construído dentro da imagem para a demo e o benchmark. O comando padrão é o
#     portão: formatador, linter e depois os testes.
FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
COPY . .
RUN cargo build --release --locked --offline
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --offline --all-targets -- -D warnings && cargo test --offline --locked"]
