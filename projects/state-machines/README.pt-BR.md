# Máquinas de estado

> English version: [README.md](README.md)

Uma máquina de estados descreve o comportamento como um conjunto finito de estados e as transições entre eles. É ao mesmo tempo um modelo teórico (autômatos, linguagens regulares, máquinas de Turing e os limites da computação) e uma ferramenta prática de projeto: protocolos, parsers, interfaces e fluxos de negócio ficam mais fáceis de entender, e situações inválidas ficam impossíveis de representar, quando os estados são explícitos.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Máquina de estados de pedido](order-state-machine/) | Como estados e transições explícitos eliminam situações inválidas | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/state-machines/](../../quiz/content/state-machines/)
- Documentação: [docs/pt/state-machines/](../../docs/pt/state-machines/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Welcome to the world of Statecharts](https://statecharts.dev/), statecharts community. Gratuito. Introdução direta a máquinas de estados e statecharts, com os problemas que cada conceito resolve.
- [Game Programming Patterns: State](https://gameprogrammingpatterns.com/state.html), Robert Nystrom. Gratuito. Parte de um emaranhado de flags e chega a máquinas de estados finitos, hierarquias e autômatos com pilha.
- [State pattern](https://refactoring.guru/design-patterns/state), Refactoring Guru. Gratuito. O padrão State orientado a objetos com diagramas e código, também disponível em português no site.

### Livros

- [Introduction to the Theory of Computation, 3rd edition](https://math.mit.edu/~sipser/book.html), Michael Sipser. Pago. O livro-texto padrão sobre autômatos, linguagens regulares e livres de contexto, máquinas de Turing e computabilidade.
- [Practical UML Statecharts in C/C++, 2nd edition](https://www.state-machine.com/psicc2), Miro Samek. Gratuito. Livro sobre como implementar máquinas de estados hierárquicas em software real, gratuito em PDF pelo autor.

### Cursos e aulas

- [MIT 18.404J Theory of Computation](https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/), Michael Sipser, MIT OpenCourseWare. Gratuito. Videoaulas do autor do livro-texto, de autômatos finitos a indecidibilidade e complexidade.
- [CS 103 Mathematical Foundations of Computing](https://web.stanford.edu/class/cs103/), Stanford University. Gratuito. Slides e apostilas sobre AFDs, AFNs, expressões regulares, gramáticas livres de contexto e máquinas de Turing.

### Artigos e especificações

- [On Computable Numbers, with an Application to the Entscheidungsproblem](https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf), Alan Turing (1936). Gratuito. O artigo que definiu a máquina de Turing e provou que alguns problemas não podem ser decididos.
- [State Chart XML (SCXML)](https://www.w3.org/TR/scxml/), W3C. Gratuito. Um padrão que fixa a semântica de execução de statecharts: guardas, ações e estados paralelos.
- [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html), Russ Cox. Gratuito. Mostra o caminho de expressão regular a AFN e a AFD com pequenos programas em C.
- [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), IETF. Gratuito. Seu diagrama de estados de conexão é a máquina de estados mais conhecida de um protocolo real.
- [Statecharts in the Making: A Personal Account](https://weizmann.ac.il/math/harel/sites/math.harel/files/users/user50/Statecharts.History.pdf), David Harel (2007). Gratuito. O inventor dos statecharts conta como hierarquia, estados paralelos e comunicação por difusão foram acrescentados aos diagramas de estados, e por quê.

### Documentação oficial

- [XState and Stately documentation](https://stately.ai/docs), Stately. Gratuito. A documentação da principal biblioteca de statecharts para TypeScript: estados, eventos, guardas, ações e atores.
- [gen_statem](https://www.erlang.org/doc/apps/stdlib/gen_statem.html), Erlang/OTP. Gratuito. O comportamento padrão de máquina de estados da BEAM, usado a partir do Elixir em protocolos e fluxos.
- [Mermaid: State diagrams](https://mermaid.js.org/syntax/stateDiagram.html), Mermaid. Gratuito. A sintaxe para desenhar diagramas de estados a partir de texto, como o miniprojeto faz a partir do código.

### Vídeos

- [MIT 18.404J Theory of Computation, Fall 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP60_JNv2MmK3wkOt9syvfQWY), Michael Sipser, MIT OpenCourseWare. Gratuito. As aulas gravadas do curso acima.
- [Theory of Computation and Automata Theory](https://www.youtube.com/playlist?list=PLBlnK6fEyqRgp46KUv4ZY69yXmpwKOIev), Neso Academy. Gratuito. Exemplos curtos resolvidos de projeto de AFD, conversão de AFN para AFD, minimização e máquinas de Mealy e Moore.
- [Infinitely Better UIs with Finite Automata](https://www.youtube.com/watch?v=VU1NKX6Qkxc), David Khourshid. Gratuito. Palestra sobre por que máquinas de estados explícitas tornam previsível a lógica de interfaces.

### Prática e ferramentas

- [JFLAP](https://www.jflap.org/), Susan Rodger, Duke University. Gratuito. Ferramenta para construir e simular autômatos, gramáticas e máquinas de Turing, e converter entre eles.
- [FSM Simulator](https://ivanzuzak.info/noam/webapps/fsm_simulator/), Ivan Zuzak. Gratuito. Constrói no navegador um autômato a partir de uma expressão regular e percorre uma entrada passo a passo.

### Comunidades

- [Computer Science Stack Exchange: automata tag](https://cs.stackexchange.com/questions/tagged/automata), Stack Exchange. Gratuito. Perguntas respondidas sobre construções de autômatos, provas e linguagens regulares.
- [XState discussions](https://github.com/statelyai/xstate/discussions), Stately community. Gratuito. Onde são respondidas dúvidas práticas sobre modelar lógica de aplicação como máquinas de estados.
