import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

// EN: Reader of the shared scenarios.txt. It is support code, used by the tests and the demo,
//     and it is not counted in the comparison. Each scenario is run as it is read: the lines of
//     the file become calls on a Cart, and the "expect" lines become the expected outcome.
// PT: Leitor do scenarios.txt compartilhado. É código de apoio, usado pelos testes e pela demo,
//     e não entra na comparação. Cada cenário é executado enquanto é lido: as linhas do arquivo
//     viram chamadas em um Cart, e as linhas "expect" viram o resultado esperado.
public final class Scenarios {
  private Scenarios() {}

  /** What a scenario produced or should produce: a receipt, or the code of a rejection. */
  public record Outcome(Receipt receipt, String error) {
    static Outcome rejected(String code) {
      return new Outcome(null, code);
    }
  }

  public record Result(String name, Outcome expected, Outcome actual) {}

  // EN: Mutable on purpose and private to this file: it only exists while one scenario is read.
  // PT: Mutável de propósito e privado a este arquivo: só existe enquanto um cenário é lido.
  private static final class Draft {
    final String name;
    final Cart cart = new Cart();
    final List<AppliedDiscount> discounts = new ArrayList<>();
    String thrown;
    String expectedError;
    int subtotal;
    int tax;
    int total;

    Draft(String name) {
      this.name = name;
    }

    Result finish() {
      Outcome expected =
          expectedError != null
              ? Outcome.rejected(expectedError)
              : new Outcome(new Receipt(subtotal, discounts, tax, total), null);
      Outcome actual =
          thrown != null ? Outcome.rejected(thrown) : new Outcome(cart.checkout(), null);
      return new Result(name, expected, actual);
    }
  }

  // EN: The one place that knows the concrete classes: where the objects are created.
  //     Everything after this point sees only the DiscountRule interface.
  // PT: O único lugar que conhece as classes concretas: onde os objetos são criados. Tudo depois
  //     deste ponto enxerga só a interface DiscountRule.
  private static DiscountRule createRule(String[] words) {
    int third = Integer.parseInt(words[3]);
    return switch (words[1]) {
      case "percent-coupon" -> new PercentCoupon(words[2], third);
      case "fixed-coupon" -> new FixedCoupon(words[2], third);
      case "bulk" -> new BulkDiscount(words[2], third, Integer.parseInt(words[4]));
      case "take-pay" -> new TakePayDiscount(words[2], third, Integer.parseInt(words[4]));
      default -> throw new IllegalArgumentException("unknown rule " + words[1]);
    };
  }

  private static void apply(Draft draft, String line) {
    String[] words = line.split(" ");
    switch (words[0]) {
      case "item" ->
          draft.cart.add(
              new CartLine(words[1], Integer.parseInt(words[2]), Integer.parseInt(words[3])));
      case "rule" -> draft.cart.addRule(createRule(words));
      case "tax" ->
          draft.cart.setTaxPolicy(
              words[1].equals("flat") ? new FlatTax(Integer.parseInt(words[2])) : new NoTax());
      case "expect" -> {
        switch (words[1]) {
          case "subtotal" -> draft.subtotal = Integer.parseInt(words[2]);
          case "tax" -> draft.tax = Integer.parseInt(words[2]);
          case "total" -> draft.total = Integer.parseInt(words[2]);
          case "error" -> draft.expectedError = words[2];
          case "discount" ->
              draft.discounts.add(
                  new AppliedDiscount(line.split(" ", 4)[3], Integer.parseInt(words[2])));
          default -> throw new IllegalArgumentException("cannot read: " + line);
        }
      }
      default -> throw new IllegalArgumentException("cannot read: " + line);
    }
  }

  public static List<Result> runAll(Path file) throws IOException {
    List<Result> results = new ArrayList<>();
    Draft draft = null;
    for (String raw : Files.readAllLines(file)) {
      String line = raw.strip();
      if (line.isEmpty() || line.startsWith("#")) {
        continue;
      }
      if (line.startsWith("scenario ")) {
        if (draft != null) {
          results.add(draft.finish());
        }
        draft = new Draft(line.substring("scenario ".length()));
        continue;
      }
      if (draft == null) {
        throw new IllegalArgumentException("line outside a scenario: " + line);
      }
      // EN: After the first rejection the cart of this scenario is abandoned, as a caller would
      //     do. Only the "expect" lines are still read.
      // PT: Depois da primeira recusa o carrinho deste cenário é abandonado, como faria quem
      //     chama. Só as linhas "expect" continuam sendo lidas.
      if (draft.thrown != null && !line.startsWith("expect ")) {
        continue;
      }
      try {
        apply(draft, line);
      } catch (CartException e) {
        draft.thrown = e.code();
      }
    }
    if (draft != null) {
      results.add(draft.finish());
    }
    return results;
  }

  public static String format(Outcome outcome) {
    if (outcome.error() != null) {
      return "  rejected: " + outcome.error();
    }
    Receipt receipt = outcome.receipt();
    StringBuilder text = new StringBuilder("  subtotal " + money(receipt.subtotalCents()));
    for (AppliedDiscount discount : receipt.discounts()) {
      text.append("\n  - ").append(money(discount.amountCents())).append("  ");
      text.append(discount.label());
    }
    text.append("\n  tax ").append(money(receipt.taxCents()));
    text.append("\n  total ").append(money(receipt.totalCents()));
    return text.toString();
  }

  private static String money(int cents) {
    return String.format("%d.%02d", cents / 100, cents % 100);
  }
}
