# EN: The tests run in release mode on purpose. One of them compares the time of two loop orders,
#     and a debug build is so slow in every loop that the cost of the cache misses would be hidden.
# PT: Os testes rodam em modo release de propósito. Um deles compara o tempo de duas ordens de
#     laço, e um build de debug é tão lento em todo laço que o custo das faltas de cache ficaria escondido.
# ES: Las pruebas corren en modo release a propósito. Una de ellas compara el tiempo de dos órdenes de
#     bucle, y un build de debug es tan lento en todo bucle que el costo de los fallos de caché quedaría
#     escondido.
FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
COPY . .
RUN cargo build --release --offline
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --offline --all-targets -- -D warnings && cargo test --release --offline -- --test-threads=1"]
