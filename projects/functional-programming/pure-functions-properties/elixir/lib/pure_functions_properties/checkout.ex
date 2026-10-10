defmodule PureFunctionsProperties.Checkout do
  @moduledoc """
  EN: The same checkout rule written twice. `price_order_impure/1` reads the clock and keeps a
      hidden counter; `price_order/2` receives everything it needs as arguments. The rule is
      identical: add up the items and apply the coupon if it has not expired.
  PT: A mesma regra de checkout escrita duas vezes. `price_order_impure/1` lê o relógio e
      mantém um contador oculto; `price_order/2` recebe por argumento tudo de que precisa. A
      regra é idêntica: somar os itens e aplicar o cupom se ele não tiver vencido.
  ES: La misma regla de checkout escrita dos veces. `price_order_impure/1` lee el reloj y
      mantiene un contador oculto; `price_order/2` recibe por argumento todo lo que necesita. La
      regla es idéntica: sumar los ítems y aplicar el cupón si no ha vencido.
  """

  # EN: PURE. `now` is a parameter (seconds since the epoch), so the answer depends only on
  #     the arguments. Money is kept in integer cents and the discount is rounded down, which
  #     keeps every result exact.
  # PT: PURA. `now` é um parâmetro (segundos desde a época), então a resposta depende só dos
  #     argumentos. O dinheiro fica em centavos inteiros e o desconto é arredondado para
  #     baixo, o que mantém todo resultado exato.
  # ES: PURA. `now` es un parámetro (segundos desde la época), así que la respuesta depende solo de
  #     los argumentos. El dinero se guarda en centavos enteros y el descuento se redondea hacia
  #     abajo, lo que mantiene exacto todo resultado.
  def price_order(%{items: items, coupon: coupon}, now) do
    subtotal = items |> Enum.map(&(&1.unit_cents * &1.quantity)) |> Enum.sum()
    discount = discount(subtotal, coupon, now)
    %{subtotal_cents: subtotal, discount_cents: discount, total_cents: subtotal - discount}
  end

  # EN: Two clauses instead of an `if`: the first matches only a coupon that is still valid,
  #     and the second catches everything else, including `nil` (no coupon).
  # PT: Duas cláusulas no lugar de um `if`: a primeira casa só com um cupom ainda válido, e a
  #     segunda pega todo o resto, inclusive `nil` (sem cupom).
  # ES: Dos cláusulas en lugar de un `if`: la primera coincide solo con un cupón todavía válido, y
  #     la segunda atrapa todo lo demás, incluido `nil` (sin cupón).
  defp discount(subtotal, %{percent: percent, expires_at: expires_at}, now)
       when now <= expires_at,
       do: div(subtotal * percent, 100)

  defp discount(_subtotal, _coupon, _now), do: 0

  # EN: IMPURE, kept on purpose for comparison. It has a hidden input (the system clock) and
  #     a hidden output (a counter in the process dictionary, the closest thing Elixir has to
  #     a mutable global), so two calls with the same order return different values, and a
  #     test of the coupon rule would have to replace the clock.
  # PT: IMPURA, mantida de propósito para comparação. Ela tem uma entrada oculta (o relógio do
  #     sistema) e uma saída oculta (um contador no dicionário do processo, o mais próximo que
  #     Elixir tem de uma global mutável), então duas chamadas com o mesmo pedido devolvem
  #     valores diferentes, e um teste da regra do cupom teria de substituir o relógio.
  # ES: IMPURA, mantenida a propósito para comparar. Tiene una entrada oculta (el reloj del
  #     sistema) y una salida oculta (un contador en el diccionario del proceso, lo más parecido
  #     que tiene Elixir a una global mutable), así que dos llamadas con el mismo pedido devuelven
  #     valores distintos, y una prueba de la regla del cupón tendría que reemplazar el reloj.
  def price_order_impure(order) do
    now = System.os_time(:second)
    receipt_number = Process.get(:receipts_issued, 0) + 1
    Process.put(:receipts_issued, receipt_number)
    order |> price_order(now) |> Map.put(:receipt_number, receipt_number)
  end

  # EN: IMPERATIVE SHELL. The only place that touches the world: it reads the clock once,
  #     hands the value to the pure core and returns the text to print. All decisions stay in
  #     `price_order/2`.
  # PT: CASCA IMPERATIVA. O único lugar que toca o mundo: lê o relógio uma vez, entrega o
  #     valor ao núcleo puro e devolve o texto a imprimir. Todas as decisões ficam em
  #     `price_order/2`.
  # ES: CASCARÓN IMPERATIVO. El único lugar que toca el mundo: lee el reloj una vez, entrega el
  #     valor al núcleo puro y devuelve el texto a imprimir. Todas las decisiones están en
  #     `price_order/2`.
  def checkout_now(order) do
    price = price_order(order, System.os_time(:second))

    "subtotal #{price.subtotal_cents} - discount #{price.discount_cents} = total #{price.total_cents}"
  end
end
