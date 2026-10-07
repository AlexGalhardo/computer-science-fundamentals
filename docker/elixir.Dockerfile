# EN: Base image for Elixir mini-projects. `mix format` ships with Elixir. The slim image has
#     no CA certificates, and Hex needs them to download packages over HTTPS.
# PT: Imagem base dos mini-projetos em Elixir. O `mix format` vem com o Elixir. A imagem slim
#     não traz certificados de CA, e o Hex precisa deles para baixar pacotes por HTTPS.
FROM elixir:1.20.4-otp-28-slim
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates findutils \
	&& rm -rf /var/lib/apt/lists/*
RUN mix local.hex --force && mix local.rebar --force
WORKDIR /app
CMD ["elixir", "--version"]
