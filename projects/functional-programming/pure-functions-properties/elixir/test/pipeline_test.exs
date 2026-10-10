defmodule PureFunctionsProperties.PipelineTest do
  use ExUnit.Case, async: true

  alias PureFunctionsProperties.{Cases, Pipeline, Prop}

  defp shared do
    pipeline = Cases.load()["pipeline"]

    %{
      top: pipeline["top"],
      orders: Enum.map(pipeline["orders"], &Cases.sales_order/1),
      expected: Enum.map(pipeline["expected"], &Cases.category_total/1)
    }
  end

  describe "composition" do
    test "the pipe applies the functions from left to right" do
      add_one = &(&1 + 1)
      double = &(&1 * 2)
      assert 5 |> add_one.() |> double.() == 12
      assert 5 |> double.() |> add_one.() == 11
    end

    # EN: The orders and the expected report come from cases.json, the same file the
    #     TypeScript tests read, so both implementations are held to the same answer.
    # PT: Os pedidos e o relatório esperado vêm de cases.json, o mesmo arquivo que os testes
    #     em TypeScript leem, então as duas implementações são cobradas pela mesma resposta.
    # ES: Los pedidos y el reporte esperado vienen de cases.json, el mismo archivo que leen las
    #     pruebas en TypeScript, así que las dos implementaciones deben dar la misma respuesta.
    test "the sales report matches the shared expected result" do
      %{top: top, orders: orders, expected: expected} = shared()
      assert Pipeline.sales_report(orders, top) == expected
    end

    test "each step can be tested on its own" do
      paid = Pipeline.only_status(shared().orders, "paid")
      assert length(paid) == 3
      assert length(Pipeline.line_totals(paid)) == 6

      categories =
        paid
        |> Pipeline.line_totals()
        |> Pipeline.totals_by_category()
        |> Pipeline.ranked()
        |> Enum.map(& &1.category)

      assert categories == ["games", "books", "music", "tools", "garden"]
    end
  end

  describe "invariant" do
    defp orders do
      Prop.list_of(
        Prop.tuple([
          Prop.one_of(["paid", "pending", "cancelled"]),
          Prop.list_of(
            Prop.tuple([
              Prop.one_of(["books", "games", "music"]),
              Prop.int(0, 50_000),
              Prop.int(0, 9)
            ]),
            4
          )
        ]),
        6
      )
    end

    defp to_orders(generated) do
      Enum.map(generated, fn {status, lines} ->
        %{
          status: status,
          lines:
            Enum.map(lines, fn {category, unit_cents, quantity} ->
              %{category: category, unit_cents: unit_cents, quantity: quantity}
            end)
        }
      end)
    end

    defp sum(rows), do: rows |> Enum.map(& &1.total_cents) |> Enum.sum()

    # EN: Grouping and sorting may move money between rows, but they cannot create or lose
    #     any: the full report adds up to the paid lines, for any list of orders.
    # PT: Agrupar e ordenar podem mover dinheiro entre linhas, mas não podem criar nem perder
    #     nenhum: o relatório completo soma o mesmo que as linhas pagas, para qualquer lista
    #     de pedidos.
    # ES: Agrupar y ordenar pueden mover dinero entre líneas, pero no pueden crear ni perder
    #     ninguno: el reporte completo suma lo mismo que las líneas pagadas, para cualquier lista
    #     de pedidos.
    test "the full report adds up to the paid lines" do
      property = fn generated ->
        sales = to_orders(generated)
        paid_lines = sales |> Pipeline.only_status("paid") |> Pipeline.line_totals()
        sum(Pipeline.sales_report(sales, 1_000_000)) == sum(paid_lines)
      end

      assert Prop.check(orders(), property, runs: 300) == {:ok, 300}
    end
  end
end
