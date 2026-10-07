defmodule CounterRaceTest do
  use ExUnit.Case, async: false

  @workers 8
  @per_worker 125_000
  @expected @workers * @per_worker

  # EN: A fix is only a fix if it is right every time: 100 runs in a row, each exactly 1,000,000.
  # PT: Uma correção só é correção se acerta sempre: 100 execuções seguidas, cada uma com
  #     exatamente 1.000.000.
  @tag timeout: 900_000
  test "the actor counter is exact in 100 consecutive runs" do
    runs = String.to_integer(System.get_env("FIXED_RUNS", "100"))

    for run <- 1..runs do
      assert CounterRace.run(:actor, @workers, @per_worker) == @expected, "run #{run}"
    end

    IO.puts("actor: #{runs} of #{runs} runs reached exactly #{@expected}")
  end

  # EN: The actor protects each message, not a sequence of messages. Reading and then writing
  #     in two messages brings the lost update back.
  # PT: O ator protege cada mensagem, não uma sequência de mensagens. Ler e depois gravar em
  #     duas mensagens traz a atualização perdida de volta.
  @tag timeout: 300_000
  test "get followed by set loses updates even with an actor" do
    final = CounterRace.run(:get_then_set, @workers, @per_worker)
    IO.puts("get-then-set: final=#{final} lost=#{@expected - final}")
    assert final < @expected
    assert final >= @per_worker
  end

  test "a single process counts without losing anything" do
    assert CounterRace.run(:get_then_set, 1, 1000) == 1000
  end
end
