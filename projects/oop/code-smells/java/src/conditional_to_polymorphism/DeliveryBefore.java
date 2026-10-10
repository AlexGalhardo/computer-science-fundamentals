// EN: SMELL: a conditional chain on a type code. The question "which kind of delivery is this?"
//     is asked in three methods. A new kind means a new branch in each of them, and a forgotten
//     branch is found only when the last line throws at run time.
// PT: MAU CHEIRO: uma cadeia de condicionais sobre um código de tipo. A pergunta "que tipo de
//     entrega é esta?" é feita em três métodos. Um tipo novo exige um ramo novo em cada um
//     deles, e um ramo esquecido só é achado quando a última linha lança exceção em tempo de
//     execução.
// ES: MAL OLOR: una cadena de condicionales sobre un código de tipo. La pregunta "¿qué tipo de
//     entrega es esta?" se hace en tres métodos. Un tipo nuevo exige una rama nueva en cada uno
//     de ellos, y una rama olvidada solo se descubre cuando la última línea lanza una excepción
//     en tiempo de ejecución.
public final class DeliveryBefore {
  private DeliveryBefore() {}

  static int costCents(DeliveryKind kind, int grams) {
    int startedKilos = (grams + 999) / 1000;
    if (kind == DeliveryKind.STANDARD) {
      return 1200 + 300 * startedKilos;
    } else if (kind == DeliveryKind.EXPRESS) {
      return 2500 + 500 * startedKilos;
    } else if (kind == DeliveryKind.PICKUP) {
      return 0;
    }
    throw new IllegalArgumentException("unknown delivery kind: " + kind);
  }

  static int days(DeliveryKind kind) {
    if (kind == DeliveryKind.STANDARD) {
      return 5;
    } else if (kind == DeliveryKind.EXPRESS) {
      return 1;
    } else if (kind == DeliveryKind.PICKUP) {
      return 0;
    }
    throw new IllegalArgumentException("unknown delivery kind: " + kind);
  }

  static String trackingPrefix(DeliveryKind kind) {
    if (kind == DeliveryKind.STANDARD) {
      return "ST";
    } else if (kind == DeliveryKind.EXPRESS) {
      return "EX";
    } else if (kind == DeliveryKind.PICKUP) {
      return "PK";
    }
    throw new IllegalArgumentException("unknown delivery kind: " + kind);
  }

  public static String shippingLine(DeliveryKind kind, int grams, int orderNumber) {
    int cost = costCents(kind, grams);
    return String.format(
        "%s: %d.%02d, days %d, %s-%06d",
        kind.name().toLowerCase(),
        cost / 100,
        cost % 100,
        days(kind),
        trackingPrefix(kind),
        orderNumber);
  }
}
