# Databases (theory)

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

Database theory explains how data is modelled as relations, queried with a declarative language and stored so that queries stay fast and data stays correct. The relational model, relational algebra, normalisation, indexes and query optimisation are the ideas behind every SQL database, and they are what lets a developer design a schema and read a query plan instead of guessing.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Mini relational DBMS](mini-dbms/) | How selection, projection and three join algorithms work | available |
| [Normalisation tool](normalisation-tool/) | How functional dependencies drive normal forms | available |

## Quiz and documentation

- Quiz questions: [quiz/content/databases/](../../quiz/content/databases/)
- Documentation: [docs/en/databases/](../../docs/en/databases/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [SQLBolt](https://sqlbolt.com/), SQLBolt. Free. Short interactive lessons that teach SQL by running queries in the browser.
- [Use The Index, Luke](https://use-the-index-luke.com/), Markus Winand. Free. A free online book on how B-tree indexes work and how to write queries that use them.
- [Let's Build a Simple Database](https://cstack.github.io/db_tutorial/), Connor Stack. Free. A tutorial that writes a small SQLite clone in C, from the REPL to the B-tree on disk.

### Books

- [Database System Concepts, 7th edition](https://db-book.com/), Silberschatz, Korth and Sudarshan. Paid. A complete textbook; the site offers free slides and practice exercises for every chapter.
- [Database Internals](https://www.databass.dev/), Alex Petrov. Paid. How storage engines are built: B-trees, log-structured storage, buffer management and recovery.
- [Readings in Database Systems, 5th edition (the Red Book)](http://www.redbook.io/), Peter Bailis, Joseph Hellerstein and Michael Stonebraker. Free. A commented selection of the papers that shaped the field, with an introduction to each group.
- [An Introduction to Database Systems, 8th edition](https://en.wikipedia.org/wiki/Christopher_J._Date), C. J. Date (Addison-Wesley, 2004). Paid. The textbook the quiz follows, now out of the publisher's catalogue; the link is the encyclopedia article on the author and his books.

### Courses and lectures

- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Free. Slides, notes, videos and projects on storage, indexes, query execution, optimisation and concurrency.
- [CS 186 Introduction to Database Systems](https://cs186berkeley.net/), UC Berkeley. Free. Course notes and exercises on relational algebra, joins, query optimisation and normalisation.
- [Curso de Banco de Dados MySQL](https://www.cursoemvideo.com/curso/mysql/), Gustavo Guanabara, Curso em Vídeo. In Portuguese. Free. A beginner video course in Portuguese covering tables, keys, relationships and SQL queries.

### Papers and specifications

- [A Relational Model of Data for Large Shared Data Banks](https://www.engineering.upenn.edu/~zives/03f/cis550/codd.pdf), Edgar F. Codd (1970). Free. The paper that proposed relations, keys and normal forms and started relational databases.
- [Architecture of a Database System](https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf), Hellerstein, Stonebraker and Hamilton (2007). Free. A long survey of how a real relational DBMS is organised, from the parser to the storage manager.
- [Access Path Selection in a Relational Database Management System](https://courses.cs.duke.edu/compsci516/cps216/spring03/papers/selinger-etal-1979.pdf), Selinger and others, IBM (1979). Free. The System R paper that defined cost-based query optimisation and join ordering.

### Official documentation

- [PostgreSQL documentation](https://www.postgresql.org/docs/current/), PostgreSQL Global Development Group. Free. The clearest manual of a real system: SQL, indexes, the planner and EXPLAIN.
- [SQLite: Query Planning](https://www.sqlite.org/queryplanner.html), SQLite. Free. A short illustrated explanation of how indexes speed up lookups, sorting and joins.

### Videos

- [CMU Database Group](https://www.youtube.com/@CMUDatabaseGroup), Carnegie Mellon University. Free. The recorded lectures of 15-445 and 15-721, plus talks by database engineers.

### Practice and tools

- [RelaX: relational algebra calculator](https://dbis-uibk.github.io/relax/), University of Innsbruck. Free. Runs relational algebra expressions on sample data and shows the operator tree.
- [PostgreSQL Exercises](https://pgexercises.com/), Alisdair Owens. Free. Graded SQL exercises on one small schema, from simple selects to window functions.

### Communities

- [Database Administrators Stack Exchange](https://dba.stackexchange.com/), Stack Exchange. Free. Questions and answers on schema design, normalisation, indexes and query plans.
- [r/Database](https://www.reddit.com/r/Database/), Reddit. Free. General discussion on database design and systems.
