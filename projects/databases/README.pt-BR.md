# Bancos de dados (teoria)

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

A teoria de bancos de dados explica como os dados são modelados como relações, consultados com uma linguagem declarativa e armazenados de modo que as consultas continuem rápidas e os dados continuem corretos. O modelo relacional, a álgebra relacional, a normalização, os índices e a otimização de consultas são as ideias por trás de todo banco SQL, e são o que permite projetar um esquema e ler um plano de consulta em vez de adivinhar.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Mini SGBD relacional](mini-dbms/) | Como funcionam a seleção, a projeção e três algoritmos de junção | disponível |
| [Ferramenta de normalização](normalisation-tool/) | Como as dependências funcionais determinam as formas normais | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/databases/](../../quiz/content/databases/)
- Documentação: [docs/pt/databases/](../../docs/pt/databases/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [SQLBolt](https://sqlbolt.com/), SQLBolt. Gratuito. Lições interativas curtas que ensinam SQL executando consultas no navegador.
- [Use The Index, Luke](https://use-the-index-luke.com/), Markus Winand. Gratuito. Livro online gratuito sobre como funcionam os índices em árvore B e como escrever consultas que os usam.
- [Let's Build a Simple Database](https://cstack.github.io/db_tutorial/), Connor Stack. Gratuito. Tutorial que escreve um pequeno clone do SQLite em C, do REPL à árvore B em disco.

### Livros

- [Database System Concepts, 7th edition](https://db-book.com/), Silberschatz, Korth and Sudarshan. Pago. Livro-texto completo; o site oferece gratuitamente slides e exercícios de prática de cada capítulo.
- [Database Internals](https://www.databass.dev/), Alex Petrov. Pago. Como os motores de armazenamento são construídos: árvores B, armazenamento em log, gerência de buffer e recuperação.
- [Readings in Database Systems, 5th edition (the Red Book)](http://www.redbook.io/), Peter Bailis, Joseph Hellerstein and Michael Stonebraker. Gratuito. Seleção comentada dos artigos que moldaram a área, com uma introdução para cada grupo.
- [An Introduction to Database Systems, 8th edition](https://en.wikipedia.org/wiki/Christopher_J._Date), C. J. Date (Addison-Wesley, 2004). Pago. O livro-texto que o quiz segue, hoje fora do catálogo da editora; o link é o artigo de enciclopédia sobre o autor e seus livros.

### Cursos e aulas

- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. Slides, notas, vídeos e projetos sobre armazenamento, índices, execução de consultas, otimização e concorrência.
- [CS 186 Introduction to Database Systems](https://cs186berkeley.net/), UC Berkeley. Gratuito. Notas de curso e exercícios sobre álgebra relacional, junções, otimização de consultas e normalização.
- [Curso de Banco de Dados MySQL](https://www.cursoemvideo.com/curso/mysql/), Gustavo Guanabara, Curso em Vídeo. Em português. Gratuito. Curso em vídeo para iniciantes em português sobre tabelas, chaves, relacionamentos e consultas SQL.

### Artigos e especificações

- [A Relational Model of Data for Large Shared Data Banks](https://www.engineering.upenn.edu/~zives/03f/cis550/codd.pdf), Edgar F. Codd (1970). Gratuito. O artigo que propôs relações, chaves e formas normais e deu início aos bancos relacionais.
- [Architecture of a Database System](https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf), Hellerstein, Stonebraker and Hamilton (2007). Gratuito. Um longo panorama de como um SGBD relacional real é organizado, do analisador ao gerenciador de armazenamento.
- [Access Path Selection in a Relational Database Management System](https://courses.cs.duke.edu/compsci516/cps216/spring03/papers/selinger-etal-1979.pdf), Selinger and others, IBM (1979). Gratuito. O artigo do System R que definiu a otimização de consultas baseada em custo e a ordenação de junções.

### Documentação oficial

- [PostgreSQL documentation](https://www.postgresql.org/docs/current/), PostgreSQL Global Development Group. Gratuito. O manual mais claro de um sistema real: SQL, índices, o planejador e o EXPLAIN.
- [SQLite: Query Planning](https://www.sqlite.org/queryplanner.html), SQLite. Gratuito. Explicação curta e ilustrada de como os índices aceleram buscas, ordenação e junções.

### Vídeos

- [CMU Database Group](https://www.youtube.com/@CMUDatabaseGroup), Carnegie Mellon University. Gratuito. As aulas gravadas de 15-445 e 15-721, além de palestras de engenheiros de bancos de dados.

### Prática e ferramentas

- [RelaX: relational algebra calculator](https://dbis-uibk.github.io/relax/), University of Innsbruck. Gratuito. Executa expressões de álgebra relacional sobre dados de exemplo e mostra a árvore de operadores.
- [PostgreSQL Exercises](https://pgexercises.com/), Alisdair Owens. Gratuito. Exercícios de SQL com correção sobre um esquema pequeno, de consultas simples a funções de janela.

### Comunidades

- [Database Administrators Stack Exchange](https://dba.stackexchange.com/), Stack Exchange. Gratuito. Perguntas e respostas sobre projeto de esquema, normalização, índices e planos de consulta.
- [r/Database](https://www.reddit.com/r/Database/), Reddit. Gratuito. Discussão geral sobre projeto e sistemas de bancos de dados.
