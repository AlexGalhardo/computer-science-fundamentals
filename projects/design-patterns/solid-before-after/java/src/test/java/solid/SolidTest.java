package solid;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.function.ToLongFunction;
import solid.dip.DipAfter;
import solid.dip.DipBefore;
import solid.dip.Infrastructure.Cart;
import solid.dip.Infrastructure.CartItem;
import solid.dip.Infrastructure.CheckoutApp;
import solid.dip.Infrastructure.Receipt;
import solid.isp.IspAfter;
import solid.isp.IspBefore;
import solid.isp.Products.Product;
import solid.lsp.AccountSpec;
import solid.lsp.LspAfter;
import solid.lsp.LspBefore;
import solid.ocp.OcpAfter;
import solid.ocp.OcpBefore;
import solid.srp.Invoices.Issued;
import solid.srp.Invoices.Line;
import solid.srp.Invoices.Order;
import solid.srp.SrpAfter;
import solid.srp.SrpBefore;

// EN: For each principle one method describes the behaviour of the module and runs twice: on
//     the violating version and on the refactored one. The checks were written for `before`
//     and did not change for `after`, which is what makes the second version a refactor.
// PT: Para cada princípio um método descreve o comportamento do módulo e roda duas vezes: na
//     versão com a violação e na refatorada. As verificações foram escritas para `before` e não
//     mudaram para `after`, e é isso que faz da segunda versão uma refatoração.
// ES: Para cada principio un método describe el comportamiento del módulo y se ejecuta dos
//     veces: en la versión con la violación y en la refactorizada. Las verificaciones se
//     escribieron para `before` y no cambiaron para `after`, y eso es lo que hace de la segunda
//     versión una refactorización.
public final class SolidTest {
  private SolidTest() {}

  public static void main(String[] args) {
    srp("srp before", SrpBefore::issueInvoice);
    srp("srp after", SrpAfter::issueInvoice);
    ocp("ocp before", OcpBefore::discountCents);
    ocp("ocp after", OcpAfter::discountCents);
    ocpExtension();
    lsp("lsp before", LspBefore::chargeMonthlyFee, LspBefore::availableNow);
    lsp("lsp after", LspAfter::chargeMonthlyFee, LspAfter::availableNow);
    ispBefore();
    ispAfter();
    dip("dip before", DipBefore::createCheckout);
    dip("dip after", DipAfter::createCheckout);
    dipWithoutInfrastructure();
    System.exit(Check.finish());
  }

  private static void srp(String name, Function<Order, Issued> issueInvoice) {
    List<Line> lines = List.of(new Line("Book", 2, 5000), new Line("Pen", 3, 250));
    Order order = new Order("inv-7", "Ana", "SP", lines);
    Issued issued = issueInvoice.apply(order);

    // 2 x 5000 + 3 x 250 = 10750; 18% of 10750 = 1935; total 12685
    Check.equal(name + ": adds the state tax to the subtotal", 12685L, issued.totalCents());
    Check.equal(
        name + ": another state has another rate",
        12900L,
        issueInvoice.apply(new Order("inv-7", "Ana", "RJ", lines)).totalCents());
    Check.equal(
        name + ": writes the receipt line by line",
        String.join(
            "\n",
            "Invoice inv-7 for Ana",
            "2 x Book @ 50.00 = 100.00",
            "3 x Pen @ 2.50 = 7.50",
            "Subtotal: 107.50",
            "Tax (18%): 19.35",
            "Total: 126.85"),
        issued.receipt());
    Check.equal(name + ": produces the stored record", "inv-7;Ana;SP;12685", issued.record());
    Check.fails(
        name + ": refuses an order with no lines",
        "an invoice needs at least one line",
        () -> issueInvoice.apply(new Order("inv-8", "Ana", "SP", List.of())));
  }

