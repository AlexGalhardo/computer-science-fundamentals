defmodule OrderStateMachineTest do
  use ExUnit.Case, async: true

  # EN: The expected answers come straight from `machine.json`, read again here, and not from
  #     the module under test. The loop below then creates one test per (state, event) pair:
  #     pairs in the table must succeed, all the others must be rejected.
  # PT: As respostas esperadas vêm direto de `machine.json`, lido de novo aqui, e não do módulo
  #     em teste. O laço abaixo cria então um teste por par (estado, evento): os pares da tabela
  #     devem dar certo, todos os outros devem ser rejeitados.
  @table Path.expand("../../machine.json", __DIR__) |> File.read!() |> JSON.decode!()
  @expected Map.new(@table["transitions"], fn row ->
              {{String.to_atom(row["from"]), String.to_atom(row["event"])},
               String.to_atom(row["to"])}
            end)

  for state <- Enum.map(@table["states"], &String.to_atom/1),
      event <- Enum.map(@table["events"], &String.to_atom/1) do
    case Map.fetch(@expected, {state, event}) do
      {:ok, target} ->
        test "#{state} --#{event}--> #{target} succeeds" do
          assert OrderStateMachine.transition(unquote(state), unquote(event)) ==
                   {:ok, unquote(target)}
        end

      :error ->
        test "#{event} is rejected in #{state}" do
          assert OrderStateMachine.transition(unquote(state), unquote(event)) ==
                   {:error, {:invalid_transition, unquote(state), unquote(event)}}

          assert OrderStateMachine.run([unquote(event)], unquote(state)) ==
                   {[{unquote(event), unquote(state), unquote(state), :rejected}], unquote(state)}
        end
    end
  end

  test "the table has 6 valid transitions and 24 rejected pairs" do
    pairs =
      for state <- OrderStateMachine.states(),
          event <- OrderStateMachine.events(),
          do: {state, event}

    valid =
      Enum.filter(pairs, fn {state, event} ->
        match?({:ok, _}, OrderStateMachine.transition(state, event))
      end)

    assert length(pairs) == 30
    assert length(valid) == 6
    assert length(pairs) - length(valid) == 24
  end

  test "cancelled and refunded are the terminal states" do
    assert Enum.filter(OrderStateMachine.states(), &OrderStateMachine.terminal?/1) ==
             [:cancelled, :refunded]
  end

  test "a full order ends in delivered" do
    assert {steps, :delivered} = OrderStateMachine.run([:pay, :ship, :deliver])
    assert Enum.all?(steps, fn {_event, _from, _to, outcome} -> outcome == :accepted end)
  end

  test "a rejected event changes nothing and the order can go on" do
    assert {steps, :delivered} = OrderStateMachine.run([:pay, :deliver, :ship, :deliver])
    assert Enum.at(steps, 1) == {:deliver, :paid, :paid, :rejected}
  end

  test "unknown text is not turned into an event" do
    assert OrderStateMachine.parse_event("pay") == {:ok, :pay}
    assert OrderStateMachine.parse_event("teleport") == :error
  end
end
