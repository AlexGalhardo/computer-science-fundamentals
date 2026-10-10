# Testes

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Testes automatizados são como um time sabe que o software continua funcionando depois de cada mudança. O assunto cobre os níveis de teste (unidade, integração, ponta a ponta), as técnicas para escrevê-los (dublês de teste, desenvolvimento guiado por testes, testes baseados em propriedades e de mutação) e seus modos de falha, como testes instáveis e números de cobertura que não provam nada. Bons testes são o que torna seguras a refatoração e a entrega contínua.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Pirâmide de testes completa (`test-pyramid`) | Para que serve cada nível de teste e quanto custa | planejado |
| Kata de TDD com histórico de commits (`tdd-kata`) | O ritmo vermelho, verde, refatorar | planejado |
| Testes de mutação (`mutation-testing`) | Por que a cobertura não mede a qualidade dos testes | planejado |
| Laboratório de testes instáveis (`flaky-tests`) | As causas habituais de testes intermitentes | planejado |
| Mini xUnit do zero (`mini-xunit`) | Como um framework de testes funciona por dentro | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/testing/`).
- Documentação: planejada (`docs/pt/testing/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html), Ham Vocke. Gratuito. Um longo exemplo resolvido de testes de unidade, integração, contrato e ponta a ponta em uma aplicação.
- [Engenharia de Software Moderna, capítulo 8: Testes](https://engsoftmoderna.info/cap8.html), Marco Tulio Valente, UFMG. Em português. Gratuito. Capítulo gratuito em português sobre a pirâmide, testes de unidade, mocks, TDD, cobertura e testes instáveis.
- [Test Desiderata](https://testdesiderata.com/), Kent Beck. Gratuito. Doze propriedades de um bom teste, cada uma com um vídeo curto, e as trocas entre elas.

### Livros

- [Test-Driven Development: By Example](https://www.informit.com/store/test-driven-development-by-example-9780321146533), Kent Beck. Pago. A fonte do kata de dinheiro em várias moedas e do exemplo de xUnit refeito nesta área.
- [Software Engineering at Google: Testing Overview](https://abseil.io/resources/swe-book/html/ch11.html), Winters, Manshreck and Wright. Gratuito. Capítulos gratuitos sobre tamanhos de teste, testes de unidade, dublês e testes maiores, a partir de uma base de código enorme.
- [Unit Testing Principles, Practices, and Patterns](https://www.manning.com/books/unit-testing), Vladimir Khorikov. Pago. Define o que torna valioso um teste de unidade e quando mocks ajudam ou atrapalham.
- [xUnit Test Patterns](http://xunitpatterns.com/), Gerard Meszaros. Gratuito online, pago impresso. O catálogo de smells e padrões de teste que definiu o vocabulário dos dublês de teste, gratuito online.
- [Effective Software Testing](https://www.manning.com/books/effective-software-testing), Maurício Aniche. Pago. Projeto sistemático de testes: testes baseados em especificação, limites, testes estruturais e baseados em propriedades.

### Cursos e aulas

- [MIT 6.031 Reading 3: Testing](https://web.mit.edu/6.031/www/sp22/classes/03-testing/), MIT. Gratuito. Leitura clara sobre a escolha de casos de teste particionando o espaço de entrada e cobrindo os limites.

### Artigos e especificações

- [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html), Martin Fowler. Gratuito. O artigo que separa os tipos de dublês de teste e os estilos clássico e mockista.
- [Flaky Tests at Google and How We Mitigate Them](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html), John Micco, Google Testing Blog. Gratuito. Números e causas da instabilidade em grande escala, e o que se faz a respeito.
- [State of Mutation Testing at Google](https://research.google/pubs/state-of-mutation-testing-at-google/), Goran Petrović and Marko Ivanković (2018). Gratuito. Como os testes de mutação se tornam viáveis na revisão de código em uma base muito grande.
- [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf), Koen Claessen and John Hughes (2000). Gratuito. O artigo que apresentou os testes baseados em propriedades.
- [Just Say No to More End-to-End Tests](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html), Mike Wacker, Google Testing Blog. Gratuito. O argumento a favor da pirâmide: por que muitos testes ponta a ponta dão retorno lento e pouco confiável.

### Documentação oficial

- [Playwright documentation](https://playwright.dev/docs/intro), Microsoft. Gratuito. O guia oficial da ferramenta de ponta a ponta deste repositório: localizadores, espera automática e visualizador de traces.
- [Bun test runner](https://bun.sh/docs/test), Oven. Gratuito. A documentação do executor de testes usado pelos miniprojetos em TypeScript.
- [Stryker Mutator documentation](https://stryker-mutator.io/docs/), Stryker team. Gratuito. Testes de mutação para JavaScript e TypeScript, com explicação de mutantes e da pontuação.
- [fast-check](https://fast-check.dev/), Nicolas Dubien. Gratuito. Testes baseados em propriedades para TypeScript.

### Vídeos

- [TDD, Where Did It All Go Wrong](https://www.youtube.com/watch?v=EZ05e7EMOLM), Ian Cooper. Gratuito. Palestra sobre testar comportamento em vez de detalhes de implementação, voltando ao livro de Kent Beck.
- [Modern Software Engineering](https://www.youtube.com/@ModernSoftwareEngineeringYT), Dave Farley. Gratuito. Vídeos semanais sobre TDD, testes de aceitação e estratégia de testes.

### Prática e ferramentas

- [Kata Catalogue](https://codingdojo.org/kata/), Coding Dojo community. Gratuito. Lista de exercícios pequenos para praticar TDD, como FizzBuzz, Boliche e Numerais Romanos.
- [Gilded Rose Refactoring Kata](https://github.com/emilybache/GildedRose-Refactoring-Kata), Emily Bache. Gratuito. Código legado em dezenas de linguagens para praticar testes de caracterização e refatoração segura.

### Comunidades

- [Software Quality Assurance and Testing Stack Exchange](https://sqa.stackexchange.com/), Stack Exchange. Gratuito. Perguntas e respostas sobre projeto de testes, automação e estratégia.
- [Ministry of Testing](https://www.ministryoftesting.com/), Ministry of Testing. Gratuito online, pago impresso. Grande comunidade de testes com fórum, artigos e eventos.
