defmodule PureFunctionsProperties.Pipeline do
  @moduledoc """
  EN: A sales report built by composing small pure functions. Each step takes a value and
      returns a new one, so the steps can be tested alone and read top to bottom.
  PT: Um relatório de vendas montado pela composição de pequenas funções puras. Cada etapa
      recebe um valor e devolve um novo, então as etapas podem ser testadas sozinhas e lidas de
      cima para baixo.
  ES: Un reporte de ventas armado componiendo pequeñas funciones puras. Cada paso
      recibe un valor y devuelve uno nuevo, así que los pasos se pueden probar solos y leer de
      arriba hacia abajo.
  """

  # EN: The pipe operator passes the value on its left as the first argument of the call on
  #     its right, so these five lines are `Enum.take(ranked(totals_by_category(...)), top)`
  #     written in the order in which things happen. TypeScript has no such operator, and the
  #     other implementation builds the same chain with a `pipe` function.
  # PT: O operador pipe passa o valor à esquerda como primeiro argumento da chamada à direita,
  #     então estas cinco linhas são `Enum.take(ranked(totals_by_category(...)), top)` escritas
  #     na ordem em que as coisas acontecem. TypeScript não tem esse operador, e a outra
  #     implementação monta a mesma cadeia com uma função `pipe`.
  # ES: El operador pipe pasa el valor de la izquierda como primer argumento de la llamada de la
  #     derecha, así que estas cinco líneas son `Enum.take(ranked(totals_by_category(...)), top)`
  #     escritas en el orden en que ocurren las cosas. TypeScript no tiene ese operador, y la otra
  #     implementación arma la misma cadena con una función `pipe`.
  def sales_report(orders, top) do
    orders
    |> only_status("paid")
    |> line_totals()
    |> totals_by_category()
    |> ranked()
    |> Enum.take(top)
  end

  def only_status(orders, status), do: Enum.filter(orders, &(&1.status == status))

  def line_totals(orders) do
    Enum.flat_map(orders, fn order ->
      Enum.map(order.lines, &%{category: &1.category, total_cents: &1.unit_cents * &1.quantity})
    end)
  end

  # EN: Grouping is a reduction whose accumulator is a map from category to total. Each step
  #     returns a new map; nothing is updated in place.
  # PT: Agrupar é uma redução cujo acumulador é um map de categoria para total. Cada passo
  #     devolve um map novo; nada é atualizado no lugar.
  # ES: Agrupar es una reducción cuyo acumulador es un map de categoría a total. Cada paso
  #     devuelve un map nuevo; nada se actualiza en el lugar.
  def totals_by_category(lines) do
    lines
    |> Enum.reduce(%{}, fn line, totals ->
      Map.update(totals, line.category, line.total_cents, &(&1 + line.total_cents))
    end)
    |> Enum.map(fn {category, total_cents} -> %{category: category, total_cents: total_cents} end)
  end

  # EN: Largest total first; equal totals are ordered by category name so the result does not
  #     depend on the order of the input (a map has no guaranteed order).
  # PT: Maior total primeiro; totais iguais são ordenados pelo nome da categoria, para o
  #     resultado não depender da ordem da entrada (um map não tem ordem garantida).
  # ES: Primero el total mayor; los totales iguales se ordenan por el nombre de la categoría, para
  #     que el resultado no dependa del orden de la entrada (un map no tiene orden garantizado).
  def ranked(totals), do: Enum.sort_by(totals, &{-&1.total_cents, &1.category})
end
