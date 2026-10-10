# EN: HTTP server of the benchmark in Elixir, with Plug (the standard web interface) on Bandit
#     (the default server of Phoenix). JSON comes from the standard library (the JSON module).
#     Model: one BEAM process per connection. Each request runs in its own isolated process,
#     so a crash or a slow handler in one never touches the others. The VM preempts processes,
#     so even a CPU-bound handler cannot starve the rest, and the schedulers use every core.
#     Protocol (the same in the 7 languages): GET /health, POST /echo, GET /primes?limit=N.
# PT: Servidor HTTP do benchmark em Elixir, com Plug (a interface web padrão) sobre o Bandit (o
#     servidor padrão do Phoenix). O JSON vem da biblioteca padrão (módulo JSON).
#     Modelo: um processo da BEAM por conexão. Cada requisição roda em seu próprio processo
#     isolado, então uma falha ou um handler lento em um nunca atinge os outros. A VM preempta
#     os processos, então nem um handler preso à CPU consegue deixar o resto sem vez, e os
#     escalonadores usam todos os núcleos.
#     Protocolo (o mesmo nas 7 linguagens): GET /health, POST /echo, GET /primes?limit=N.
# ES: Servidor HTTP del benchmark en Elixir, con Plug (la interfaz web estándar) sobre Bandit (el
#     servidor estándar de Phoenix). El JSON viene de la biblioteca estándar (módulo JSON).
#     Modelo: un proceso de la BEAM por conexión. Cada petición corre en su propio proceso
#     aislado, así que una falla o un handler lento en uno nunca alcanza a los demás. La VM expulsa
#     los procesos, así que ni un handler limitado por CPU logra dejar al resto sin turno, y los
#     planificadores usan todos los núcleos.
#     Protocolo (el mismo en los 7 lenguajes): GET /health, POST /echo, GET /primes?limit=N.
defmodule Server.Router do
  use Plug.Router

  @max_limit 100_000

  plug(:match)
  plug(:dispatch)

  get "/health" do
    send_resp(conn, 200, "ok")
  end

  # EN: The body is parsed and serialised again, so this measures the JSON library and the
  #     HTTP stack, not a copy of bytes.
  # PT: O corpo é interpretado e serializado de novo, então isto mede a biblioteca de JSON e a
  #     pilha HTTP, não uma cópia de bytes.
  # ES: El cuerpo se interpreta y se serializa de nuevo, así que esto mide la biblioteca de JSON y la
  #     pila HTTP, no una copia de bytes.
  post "/echo" do
    {:ok, body, conn} = Plug.Conn.read_body(conn)

    case JSON.decode(body) do
      {:ok, value} -> json(conn, 200, %{language: "elixir", echo: value})
      {:error, _reason} -> json(conn, 400, %{error: "invalid json"})
    end
  end

  get "/primes" do
    conn = Plug.Conn.fetch_query_params(conn)

    case Integer.parse(Map.get(conn.query_params, "limit", "")) do
      {limit, ""} when limit >= 2 and limit <= @max_limit ->
        json(conn, 200, %{language: "elixir", limit: limit, count: count_primes(limit, 2, 0)})

      _ ->
        json(conn, 400, %{error: "invalid limit"})
    end
  end

  match _ do
    send_resp(conn, 404, "not found")
  end

  defp json(conn, status, value) do
    conn
    |> Plug.Conn.put_resp_content_type("application/json")
    |> send_resp(status, JSON.encode!(value))
  end

  # EN: The CPU-bound endpoint: count the primes up to limit by trial division.
  # PT: O endpoint preso à CPU: conta os primos até limit por divisão por tentativa.
  # ES: El endpoint limitado por CPU: cuenta los primos hasta limit por división de prueba.
  defp count_primes(limit, k, count) when k > limit, do: count

  defp count_primes(limit, k, count),
    do: count_primes(limit, k + 1, if(prime?(k), do: count + 1, else: count))

  defp prime?(k) when k < 2, do: false
  defp prime?(k) when k < 4, do: true
  defp prime?(k) when rem(k, 2) == 0, do: false
  defp prime?(k), do: no_divisor?(k, 3)

  defp no_divisor?(k, d) when d * d > k, do: true
  defp no_divisor?(k, d) when rem(k, d) == 0, do: false
  defp no_divisor?(k, d), do: no_divisor?(k, d + 2)
end

defmodule Server.Application do
  use Application

  @impl true
  def start(_type, _args) do
    # EN: A supervisor restarts the HTTP server if it ever crashes: the usual OTP structure.
    # PT: Um supervisor reinicia o servidor HTTP se ele cair: a estrutura usual do OTP.
    # ES: Un supervisor reinicia el servidor HTTP si se cae: la estructura habitual de OTP.
    children = [{Bandit, plug: Server.Router, port: 8080}]
    Supervisor.start_link(children, strategy: :one_for_one, name: Server.Supervisor)
  end
end
