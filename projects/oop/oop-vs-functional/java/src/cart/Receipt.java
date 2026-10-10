import java.util.List;

// EN: List.copyOf makes an unmodifiable copy, so a receipt cannot be changed after checkout,
//     not even by whoever still holds the list that was passed in.
// PT: List.copyOf faz uma cópia não modificável, então um recibo não pode ser alterado depois do
//     checkout, nem por quem ainda tem em mãos a lista que foi passada.
// ES: List.copyOf hace una copia no modificable, así que un recibo no puede cambiarse después del
//     checkout, ni siquiera por quien todavía tiene en sus manos la lista que se pasó.
public record Receipt(
    int subtotalCents, List<AppliedDiscount> discounts, int taxCents, int totalCents) {
  public Receipt {
    discounts = List.copyOf(discounts);
  }
}
