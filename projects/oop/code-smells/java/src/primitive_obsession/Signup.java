// EN: What both versions must do. The tests are written against this interface only, so they
//     run unchanged on the version with strings and on the version with small types.
// PT: O que as duas versões precisam fazer. Os testes são escritos só contra esta interface,
//     então rodam sem mudança na versão com strings e na versão com tipos pequenos.
// ES: Lo que ambas versiones deben hacer. Los tests se escriben solo contra esta interfaz, así
//     que corren sin cambios en la versión con strings y en la versión con tipos pequeños.
public interface Signup {
  /** Registers a user and returns the description of the account. */
  String register(String name, String email, String phone);

  /** Returns the invitation text for a friend. */
  String invite(String ownEmail, String friendEmail);
}
