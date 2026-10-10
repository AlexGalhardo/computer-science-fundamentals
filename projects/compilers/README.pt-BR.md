# Compiladores

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Um compilador traduz um programa de uma linguagem para outra, e um interpretador o executa diretamente. Ambos passam pelas mesmas etapas: dividir o texto em tokens, construir uma árvore a partir de uma gramática, verificá-la e então gerar código ou executá-lo. Conhecer essas etapas tira o mistério das mensagens de erro, do desempenho, da coleta de lixo e de toda ferramenta que lê código.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Minilinguagem: lexer e parser](mini-language-parser/) | Como o texto-fonte vira tokens e depois uma árvore | disponível |
| [Interpretador que percorre a árvore](tree-walking-interpreter/) | Como uma árvore é executada: ambientes, escopos e closures | disponível |
| [Máquina virtual de bytecode](bytecode-vm/) | Por que bytecode executa mais rápido do que percorrer uma árvore | disponível |
| [Motor de expressões regulares](regex-engine/) | Como uma expressão regular vira um autômato | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/compilers/](../../quiz/content/compilers/)
- Documentação: [docs/pt/compilers/](../../docs/pt/compilers/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Crafting Interpreters](https://craftinginterpreters.com/), Robert Nystrom. Gratuito online, pago impresso. Gratuito online: constrói a mesma linguagem duas vezes, como interpretador de árvore e como máquina virtual de bytecode.
- [Let's Build A Simple Interpreter](https://ruslanspivak.com/lsbasi-part1/), Ruslan Spivak. Gratuito. Série de blog paciente que faz crescer um interpretador de Pascal um pequeno passo por vez.
- [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html), Russ Cox. Gratuito. Explica a construção de Thompson e por que o casamento baseado em autômatos evita tempo exponencial.

### Livros

- [Compilers: Principles, Techniques, and Tools, 2nd edition (the Dragon Book)](https://www.pearson.com/en-us/subject-catalog/p/compilers-principles-techniques-and-tools/P200000003472), Aho, Lam, Sethi and Ullman. Pago. O livro-texto que o quiz segue: análise léxica, parsing LL e LR, tradução, geração de código e otimização.
- [Introduction to Compilers and Language Design](https://dthain.github.io/books/compiler/), Douglas Thain, University of Notre Dame. Gratuito online, pago impresso. Livro-texto gratuito de um semestre que vai da análise léxica à geração de código x86.
- [Writing An Interpreter In Go](https://interpreterbook.com/), Thorsten Ball. Pago. Constrói um lexer, um parser de Pratt e um avaliador com testes primeiro; a continuação acrescenta compilador e VM.
- [The Garbage Collection Handbook, 2nd edition](https://gchandbook.org/), Richard Jones, Antony Hosking and Eliot Moss. Pago. A referência em gerência automática de memória, do mark-and-sweep aos coletores concorrentes.

### Cursos e aulas

- [CS 143 Compilers](https://web.stanford.edu/class/cs143/), Stanford University. Gratuito. Slides e trabalhos em que um compilador para a linguagem COOL é construído fase a fase.
- [CS 6120 Advanced Compilers: The Self-Guided Online Course](https://www.cs.cornell.edu/courses/cs6120/2020fa/self-guided/), Adrian Sampson, Cornell University. Gratuito. Vídeos e tarefas sobre representações intermediárias, análise de fluxo de dados, SSA e otimização.
- [MIT 6.035 Computer Language Engineering](https://ocw.mit.edu/courses/6-035-computer-language-engineering-spring-2010/), MIT OpenCourseWare. Gratuito. Notas de aula sobre o pipeline completo, com ênfase em geração de código e otimização.

### Artigos e especificações

- [The Implementation of Lua 5.0](https://www.lua.org/doc/jucs05.pdf), Ierusalimschy, de Figueiredo and Celes (2005). Gratuito. Como uma máquina virtual real e pequena é projetada: registradores, closures e tabelas, por seus autores brasileiros.
- [Pratt Parsers: Expression Parsing Made Easy](https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/), Robert Nystrom. Gratuito. A explicação mais clara de parsing por precedência de operadores, a técnica usada na minilinguagem.

### Documentação oficial

- [LLVM Tutorial: Kaleidoscope](https://llvm.org/docs/tutorial/), LLVM Project. Gratuito. O tutorial oficial que implementa uma linguagem pequena com gerador de código e JIT reais.
- [WebAssembly Core Specification](https://webassembly.github.io/spec/core/), W3C WebAssembly Community Group. Gratuito. Especificação precisa de um bytecode moderno baseado em pilha e de suas regras de validação e execução.

### Vídeos

- [Computerphile](https://www.youtube.com/@Computerphile), University of Nottingham. Gratuito. Tem vídeos curtos sobre parsing, gramáticas, expressões regulares e coleta de lixo.

### Prática e ferramentas

- [Compiler Explorer](https://godbolt.org/), Matt Godbolt. Gratuito. Digite código à esquerda e leia o assembly gerado à direita, para muitos compiladores.
- [AST Explorer](https://astexplorer.net/), Felix Kling. Gratuito. Mostra a árvore sintática que parsers reais constroem para um trecho de código.
- [regex101](https://regex101.com/), Firas Dib. Gratuito. Testa uma expressão regular e explica cada parte, com depurador passo a passo.
- [Expressões Regulares: Guia de Consulta Rápida](https://aurelio.net/regex/guia/), Aurelio Marinho Jargas. Em português. Gratuito. O guia gratuito clássico de expressões regulares em português.

### Comunidades

- [r/ProgrammingLanguages](https://www.reddit.com/r/ProgrammingLanguages/), Reddit. Gratuito. Comunidade ativa de quem projeta e implementa linguagens.
- [Programming Language Design and Implementation Stack Exchange](https://langdev.stackexchange.com/), Stack Exchange. Gratuito. Perguntas e respostas sobre parsing, sistemas de tipos, interpretadores e compiladores.
