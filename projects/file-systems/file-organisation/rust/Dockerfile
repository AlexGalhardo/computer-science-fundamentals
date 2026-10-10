# EN: Rust on a pinned image. Format, lint and tests run together, so a style slip fails the
#     run. The build context is the project folder, because a test compares the demo with results/demo.md.
# PT: Rust em uma imagem fixada. Formato, lint e testes rodam juntos, então um deslize de estilo
#     falha a execução. O contexto de build é a pasta do projeto, porque um teste compara a demo com results/demo.md.
# ES: Rust en una imagen fijada. Formato, lint y pruebas se ejecutan juntos, así que un descuido
#     de estilo hace fallar la ejecución. El contexto de build es la carpeta del proyecto,
#     porque una prueba compara la demo con results/demo.md.
FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
COPY rust/ rust/
COPY results/demo.md results/demo.md
WORKDIR /app/rust
RUN cargo build --release --all-targets && cargo test --no-run \
	&& cp target/release/demo /usr/local/bin/forg_demo
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test"]
