import java.util.List;

// EN: A percentage off the lines of one product, from a minimum quantity on. This rule looks at
//     the lines and ignores the running total, the opposite of the coupons.
// PT: Uma porcentagem sobre as linhas de um produto, a partir de uma quantidade mínima. Esta
//     regra olha as linhas e ignora o total corrente, o oposto dos cupons.
// ES: Un porcentaje sobre las líneas de un producto, a partir de una cantidad mínima. Esta regla
//     mira las líneas e ignora el total corriente, lo opuesto a los cupones.
public final class BulkDiscount implements DiscountRule {
  private final String sku;
  private final int minQuantity;
  private final int percent;

  public BulkDiscount(String sku, int minQuantity, int percent) {
    if (minQuantity < 1) {
      throw new CartException("invalid-rule");
    }
    CartException.requirePercent(percent);
    this.sku = sku;
    this.minQuantity = minQuantity;
    this.percent = percent;
  }

  @Override
  public int discountCents(List<CartLine> lines, int runningCents) {
    int total = 0;
    for (CartLine line : lines) {
      if (line.sku().equals(sku) && line.quantity() >= minQuantity) {
        total += line.totalCents() * percent / 100;
      }
    }
    return total;
  }

  @Override
  public String describe() {
    return "bulk " + sku + ": " + percent + "% off from " + minQuantity + " units";
  }
}
