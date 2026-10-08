# Padrões de projeto e SOLID

> English version: [README.md](README.md)

Padrões de projeto são soluções com nome para problemas de projeto que sempre voltam, e os princípios SOLID são cinco regras práticas para manter classes e módulos fáceis de mudar. Juntos eles dão um vocabulário comum (Strategy, Adapter, Observer, inversão de dependência) para discutir projeto, e o discernimento para ver quando um padrão se paga e quando é só cerimônia.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Padrões de projeto para back-end (`backend-patterns`) | Cerca de dez padrões em situações em que eles compensam | planejado |
| SOLID antes e depois (`solid-before-after`) | O que cada princípio evita | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/design-patterns/`).
- Documentação: planejada (`docs/pt/design-patterns/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Design Patterns](https://refactoring.guru/design-patterns), Alexander Shvets, Refactoring Guru. Gratuito. O catálogo online mais claro: cada padrão com o problema, a estrutura, prós e contras e código.
- [Padrões de Projeto](https://refactoring.guru/pt-br/design-patterns), Alexander Shvets, Refactoring Guru. Em português. Gratuito. O mesmo catálogo traduzido para o português do Brasil.
- [Game Programming Patterns](https://gameprogrammingpatterns.com/), Robert Nystrom. Gratuito online, pago impresso. Gratuito online: revisita Command, Observer, State e Singleton com notas honestas sobre quando não usá-los.

### Livros

- [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.informit.com/store/design-patterns-elements-of-reusable-object-oriented-9780201633610), Gamma, Helm, Johnson and Vlissides. Pago. O catálogo original de 23 padrões da "Gang of Four", ainda a referência para nomes e intenção.
- [Head First Design Patterns, 2nd edition](https://wickedlysmart.com/head-first-design-patterns/), Eric Freeman and Elisabeth Robson. Pago. A página dos autores do livro mais acessível: cada padrão nasce de um problema de projeto que primeiro piora.
- [Catalog of Patterns of Enterprise Application Architecture](https://martinfowler.com/eaaCatalog/), Martin Fowler. Gratuito. Resumos curtos dos padrões de back-end: Repository, Unit of Work, Data Mapper, Service Layer.
- [Orientação a Objetos e SOLID para Ninjas](https://www.casadocodigo.com.br/products/livro-oo-solid), Maurício Aniche, Casa do Código. Em português. Pago. Livro curto em português que explica cada princípio SOLID por meio de acoplamento e coesão.
- [Clean Code](https://www.informit.com/store/clean-code-a-handbook-of-agile-software-craftsmanship-9780132350884), Robert C. Martin. Pago. Uma das fontes do quiz, para nomes, funções pequenas e os princípios no nível de classe.

### Cursos e aulas

- [Design Patterns](https://www.coursera.org/learn/design-patterns), University of Alberta (Coursera). Gratuito como ouvinte, certificado pago. Curso curto que aplica padrões criacionais, estruturais e comportamentais a uma aplicação Java.
- [Engenharia de Software Moderna, capítulo 6: Padrões de Projeto](https://engsoftmoderna.info/cap6.html), Marco Tulio Valente, UFMG. Em português. Gratuito. Capítulo gratuito em português que apresenta dez padrões com motivação e código, além de críticas.

### Artigos e especificações

- [The Principles of OOD](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod), Robert C. Martin. Gratuito. O índice do autor com os artigos originais sobre cada um dos princípios depois chamados de SOLID.
- [A Behavioral Notion of Subtyping](https://www.cs.cmu.edu/~wing/publications/LiskovWing94.pdf), Barbara Liskov and Jeannette Wing (1994). Gratuito. O enunciado formal do princípio da substituição: o que um subtipo precisa preservar.
- [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html), Martin Fowler (2004). Gratuito. O artigo que deu nome à injeção de dependência e a comparou com o service locator.
- [The Single Responsibility Principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html), Robert C. Martin. Gratuito. Texto curto que reformula o princípio como: um módulo, um motivo para mudar, um ator.
- [On the Criteria To Be Used in Decomposing Systems into Modules](https://wstomv.win.tue.nl/edu/2ip30/references/criteria_for_modularization.pdf), David Parnas (1972). Gratuito. A origem da ocultação de informação, a ideia por baixo da maioria dos padrões e princípios.

### Documentação oficial

- [Design Patterns in TypeScript](https://refactoring.guru/design-patterns/typescript), Refactoring Guru. Gratuito. Um exemplo executável em TypeScript de cada padrão do catálogo.
- [Patterns.dev](https://www.patterns.dev/), Lydia Hallie and Addy Osmani. Gratuito. Padrões de projeto, de renderização e de desempenho para aplicações JavaScript modernas.

### Vídeos

- [Design Patterns in Object Oriented Programming](https://www.youtube.com/playlist?list=PLrhzvIcii6GNjpARdnO4ueTUAVR9eMBpc), Christopher Okhravi. Gratuito. Explicações animadas no quadro dos principais padrões, seguindo o Head First Design Patterns.

### Prática e ferramentas

- [Refactoring catalog](https://refactoring.guru/refactoring/catalog), Refactoring Guru. Gratuito. As transformações passo a passo usadas para levar código existente em direção a um padrão.

### Comunidades

- [Software Engineering Stack Exchange: design-patterns tag](https://softwareengineering.stackexchange.com/questions/tagged/design-patterns), Stack Exchange. Gratuito. Discussões sobre quando um padrão cabe e quando é excesso de engenharia.
- [Stack Overflow: solid-principles tag](https://stackoverflow.com/questions/tagged/solid-principles), Stack Overflow. Gratuito. Dúvidas concretas sobre a aplicação de cada princípio em código real.
