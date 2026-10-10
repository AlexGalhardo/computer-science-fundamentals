defmodule OrderStateMachine.CLI do
  @moduledoc """
  EN: Command line: `mix order <event> [event...]` and `mix order demo`.
  PT: Linha de comando: `mix order <evento> [evento...]` e `mix order demo`.
  ES: Línea de comandos: `mix order <evento> [evento...]` y `mix order demo`.
  """

  # EN: Returns the text and the exit code instead of printing and halting, so the tests can
  #     call it. Exit code: 0 when every event was accepted, 1 when one was rejected, 2 on bad
  #     usage.
  # PT: Devolve o texto e o código de saída em vez de imprimir e encerrar, para que os testes
  #     possam chamá-la. Código de saída: 0 quando todo evento foi aceito, 1 quando algum foi
  #     rejeitado, 2 em uso incorreto.
  # ES: Devuelve el texto y el código de salida en lugar de imprimir y terminar, para que las
  #     pruebas puedan llamarla. Código de salida: 0 cuando todo evento fue aceptado, 1 cuando
  #     alguno fue rechazado, 2 en uso incorrecto.
  @spec run([String.t()]) :: {String.t(), 0 | 1 | 2}
  def run(["demo"]) do
    {full, _code} = walk([:pay, :ship, :deliver])
    {rejected, _code} = walk([:pay, :deliver, :ship, :deliver])

    output =
      Enum.join(
        [
          "== A full order / Um pedido completo / Un pedido completo ==",
          full,
          "",
          "== A rejected transition / Uma transição rejeitada / Una transición rechazada ==",
          rejected
        ],
        "\n"
      )

    {output, 0}
  end

  def run(args) do
    parsed = Enum.map(args, &OrderStateMachine.parse_event/1)

    if args == [] or :error in parsed do
      events = Enum.join(OrderStateMachine.events(), ", ")
      {"usage: mix order <event> [event...]\nevents: #{events}", 2}
    else
      walk(for {:ok, event} <- parsed, do: event)
    end
  end

  @spec walk([OrderStateMachine.event()]) :: {String.t(), 0 | 1}
  def walk(events) do
    {steps, final} = OrderStateMachine.run(events)
    terminal = if OrderStateMachine.terminal?(final), do: " (terminal)", else: ""

    lines =
      ["start: #{OrderStateMachine.initial()}"] ++
        Enum.map(steps, &format_step/1) ++ ["end: #{final}#{terminal}"]

    rejected? = Enum.any?(steps, fn {_event, _from, _to, outcome} -> outcome == :rejected end)
    {Enum.join(lines, "\n"), if(rejected?, do: 1, else: 0)}
  end

  defp format_step({event, from, to, :accepted}) do
    "  #{pad(event)} #{from} -> #{to}"
  end

  defp format_step({event, from, _to, :rejected}) do
    "  #{pad(event)} REJECTED: not allowed in #{from}, the order stays in #{from}"
  end

  defp pad(event), do: event |> Atom.to_string() |> String.pad_trailing(8)
end
