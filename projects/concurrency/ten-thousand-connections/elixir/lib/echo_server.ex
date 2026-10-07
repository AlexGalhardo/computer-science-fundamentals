defmodule EchoServer do
  @moduledoc """
  EN: The Elixir implementation of the echo and delayed-response server, written directly on
  TCP sockets with no library. Every connection gets its own BEAM process. A BEAM process is
  not an operating-system thread: it starts with a few hundred words of memory and is scheduled
  by the virtual machine. A process that waits (in `recv` or in `Process.sleep`) costs no
  processor time, so ten thousand waiting connections are ten thousand tiny sleeping processes.

  PT: A implementação em Elixir do servidor de eco e de resposta atrasada, escrita direto sobre
  sockets TCP, sem biblioteca. Cada conexão ganha seu próprio processo da BEAM. Um processo da
  BEAM não é uma thread do sistema operacional: começa com algumas centenas de palavras de
  memória e é escalonado pela máquina virtual. Um processo que espera (em `recv` ou em
  `Process.sleep`) não custa tempo de processador, então dez mil conexões esperando são dez mil
  processos minúsculos dormindo.
  """

  @max_delay_ms 60_000
  @max_echo_bytes 1_048_576
  @acceptors 16

  @type response :: {pos_integer(), String.t(), binary()}

  @doc "Listens on the port and serves connections until the calling process dies."
  @spec listen(:inet.port_number()) :: no_return()
  def listen(port) do
    # EN: `packet: :http_bin` asks the Erlang runtime to parse HTTP request lines and headers,
    #     so no parser is written here. `active: false` means a process reads from its socket
    #     only when it asks, with `recv`.
    # PT: `packet: :http_bin` pede ao runtime do Erlang que interprete as linhas de requisição
    #     e os cabeçalhos HTTP, então nenhum parser é escrito aqui. `active: false` significa
    #     que um processo só lê do socket quando pede, com `recv`.
    options = [:binary, packet: :http_bin, active: false, reuseaddr: true, backlog: 4096]
    {:ok, socket} = :gen_tcp.listen(port, options)
    in_flight = :counters.new(1, [:write_concurrency])

    for _ <- 2..@acceptors, do: spawn_link(fn -> accept(socket, in_flight) end)
    accept(socket, in_flight)
  end

  defp accept(listen_socket, in_flight) do
    {:ok, socket} = :gen_tcp.accept(listen_socket)
    # EN: One new process per connection. If it crashes, only that connection is lost.
    # PT: Um processo novo por conexão. Se ele quebrar, só aquela conexão se perde.
    pid =
      spawn(fn ->
        receive do
          :ready -> serve(socket, in_flight)
        end
      end)

    :ok = :gen_tcp.controlling_process(socket, pid)
    send(pid, :ready)
    accept(listen_socket, in_flight)
  end

  # Serves requests on one connection until the client closes it (HTTP keep-alive).
  defp serve(socket, in_flight) do
    with {:ok, method, target} <- read_request_line(socket),
         {:ok, headers} <- read_headers(socket, %{}),
         {:ok, body} <- read_body(socket, headers) do
      :counters.add(in_flight, 1, 1)
      {status, content_type, payload} = handle(method, target, headers, body, in_flight)
      :counters.sub(in_flight, 1, 1)

      case :gen_tcp.send(socket, encode(status, content_type, payload)) do
        :ok -> serve(socket, in_flight)
        {:error, _reason} -> :gen_tcp.close(socket)
      end
    else
      {:reply_and_close, {status, content_type, payload}} ->
        :gen_tcp.send(socket, encode(status, content_type, payload))
        :gen_tcp.close(socket)

      _closed_or_invalid ->
        :gen_tcp.close(socket)
    end
  end

  defp read_request_line(socket) do
    :ok = :inet.setopts(socket, packet: :http_bin)

    case :gen_tcp.recv(socket, 0) do
      {:ok, {:http_request, method, {:abs_path, target}, _version}} ->
        {:ok, to_string(method), target}

      _other ->
        :closed
    end
  end

  defp read_headers(socket, headers) do
    case :gen_tcp.recv(socket, 0) do
      {:ok, {:http_header, _, name, _, value}} ->
        read_headers(socket, Map.put(headers, String.downcase(to_string(name)), value))

      {:ok, :http_eoh} ->
        {:ok, headers}

      _other ->
        :closed
    end
  end

  defp read_body(socket, headers) do
    case Integer.parse(Map.get(headers, "content-length", "0")) do
      {0, ""} ->
        {:ok, ""}

      {length, ""} when length > 0 and length <= @max_echo_bytes ->
        # The body is plain bytes, so the HTTP parser of the socket is switched off for it.
        :ok = :inet.setopts(socket, packet: :raw)
        :gen_tcp.recv(socket, length)

      {length, ""} when length > @max_echo_bytes ->
        {:reply_and_close, json(413, %{error: "body is too large"})}

      _invalid ->
        {:reply_and_close, json(400, %{error: "invalid content-length"})}
    end
  end

  @doc "Routes one request. Public so that the routes can be tested without a socket."
  @spec handle(String.t(), String.t(), map(), binary(), :counters.counters_ref()) :: response()
  def handle(method, target, headers, body, in_flight) do
    {path, query} =
      case String.split(target, "?", parts: 2) do
        [path, query] -> {path, query}
        [path] -> {path, ""}
      end

    case {path, method} do
      {"/health", "GET"} ->
        {200, "text/plain", "ok"}

      {"/echo", "POST"} ->
        {200, Map.get(headers, "content-type", "application/octet-stream"), body}

      {"/delay", "GET"} ->
        delay(Map.get(URI.decode_query(query), "ms", ""))

      {"/stats", "GET"} ->
        json(200, %{
          runtime: "elixir #{System.version()} (OTP #{System.otp_release()})",
          # This request counts itself, so it is subtracted.
          inFlight: :counters.get(in_flight, 1) - 1,
          rssKb: rss_kb()
        })

      {known, _other_method} when known in ["/health", "/echo", "/delay", "/stats"] ->
        {405, "text/plain", "method not allowed"}

      _unknown ->
        {404, "text/plain", "not found"}
    end
  end

  # EN: The query string is external input, so it is checked before use. `Process.sleep` puts
  #     only this process to sleep. The schedulers keep running every other connection.
  # PT: A query string é entrada externa, então é conferida antes do uso. `Process.sleep` põe
  #     para dormir só este processo. Os escalonadores seguem rodando todas as outras conexões.
  defp delay(text) do
    with true <- text =~ ~r/^\d{1,6}$/,
         ms when ms <= @max_delay_ms <- String.to_integer(text) do
      Process.sleep(ms)
      json(200, %{waitedMs: ms})
    else
      _invalid -> json(400, %{error: "ms must be an integer from 0 to #{@max_delay_ms}"})
    end
  end

  defp json(status, value), do: {status, "application/json", JSON.encode!(value)}

  defp encode(status, content_type, payload) do
    reason =
      Map.get(
        %{200 => "OK", 400 => "Bad Request", 404 => "Not Found", 405 => "Method Not Allowed"},
        status,
        "Error"
      )

    [
      "HTTP/1.1 #{status} #{reason}\r\n",
      "content-type: #{content_type}\r\n",
      "content-length: #{byte_size(payload)}\r\n\r\n",
      payload
    ]
  end

  # Resident memory of the whole BEAM operating-system process, read from Linux, in KiB.
  defp rss_kb do
    with {:ok, status} <- File.read("/proc/self/status"),
         [_, kb] <- Regex.run(~r/VmRSS:\s+(\d+) kB/, status) do
      String.to_integer(kb)
    else
      _ -> 0
    end
  end
end
