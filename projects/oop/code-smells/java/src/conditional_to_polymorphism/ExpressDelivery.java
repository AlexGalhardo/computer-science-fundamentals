public final class ExpressDelivery implements DeliveryMethod {
  @Override
  public String name() {
    return "express";
  }

  @Override
  public String trackingPrefix() {
    return "EX";
  }

  @Override
  public int costCents(int grams) {
    return 2500 + 500 * DeliveryMethod.startedKilos(grams);
  }

  @Override
  public int days() {
    return 1;
  }
}
