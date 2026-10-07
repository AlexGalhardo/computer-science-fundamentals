FROM elixir:1.20.4-otp-28-slim
WORKDIR /app
COPY . .
# EN: Compiled at build time so the demo prints only its report.
# PT: Compilado na construção da imagem para a demonstração imprimir apenas o relatório.
RUN mix compile
CMD ["sh", "-c", "mix format --check-formatted && mix test --warnings-as-errors"]
