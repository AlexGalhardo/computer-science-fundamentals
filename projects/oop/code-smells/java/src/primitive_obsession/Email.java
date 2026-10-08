// EN: REFACTORED with a small type. A record with a compact constructor: the constructor
//     normalises and validates, so an Email that exists is valid and the rule is written once.
//     Java types are nominal, so Email and Phone are different types even though each holds
//     one String, and records compare by content, so two equal e-mails are equal objects.
// PT: REFATORADO com um tipo pequeno. Um record com construtor compacto: o construtor normaliza
//     e valida, então um Email que existe é válido e a regra é escrita uma vez. Os tipos do Java
//     são nominais, então Email e Phone são tipos diferentes mesmo guardando uma String cada, e
//     records comparam por conteúdo, então dois e-mails iguais são objetos iguais.
public record Email(String value) {
  public Email {
    value = value.strip().toLowerCase();
    if (!value.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")) {
      throw new IllegalArgumentException("invalid e-mail");
    }
  }

  @Override
  public String toString() {
    return value;
  }
}
