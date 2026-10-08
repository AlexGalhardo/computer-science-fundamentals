# EN: Single-thread CPU workload in Elixir: `nbody` (floating point) and `sieve` (integers and
#     memory). Data on the BEAM is immutable: a body cannot be changed in place, so each time
#     step builds new tuples. That costs allocation, and it is the price of the model that
#     makes BEAM processes safe to run side by side.
# PT: Carga de CPU em uma thread em Elixir: `nbody` (ponto flutuante) e `sieve` (inteiros e
#     memória). Os dados na BEAM são imutáveis: um corpo não pode ser alterado no lugar, então
#     cada passo de tempo constrói novas tuplas. Isso custa alocação, e é o preço do modelo que
#     torna seguro rodar processos da BEAM lado a lado.
defmodule Main do
  @solar_mass 4.0 * :math.pi() * :math.pi()
  @days_per_year 365.24
  @dt 0.01

  # EN: Sun, Jupiter, Saturn, Uranus and Neptune as {x, y, z, vx, vy, vz, mass}.
  # PT: Sol, Júpiter, Saturno, Urano e Netuno como {x, y, z, vx, vy, vz, massa}.
  defp make_bodies do
    [
      {0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0},
      {4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01,
       1.66007664274403694e-03, 7.69901118419740425e-03, -6.90460016972063023e-05,
       9.54791938424326609e-04},
      {8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01,
       -2.76742510726862411e-03, 4.99852801234917238e-03, 2.30417297573763929e-05,
       2.85885980666130812e-04},
      {1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01,
       2.96460137564761618e-03, 2.37847173959480950e-03, -2.96589568540237556e-05,
       4.36624404335156298e-05},
      {1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01,
       2.68067772490389322e-03, 1.62824170038242295e-03, -9.51592254519715870e-05,
       5.15138902046611451e-05}
    ]
    |> Enum.map(fn {x, y, z, vx, vy, vz, mass} ->
      {x, y, z, vx * @days_per_year, vy * @days_per_year, vz * @days_per_year, mass * @solar_mass}
    end)
  end

  defp offset_momentum([{x, y, z, _, _, _, mass} | rest] = bodies) do
    {px, py, pz} =
      Enum.reduce(bodies, {0.0, 0.0, 0.0}, fn {_, _, _, vx, vy, vz, m}, {px, py, pz} ->
        {px + vx * m, py + vy * m, pz + vz * m}
      end)

    [{x, y, z, -px / @solar_mass, -py / @solar_mass, -pz / @solar_mass, mass} | rest]
  end

  # EN: One time step without mutation. The head of the list interacts with every body after
  #     it, producing an updated head and an updated tail, and the recursion continues on the
  #     tail. The order of the floating-point operations is the same as in the nested loops of
  #     the other languages, which is what keeps the checksum identical.
  # PT: Um passo de tempo sem mutação. A cabeça da lista interage com cada corpo depois dela,
  #     produzindo uma cabeça e uma cauda atualizadas, e a recursão continua na cauda. A ordem
  #     das operações de ponto flutuante é a mesma dos laços aninhados das outras linguagens, e
  #     é isso que mantém o checksum idêntico.
  defp update_velocities([]), do: []

  defp update_velocities([body | rest]) do
    {body, rest} = interact(body, rest, [])
    [body | update_velocities(rest)]
  end

  defp interact(body, [], done), do: {body, Enum.reverse(done)}

  defp interact({x, y, z, vx, vy, vz, m}, [{x2, y2, z2, vx2, vy2, vz2, m2} | rest], done) do
    dx = x - x2
    dy = y - y2
    dz = z - z2
    dist2 = dx * dx + dy * dy + dz * dz
    mag = @dt / (dist2 * :math.sqrt(dist2))

    interact(
      {x, y, z, vx - dx * m2 * mag, vy - dy * m2 * mag, vz - dz * m2 * mag, m},
      rest,
      [{x2, y2, z2, vx2 + dx * m * mag, vy2 + dy * m * mag, vz2 + dz * m * mag, m2} | done]
    )
  end

  defp move({x, y, z, vx, vy, vz, m}) do
    {x + @dt * vx, y + @dt * vy, z + @dt * vz, vx, vy, vz, m}
  end

  defp simulate(bodies, 0), do: bodies

  defp simulate(bodies, steps) do
    bodies |> update_velocities() |> Enum.map(&move/1) |> simulate(steps - 1)
  end

  defp energy([], e), do: e

  defp energy([{x, y, z, vx, vy, vz, m} | rest], e) do
    e = e + 0.5 * m * (vx * vx + vy * vy + vz * vz)

    e =
      Enum.reduce(rest, e, fn {x2, y2, z2, _, _, _, m2}, acc ->
        dx = x - x2
        dy = y - y2
        dz = z - z2
        acc - m * m2 / :math.sqrt(dx * dx + dy * dy + dz * dz)
      end)

    energy(rest, e)
  end

  defp nbody(n) do
    bodies = make_bodies() |> offset_momentum() |> simulate(n)
    :erlang.float_to_binary(energy(bodies, 0.0), decimals: 9)
  end

  # EN: The BEAM has no mutable array in the language. `:atomics` is the standard escape
  #     hatch: a fixed array of integers that can be changed in place (indexes start at 1).
  #     Each access is a function call, so this is slower than an array in other languages.
  # PT: A BEAM não tem array mutável na linguagem. O `:atomics` é a saída padrão: um array fixo
  #     de inteiros que pode ser alterado no lugar (os índices começam em 1). Cada acesso é uma
  #     chamada de função, então isso é mais lento que um array nas outras linguagens.
  defp sieve(n) do
    composite = :atomics.new(n + 1, signed: false)
    cross_out(composite, 2, n)
    {count, largest} = count_primes(composite, 2, n, 0, 0)
    "#{count}:#{largest}"
  end

  defp cross_out(composite, i, n) when i * i <= n do
    if :atomics.get(composite, i + 1) == 0, do: mark(composite, i * i, i, n)
    cross_out(composite, i + 1, n)
  end

  defp cross_out(_composite, _i, _n), do: :ok

  defp mark(composite, j, step, n) when j <= n do
    :atomics.put(composite, j + 1, 1)
    mark(composite, j + step, step, n)
  end

  defp mark(_composite, _j, _step, _n), do: :ok

  defp count_primes(_composite, i, n, count, largest) when i > n, do: {count, largest}

  defp count_primes(composite, i, n, count, largest) do
    if :atomics.get(composite, i + 1) == 0 do
      count_primes(composite, i + 1, n, count + 1, i)
    else
      count_primes(composite, i + 1, n, count, largest)
    end
  end

  # EN: VmHWM in /proc/self/status is the peak resident memory of the whole VM, in kibibytes.
  # PT: VmHWM em /proc/self/status é o pico de memória residente da VM inteira, em kibibytes.
  defp peak_memory_kb do
    case Regex.run(~r/VmHWM:\s+(\d+)/, File.read!("/proc/self/status")) do
      [_, kb] -> String.to_integer(kb)
      _ -> 0
    end
  end

  def main(args) do
    implementation = Enum.at(args, 0, "nbody")
    n = args |> Enum.at(1, "1000") |> String.to_integer()

    start = System.monotonic_time(:microsecond)
    checksum = if implementation == "sieve", do: sieve(n), else: nbody(n)
    elapsed_ms = (System.monotonic_time(:microsecond) - start) / 1000

    IO.puts(
      ~s({"n":#{n},"elapsedMs":#{elapsed_ms},"memoryKb":#{peak_memory_kb()},) <>
        ~s("language":"elixir","implementation":"#{implementation}","checksum":"#{checksum}"})
    )
  end
end
