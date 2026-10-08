defmodule PureFunctionsProperties.Cases do
  @moduledoc """
  EN: Reads `cases.json`, the examples shared with the TypeScript implementation, and turns
      its camelCase JSON objects into the maps with atom keys that the Elixir code uses.
      Reading a file is an effect, so it stays here, at the edge, away from the pure modules.
  PT: Lê `cases.json`, os exemplos compartilhados com a implementação em TypeScript, e
      transforma os objetos JSON em camelCase nos maps com chaves átomo que o código Elixir
      usa. Ler um arquivo é um efeito, então isso fica aqui, na borda, longe dos módulos puros.
  """

  def load do
    "../cases.json" |> Path.expand(File.cwd!()) |> File.read!() |> JSON.decode!()
  end

  def order(%{"items" => items, "coupon" => coupon}) do
    %{
      items: Enum.map(items, &%{unit_cents: &1["unitCents"], quantity: &1["quantity"]}),
      coupon: coupon && %{percent: coupon["percent"], expires_at: coupon["expiresAt"]}
    }
  end

  def price(%{"subtotalCents" => subtotal, "discountCents" => discount, "totalCents" => total}) do
    %{subtotal_cents: subtotal, discount_cents: discount, total_cents: total}
  end

  def sales_order(%{"status" => status, "lines" => lines}) do
    %{
      status: status,
      lines:
        Enum.map(
          lines,
          &%{category: &1["category"], unit_cents: &1["unitCents"], quantity: &1["quantity"]}
        )
    }
  end

  def category_total(%{"category" => category, "totalCents" => total}) do
    %{category: category, total_cents: total}
  end
end
