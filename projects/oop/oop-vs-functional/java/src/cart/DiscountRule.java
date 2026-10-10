import java.util.List;

// EN: The contract of every discount rule: two operations. The cart depends on this interface
//     and on nothing else, so a new rule is a new class and no existing file is edited. The
//     price of that freedom: a third operation would have to be added here and written in
//     every rule class.
// PT: O contrato de toda regra de desconto: duas operações. O carrinho depende desta interface
//     e de mais nada, então uma regra nova é uma classe nova e nenhum arquivo existente é
//     editado. O preço dessa liberdade: uma terceira operação teria de ser acrescentada aqui e
//     escrita em todas as classes de regra.
// ES: El contrato de toda regla de descuento: dos operaciones. El carrito depende de esta interfaz
//     y de nada más, así que una regla nueva es una clase nueva y no se edita ningún archivo
//     existente. El precio de esa libertad: una tercera operación tendría que agregarse aquí y
//     escribirse en todas las clases de regla.
public interface DiscountRule {
  /** How much this rule takes off, given the lines and what is still to pay. */
  int discountCents(List<CartLine> lines, int runningCents);

  /** The text printed on the receipt. */
  String describe();
}
