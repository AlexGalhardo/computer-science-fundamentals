// EN: A record is an immutable value: the fields are final and equals, hashCode and toString
//     compare and print the contents. The compact constructor validates, so every CartLine
//     that exists is valid and the other classes never check it again.
// PT: Um record é um valor imutável: os campos são final, e equals, hashCode e toString comparam
//     e imprimem o conteúdo. O construtor compacto valida, então toda CartLine que existe é
//     válida e as outras classes nunca a conferem de novo.
// ES: Un record es un valor inmutable: los campos son final, y equals, hashCode y toString
//     comparan e imprimen el contenido. El constructor compacto valida, así que toda CartLine que
//     existe es válida y las otras clases nunca la verifican de nuevo.
public record CartLine(String sku, int unitPriceCents, int quantity) {
  public CartLine {
    if (quantity < 1) {
      throw new CartException("invalid-quantity");
    }
    if (unitPriceCents < 0) {
      throw new CartException("invalid-price");
    }
  }

  public int totalCents() {
    return unitPriceCents * quantity;
  }
}
