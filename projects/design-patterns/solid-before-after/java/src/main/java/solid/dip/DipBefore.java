package solid.dip;

import java.util.List;
import solid.dip.Infrastructure.Cart;
import solid.dip.Infrastructure.CartItem;
import solid.dip.Infrastructure.CheckoutApp;
import solid.dip.Infrastructure.Receipt;
import solid.dip.Infrastructure.SmtpMailer;
import solid.dip.Infrastructure.SqlOrderTable;

// EN: VIOLATES THE DEPENDENCY INVERSION PRINCIPLE. The business rule (high level) creates and
//     calls the SMTP client and the SQL table (low level) by name. The rule cannot run without
//     them, cannot be tested with anything else, and changes whenever one of them is replaced.
// PT: QUEBRA O PRINCÍPIO DA INVERSÃO DE DEPENDÊNCIA. A regra de negócio (alto nível) cria e
//     chama o cliente SMTP e a tabela SQL (baixo nível) pelo nome. A regra não roda sem eles,
//     não pode ser testada com outra coisa, e muda sempre que um deles é substituído.
public final class DipBefore {
  private DipBefore() {}

  static final class CheckoutService implements CheckoutApp {
    private final SmtpMailer mailer = new SmtpMailer();
    private final SqlOrderTable table = new SqlOrderTable();
    private int next = 1;

    @Override
    public Receipt checkout(Cart cart) {
      if (cart.items().isEmpty()) {
        throw new IllegalArgumentException("the cart is empty");
      }
      long totalCents = 0;
      for (CartItem item : cart.items()) {
        totalCents += item.quantity() * item.unitCents();
      }
      String orderId = "o-" + next++;
      table.insert(orderId, totalCents);
      mailer.sendMail(cart.email(), "Order " + orderId + " confirmed");
      return new Receipt(orderId, totalCents);
    }

    @Override
    public List<String> sent() {
      return mailer.outbox();
    }

    @Override
    public List<String> stored() {
      return table.statements();
    }
  }

  public static CheckoutApp createCheckout() {
    return new CheckoutService();
  }
}
