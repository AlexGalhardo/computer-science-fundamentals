# Pruebas (Testing)

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Las pruebas automatizadas son la forma en que un equipo sabe que el software sigue funcionando después de cada cambio. El tema cubre los niveles de pruebas (unitarias, de integración, de extremo a extremo), las técnicas para escribirlas (dobles de prueba, desarrollo guiado por pruebas, pruebas basadas en propiedades y de mutación) y sus modos de fallo, como las pruebas intermitentes (flaky) y los números de cobertura que no prueban nada. Las buenas pruebas son lo que hace seguros el refactoring y la entrega continua.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| Pirámide de pruebas completa (`test-pyramid`) | Para qué sirve cada nivel de prueba y cuánto cuesta | planeado |
| Kata de TDD con historial de commits (`tdd-kata`) | El ritmo rojo, verde, refactorizar | planeado |
| Pruebas de mutación (`mutation-testing`) | Por qué la cobertura no mide la calidad de las pruebas | planeado |
| Laboratorio de pruebas intermitentes (`flaky-tests`) | Las causas habituales de las pruebas intermitentes | planeado |
| Mini xUnit desde cero (`mini-xunit`) | Cómo funciona por dentro un framework de pruebas | planeado |

## Quiz y documentación

- Preguntas del quiz: planeadas (`quiz/content/testing/`).
- Documentación: planeada (`docs/es/testing/`).
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), Ham Vocke. Gratis. Un largo ejemplo resuelto de pruebas unitarias, de integración, de contrato y de extremo a extremo en una aplicación.
- [Engenharia de Software Moderna, capítulo 8: Testes](https://engsoftmoderna.info/cap8.html), Marco Tulio Valente, UFMG. En portugués. Gratis. Un capítulo gratuito en portugués sobre la pirámide, pruebas unitarias, mocks, TDD, cobertura y pruebas intermitentes.
- [Test Desiderata](https://testdesiderata.com/), Kent Beck. Gratis. Doce propiedades de una buena prueba, cada una con un video corto, y los compromisos entre ellas.

### Libros

- [Test-Driven Development: By Example](https://www.informit.com/store/test-driven-development-by-example-9780321146533), Kent Beck. De pago. La fuente del kata de dinero multimoneda y del ejemplo de xUnit reconstruido en esta área.
- [Software Engineering at Google: Testing Overview](https://abseil.io/resources/swe-book/html/ch11.html), Winters, Manshreck and Wright. Gratis. Capítulos gratuitos sobre tamaños de prueba, pruebas unitarias, dobles de prueba y pruebas más grandes, desde una base de código enorme.
- [Unit Testing Principles, Practices, and Patterns](https://www.manning.com/books/unit-testing), Vladimir Khorikov. De pago. Define qué hace valiosa una prueba unitaria y cuándo los mocks ayudan o perjudican.
- [xUnit Test Patterns](http://xunitpatterns.com/), Gerard Meszaros. Gratis en línea, de pago impreso. El catálogo de smells y patrones de prueba que definió el vocabulario de los dobles de prueba, gratis en línea.
- [Effective Software Testing](https://www.manning.com/books/effective-software-testing), Maurício Aniche. De pago. Diseño sistemático de pruebas: pruebas basadas en especificación, límites, pruebas estructurales y basadas en propiedades.

### Cursos y clases

- [MIT 6.031 Reading 3: Testing](https://web.mit.edu/6.031/www/sp22/classes/03-testing/), MIT. Gratis. Una lectura clara sobre cómo elegir casos de prueba particionando el espacio de entrada y cubriendo los límites.

### Artículos y especificaciones

- [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html), Martin Fowler. Gratis. El artículo que separa los tipos de dobles de prueba y los estilos clásico y mockista.
- [Flaky Tests at Google and How We Mitigate Them](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html), John Micco, Google Testing Blog. Gratis. Números y causas de la intermitencia a gran escala, y lo que se hace al respecto.
- [State of Mutation Testing at Google](https://research.google/pubs/state-of-mutation-testing-at-google/), Goran Petrović and Marko Ivanković (2018). Gratis. Cómo se vuelven prácticas las pruebas de mutación en la revisión de código en una base muy grande.
- [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf), Koen Claessen and John Hughes (2000). Gratis. El artículo que introdujo las pruebas basadas en propiedades.
- [Just Say No to More End-to-End Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html), Mike Wacker, Google Testing Blog. Gratis. El argumento a favor de la pirámide: por qué muchas pruebas de extremo a extremo dan retroalimentación lenta y poco confiable.

### Documentación oficial

- [Playwright documentation](https://playwright.dev/docs/intro), Microsoft. Gratis. La guía oficial de la herramienta de extremo a extremo de este repositorio: localizadores, espera automática y visor de trazas.
- [Bun test runner](https://bun.sh/docs/test), Oven. Gratis. La documentación del ejecutor de pruebas que usan los mini-proyectos en TypeScript.
- [Stryker Mutator documentation](https://stryker-mutator.io/docs/), Stryker team. Gratis. Pruebas de mutación para JavaScript y TypeScript, con una explicación de los mutantes y de la puntuación.
- [fast-check](https://fast-check.dev/), Nicolas Dubien. Gratis. Pruebas basadas en propiedades para TypeScript.

### Videos

- [TDD, Where Did It All Go Wrong](https://www.youtube.com/watch?v=EZ05e7EMOLM), Ian Cooper. Gratis. Una charla sobre probar comportamiento en lugar de detalles de implementación, volviendo al libro de Kent Beck.
- [Modern Software Engineering](https://www.youtube.com/@ModernSoftwareEngineeringYT), Dave Farley. Gratis. Videos semanales sobre TDD, pruebas de aceptación y estrategia de pruebas.

### Práctica y herramientas

- [Kata Catalogue](https://codingdojo.org/kata/), Coding Dojo community. Gratis. Una lista de ejercicios pequeños para practicar TDD, como FizzBuzz, Bowling y Números Romanos.
- [Gilded Rose Refactoring Kata](https://github.com/emilybache/GildedRose-Refactoring-Kata), Emily Bache. Gratis. Código heredado en decenas de lenguajes para practicar pruebas de caracterización y refactoring seguro.

### Comunidades

- [Software Quality Assurance and Testing Stack Exchange](https://sqa.stackexchange.com/), Stack Exchange. Gratis. Preguntas y respuestas sobre diseño de pruebas, automatización y estrategia.
- [Ministry of Testing](https://www.ministryoftesting.com/), Ministry of Testing. Gratis en línea, de pago impreso. Una gran comunidad de pruebas con foro, artículos y eventos.
