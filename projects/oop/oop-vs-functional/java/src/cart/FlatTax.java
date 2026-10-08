// EN: The rate is in basis points (825 = 8.25%) so that every number stays an integer. Adding
//     half a unit before the integer division rounds half a cent up. The product is computed in
//     long so that a large cart does not overflow int.
// PT: A alíquota vem em pontos-base (825 = 8,25%) para que todo número continue inteiro. Somar
//     meia unidade antes da divisão inteira arredonda meio centavo para cima. O produto é feito
//     em long para que um carrinho grande não estoure o int.
public final class FlatTax implements TaxPolicy {
  private final int basisPoints;

  public FlatTax(int basisPoints) {
    if (basisPoints < 0) {
      throw new CartException("invalid-tax");
    }
    this.basisPoints = basisPoints;
  }

  @Override
  public int taxCents(int amountCents) {
    return (int) (((long) amountCents * basisPoints + 5000) / 10000);
  }
}
