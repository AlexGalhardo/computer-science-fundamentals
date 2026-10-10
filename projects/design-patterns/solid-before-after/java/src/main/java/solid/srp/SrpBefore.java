package solid.srp;

import static solid.srp.Invoices.money;

import java.util.ArrayList;
import java.util.List;
import solid.srp.Invoices.Issued;
import solid.srp.Invoices.Line;
import solid.srp.Invoices.Order;

// EN: VIOLATES THE SINGLE RESPONSIBILITY PRINCIPLE. One method holds three subjects that change
//     for different reasons: the tax rule, the layout of the receipt and the format of the
//     stored record. Any of the three changes opens this method.
// PT: QUEBRA O PRINCÍPIO DA RESPONSABILIDADE ÚNICA. Um método guarda três assuntos que mudam
//     por motivos diferentes: a regra de imposto, o layout do recibo e o formato do registro
//     gravado. Qualquer uma das três mudanças abre este método.
// ES: ROMPE EL PRINCIPIO DE RESPONSABILIDAD ÚNICA. Un método guarda tres asuntos que cambian por
//     motivos distintos: la regla del impuesto, el diseño del recibo y el formato del registro
//     guardado. Cualquiera de los tres cambios abre este método.
public final class SrpBefore {
  private SrpBefore() {}

  public static Issued issueInvoice(Order order) {
    if (order.lines().isEmpty()) {
      throw new IllegalArgumentException("an invoice needs at least one line");
    }

    long subtotal = 0;
    List<String> receipt = new ArrayList<>();
    receipt.add("Invoice " + order.id() + " for " + order.customer());
    for (Line line : order.lines()) {
      long lineTotal = line.quantity() * line.unitCents();
      subtotal += lineTotal;
      receipt.add(
          line.quantity()
              + " x "
              + line.description()
              + " @ "
              + money(line.unitCents())
              + " = "
              + money(lineTotal));
    }

    int ratePercent = order.state().equals("SP") ? 18 : 20;
    long tax = Math.round(subtotal * ratePercent / 100.0);
    long total = subtotal + tax;

    receipt.add("Subtotal: " + money(subtotal));
    receipt.add("Tax (" + ratePercent + "%): " + money(tax));
    receipt.add("Total: " + money(total));

    String record = order.id() + ";" + order.customer() + ";" + order.state() + ";" + total;
    return new Issued(total, String.join("\n", receipt), record);
  }
}
