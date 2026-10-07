defmodule OrderStateMachine.Diagram do
  @moduledoc """
  EN: Renders the table as Mermaid text. It must produce exactly the committed `diagram.md`.
  PT: Renderiza a tabela como texto Mermaid. Precisa produzir exatamente o `diagram.md` versionado.
  """

  # EN: The TypeScript implementation writes `diagram.md`; this one renders it again on its own.
  #     If the two languages disagreed about the table, the freshness test of one of them
  #     would fail, so the file also proves that both implement the same machine.
  # PT: A implementação em TypeScript grava `diagram.md`; esta o renderiza de novo por conta
  #     própria. Se as duas linguagens discordassem sobre a tabela, o teste de atualização de
  #     uma delas falharia, então o arquivo também prova que ambas implementam a mesma máquina.
  @spec render() :: String.t()
  def render do
    transitions = OrderStateMachine.transitions()
    events = OrderStateMachine.events()
    targets = Map.new(transitions, fn {from, event, to} -> {{from, event}, to} end)

    arrows = for {from, event, to} <- transitions, do: "    #{from} --> #{to}: #{event}"

    finals =
      for state <- OrderStateMachine.states(), OrderStateMachine.terminal?(state) do
        "    #{state} --> [*]"
      end

    rows =
      for state <- OrderStateMachine.states() do
        cells = Enum.map(events, fn event -> Map.get(targets, {state, event}, "-") end)
        "| #{state} | #{Enum.join(cells, " | ")} |"
      end

    lines =
      [
        "<!-- Generated from machine.json. Do not edit by hand: run the diagram command of the README. -->",
        "",
        "# Order state machine",
        "",
        "```mermaid",
        "stateDiagram-v2",
        "    [*] --> #{OrderStateMachine.initial()}"
      ] ++
        arrows ++
        finals ++
        [
          "```",
          "",
          "| state | #{Enum.join(events, " | ")} |",
          "| --- | #{Enum.map_join(events, " | ", fn _event -> "---" end)} |"
        ] ++ rows

    Enum.join(lines, "\n") <> "\n"
  end
end
