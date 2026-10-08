package solid.dip;

import java.util.ArrayList;
import java.util.List;

// EN: The low-level details, standing in for a real SMTP client and a real SQL driver. They
//     record what they would have sent, so the tests can look at it. Nothing here uses a
//     network or a database.
// PT: Os detalhes de baixo nível, no lugar de um cliente SMTP real e de um driver SQL real.
//     Eles registram o que teriam enviado, para que os testes possam olhar. Nada aqui usa rede
//     nem banco de dados.
public final class Infrastructure {
  private Infrastructure() {}

  public static final class SmtpMailer {
    private final List<String> outbox = new ArrayList<>();

    public void sendMail(String to, String subject) {
      outbox.add("SMTP to " + to + ": " + subject);
    }

    public List<String> outbox() {
      return List.copyOf(outbox);
    }
  }

  public static final class SqlOrderTable {
    private final List<String> statements = new ArrayList<>();

    public void insert(String orderId, long totalCents) {
      statements.add("INSERT INTO orders VALUES ('" + orderId + "', " + totalCents + ")");
    }

    public List<String> statements() {
      return List.copyOf(statements);
    }
  }

  public record CartItem(String sku, int quantity, long unitCents) {}

  public record Cart(String email, List<CartItem> items) {}

  public record Receipt(String orderId, long totalCents) {}

  // EN: What the tests of both versions see: the use case, plus a look at what left the system.
  // PT: O que os testes das duas versões enxergam: o caso de uso, mais uma visão do que saiu do
  //     sistema.
  public interface CheckoutApp {
    Receipt checkout(Cart cart);

    List<String> sent();

    List<String> stored();
  }
}
