// EN: The signature says what each part is. `new Account("Ana", phone, email)` does not compile:
//     the Docker build checks that with the file in negative/SwappedArguments.java.
// PT: A assinatura diz o que é cada parte. `new Account("Ana", phone, email)` não compila: o
//     build do Docker confere isso com o arquivo negative/SwappedArguments.java.
// ES: La firma dice qué es cada parte. `new Account("Ana", phone, email)` no compila: el
//     build de Docker lo verifica con el archivo negative/SwappedArguments.java.
public record Account(String name, Email email, Phone phone) {
  public String describe() {
    return name + " <" + email + "> " + phone;
  }
}
