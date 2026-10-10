package solid.dip;

import java.util.List;
import solid.dip.Infrastructure.Cart;
import solid.dip.Infrastructure.CartItem;
import solid.dip.Infrastructure.CheckoutApp;
import solid.dip.Infrastructure.Receipt;
import solid.dip.Infrastructure.SmtpMailer;
import solid.dip.Infrastructure.SqlOrderTable;

// EN: DEPENDENCY INVERSION. The business rule declares what it needs, in its own words: a place
//     to save orders and a way to tell the customer. These interfaces belong to the rule. The
//     details adapt to them, so the source dependency now points from the details to the rule.
// PT: INVERSÃO DE DEPENDÊNCIA. A regra de negócio declara do que precisa, com suas próprias
//     palavras: um lugar para guardar pedidos e um jeito de avisar o cliente. Essas interfaces
//     pertencem à regra. Os detalhes se adaptam a elas, então a dependência do código-fonte
//     passa a apontar dos detalhes para a regra.
// ES: INVERSIÓN DE DEPENDENCIAS. La regla de negocio declara lo que necesita, con sus propias
//     palabras: un lugar para guardar pedidos y una forma de avisar al cliente. Esas interfaces
//     pertenecen a la regla. Los detalles se adaptan a ellas, así que la dependencia del código
//     fuente pasa a apuntar de los detalles hacia la regla.
public final class DipAfter {
  private DipAfter() {}

  public interface OrderStore {
    void save(String orderId, long totalCents);
  }

  public interface CustomerNotifier {
    void orderConfirmed(String email, String orderId);
  }

  public static final class CheckoutService {
    private final OrderStore orders;
    private final CustomerNotifier notifier;
    private int next = 1;

    public CheckoutService(OrderStore orders, CustomerNotifier notifier) {
      this.orders = orders;
      this.notifier = notifier;
    }

    public Receipt checkout(Cart cart) {
      if (cart.items().isEmpty()) {
        throw new IllegalArgumentException("the cart is empty");
      }
      long totalCents = 0;
      for (CartItem item : cart.items()) {
        totalCents += item.quantity() * item.unitCents();
      }
      String orderId = "o-" + next++;
      orders.save(orderId, totalCents);
      notifier.orderConfirmed(cart.email(), orderId);
      return new Receipt(orderId, totalCents);
    }
  }

  // EN: The composition root: the only place that names the concrete details and fits them to
  //     the interfaces of the rule. Replacing SMTP or SQL is a change here and nowhere else.
  // PT: A raiz de composição: o único lugar que cita os detalhes concretos e os encaixa nas
  //     interfaces da regra. Trocar o SMTP ou o SQL é uma mudança aqui e em nenhum outro lugar.
  // ES: La composition root: el único lugar que cita los detalles concretos y los encaja en las
  //     interfaces de la regla. Cambiar SMTP o SQL es un cambio aquí y en ningún otro lugar.
  public static CheckoutApp createCheckout() {
    SmtpMailer mailer = new SmtpMailer();
    SqlOrderTable table = new SqlOrderTable();
    CheckoutService service =
        new CheckoutService(
            table::insert,
            (email, orderId) -> mailer.sendMail(email, "Order " + orderId + " confirmed"));
    return new CheckoutApp() {
      @Override
      public Receipt checkout(Cart cart) {
        return service.checkout(cart);
      }

      @Override
      public List<String> sent() {
        return mailer.outbox();
      }

      @Override
      public List<String> stored() {
        return table.statements();
      }
    };
  }
}
