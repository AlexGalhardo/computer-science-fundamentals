import java.util.List;

// EN: A fixed amount. The cart clamps it, so a coupon bigger than the cart makes the total zero,
//     never negative.
// PT: Um valor fixo. O carrinho o limita, então um cupom maior que o carrinho zera o total,
//     nunca o deixa negativo.
// ES: Un valor fijo. El carrito lo limita, así que un cupón mayor que el carrito deja el total en
//     cero, nunca negativo.
public final class FixedCoupon implements DiscountRule {
  private final String code;
  private final int amountCents;

  public FixedCoupon(String code, int amountCents) {
    if (amountCents < 0) {
      throw new CartException("invalid-rule");
    }
    this.code = code;
    this.amountCents = amountCents;
  }

  @Override
  public int discountCents(List<CartLine> lines, int runningCents) {
    return amountCents;
  }

  @Override
  public String describe() {
    return String.format("coupon %s: %d.%02d off", code, amountCents / 100, amountCents % 100);
  }
}
