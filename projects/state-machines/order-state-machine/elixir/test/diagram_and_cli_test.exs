defmodule OrderStateMachine.DiagramAndCliTest do
  use ExUnit.Case, async: true

  alias OrderStateMachine.CLI
  alias OrderStateMachine.Diagram

  # EN: The freshness test, from the Elixir side: the committed file must be exactly what this
  #     implementation renders from the table.
  # PT: O teste de atualização, do lado do Elixir: o arquivo versionado deve ser exatamente o
  #     que esta implementação renderiza a partir da tabela.
  # ES: La prueba de actualización, desde el lado de Elixir: el archivo versionado debe ser
  #     exactamente lo que esta implementación renderiza a partir de la tabla.
  test "the committed diagram.md is up to date" do
    committed = Path.expand("../../diagram.md", __DIR__) |> File.read!()
    assert committed == Diagram.render()
  end

  test "a full order exits with 0" do
    assert {output, 0} = CLI.run(["pay", "ship", "deliver"])
    assert output =~ "ship     paid -> shipped"
    assert output =~ "end: delivered"
  end

  test "a rejected event exits with 1 and says where the order stays" do
    assert {output, 1} = CLI.run(["pay", "deliver"])
    assert output =~ "deliver  REJECTED: not allowed in paid, the order stays in paid"
    assert output =~ "end: paid"
  end

  test "an unknown event is bad usage, not a transition" do
    assert {output, 2} = CLI.run(["pay", "teleport"])
    assert output =~ "usage:"
  end

  test "the demo shows a full order and a rejected transition" do
    assert {output, 0} = CLI.run(["demo"])
    assert output =~ "A full order"
    assert output =~ "Un pedido completo"
    assert output =~ "REJECTED"
  end

  test "a terminal state is marked" do
    assert {output, 0} = CLI.run(["cancel"])
    assert output =~ "end: cancelled (terminal)"
  end
end
