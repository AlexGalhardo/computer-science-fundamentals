// EN: This file must NOT compile. The Dockerfile runs javac on it and fails the build if javac
//     accepts it. It is the proof that small types turn a swapped argument into a compile error.
// PT: Este arquivo NÃO pode compilar. O Dockerfile roda o javac nele e falha o build se o javac
//     o aceitar. É a prova de que tipos pequenos transformam um argumento trocado em erro de
//     compilação.
final class SwappedArguments {
  private SwappedArguments() {}

  static Account build() {
    Email email = new Email("ana@example.com");
    Phone phone = new Phone("11999990000");
    return new Account("Ana", phone, email);
  }
}
