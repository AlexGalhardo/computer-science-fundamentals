import java.util.List;

// EN: "Take 3, pay 2": in every complete group of `take` units, `take - pay` units are free.
//     This was the last rule added to the project. In this version it is this one new file:
//     no other production file was touched (see the comparison in the README).
// PT: "Leve 3, pague 2": em cada grupo completo de `take` unidades, `take - pay` unidades saem
//     de graça. Esta foi a última regra acrescentada ao projeto. Nesta versão ela é este único
//     arquivo novo: nenhum outro arquivo de produção foi tocado (veja a comparação no README).
public final class TakePayDiscount implements DiscountRule {
  private final String sku;
  private final int take;
  private final int pay;

  public TakePayDiscount(String sku, int take, int pay) {
    if (pay < 1 || pay >= take) {
      throw new CartException("invalid-rule");
    }
    this.sku = sku;
    this.take = take;
    this.pay = pay;
  }

  @Override
  public int discountCents(List<CartLine> lines, int runningCents) {
    int total = 0;
    for (CartLine line : lines) {
      if (line.sku().equals(sku)) {
        total += line.quantity() / take * (take - pay) * line.unitPriceCents();
      }
    }
    return total;
  }

  @Override
  public String describe() {
    return sku + ": take " + take + ", pay " + pay;
  }
}
