public final class NoTax implements TaxPolicy {
  @Override
  public int taxCents(int amountCents) {
    return 0;
  }
}
