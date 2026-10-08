package solid.ocp;

import java.util.List;
import java.util.function.LongUnaryOperator;

// EN: OPEN-CLOSED. A discount rule is an object behind an interface, and the calculator only
//     walks the rules it was given. The calculator is closed (it never changes again) and the
//     system is open (a new kind is a new rule handed to `Discounts`).
// PT: ABERTO-FECHADO. Uma regra de desconto é um objeto atrás de uma interface, e a calculadora
//     só percorre as regras que recebeu. A calculadora fica fechada (não muda mais) e o sistema
//     fica aberto (um tipo novo é uma regra nova entregue a `Discounts`).
public final class OcpAfter {
  private OcpAfter() {}

  public interface DiscountRule {
    String kind();

    long discount(long totalCents);
  }

  public record Rule(String kind, LongUnaryOperator formula) implements DiscountRule {
    @Override
    public long discount(long totalCents) {
      return formula.applyAsLong(totalCents);
    }
  }

  public static final List<DiscountRule> DEFAULT_RULES =
      List.of(
          new Rule("regular", total -> 0),
          new Rule("premium", total -> Math.round(total * 10 / 100.0)),
          new Rule("employee", total -> Math.round(total * 30 / 100.0)));

  public static final class Discounts {
    private final List<DiscountRule> rules;

    public Discounts(List<DiscountRule> rules) {
      this.rules = List.copyOf(rules);
    }

    public long discountCents(String kind, long totalCents) {
      for (DiscountRule rule : rules) {
        if (rule.kind().equals(kind)) {
          return rule.discount(totalCents);
        }
      }
      throw new IllegalArgumentException("unknown customer kind: " + kind);
    }
  }

  public static long discountCents(String kind, long totalCents) {
    return new Discounts(DEFAULT_RULES).discountCents(kind, totalCents);
  }
}
