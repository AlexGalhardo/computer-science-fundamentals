# EN: Image used by the benchmark runner. hyperfine measures a command several times and
#     reports mean, deviation and range. The static (musl) build is used so the same binary
#     runs inside any language image, whatever its C library.
# PT: Imagem usada pelo runner de benchmarks. O hyperfine mede um comando várias vezes e
#     informa média, desvio e intervalo. A build estática (musl) é usada para que o mesmo
#     binário rode dentro de qualquer imagem de linguagem, seja qual for a biblioteca C dela.
# ES: Imagen usada por el runner de benchmarks. hyperfine mide un comando varias veces e
#     informa media, desviación y rango. Se usa la build estática (musl) para que el mismo
#     binario corra dentro de cualquier imagen de lenguaje, sea cual sea su biblioteca C.
FROM debian:trixie-20261005-slim
ARG HYPERFINE_VERSION=2.0.0
ADD https://github.com/sharkdp/hyperfine/releases/download/v${HYPERFINE_VERSION}/hyperfine-v${HYPERFINE_VERSION}-x86_64-unknown-linux-musl.tar.gz /tmp/hyperfine.tar.gz
RUN mkdir -p /opt/hyperfine \
	&& tar -xzf /tmp/hyperfine.tar.gz -C /opt/hyperfine --strip-components=1 \
	&& rm /tmp/hyperfine.tar.gz
ENTRYPOINT ["/opt/hyperfine/hyperfine"]
