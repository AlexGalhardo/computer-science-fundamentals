# EN: Rust on a pinned image. Format, lint and tests run together, so a style slip fails the run.
# PT: Rust em uma imagem fixada. Formato, lint e testes rodam juntos, então um deslize de estilo falha a execução.
FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
COPY . .
RUN cargo build --release --all-targets && cargo test --no-run
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test"]
