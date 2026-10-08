# Arquitetura de software

> English version: [README.md](README.md)

Arquitetura de software é o conjunto das decisões caras de mudar: como um sistema é dividido em partes, para que lado apontam as dependências e quais atributos de qualidade (desempenho, disponibilidade, facilidade de mudança) são favorecidos. Arquiteturas em camadas, hexagonal e limpa, monólitos e microsserviços, eventos e CQRS são respostas à mesma pergunta: como manter as regras de negócio independentes dos detalhes ao redor.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Aplicação em arquitetura limpa (`clean-architecture-app`) | Como a regra de dependência mantém as regras de negócio livres de frameworks | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/software-architecture/`).
- Documentação: planejada (`docs/pt/software-architecture/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), Robert C. Martin. Gratuito. O texto original com os círculos concêntricos e a regra de dependência.
- [Software Architecture Guide](https://martinfowler.com/architecture/), Martin Fowler. Gratuito. Índice de artigos sobre o que é arquitetura, fronteiras de aplicação, microsserviços e evolução.
- [Engenharia de Software Moderna, capítulo 7: Arquitetura](https://engsoftmoderna.info/cap7.html), Marco Tulio Valente, UFMG. Em português. Gratuito. Capítulo gratuito em português sobre camadas, MVC, microsserviços, filas de mensagens e publish/subscribe.
- [The C4 model for visualising software architecture](https://c4model.com/), Simon Brown. Gratuito. Uma forma simples de desenhar arquitetura em quatro níveis: contexto, contêineres, componentes e código.

### Livros

- [Clean Architecture](https://www.informit.com/store/clean-architecture-a-craftsmans-guide-to-software-structure-9780134494166), Robert C. Martin. Pago. O livro sobre entidades, casos de uso, adaptadores de interface e princípios de componentes.
- [Fundamentals of Software Architecture](https://fundamentalsofsoftwarearchitecture.com/), Mark Richards and Neal Ford. Pago. Panorama de estilos e características arquiteturais, com os prós e contras de cada estilo avaliados.
- [Architecture Patterns with Python](https://www.cosmicpython.com/), Harry Percival and Bob Gregory. Gratuito online, pago impresso. Gratuito online: repository, unit of work, eventos e CQRS aplicados passo a passo com testes.
- [Arquitetura Limpa na Prática](https://hotmart.com/pt-br/marketplace/produtos/livro-arquitetura-limpa-na-pratica/O59619511K), Otávio Lemos. Em português. Pago. Livro brasileiro curto que aplica arquitetura limpa a uma API em TypeScript, uma das fontes do quiz.
- [Domain-Driven Design Reference](https://www.domainlanguage.com/ddd/reference/), Eric Evans. Gratuito. Resumo gratuito das definições e dos padrões do livro Domain-Driven Design.
- [A Philosophy of Software Design, 2nd edition](https://web.stanford.edu/~ouster/cgi-bin/aposd.php), John Ousterhout. Pago. Livro curto sobre complexidade, módulos profundos e ocultação de informação.

### Cursos e aulas

- [MIT 6.033 Computer System Engineering](https://ocw.mit.edu/courses/6-033-computer-system-engineering-spring-2018/), MIT OpenCourseWare. Gratuito. Aulas sobre modularidade, abstração, camadas e projeto de sistemas grandes, com artigos clássicos.

### Artigos e especificações

- [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/), Alistair Cockburn. Gratuito. O artigo original sobre portas e adaptadores, pelo próprio autor.
- [Microservices](https://martinfowler.com/articles/microservices.html), James Lewis and Martin Fowler (2014). Gratuito. O artigo que definiu o estilo e suas características, incluindo os custos.
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), Michael Nygard (2011). Gratuito. O texto curto que propôs os registros de decisão de arquitetura e seu formato.
- [How Do Committees Invent?](https://www.melconway.com/Home/Committees_Paper.html), Melvin Conway (1968). Gratuito. A fonte da lei de Conway: sistemas espelham a estrutura de comunicação de quem os constrói.
- [Big Ball of Mud](http://www.laputan.org/mud/), Brian Foote and Joseph Yoder (1997). Gratuito. Estudo franco da arquitetura mais comum de todas e das forças que a produzem.
- [CQRS](https://martinfowler.com/bliki/CQRS.html), Martin Fowler. Gratuito. Explicação curta e cautelosa da separação entre o modelo de leitura e o de escrita.

### Documentação oficial

- [Cloud Design Patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/), Microsoft Azure Architecture Center. Gratuito. Catálogo de padrões de sistemas distribuídos com o problema, a solução e as considerações.
- [Architectural Decision Records](https://adr.github.io/), ADR GitHub organisation. Gratuito. Modelos, ferramentas e exemplos para escrever registros de decisão.
- [The Twelve-Factor App](https://12factor.net/), Adam Wiggins. Gratuito. Doze regras para construir serviços fáceis de implantar e de escalar.

### Vídeos

- [Visualising software architecture with the C4 model](https://www.youtube.com/watch?v=x2-rSnhpw0g), Simon Brown. Gratuito. Palestra sobre por que a maioria dos diagramas de arquitetura falha e como desenhar diagramas úteis.
- [Full Cycle](https://www.youtube.com/@FullCycle), Wesley Willians. Em português. Gratuito. Canal brasileiro com palestras e aulas sobre arquitetura, microsserviços e domain-driven design.
- [Rodrigo Branas](https://www.youtube.com/@RodrigoBranas), Rodrigo Branas. Em português. Gratuito. Canal brasileiro com aulas em português sobre arquitetura limpa, domain-driven design e SOLID.

### Prática e ferramentas

- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser), Sander Verweij. Gratuito. Valida e desenha as dependências de um projeto TypeScript, útil para impor a regra de dependência.

### Comunidades

- [Software Engineering Stack Exchange: architecture tag](https://softwareengineering.stackexchange.com/questions/tagged/architecture), Stack Exchange. Gratuito. Discussões de dilemas concretos de arquitetura.
