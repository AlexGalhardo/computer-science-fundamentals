# EN: Base image for Rust mini-projects. The official image uses the minimal profile, so rustfmt
#     and clippy are added explicitly.
# PT: Imagem base dos mini-projetos em Rust. A imagem oficial usa o perfil mínimo, então rustfmt
#     e clippy são adicionados explicitamente.
# ES: Imagen base de los mini-proyectos en Rust. La imagen oficial usa el perfil mínimo, así que
#     rustfmt y clippy se agregan explícitamente.
FROM rust:1.99.0-slim-trixie
RUN rustup component add rustfmt clippy
WORKDIR /app
CMD ["cargo", "--version"]
