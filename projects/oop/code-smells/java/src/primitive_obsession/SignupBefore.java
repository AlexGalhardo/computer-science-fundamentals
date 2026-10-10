// EN: SMELL: Primitive Obsession. An e-mail and a phone are "just strings", so every method
//     that receives one cleans and checks it again: the e-mail rule below is written three
//     times. The compiler cannot tell a name from an e-mail from a phone, so describe() can be
//     called with its arguments in any order.
// PT: MAU CHEIRO: Obsessão por Primitivos. Um e-mail e um telefone são "só strings", então todo
//     método que recebe um limpa e confere de novo: a regra de e-mail abaixo está escrita três
//     vezes. O compilador não distingue nome, e-mail e telefone, então describe() pode ser
//     chamado com os argumentos em qualquer ordem.
// ES: MAL OLOR: Obsesión por los Primitivos. Un correo y un teléfono son "solo strings", así
//     que todo método que recibe uno lo limpia y lo verifica de nuevo: la regla de correo de
//     abajo está escrita tres veces. El compilador no distingue nombre, correo y teléfono, así
//     que describe() puede llamarse con los argumentos en cualquier orden.
public final class SignupBefore implements Signup {
  @Override
  public String register(String name, String email, String phone) {
    String cleanEmail = email.strip().toLowerCase();
    if (!cleanEmail.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
      throw new IllegalArgumentException("invalid e-mail");
    }
    String digits = phone.replaceAll("\\D", "");
    if (digits.length() < 10 || digits.length() > 11) {
      throw new IllegalArgumentException("invalid phone");
    }
    return describe(name, cleanEmail, digits);
  }

  @Override
  public String invite(String ownEmail, String friendEmail) {
    String own = ownEmail.strip().toLowerCase();
    if (!own.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
      throw new IllegalArgumentException("invalid e-mail");
    }
    String friend = friendEmail.strip().toLowerCase();
    if (!friend.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
      throw new IllegalArgumentException("invalid e-mail");
    }
    if (own.equals(friend)) {
      throw new IllegalArgumentException("cannot invite yourself");
    }
    return own + " invited " + friend;
  }

  static String describe(String name, String email, String phone) {
    String rest = phone.substring(2);
    int split = rest.length() - 4;
    return name
        + " <"
        + email
        + "> ("
        + phone.substring(0, 2)
        + ") "
        + rest.substring(0, split)
        + "-"
        + rest.substring(split);
  }
}
