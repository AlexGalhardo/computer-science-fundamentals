# EN: Build context is the mini-project folder, so the same file serves docker compose and the
#     benchmark runner. Everything is compiled at build time, so the container needs no network.
# PT: O contexto de build é a pasta do mini-projeto, então o mesmo arquivo serve ao docker
#     compose e ao runner de benchmark. Tudo é compilado no build, então o contêiner não
#     precisa de rede.
# ES: El contexto de build es la carpeta del mini-proyecto, así que el mismo archivo sirve a docker
#     compose y al runner de benchmark. Todo se compila en el build, así que el contenedor no
#     necesita red.
FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /src
COPY rust/ .
ENV CARGO_TARGET_DIR=/target
RUN cargo build --release --offline \
	&& cp /target/release/counter-race /usr/local/bin/counter-race-rust \
	&& cargo test --offline --no-run
CMD ["sh", "-c", "cargo fmt --check && cargo clippy --offline --all-targets -- -D warnings && cargo test --offline -- --nocapture --test-threads=1"]