  private static void ocp(String name, BiFunction<String, Long, Long> discountCents) {
    Check.equal(name + ": regular", 0L, discountCents.apply("regular", 20000L));
    Check.equal(name + ": premium", 2000L, discountCents.apply("premium", 20000L));
    Check.equal(name + ": employee", 6000L, discountCents.apply("employee", 20000L));
    Check.equal(name + ": rounds to the cent", 200L, discountCents.apply("premium", 1995L));
    Check.fails(
        name + ": refuses an unknown kind",
        "unknown customer kind: student",
        () -> discountCents.apply("student", 20000L));
  }

  // EN: The new requirement of the README, met from outside: no existing class is edited.
  // PT: O requisito novo do README, atendido de fora: nenhuma classe existente é editada.
  // ES: El requisito nuevo del README, atendido desde fuera: ninguna clase existente se edita.
  private static void ocpExtension() {
    List<OcpAfter.DiscountRule> rules = new ArrayList<>(OcpAfter.DEFAULT_RULES);
    rules.add(new OcpAfter.Rule("student", total -> Math.round(total * 15 / 100.0)));
    OcpAfter.Discounts discounts = new OcpAfter.Discounts(rules);
    Check.equal(
        "ocp after: a new kind without editing the calculator",
        3000L,
        discounts.discountCents("student", 20000));
  }

  private static void lsp(
      String name,
      BiFunction<List<AccountSpec>, Long, List<Long>> chargeMonthlyFee,
      ToLongFunction<List<AccountSpec>> availableNow) {
    List<AccountSpec> specs =
        List.of(
            new AccountSpec("checking", 10000),
            new AccountSpec("fixed-term", 50000),
            new AccountSpec("savings", 500));
    // checking pays 1200; fixed-term is never charged; savings has less than the fee
    Check.equal(
        name + ": charges the fee where a withdrawal is possible",
        List.of(8800L, 50000L, 500L),
        chargeMonthlyFee.apply(specs, 1200L));
    Check.equal(
        name + ": counts only money that can be withdrawn",
        10500L,
        availableNow.applyAsLong(specs));
    Check.equal(name + ": handles an empty list", 0L, availableNow.applyAsLong(List.of()));
  }

  private static final List<Product> PRODUCTS =
      List.of(new Product("p1", "Keyboard", 20000), new Product("p2", "Mouse", 7990));
  private static final String CSV = "s1,Cable,1500\ns2,Adapter,3250\n";

  // EN: The two versions give their catalogs different types, so this suite receives the four
  //     observations as plain values. The expected values are the same for both.
  // PT: As duas versões dão tipos diferentes aos seus catálogos, então esta suíte recebe as
  //     quatro observações como valores simples. Os valores esperados são os mesmos para as duas.
  // ES: Las dos versiones dan tipos distintos a sus catálogos, así que esta suite recibe las
  //     cuatro observaciones como valores simples. Los valores esperados son los mismos para las
  //     dos.
  private static void isp(
      String name,
      String memoryReport,
      String csvReport,
      Optional<Product> found,
      Supplier<String> reportAfterIncrease) {
    Check.equal(
        name + ": reports a catalog in memory", "Keyboard: 200.00\nMouse: 79.90", memoryReport);
    Check.equal(name + ": reports a CSV list", "Cable: 15.00\nAdapter: 32.50", csvReport);
    Check.equal(
        name + ": finds a CSV product", Optional.of(new Product("s2", "Adapter", 3250)), found);
    // 20000 * 1.10 = 22000; 7990 * 1.10 = 8789
    Check.equal(
        name + ": raises the prices of a writable catalog",
        "Keyboard: 220.00\nMouse: 87.89",
        reportAfterIncrease.get());
  }

