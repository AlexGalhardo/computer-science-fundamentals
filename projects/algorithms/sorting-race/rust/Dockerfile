FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
COPY . .
CMD ["sh", "-c", "cargo fmt --check && cargo clippy -- -D warnings && cargo test"]
