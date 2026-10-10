# Programação funcional

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

A programação funcional constrói programas com funções puras e dados imutáveis, empurrando os efeitos colaterais para as bordas. Código escrito assim é mais fácil de testar, de entender e de executar de forma concorrente, porque o resultado de uma função depende só dos argumentos. Funções de ordem superior, closures, casamento de padrões e tipos como Option e Result saíram de Haskell e Elixir e chegaram a TypeScript, Rust e Java.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Funções puras e testes baseados em propriedades (`pure-functions-properties`) | Por que código puro é fácil de testar e o que as propriedades encontram | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/functional-programming/`).
- Documentação: planejada (`docs/pt/functional-programming/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS), Kyle Simpson. Gratuito. Livro gratuito e pragmático sobre funções puras, closures, composição e imutabilidade sem teoria pesada.
- [Elixir School](https://elixirschool.com/pt), Elixir School contributors. Em português. Gratuito. Lições gratuitas de Elixir em português (e em muitos outros idiomas): casamento de padrões, pipes, recursão, processos.
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/), Scott Wlaschin. Gratuito. A explicação mais conhecida de tratamento de erros com tipos Result, como uma figura de dois trilhos.

### Livros

- [Structure and Interpretation of Computer Programs, 2nd edition](https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/6515/sicp.zip/index.html), Harold Abelson and Gerald Jay Sussman. Gratuito. O clássico sobre abstração com funções, recursão, procedimentos de ordem superior e interpretadores.
- [Learn You a Haskell for Great Good!](https://learnyouahaskell.github.io/), Miran Lipovača, community edition. Gratuito. Introdução gratuita e amigável a tipos, currying, avaliação preguiçosa, functores e mônadas.
- [Grokking Simplicity](https://www.manning.com/books/grokking-simplicity), Eric Normand. Pago. Ensina o pensamento funcional em JavaScript separando ações, cálculos e dados.
- [Domain Modeling Made Functional](https://pragprog.com/titles/swdddf/domain-modeling-made-functional/), Scott Wlaschin. Pago. Mostra como tipos algébricos tornam estados inválidos impossíveis de representar em código de negócio.
- [How to Design Programs, 2nd edition](https://htdp.org/), Felleisen, Findler, Flatt and Krishnamurthi. Gratuito. Livro-texto gratuito que ensina projeto sistemático de programas com funções e definições de dados.

### Cursos e aulas

- [Programming Languages, Part A](https://www.coursera.org/learn/programming-languages), Dan Grossman, University of Washington (Coursera). Gratuito como ouvinte, certificado pago. Curso exigente de programação funcional em ML: recursão, casamento de padrões, closures e inferência de tipos.
- [Haskell MOOC](https://haskell.mooc.fi/), University of Helsinki. Gratuito. Curso online gratuito com exercícios corrigidos automaticamente, do básico às mônadas.

### Artigos e especificações

- [Why Functional Programming Matters](https://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf), John Hughes (1990). Gratuito. O artigo que defende funções de ordem superior e avaliação preguiçosa como ferramentas de modularidade.
- [QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs](https://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf), Koen Claessen and John Hughes (2000). Gratuito. A origem dos testes baseados em propriedades: declare uma propriedade e deixe a ferramenta procurar um contraexemplo.
- [Out of the Tar Pit](https://curtclifton.net/papers/MoseleyMarks06a.pdf), Ben Moseley and Peter Marks (2006). Gratuito. Ensaio influente sobre o estado como principal fonte de complexidade em software.
- [Monads for functional programming](https://homepages.inf.ed.ac.uk/wadler/papers/marktoberdorf/baastad.pdf), Philip Wadler (1995). Gratuito. O artigo-tutorial que mostra mônadas estruturando erros, estado e saída em uma linguagem pura.

### Documentação oficial

- [Elixir: Getting Started](https://hexdocs.pm/elixir/introduction.html), The Elixir Team. Gratuito. O guia oficial: imutabilidade, casamento de padrões, recursão, enumeráveis e streams.
- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), Microsoft. Gratuito. Uniões discriminadas e verificação de exaustividade, a forma do TypeScript para tipos algébricos.
- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures), Mozilla. Gratuito. Explicação cuidadosa de escopo léxico e closures com exemplos pequenos.

### Vídeos

- [Learning Functional Programming with JavaScript](https://www.youtube.com/watch?v=e-5obm1G_FY), Anjana Vakil, JSUnconf. Gratuito. Palestra de trinta minutos para iniciantes sobre funções puras, funções de ordem superior e imutabilidade.
- [Simple Made Easy](https://www.infoq.com/presentations/Simple-Made-Easy/), Rich Hickey. Gratuito. A palestra que separa simples de fácil e defende valores em vez de estado mutável.
- [Functional Design Patterns](https://www.youtube.com/watch?v=srQt1NAHYC0), Scott Wlaschin, NDC. Gratuito. Palestra que mapeia padrões orientados a objetos para funções, composição, functores e mônadas.

### Prática e ferramentas

- [fast-check](https://fast-check.dev/), Nicolas Dubien. Gratuito. A biblioteca de testes baseados em propriedades para TypeScript, com um guia para escrever boas propriedades.
- [StreamData](https://hexdocs.pm/stream_data/StreamData.html), Andrea Leopardi and the Elixir Team. Gratuito. Geração de dados e testes baseados em propriedades para Elixir.
- [Exercism: Elixir track](https://exercism.org/tracks/elixir), Exercism. Gratuito. Exercícios com mentoria que treinam recursão, casamento de padrões e pipelines.

### Comunidades

- [Elixir Forum](https://elixirforum.com/), Elixir community. Gratuito. Fórum acolhedor para dúvidas sobre projeto funcional em Elixir.
- [r/functionalprogramming](https://www.reddit.com/r/functionalprogramming/), Reddit. Gratuito. Discussão entre linguagens, com muitas indicações de leitura.