  private static void ispBefore() {
    isp(
        "isp before",
        IspBefore.priceReport(IspBefore.createMemoryCatalog(PRODUCTS)),
        IspBefore.priceReport(IspBefore.createCsvCatalog(CSV)),
        IspBefore.createCsvCatalog(CSV).find("s2"),
        () -> {
          IspBefore.ProductCatalog catalog = IspBefore.createMemoryCatalog(PRODUCTS);
          IspBefore.increasePrices(catalog, 10);
          return IspBefore.priceReport(catalog);
        });
    // EN: The cost of the fat interface: this mistake compiles and is found only at run time.
    // PT: O custo da interface gorda: este erro compila e só é descoberto em execução.
    // ES: El costo de la interfaz gorda: este error compila y solo se descubre en ejecución.
    Check.fails(
        "isp before: a read-only catalog is accepted by a writer and fails at run time",
        "the CSV catalog is read-only",
        () -> IspBefore.increasePrices(IspBefore.createCsvCatalog(CSV), 10));
  }

  private static void ispAfter() {
    isp(
        "isp after",
        IspAfter.priceReport(IspAfter.createMemoryCatalog(PRODUCTS)),
        IspAfter.priceReport(IspAfter.createCsvCatalog(CSV)),
        IspAfter.createCsvCatalog(CSV).find("s2"),
        () -> {
          IspAfter.MemoryCatalog catalog = IspAfter.createMemoryCatalog(PRODUCTS);
          IspAfter.increasePrices(catalog, 10);
          return IspAfter.priceReport(catalog);
        });
    // EN: `IspAfter.increasePrices(IspAfter.createCsvCatalog(CSV), 10)` does not compile:
    //     ProductReader is not a ProductWriter. The mistake above can no longer be written.
    // PT: `IspAfter.increasePrices(IspAfter.createCsvCatalog(CSV), 10)` não compila:
    //     ProductReader não é um ProductWriter. O erro acima não pode mais ser escrito.
    // ES: `IspAfter.increasePrices(IspAfter.createCsvCatalog(CSV), 10)` no compila:
    //     ProductReader no es un ProductWriter. El error de arriba ya no se puede escribir.
    Check.equal(
        "isp after: the read-only catalog is not a writer",
        false,
        IspAfter.createCsvCatalog(CSV) instanceof IspAfter.ProductWriter);
  }

  private static final Cart CART =
      new Cart(
          "ana@example.test", List.of(new CartItem("book", 2, 5000), new CartItem("pen", 1, 250)));

  private static void dip(String name, Supplier<CheckoutApp> createCheckout) {
    CheckoutApp app = createCheckout.get();
    Check.equal(name + ": totals the cart", new Receipt("o-1", 10250), app.checkout(CART));
    Check.equal(name + ": numbers the orders", "o-2", app.checkout(CART).orderId());
    Check.equal(
        name + ": stores the order",
        "INSERT INTO orders VALUES ('o-1', 10250)",
        app.stored().get(0));
    Check.equal(
        name + ": confirms to the customer",
        "SMTP to ana@example.test: Order o-1 confirmed",
        app.sent().get(0));

    CheckoutApp empty = createCheckout.get();
    Check.fails(
        name + ": refuses an empty cart",
        "the cart is empty",
        () -> empty.checkout(new Cart("ana@example.test", List.of())));
    Check.equal(name + ": and leaves nothing behind", List.of(), empty.stored());
  }

  // EN: The rule alone, with two lambdas in the place of SMTP and SQL.
  // PT: A regra sozinha, com dois lambdas no lugar do SMTP e do SQL.
  // ES: La regla sola, con dos lambdas en lugar de SMTP y SQL.
  private static void dipWithoutInfrastructure() {
    List<String> saved = new ArrayList<>();
    List<String> told = new ArrayList<>();
    DipAfter.CheckoutService service =
        new DipAfter.CheckoutService(
            (orderId, totalCents) -> saved.add(orderId + "=" + totalCents),
            (email, orderId) -> told.add(email + ":" + orderId));
    service.checkout(CART);
    Check.equal("dip after: the rule runs with no infrastructure", List.of("o-1=10250"), saved);
    Check.equal("dip after: and tells the customer", List.of("ana@example.test:o-1"), told);
  }
}
