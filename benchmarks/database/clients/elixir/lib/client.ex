# EN: Database client of the benchmark in Elixir, with Postgrex, the PostgreSQL driver used by
#     Ecto and Phoenix. The four phases are the same in the 7 languages: insert n rows one by
#     one, read each by primary key, run a query with a filter and an aggregate, and read by
#     key again from 8 processes sharing a pool of 8 connections. In Postgrex every connection
#     is itself a BEAM process, and the pool is built in: `pool_size` is all it takes.
# PT: Cliente de banco de dados do benchmark em Elixir, com Postgrex, o driver PostgreSQL usado
#     pelo Ecto e pelo Phoenix. As quatro fases são as mesmas nas 7 linguagens: inserir n linhas
#     uma a uma, ler cada uma pela chave primária, rodar uma consulta com filtro e agregação, e
#     ler pela chave de novo a partir de 8 processos dividindo um pool de 8 conexões. No
#     Postgrex cada conexão é ela mesma um processo da BEAM, e o pool já vem pronto: basta o
#     `pool_size`.
defmodule Client do
  @table "items_elixir"
  @query_ops 200
  @categories 10

  # EN: Runs fun for every id, records how long each call took and adds up what it returned.
  # PT: Roda fun para cada id, registra quanto tempo cada chamada levou e soma o que ela devolveu.
  defp timed(ids, fun) do
    start = System.monotonic_time(:nanosecond)

    {latencies, total} =
      Enum.reduce(ids, {[], 0}, fn i, {latencies, total} ->
        before = System.monotonic_time(:nanosecond)
        value = fun.(i)
        {[(System.monotonic_time(:nanosecond) - before) / 1.0e6 | latencies], total + value}
      end)

    %{
      ops: Enum.count(ids),
      elapsed: (System.monotonic_time(:nanosecond) - start) / 1.0e6,
      latencies: latencies,
      total: total
    }
  end

  defp summary(%{ops: ops, elapsed: elapsed, latencies: latencies}) do
    sorted = Enum.sort(latencies)
    count = length(sorted)

    at = fn q ->
      if count == 0, do: 0.0, else: Enum.at(sorted, min(count - 1, trunc(q * count)))
    end

    ~s({"ops":#{ops},"elapsedMs":#{elapsed},"p50Ms":#{at.(0.50)},"p95Ms":#{at.(0.95)},"p99Ms":#{at.(0.99)}})
  end

  defp options(pool_size) do
    [
      hostname: System.get_env("PGHOST", "localhost"),
      port: String.to_integer(System.get_env("PGPORT", "5432")),
      username: System.get_env("PGUSER", "bench"),
      password: System.get_env("PGPASSWORD", "bench"),
      database: System.get_env("PGDATABASE", "bench"),
      pool_size: pool_size
    ]
  end

  defp read(conn, i) do
    %Postgrex.Result{rows: [[_name, price]]} =
      Postgrex.query!(conn, "SELECT name, price FROM #{@table} WHERE id = $1", [i])

    price
  end

  def main(args) do
    n = args |> Enum.at(0, "1000") |> String.to_integer()
    workers = args |> Enum.at(1, "8") |> String.to_integer()

    {:ok, conn} = Postgrex.start_link(options(1))
    Postgrex.query!(conn, "DROP TABLE IF EXISTS #{@table}", [])

    Postgrex.query!(
      conn,
      "CREATE TABLE #{@table} (id integer PRIMARY KEY, name text NOT NULL, category integer NOT NULL, price integer NOT NULL)",
      []
    )

    insert =
      timed(1..n//1, fn i ->
        Postgrex.query!(
          conn,
          "INSERT INTO #{@table} (id, name, category, price) VALUES ($1, $2, $3, $4)",
          [i, "item-#{i}", rem(i, @categories), rem(i * 37, 1000)]
        )

        0
      end)

    read = timed(1..n//1, &read(conn, &1))

    query =
      timed(0..(@query_ops - 1), fn i ->
        %Postgrex.Result{rows: [[count, sum]]} =
          Postgrex.query!(
            conn,
            "SELECT count(*), coalesce(sum(price), 0) FROM #{@table} WHERE category = $1",
            [rem(i, @categories)]
          )

        count + sum
      end)

    # EN: The pool is just another Postgrex process with more connections behind it.
    # PT: O pool é só outro processo do Postgrex com mais conexões por trás.
    {:ok, pool} = Postgrex.start_link(options(workers))
    Enum.each(1..workers, fn _ -> Postgrex.query!(pool, "SELECT 1", []) end)
    start = System.monotonic_time(:nanosecond)

    parts =
      0..(workers - 1)
      |> Task.async_stream(fn w -> timed((w + 1)..n//workers, &read(pool, &1)) end,
        max_concurrency: workers,
        timeout: :infinity
      )
      |> Enum.map(fn {:ok, part} -> part end)

    pooled = %{
      ops: parts |> Enum.map(& &1.ops) |> Enum.sum(),
      elapsed: (System.monotonic_time(:nanosecond) - start) / 1.0e6,
      latencies: Enum.flat_map(parts, & &1.latencies)
    }

    checksum = read.total + query.total + (parts |> Enum.map(& &1.total) |> Enum.sum())
    Postgrex.query!(conn, "DROP TABLE #{@table}", [])

    # EN: CPU time of every thread of the VM and peak memory of the VM, as counted by the kernel.
    # PT: Tempo de CPU de todas as threads da VM e pico de memória da VM, contados pelo kernel.
    {cpu_ms, _} = :erlang.statistics(:runtime)
    [_, peak] = Regex.run(~r/VmHWM:\s+(\d+)/, File.read!("/proc/self/status"))

    IO.puts(
      ~s({"language":"elixir","driver":"Postgrex","n":#{n},"concurrency":#{workers},"checksum":"#{checksum}",) <>
        ~s("cpuMs":#{cpu_ms},"memoryKb":#{peak},"phases":{"insert":#{summary(insert)},"read":#{summary(read)},) <>
        ~s("query":#{summary(query)},"pool":#{summary(pooled)}}})
    )
  end
end
