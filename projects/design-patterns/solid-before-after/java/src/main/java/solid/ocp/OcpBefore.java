package solid.ocp;

// EN: VIOLATES THE OPEN-CLOSED PRINCIPLE. The list of customer kinds is written inside the
//     method. Every new kind is an edit to code that already works and is already tested.
// PT: QUEBRA O PRINCÍPIO ABERTO-FECHADO. A lista de tipos de cliente está escrita dentro do
//     método. Todo tipo novo é uma edição em código que já funciona e já está testado.
public final class OcpBefore {
  private OcpBefore() {}

  public static long discountCents(String kind, long totalCents) {
    if (kind.equals("regular")) {
      return 0;
    }
    if (kind.equals("premium")) {
      return Math.round(totalCents * 10 / 100.0);
    }
    if (kind.equals("employee")) {
      return Math.round(totalCents * 30 / 100.0);
    }
    throw new IllegalArgumentException("unknown customer kind: " + kind);
  }
}
