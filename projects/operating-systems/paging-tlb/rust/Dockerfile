FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
COPY . .
# EN: The demo binary is compiled while the image is built, so running it needs no compiler step.
# PT: O binário da demo é compilado durante a construção da imagem, então rodá-lo não exige compilação.
# ES: El binario de la demo se compila al construir la imagen, así que ejecutarlo no exige compilar.
RUN cargo build --release
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test"]
