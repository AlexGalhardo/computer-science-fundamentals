import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

// EN: The cart owns its state. The fields are private, so the only way to change the cart is
//     through its methods, and the only way to learn the total is to ask the cart to compute it
//     ("tell, don't ask"). The cart is mutable: add changes this very object.
// PT: O carrinho é dono do seu estado. Os campos são privados, então a única forma de alterar o
//     carrinho é pelos seus métodos, e a única forma de saber o total é pedir que o carrinho o
//     calcule ("tell, don't ask"). O carrinho é mutável: add altera este mesmo objeto.
// ES: El carrito es dueño de su estado. Los campos son privados, así que la única forma de
//     modificar el carrito es mediante sus métodos, y la única forma de conocer el total es
//     pedirle al carrito que lo calcule ("tell, don't ask"). El carrito es mutable: add modifica
//     este mismo objeto.
public final class Cart {
  private final List<CartLine> lines = new ArrayList<>();
  private final List<DiscountRule> rules = new ArrayList<>();
  private TaxPolicy tax = new NoTax();

  public void add(CartLine line) {
    lines.add(line);
  }

  public void addRule(DiscountRule rule) {
    rules.add(rule);
  }

  public void setTaxPolicy(TaxPolicy tax) {
    this.tax = tax;
  }

  // EN: A read-only view goes out, never the internal list. A caller that tries to change it
  //     gets an UnsupportedOperationException.
  // PT: Sai uma visão somente leitura, nunca a lista interna. Quem tentar alterá-la recebe uma
  //     UnsupportedOperationException.
  // ES: Sale una vista de solo lectura, nunca la lista interna. Quien intente modificarla recibe
  //     una UnsupportedOperationException.
  public List<CartLine> lines() {
    return Collections.unmodifiableList(lines);
  }

  // EN: The cart knows only the two interfaces. Each rule object answers discountCents and
  //     describe in its own way (dynamic dispatch), so this loop never changes when a rule is
  //     added. A rule can never take more than what is left to pay.
  // PT: O carrinho conhece só as duas interfaces. Cada objeto de regra responde a discountCents
  //     e a describe do seu jeito (despacho dinâmico), então este laço nunca muda quando uma
  //     regra é adicionada. Uma regra nunca tira mais do que resta a pagar.
  // ES: El carrito conoce solo las dos interfaces. Cada objeto de regla responde a discountCents
  //     y a describe a su manera (despacho dinámico), así que este ciclo nunca cambia cuando se
  //     agrega una regla. Una regla nunca quita más de lo que queda por pagar.
  public Receipt checkout() {
    int subtotal = 0;
    for (CartLine line : lines) {
      subtotal += line.totalCents();
    }
    List<AppliedDiscount> discounts = new ArrayList<>();
    int running = subtotal;
    for (DiscountRule rule : rules) {
      int amount = Math.min(rule.discountCents(lines(), running), running);
      if (amount > 0) {
        discounts.add(new AppliedDiscount(rule.describe(), amount));
        running -= amount;
      }
    }
    int taxCents = tax.taxCents(running);
    return new Receipt(subtotal, discounts, taxCents, running + taxCents);
  }
}
