# EN: Rust on a pinned image. Format, lint and tests run together, so a style slip fails the
#     run. The build context is the project folder, because the tests read fixtures/.
# PT: Rust em uma imagem fixada. Formato, lint e testes rodam juntos, então um deslize de estilo
#     falha a execução. O contexto de build é a pasta do projeto, porque os testes leem fixtures/.
FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
COPY fixtures/ fixtures/
COPY rust/ rust/
WORKDIR /app/rust
RUN cargo build --release --all-targets && cargo test --no-run \
	&& cp target/release/extsort /usr/local/bin/extsort
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test"]
