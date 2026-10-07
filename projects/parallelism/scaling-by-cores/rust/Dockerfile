# EN: Test image of the Rust implementation: formatter, linter and tests on a pinned toolchain.
# PT: Imagem de teste da implementação em Rust: formatador, linter e testes em uma toolchain fixada.
FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
COPY . .
# EN: The crate has no dependencies, so `--offline` proves the build never touches the network.
# PT: O crate não tem dependências, então `--offline` prova que o build nunca usa a rede.
RUN cargo build --offline --release && cargo build --offline --all-targets
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --offline --all-targets -- -D warnings && cargo test --offline"]
