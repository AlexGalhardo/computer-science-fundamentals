defmodule Scenarios do
  @moduledoc """
  Reader of the shared `scenarios.txt`. Support code for the tests and the demo.
  """

  # EN: This module is not counted in the comparison. It turns the text file into a list of
  #     {name, cart, expected}: the cart is built with the public functions of Cart, and the
  #     expectation has the same shape that Cart.price/1 returns, so a test compares them with
  #     one ==.
  # PT: Este módulo não entra na comparação. Ele transforma o arquivo de texto em uma lista de
  #     {nome, carrinho, esperado}: o carrinho é montado com as funções públicas de Cart, e o
  #     esperado tem o mesmo formato que Cart.price/1 devolve, então um teste os compara com um
  #     único ==.
  # ES: Este módulo no entra en la comparación. Transforma el archivo de texto en una lista de
  #     {nombre, carrito, esperado}: el carrito se arma con las funciones públicas de Cart, y lo
  #     esperado tiene el mismo formato que devuelve Cart.price/1, así que una prueba los compara
  #     con un solo ==.

  @file_path Path.expand("../../scenarios.txt", __DIR__)

  def path, do: @file_path

  def load(path \\ @file_path) do
    path
    |> File.read!()
    |> String.split(~r/\r?\n/)
    |> Enum.map(&String.trim/1)
    |> Enum.reject(&(&1 == "" or String.starts_with?(&1, "#")))
    |> Enum.chunk_while([], &chunk/2, &{:cont, Enum.reverse(&1), []})
    |> Enum.reject(&(&1 == []))
    |> Enum.map(&scenario/1)
  end

  # EN: Groups the lines: a "scenario" line closes the group before it and opens a new one.
  # PT: Agrupa as linhas: uma linha "scenario" fecha o grupo anterior e abre um novo.
  # ES: Agrupa las líneas: una línea "scenario" cierra el grupo anterior y abre uno nuevo.
  defp chunk("scenario " <> _ = line, acc), do: {:cont, Enum.reverse(acc), [line]}
  defp chunk(line, acc), do: {:cont, [line | acc]}

  defp scenario(["scenario " <> name | lines]) do
    empty = %{subtotal_cents: 0, discounts: [], tax_cents: 0, total_cents: 0}

    {cart, receipt, error} =
      Enum.reduce(lines, {Cart.new(), empty, nil}, fn line, {cart, receipt, error} ->
        case String.split(line, " ") do
          ["item", sku, price, quantity] ->
            {Cart.add_line(cart, sku, int(price), int(quantity)), receipt, error}

          ["rule" | rule] ->
            {Cart.add_rule(cart, rule(rule)), receipt, error}

          ["tax", "none"] ->
            {Cart.with_tax(cart, :none), receipt, error}

          ["tax", "flat", basis_points] ->
            {Cart.with_tax(cart, {:flat, int(basis_points)}), receipt, error}

          ["expect", "subtotal", cents] ->
            {cart, %{receipt | subtotal_cents: int(cents)}, error}

          ["expect", "tax", cents] ->
            {cart, %{receipt | tax_cents: int(cents)}, error}

          ["expect", "total", cents] ->
            {cart, %{receipt | total_cents: int(cents)}, error}

          ["expect", "discount", cents | label] ->
            discount = {Enum.join(label, " "), int(cents)}
            {cart, %{receipt | discounts: receipt.discounts ++ [discount]}, error}

          ["expect", "error", code] ->
            {cart, receipt, code |> String.replace("-", "_") |> String.to_atom()}
        end
      end)

    expected = if error, do: {:error, error}, else: {:ok, receipt}
    {name, cart, expected}
  end

  defp rule(["percent-coupon", code, percent]), do: {:percent_coupon, code, int(percent)}
  defp rule(["fixed-coupon", code, amount]), do: {:fixed_coupon, code, int(amount)}
  defp rule(["bulk", sku, min, percent]), do: {:bulk, sku, int(min), int(percent)}
  defp rule(["take-pay", sku, take, pay]), do: {:take_pay, sku, int(take), int(pay)}

  defp int(text), do: String.to_integer(text)

  def format({:error, code}) do
    "  rejected: #{code |> Atom.to_string() |> String.replace("_", "-")}"
  end

  def format({:ok, receipt}) do
    discounts =
      Enum.map(receipt.discounts, fn {label, cents} -> "  - #{money(cents)}  #{label}" end)

    ["  subtotal #{money(receipt.subtotal_cents)}"]
    |> Kernel.++(discounts)
    |> Kernel.++(["  tax #{money(receipt.tax_cents)}", "  total #{money(receipt.total_cents)}"])
    |> Enum.join("\n")
  end

  defp money(cents) do
    "#{div(cents, 100)}.#{cents |> rem(100) |> Integer.to_string() |> String.pad_leading(2, "0")}"
  end
end
