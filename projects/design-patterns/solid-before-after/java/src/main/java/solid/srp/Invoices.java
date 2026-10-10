package solid.srp;

import java.util.List;
import java.util.Locale;

// EN: The data both versions work on. Money is kept in cents, as whole numbers, so no test
//     depends on floating point rounding.
// PT: Os dados com que as duas versões trabalham. O dinheiro fica em centavos, como números
//     inteiros, então nenhum teste depende de arredondamento de ponto flutuante.
// ES: Los datos con que trabajan las dos versiones. El dinero está en centavos, como números
//     enteros, así que ninguna prueba depende del redondeo de punto flotante.
public final class Invoices {
  private Invoices() {}

  public record Line(String description, int quantity, long unitCents) {}

  public record Order(String id, String customer, String state, List<Line> lines) {}

  public record Issued(long totalCents, String receipt, String record) {}

  public static String money(long cents) {
    return String.format(Locale.ROOT, "%d.%02d", cents / 100, cents % 100);
  }
}
