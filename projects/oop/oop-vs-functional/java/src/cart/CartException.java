// EN: In this version an invalid value is refused by throwing. The constructor that receives it
//     never finishes, so the invalid object is never created. It is an unchecked exception
//     because an invalid cart is a mistake of the caller, not something to recover from.
// PT: Nesta versão um valor inválido é recusado com uma exceção. O construtor que o recebe não
//     termina, então o objeto inválido nunca é criado. É uma exceção não verificada porque um
//     carrinho inválido é um erro de quem chama, não algo de que se recuperar.
// ES: En esta versión un valor inválido se rechaza con una excepción. El constructor que lo recibe
//     nunca termina, así que el objeto inválido nunca se crea. Es una excepción no verificada
//     porque un carrito inválido es un error de quien llama, no algo de lo que recuperarse.
public final class CartException extends RuntimeException {
  private static final long serialVersionUID = 1L;

  private final String code;

  public CartException(String code) {
    super(code);
    this.code = code;
  }

  public String code() {
    return code;
  }

  static void requirePercent(int percent) {
    if (percent < 0 || percent > 100) {
      throw new CartException("invalid-percent");
    }
  }
}
