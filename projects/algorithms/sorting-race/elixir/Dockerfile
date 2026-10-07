FROM elixir:1.20.4-otp-28-slim
WORKDIR /app
COPY . .
CMD ["sh", "-c", "mix format --check-formatted && mix test"]
