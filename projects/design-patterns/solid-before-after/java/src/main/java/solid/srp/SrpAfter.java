package solid.srp;

import static solid.srp.Invoices.money;

import java.util.ArrayList;
import java.util.List;
import solid.srp.Invoices.Issued;
import solid.srp.Invoices.Line;
import solid.srp.Invoices.Order;

// EN: SINGLE RESPONSIBILITY. Three methods, one reason to change each. The tax rule knows
//     nothing about text, the receipt layout does no arithmetic on rates, and the record format
//     is one line. `issueInvoice` only coordinates them.
// PT: RESPONSABILIDADE ÚNICA. Três métodos, um motivo de mudança para cada. A regra de imposto
//     não sabe nada de texto, o layout do recibo não faz conta com alíquotas, e o formato do
//     registro é uma linha. `issueInvoice` só coordena os três.
public final class SrpAfter {
  private SrpAfter() {}

  public record Totals(long subtotalCents, int ratePercent, long taxCents, long totalCents) {}

  public static Totals calculateTotals(Order order) {
    if (order.lines().isEmpty()) {
      throw new IllegalArgumentException("an invoice needs at least one line");
    }
    long subtotal = 0;
    for (Line line : order.lines()) {
      subtotal += line.quantity() * line.unitCents();
    }
    int ratePercent = order.state().equals("SP") ? 18 : 20;
    long tax = Math.round(subtotal * ratePercent / 100.0);
    return new Totals(subtotal, ratePercent, tax, subtotal + tax);
  }

  public static String formatReceipt(Order order, Totals totals) {
    List<String> receipt = new ArrayList<>();
    receipt.add("Invoice " + order.id() + " for " + order.customer());
    for (Line line : order.lines()) {
      receipt.add(
          line.quantity()
              + " x "
              + line.description()
              + " @ "
              + money(line.unitCents())
              + " = "
              + money(line.quantity() * line.unitCents()));
    }
    receipt.add("Subtotal: " + money(totals.subtotalCents()));
    receipt.add("Tax (" + totals.ratePercent() + "%): " + money(totals.taxCents()));
    receipt.add("Total: " + money(totals.totalCents()));
    return String.join("\n", receipt);
  }

  public static String toRecord(Order order, Totals totals) {
    return order.id() + ";" + order.customer() + ";" + order.state() + ";" + totals.totalCents();
  }

  public static Issued issueInvoice(Order order) {
    Totals totals = calculateTotals(order);
    return new Issued(totals.totalCents(), formatReceipt(order, totals), toRecord(order, totals));
  }
}
