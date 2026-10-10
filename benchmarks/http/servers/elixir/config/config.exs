import Config

# EN: Only warnings are logged: one log line per request would be measured as server work.
# PT: Só avisos são registrados: uma linha de log por requisição seria medida como trabalho do servidor.
# ES: Solo se registran advertencias: una línea de log por petición se mediría como trabajo del servidor.
config :logger, level: :warning
