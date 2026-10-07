FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
# EN: The Rust tests read the SQLite fixture, so it is copied next to the crate.
# PT: Os testes em Rust leem o fixture do SQLite, então ele é copiado ao lado do crate.
COPY fixtures ./fixtures
COPY rust ./rust
WORKDIR /app/rust
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test"]
