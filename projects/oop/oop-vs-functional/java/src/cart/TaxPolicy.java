// EN: The second point of variation, independent of the discounts. The cart holds one TaxPolicy
//     object and can swap it at run time (composition), which a TaxedCart subclass could not.
// PT: O segundo ponto de variação, independente dos descontos. O carrinho guarda um objeto
//     TaxPolicy e pode trocá-lo em tempo de execução (composição), o que uma subclasse TaxedCart
//     não permitiria.
public interface TaxPolicy {
  int taxCents(int amountCents);
}
