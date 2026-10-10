import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/** Tests of the Java cart, run with a plain main method and no test framework. */
public final class CartTests {
  private static int checks;
  private static int failures;

  private CartTests() {}

  private static void check(boolean condition, String what) {
    checks++;
    if (!condition) {
      failures++;
      System.err.println("FAIL: " + what);
    }
  }

  private static boolean rejects(Runnable action, String code) {
    try {
      action.run();
      return false;
    } catch (CartException e) {
      return e.code().equals(code);
    }
  }

  // EN: The acceptance test of the mini-project: the scenarios of the shared file, the same
  //     ones the TypeScript and Elixir versions read. Records compare by content, so one
  //     equals call compares the whole receipt, discount by discount.
  // PT: O teste de aceitação do mini-projeto: os cenários do arquivo compartilhado, os mesmos
  //     que as versões em TypeScript e Elixir leem. Records comparam por conteúdo, então uma
  //     chamada a equals compara o recibo inteiro, desconto por desconto.
  // ES: La prueba de aceptación del miniproyecto: los escenarios del archivo compartido, los
  //     mismos que leen las versiones en TypeScript y Elixir. Los records comparan por contenido,
  //     así que una llamada a equals compara el recibo completo, descuento por descuento.
  private static void sharedScenarios(Path file) throws IOException {
    List<Scenarios.Result> results = Scenarios.runAll(file);
    check(results.size() >= 15, "the shared file has at least 15 scenarios");
    for (Scenarios.Result result : results) {
      check(
          result.expected().equals(result.actual()),
          result.name() + ": expected " + result.expected() + " but got " + result.actual());
    }
  }

  private static void encapsulation() {
    check(rejects(() -> new CartLine("PEN", 250, 0), "invalid-quantity"), "quantity zero");
    check(rejects(() -> new CartLine("PEN", -1, 1), "invalid-price"), "negative price");
    check(rejects(() -> new PercentCoupon("X", 101), "invalid-percent"), "percent above 100");
    check(rejects(() -> new TakePayDiscount("TEE", 2, 2), "invalid-rule"), "take 2 pay 2");
    check(rejects(() -> new FlatTax(-1), "invalid-tax"), "negative tax");

    Cart cart = new Cart();
    cart.add(new CartLine("PEN", 250, 4));
    boolean refused = false;
    try {
      cart.lines().add(new CartLine("BOOK", 4000, 1));
    } catch (UnsupportedOperationException e) {
      refused = true;
    }
    check(refused, "the list returned by lines() cannot be changed");
    check(cart.checkout().subtotalCents() == 1000, "the cart kept its single line");

    List<AppliedDiscount> source = new ArrayList<>();
    Receipt receipt = new Receipt(100, source, 0, 100);
    source.add(new AppliedDiscount("late", 1));
    check(receipt.discounts().isEmpty(), "a receipt keeps its own copy of the discounts");
  }

  // EN: A rule the cart has never seen, written here as an anonymous class. The cart calls it
  //     through the interface exactly as it calls the rules of the project.
  // PT: Uma regra que o carrinho nunca viu, escrita aqui como classe anônima. O carrinho a chama
  //     pela interface exatamente como chama as regras do projeto.
  // ES: Una regla que el carrito nunca ha visto, escrita aquí como clase anónima. El carrito la
  //     llama por la interfaz exactamente como llama a las reglas del proyecto.
  private static void polymorphism() {
    DiscountRule oneCentOff =
        new DiscountRule() {
          @Override
          public int discountCents(List<CartLine> lines, int runningCents) {
            return 1;
          }

          @Override
          public String describe() {
            return "one cent off";
          }
        };
    Cart cart = new Cart();
    cart.add(new CartLine("PEN", 250, 4));
    cart.addRule(new PercentCoupon("WELCOME10", 10));
    cart.addRule(oneCentOff);
    Receipt expected =
        new Receipt(
            1000,
            List.of(
                new AppliedDiscount("coupon WELCOME10: 10% off", 100),
                new AppliedDiscount("one cent off", 1)),
            0,
            899);
    check(cart.checkout().equals(expected), "the cart accepts a rule it has never seen");

    cart.setTaxPolicy(new FlatTax(825));
    check(cart.checkout().taxCents() == 74, "the tax policy can be replaced on a living cart");
  }

  public static void main(String[] args) throws IOException {
    sharedScenarios(Path.of(args[0]));
    encapsulation();
    polymorphism();
    System.out.println(checks + " checks, " + failures + " failures");
    if (failures > 0) {
      System.exit(1);
    }
  }
}
