# Compilers

> Versão em português: [README.pt-BR.md](README.pt-BR.md)

A compiler translates a program from one language into another, and an interpreter runs it directly. Both go through the same stages: splitting text into tokens, building a tree from a grammar, checking it, and then generating code or executing it. Knowing these stages removes the mystery from error messages, performance, garbage collection and every tool that reads code.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Mini language: lexer and parser](mini-language-parser/) | How source text becomes tokens and then a tree | available |
| [Tree-walking interpreter](tree-walking-interpreter/) | How a tree is executed: environments, scopes and closures | available |
| [Bytecode virtual machine](bytecode-vm/) | Why bytecode runs faster than walking a tree | available |
| [Regex engine](regex-engine/) | How a regular expression becomes an automaton | available |

## Quiz and documentation

- Quiz questions: [quiz/content/compilers/](../../quiz/content/compilers/)
- Documentation: [docs/en/compilers/](../../docs/en/compilers/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [Crafting Interpreters](https://craftinginterpreters.com/), Robert Nystrom. Free online, paid in print. Free online: builds the same language twice, as a tree-walking interpreter and as a bytecode virtual machine.
- [Let's Build A Simple Interpreter](https://ruslanspivak.com/lsbasi-part1/), Ruslan Spivak. Free. A patient blog series that grows a Pascal interpreter one small step at a time.
- [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html), Russ Cox. Free. Explains Thompson's construction and why automata-based matching avoids exponential time.

### Books

- [Compilers: Principles, Techniques, and Tools, 2nd edition (the Dragon Book)](https://www.pearson.com/en-us/subject-catalog/p/compilers-principles-techniques-and-tools/P200000003472), Aho, Lam, Sethi and Ullman. Paid. The textbook the quiz follows: lexing, LL and LR parsing, translation, code generation and optimisation.
- [Introduction to Compilers and Language Design](https://dthain.github.io/books/compiler/), Douglas Thain, University of Notre Dame. Free online, paid in print. A free one-semester textbook that goes from scanning to x86 code generation.
- [Writing An Interpreter In Go](https://interpreterbook.com/), Thorsten Ball. Paid. Builds a lexer, a Pratt parser and an evaluator with tests first; a sequel adds a compiler and VM.
- [The Garbage Collection Handbook, 2nd edition](https://gchandbook.org/), Richard Jones, Antony Hosking and Eliot Moss. Paid. The reference on automatic memory management, from mark-and-sweep to concurrent collectors.

### Courses and lectures

- [CS 143 Compilers](https://web.stanford.edu/class/cs143/), Stanford University. Free. Lecture slides and assignments in which a compiler for the COOL language is built phase by phase.
- [CS 6120 Advanced Compilers: The Self-Guided Online Course](https://www.cs.cornell.edu/courses/cs6120/2020fa/self-guided/), Adrian Sampson, Cornell University. Free. Videos and tasks on intermediate representations, data-flow analysis, SSA and optimisation.
- [MIT 6.035 Computer Language Engineering](https://ocw.mit.edu/courses/6-035-computer-language-engineering-spring-2010/), MIT OpenCourseWare. Free. Lecture notes on the full pipeline, with emphasis on code generation and optimisation.

### Papers and specifications

- [The Implementation of Lua 5.0](https://www.lua.org/doc/jucs05.pdf), Ierusalimschy, de Figueiredo and Celes (2005). Free. How a real, small virtual machine is designed: registers, closures and tables, by its Brazilian authors.
- [Pratt Parsers: Expression Parsing Made Easy](https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/), Robert Nystrom. Free. The clearest explanation of operator precedence parsing, the technique used in the mini-language.

### Official documentation

- [LLVM Tutorial: Kaleidoscope](https://llvm.org/docs/tutorial/), LLVM Project. Free. The official tutorial that implements a small language with a real code generator and JIT.
- [WebAssembly Core Specification](https://webassembly.github.io/spec/core/), W3C WebAssembly Community Group. Free. A precise specification of a modern stack-based bytecode and its validation and execution rules.

### Videos

- [Computerphile](https://www.youtube.com/@Computerphile), University of Nottingham. Free. Has short videos on parsing, grammars, regular expressions and garbage collection.

### Practice and tools

- [Compiler Explorer](https://godbolt.org/), Matt Godbolt. Free. Type code on the left and read the generated assembly on the right, for many compilers.
- [AST Explorer](https://astexplorer.net/), Felix Kling. Free. Shows the syntax tree real parsers build for a piece of code.
- [regex101](https://regex101.com/), Firas Dib. Free. Tests a regular expression and explains each part of it, with a step debugger.
- [Expressões Regulares: Guia de Consulta Rápida](https://aurelio.net/regex/guia/), Aurelio Marinho Jargas. In Portuguese. Free. The classic free guide to regular expressions in Portuguese.

### Communities

- [r/ProgrammingLanguages](https://www.reddit.com/r/ProgrammingLanguages/), Reddit. Free. An active community of people designing and implementing languages.
- [Programming Language Design and Implementation Stack Exchange](https://langdev.stackexchange.com/), Stack Exchange. Free. Questions and answers on parsing, type systems, interpreters and compilers.
