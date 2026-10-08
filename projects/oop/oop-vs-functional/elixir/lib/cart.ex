defmodule Cart do
  @moduledoc """
  The functional cart: plain immutable data and functions over it.
  """

  # EN: There are no classes here. A cart is a map, a line is a map, and a rule is a tagged
  #     tuple: the first element says which rule it is. The @type lines only document the
  #     shapes. Every value in Elixir is immutable, so no function can change its arguments.
  # PT: Não há classes aqui. Um carrinho é um mapa, uma linha é um mapa, e uma regra é uma tupla
  #     etiquetada: o primeiro elemento diz qual regra é. As linhas @type só documentam os
  #     formatos. Todo valor em Elixir é imutável, então nenhuma função consegue alterar seus
  #     argumentos.
  @type line :: %{sku: String.t(), unit_price_cents: integer(), quantity: integer()}
  @type rule ::
          {:percent_coupon, String.t(), integer()}
          | {:fixed_coupon, String.t(), integer()}
          | {:bulk, String.t(), integer(), integer()}
          | {:take_pay, String.t(), integer(), integer()}
  @type tax :: :none | {:flat, integer()}
  @type t :: %{lines: [line()], rules: [rule()], tax: tax()}
  @type receipt :: %{
          subtotal_cents: integer(),
          discounts: [{String.t(), integer()}],
          tax_cents: integer(),
          total_cents: integer()
        }
  @type error ::
          :invalid_quantity | :invalid_price | :invalid_percent | :invalid_rule | :invalid_tax

  @spec new() :: t()
  def new, do: %{lines: [], rules: [], tax: :none}

  # EN: "Adding" returns a new cart. The cart given as argument still exists, unchanged, for
  #     whoever holds it. The pipe operator in the callers threads the new cart from one call
  #     to the next.
  # PT: "Adicionar" devolve um carrinho novo. O carrinho recebido como argumento continua
  #     existindo, sem mudança, para quem o tiver em mãos. O operador pipe, em quem chama, leva
  #     o carrinho novo de uma chamada para a seguinte.
  @spec add_line(t(), String.t(), integer(), integer()) :: t()
  def add_line(cart, sku, unit_price_cents, quantity) do
    line = %{sku: sku, unit_price_cents: unit_price_cents, quantity: quantity}
    %{cart | lines: cart.lines ++ [line]}
  end

  @spec add_rule(t(), rule()) :: t()
  def add_rule(cart, rule), do: %{cart | rules: cart.rules ++ [rule]}

  @spec with_tax(t(), tax()) :: t()
  def with_tax(cart, tax), do: %{cart | tax: tax}

  # EN: An error is a value: the caller gets {:ok, receipt} or {:error, code} and pattern
  #     matches on it. `with` runs the steps in order and stops at the first one that does not
  #     match :ok.
  # PT: Um erro é um valor: quem chama recebe {:ok, recibo} ou {:error, código} e faz casamento
  #     de padrões sobre ele. O `with` executa os passos em ordem e para no primeiro que não
  #     casar com :ok.
  @spec price(t()) :: {:ok, receipt()} | {:error, error()}
  def price(cart) do
    with :ok <- first_error(cart.lines, &line_error/1),
         :ok <- first_error(cart.rules, &rule_error/1),
         :ok <- tax_error(cart.tax) do
      subtotal = cart.lines |> Enum.map(&line_total/1) |> Enum.sum()

      # EN: The loop of the object version becomes a reduce: the accumulator carries what is
      #     still to pay and the discounts applied so far from one rule to the next.
      # PT: O laço da versão com objetos vira um reduce: o acumulador leva o que ainda falta
      #     pagar e os descontos já aplicados de uma regra para a seguinte.
      {running, discounts} =
        Enum.reduce(cart.rules, {subtotal, []}, fn rule, {running, discounts} ->
          case min(discount_cents(rule, cart.lines, running), running) do
            0 -> {running, discounts}
            amount -> {running - amount, discounts ++ [{describe(rule), amount}]}
          end
        end)

      tax = tax_cents(cart.tax, running)

      {:ok,
       %{
         subtotal_cents: subtotal,
         discounts: discounts,
         tax_cents: tax,
         total_cents: running + tax
       }}
    end
  end

  # EN: One operation, one function, one clause per variant. The clause is chosen by pattern
  #     matching on the tag of the tuple, which plays the part that dynamic dispatch plays in
  #     the object version. Compare: there, this logic is spread over four classes.
  # PT: Uma operação, uma função, uma cláusula por variante. A cláusula é escolhida por
  #     casamento de padrões sobre a etiqueta da tupla, que faz o papel que o despacho dinâmico
  #     faz na versão com objetos. Compare: lá, esta lógica está espalhada por quatro classes.
  @spec discount_cents(rule(), [line()], integer()) :: integer()
  def discount_cents({:percent_coupon, _code, percent}, _lines, running) do
    div(running * percent, 100)
  end

  def discount_cents({:fixed_coupon, _code, amount}, _lines, _running), do: amount

  def discount_cents({:bulk, sku, min_quantity, percent}, lines, _running) do
    lines
    |> Enum.filter(&(&1.sku == sku and &1.quantity >= min_quantity))
    |> Enum.map(&div(line_total(&1) * percent, 100))
    |> Enum.sum()
  end

  def discount_cents({:take_pay, sku, take, pay}, lines, _running) do
    lines
    |> Enum.filter(&(&1.sku == sku))
    |> Enum.map(&(div(&1.quantity, take) * (take - pay) * &1.unit_price_cents))
    |> Enum.sum()
  end

  @spec describe(rule()) :: String.t()
  def describe({:percent_coupon, code, percent}), do: "coupon #{code}: #{percent}% off"

  def describe({:fixed_coupon, code, amount}) do
    cents = amount |> rem(100) |> Integer.to_string() |> String.pad_leading(2, "0")
    "coupon #{code}: #{div(amount, 100)}.#{cents} off"
  end

  def describe({:bulk, sku, min_quantity, percent}) do
    "bulk #{sku}: #{percent}% off from #{min_quantity} units"
  end

  def describe({:take_pay, sku, take, pay}), do: "#{sku}: take #{take}, pay #{pay}"

  # EN: 825 basis points = 8.25%. Adding 5000 before the integer division rounds half a cent up.
  # PT: 825 pontos-base = 8,25%. Somar 5000 antes da divisão inteira arredonda meio centavo para
  #     cima.
  @spec tax_cents(tax(), integer()) :: integer()
  def tax_cents(:none, _amount), do: 0
  def tax_cents({:flat, basis_points}, amount), do: div(amount * basis_points + 5000, 10_000)

  defp line_total(line), do: line.unit_price_cents * line.quantity

  defp first_error(items, check) do
    Enum.find_value(items, :ok, fn item ->
      case check.(item) do
        :ok -> nil
        error -> error
      end
    end)
  end

  defp line_error(%{quantity: quantity}) when not is_integer(quantity) or quantity < 1 do
    {:error, :invalid_quantity}
  end

  defp line_error(%{unit_price_cents: price}) when not is_integer(price) or price < 0 do
    {:error, :invalid_price}
  end

  defp line_error(_line), do: :ok

  # EN: Guards (`when`) narrow a clause beyond the shape of the data. Clauses are tried from
  #     top to bottom, so the valid cases come first and the last clause of each rule rejects.
  # PT: Guardas (`when`) restringem uma cláusula além do formato do dado. As cláusulas são
  #     testadas de cima para baixo, então os casos válidos vêm primeiro e a última cláusula de
  #     cada regra rejeita.
  defp rule_error({:percent_coupon, _code, percent}), do: percent_error(percent)

  defp rule_error({:fixed_coupon, _code, amount}) when is_integer(amount) and amount >= 0, do: :ok

  defp rule_error({:bulk, _sku, min_quantity, percent})
       when is_integer(min_quantity) and min_quantity >= 1,
       do: percent_error(percent)

  defp rule_error({:take_pay, _sku, take, pay})
       when is_integer(take) and is_integer(pay) and pay >= 1 and pay < take,
       do: :ok

  defp rule_error(_rule), do: {:error, :invalid_rule}

  defp percent_error(percent) when is_integer(percent) and percent in 0..100, do: :ok
  defp percent_error(_percent), do: {:error, :invalid_percent}

  defp tax_error({:flat, basis_points}) when not is_integer(basis_points) or basis_points < 0 do
    {:error, :invalid_tax}
  end

  defp tax_error(_tax), do: :ok
end
