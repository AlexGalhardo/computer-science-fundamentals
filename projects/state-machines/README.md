# State machines

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A state machine describes behaviour as a finite set of states and the transitions between them. It is at once a theoretical model (automata, regular languages, Turing machines and the limits of computation) and a practical design tool: protocols, parsers, user interfaces and business workflows become easier to reason about, and invalid situations become impossible to represent, when the states are made explicit.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Order state machine](order-state-machine/) | How explicit states and transitions remove invalid situations | available |

## Quiz and documentation

- Quiz questions: [quiz/content/state-machines/](../../quiz/content/state-machines/)
- Documentation: [docs/en/state-machines/](../../docs/en/state-machines/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Welcome to the world of Statecharts](https://statecharts.dev/), statecharts community. Free. A plain introduction to state machines and statecharts, with the problems each concept solves.
- [Game Programming Patterns: State](https://gameprogrammingpatterns.com/state.html), Robert Nystrom. Free. Starts from a tangle of flags and arrives at finite state machines, hierarchies and pushdown automata.
- [State pattern](https://refactoring.guru/design-patterns/state), Refactoring Guru. Free. The object-oriented State pattern with diagrams and code, also available in Portuguese on the site.

### Books

- [Introduction to the Theory of Computation, 3rd edition](https://math.mit.edu/~sipser/book.html), Michael Sipser. Paid. The standard textbook on automata, regular and context-free languages, Turing machines and computability.
- [Practical UML Statecharts in C/C++, 2nd edition](https://www.state-machine.com/psicc2), Miro Samek. Free. A book on implementing hierarchical state machines in real software, free as a PDF from the author.

### Courses and lectures

- [MIT 18.404J Theory of Computation](https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/), Michael Sipser, MIT OpenCourseWare. Free. Video lectures by the author of the textbook, from finite automata to undecidability and complexity.
- [CS 103 Mathematical Foundations of Computing](https://web.stanford.edu/class/cs103/), Stanford University. Free. Slides and handouts on DFAs, NFAs, regular expressions, context-free grammars and Turing machines.

### Papers and specifications

- [On Computable Numbers, with an Application to the Entscheidungsproblem](https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf), Alan Turing (1936). Free. The paper that defined the Turing machine and proved that some problems cannot be decided.
- [State Chart XML (SCXML)](https://www.w3.org/TR/scxml/), W3C. Free. A standard that pins down the execution semantics of statecharts: guards, actions and parallel states.
- [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html), Russ Cox. Free. Shows the path from regular expression to NFA to DFA with small C programs.
- [RFC 9293: Transmission Control Protocol (TCP)](https://www.rfc-editor.org/rfc/rfc9293), IETF. Free. Its connection state diagram is the best-known state machine in a real protocol.
- [Statecharts in the Making: A Personal Account](https://weizmann.ac.il/math/harel/sites/math.harel/files/users/user50/Statecharts.History.pdf), David Harel (2007). Free. The inventor of statecharts tells how hierarchy, parallel states and broadcast communication were added to state diagrams, and why.

### Official documentation

- [XState and Stately documentation](https://stately.ai/docs), Stately. Free. The documentation of the main statechart library for TypeScript: states, events, guards, actions and actors.
- [gen_statem](https://www.erlang.org/doc/apps/stdlib/gen_statem.html), Erlang/OTP. Free. The standard state machine behaviour of the BEAM, used from Elixir for protocols and workflows.
- [Mermaid: State diagrams](https://mermaid.js.org/syntax/stateDiagram.html), Mermaid. Free. The syntax for drawing state diagrams from text, as the mini-project does from its code.

### Videos

- [MIT 18.404J Theory of Computation, Fall 2020 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP60_JNv2MmK3wkOt9syvfQWY), Michael Sipser, MIT OpenCourseWare. Free. The recorded lectures of the course above.
- [Theory of Computation and Automata Theory](https://www.youtube.com/playlist?list=PLBlnK6fEyqRgp46KUv4ZY69yXmpwKOIev), Neso Academy. Free. Short worked examples of DFA design, NFA to DFA conversion, minimisation and Mealy and Moore machines.
- [Infinitely Better UIs with Finite Automata](https://www.youtube.com/watch?v=VU1NKX6Qkxc), David Khourshid. Free. A talk on why explicit state machines make user interface logic predictable.

### Practice and tools

- [JFLAP](https://www.jflap.org/), Susan Rodger, Duke University. Free. A tool for building and simulating automata, grammars and Turing machines, and converting between them.
- [FSM Simulator](https://ivanzuzak.info/noam/webapps/fsm_simulator/), Ivan Zuzak. Free. Builds an automaton from a regular expression in the browser and steps through an input.

### Communities

- [Computer Science Stack Exchange: automata tag](https://cs.stackexchange.com/questions/tagged/automata), Stack Exchange. Free. Answered questions on automata constructions, proofs and regular languages.
- [XState discussions](https://github.com/statelyai/xstate/discussions), Stately community. Free. Where practical questions about modelling application logic as state machines are answered.
