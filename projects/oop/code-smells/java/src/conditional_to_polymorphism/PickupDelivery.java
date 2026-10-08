public final class PickupDelivery implements DeliveryMethod {
  @Override
  public String name() {
    return "pickup";
  }

  @Override
  public String trackingPrefix() {
    return "PK";
  }

  @Override
  public int costCents(int grams) {
    return 0;
  }

  @Override
  public int days() {
    return 0;
  }
}
