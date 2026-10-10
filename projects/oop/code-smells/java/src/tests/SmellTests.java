import java.util.List;
import java.util.function.Supplier;

/** Tests of the Java examples, run with a plain main method and no test framework. */
public final class SmellTests {
  private static int checks;
  private static int failures;

  private SmellTests() {}

  private static void check(boolean condition, String what) {
    checks++;
    if (!condition) {
      failures++;
      System.err.println("FAIL: " + what);
    }
  }

  private static void same(String expected, String actual, String what) {
    check(expected.equals(actual), what + ": expected [" + expected + "] but got [" + actual + "]");
  }

  private static void refuses(Supplier<String> action, String message, String what) {
    try {
      action.get();
      check(false, what + ": nothing was thrown");
    } catch (IllegalArgumentException e) {
      same(message, e.getMessage(), what);
    }
  }

  // EN: One method, called once per version. The same checks are the safety net of the
  //     refactoring: they pass before it and they pass after it.
  // PT: Um método, chamado uma vez por versão. As mesmas verificações são a rede de segurança da
  //     refatoração: passam antes dela e passam depois dela.
  // ES: Un método, llamado una vez por versión. Las mismas verificaciones son la red de
  //     seguridad de la refactorización: pasan antes de ella y pasan después de ella.
  private static void primitiveObsession(String version, Signup signup) {
    String name = "primitive obsession, " + version + ": ";
    same(
        "Ana <ana@example.com> (11) 99999-0000",
        signup.register("Ana", "  Ana@Example.COM ", "(11) 99999-0000"),
        name + "e-mail and phone are normalised");
    same(
        "Bia <bia@example.com> (11) 3333-4444",
        signup.register("Bia", "bia@example.com", "1133334444"),
        name + "a ten-digit phone");
    refuses(
        () -> signup.register("Ana", "ana.example.com", "11999990000"),
        "invalid e-mail",
        name + "an e-mail without @");
    refuses(
        () -> signup.register("Ana", "ana@example.com", "9999-0000"),
        "invalid phone",
        name + "a phone without area code");
    same(
        "ana@example.com invited bia@example.com",
        signup.invite("ana@example.com", " Bia@Example.com"),
        name + "an invitation");
    refuses(
        () -> signup.invite("ana@example.com", "ANA@example.com "),
        "cannot invite yourself",
        name + "inviting the own e-mail");
    refuses(() -> signup.invite("ana@example.com", "bia@"), "invalid e-mail", name + "bad friend");
  }

  /** The three kinds as each version names them, plus the function under test. */
  private interface Delivery<M> {
    String line(M method, int grams, int orderNumber);
  }

  private static <M> void delivery(String version, List<M> kinds, Delivery<M> delivery) {
    String name = "conditional to polymorphism, " + version + ": ";
    M standard = kinds.get(0);
    M express = kinds.get(1);
    M pickup = kinds.get(2);
    same("standard: 15.00, days 5, ST-000042", delivery.line(standard, 1, 42), name + "standard");
    same("standard: 21.00, days 5, ST-000042", delivery.line(standard, 2500, 42), name + "2.5 kg");
    same("express: 30.00, days 1, EX-000007", delivery.line(express, 1000, 7), name + "express");
    same("express: 35.00, days 1, EX-000007", delivery.line(express, 1001, 7), name + "1001 g");
    same("pickup: 0.00, days 0, PK-123456", delivery.line(pickup, 9000, 123456), name + "pickup");
  }

  // EN: The point of the refactoring, as a test. A fourth kind is written right here, outside
  //     the production code, and the refactored checkout handles it with no edit at all. The
  //     enum of the other version cannot receive a new constant from outside.
  // PT: O objetivo da refatoração, em forma de teste. Um quarto tipo é escrito aqui mesmo, fora
  //     do código de produção, e o checkout refatorado o atende sem edição alguma. O enum da
  //     outra versão não pode receber uma constante nova de fora.
  // ES: El objetivo de la refactorización, en forma de test. Un cuarto tipo se escribe aquí
  //     mismo, fuera del código de producción, y el checkout refactorizado lo atiende sin
  //     ninguna edición. El enum de la otra versión no puede recibir una constante nueva desde
  //     afuera.
  private static void newVariant() {
    DeliveryMethod drone =
        new DeliveryMethod() {
          @Override
          public String name() {
            return "drone";
          }

          @Override
          public String trackingPrefix() {
            return "DR";
          }

          @Override
          public int costCents(int grams) {
            return 4000 + 2 * grams;
          }

          @Override
          public int days() {
            return 0;
          }
        };
    same(
        "drone: 50.00, days 0, DR-000009",
        DeliveryMethod.shippingLine(drone, 500, 9),
        "a new variant needs no edit in the refactored version");
  }

  // EN: What small types add beyond the shared behaviour: equality by content, and a value that
  //     cannot exist in an invalid state.
  // PT: O que os tipos pequenos acrescentam além do comportamento compartilhado: igualdade por
  //     conteúdo, e um valor que não consegue existir em estado inválido.
  // ES: Lo que los tipos pequeños aportan además del comportamiento compartido: igualdad por
  //     contenido, y un valor que no puede existir en un estado inválido.
  private static void smallTypes() {
    check(new Email(" A@B.co ").equals(new Email("a@b.co")), "equal e-mails are equal objects");
    refuses(() -> new Email("nope").value(), "invalid e-mail", "an invalid Email cannot exist");
    refuses(() -> new Phone("123").digits(), "invalid phone", "an invalid Phone cannot exist");
    same(
        "Ana <ana@example.com> (11) 99999-0000",
        new Account("Ana", new Email("ana@example.com"), new Phone("11999990000")).describe(),
        "an account built from small types");
    same(
        "ana@example.com <Ana> (11) 99999-0000",
        SignupBefore.describe("ana@example.com", "Ana", "11999990000"),
        "with strings, swapped arguments compile and print nonsense");
  }

  public static void main(String[] args) {
    primitiveObsession("before", new SignupBefore());
    primitiveObsession("after", new SignupAfter());
    delivery(
        "before",
        List.of(DeliveryKind.STANDARD, DeliveryKind.EXPRESS, DeliveryKind.PICKUP),
        DeliveryBefore::shippingLine);
    delivery(
        "after",
        List.of(new StandardDelivery(), new ExpressDelivery(), new PickupDelivery()),
        DeliveryMethod::shippingLine);
    newVariant();
    smallTypes();
    System.out.println(checks + " checks, " + failures + " failures");
    if (failures > 0) {
      System.exit(1);
    }
  }
}
