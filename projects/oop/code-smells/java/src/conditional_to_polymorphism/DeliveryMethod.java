// EN: REFACTORED with Replace Conditional with Polymorphism. Each kind is a class that carries
//     its own answers, and the checkout below talks only to this interface. Dynamic dispatch
//     picks the code, so the question "which kind is this?" is never asked. A new kind is one
//     new class: this file and the existing kinds are not opened.
// PT: REFATORADO com Substituir Condicional por Polimorfismo. Cada tipo é uma classe que carrega
//     suas respostas, e o checkout abaixo conversa só com esta interface. O despacho dinâmico
//     escolhe o código, então a pergunta "que tipo é este?" nunca é feita. Um tipo novo é uma
//     classe nova: este arquivo e os tipos existentes não são abertos.
// ES: REFACTORIZADO con Reemplazar Condicional por Polimorfismo. Cada tipo es una clase que
//     carga sus respuestas, y el checkout de abajo habla solo con esta interfaz. El despacho
//     dinámico elige el código, así que la pregunta "¿qué tipo es este?" nunca se hace. Un tipo
//     nuevo es una clase nueva: este archivo y los tipos existentes no se abren.
public interface DeliveryMethod {
  String name();

  String trackingPrefix();

  int costCents(int grams);

  int days();

  static int startedKilos(int grams) {
    return (grams + 999) / 1000;
  }

  static String shippingLine(DeliveryMethod method, int grams, int orderNumber) {
    int cost = method.costCents(grams);
    return String.format(
        "%s: %d.%02d, days %d, %s-%06d",
        method.name(), cost / 100, cost % 100, method.days(), method.trackingPrefix(), orderNumber);
  }
}
