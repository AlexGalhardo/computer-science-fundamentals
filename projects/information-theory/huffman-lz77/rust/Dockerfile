FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
# EN: The tests compare their output with the committed fixture and table, so both are copied
#     next to the crate.
# PT: Os testes comparam sua saída com o fixture e a tabela versionados, então os dois são
#     copiados ao lado do crate.
# ES: Las pruebas comparan su salida con el fixture y la tabla versionados, así que ambos se
#     copian junto al crate.
COPY fixtures ./fixtures
COPY results ./results
COPY rust ./rust
WORKDIR /app/rust
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test"]
