import java.util.List;

// EN: A percentage of what is still to pay. Integer division drops fractions of a cent.
// PT: Uma porcentagem do que ainda falta pagar. A divisão inteira descarta frações de centavo.
public final class PercentCoupon implements DiscountRule {
  private final String code;
  private final int percent;

  public PercentCoupon(String code, int percent) {
    CartException.requirePercent(percent);
    this.code = code;
    this.percent = percent;
  }

  @Override
  public int discountCents(List<CartLine> lines, int runningCents) {
    return runningCents * percent / 100;
  }

  @Override
  public String describe() {
    return "coupon " + code + ": " + percent + "% off";
  }
}
