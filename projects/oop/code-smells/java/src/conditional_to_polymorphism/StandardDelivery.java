public final class StandardDelivery implements DeliveryMethod {
  @Override
  public String name() {
    return "standard";
  }

  @Override
  public String trackingPrefix() {
    return "ST";
  }

  @Override
  public int costCents(int grams) {
    return 1200 + 300 * DeliveryMethod.startedKilos(grams);
  }

  @Override
  public int days() {
    return 5;
  }
}
