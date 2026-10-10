# Transacciones

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Una transacción agrupa varias operaciones para que tengan éxito o fallen juntas y no se corrompan entre sí cuando se ejecutan al mismo tiempo. ACID, los niveles de aislamiento, los bloqueos, el control de concurrencia multiversión y el registro de escritura anticipada (write-ahead log) son la forma en que las bases de datos cumplen esa promesa, y las sagas, el patrón outbox y la idempotencia son la forma en que las aplicaciones la cumplen entre servicios, donde ya no hay una única transacción de base de datos disponible.

## Mini-proyectos

| Mini-proyecto | Qué enseña | Estado |
| --- | --- | --- |
| [Niveles de aislamiento en PostgreSQL](isolation-levels/) | Qué anomalía permite cada nivel de aislamiento | disponible |
| [Sobreventa en el checkout](overselling-checkout/) | Cómo las compras concurrentes venden más que el stock y tres formas de evitarlo | disponible |
| [Prisma, Drizzle y SQL puro](orm-vs-sql/) | Cuánto cuesta un ORM y qué SQL genera | disponible |
| [Outbox y saga](outbox-saga/) | Cómo mantener consistentes dos servicios sin una transacción distribuida | disponible |

## Quiz y documentación

- Preguntas del quiz: [quiz/content/transactions/](../../quiz/content/transactions/)
- Documentación: [docs/es/transactions/](../../docs/es/transactions/)
- Referencias de todas las áreas: [REFERENCES.es.md](../../REFERENCES.es.md)

## Referencias

Fuentes seleccionadas, no una lista exhaustiva. Todos los enlaces se verificaron cuando se escribió la lista.

### Empieza aquí

- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL Global Development Group. Gratis. La tabla oficial de qué anomalías evita cada nivel, con ejemplos de lo que realmente ocurre.
- [Consistency Models](https://jepsen.io/consistency), Kyle Kingsbury, Jepsen. Gratis. Un mapa clicable de modelos de consistencia y aislamiento, cada uno con una definición corta y precisa.
- [Transactions: myths, surprises and opportunities](https://www.youtube.com/watch?v=5ZjhNTM8XU8), Martin Kleppmann, Strange Loop. Gratis. Una charla que muestra lo que realmente significan ACID y los nombres de los niveles de aislamiento en distintas bases de datos.

### Libros

- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. De pago. Los capítulos sobre transacciones, problemas de los sistemas distribuidos y consistencia son el mejor resumen moderno.
- [Concurrency Control and Recovery in Database Systems](https://www.microsoft.com/en-us/research/people/philbe/book/), Bernstein, Hadzilacos and Goodman. Gratis. El texto clásico sobre serializabilidad, bloqueo en dos fases, control multiversión y recuperación, gratuito por parte del autor.
- [An Introduction to Database Systems, 8th edition](https://en.wikipedia.org/wiki/Christopher_J._Date), C. J. Date (Addison-Wesley, 2004). De pago. El libro de texto que sigue el quiz para transacciones, recuperación y concurrencia; el enlace es el artículo de la enciclopedia sobre el autor.

### Cursos y clases

- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratis. Clases sobre teoría del control de concurrencia, bloqueo en dos fases, MVCC, registro (logging) y recuperación.
- [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/), MIT PDOS, Robert Morris and Frans Kaashoek. Gratis. Clases, artículos y laboratorios sobre replicación, commit en dos fases y consistencia, con Raft construido a mano.

### Artículos y especificaciones

- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/publication/a-critique-of-ansi-sql-isolation-levels/), Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil (1995). Gratis. El artículo que mostró que los niveles del estándar son ambiguos y definió el snapshot isolation y el write skew.
- [Sagas](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf), Hector Garcia-Molina and Kenneth Salem (1987). Gratis. El origen de la saga: una transacción larga dividida en pasos, cada uno con una acción compensatoria.
- [The Transaction Concept: Virtues and Limitations](https://jimgray.azurewebsites.net/papers/thetransactionconcept.pdf), Jim Gray (1981). Gratis. El artículo que estableció qué es una transacción y cómo el registro la hace atómica y durable.
- [Serializable Snapshot Isolation in PostgreSQL](https://drkp.net/papers/ssi-vldb12.pdf), Dan Ports and Kevin Grittner (2012). Gratis. Cómo el nivel SERIALIZABLE de PostgreSQL detecta patrones peligrosos sin bloquear a los lectores.
- [The Raft Consensus Algorithm](https://raft.github.io/), Diego Ongaro and John Ousterhout. Gratis. El artículo, una visualización e implementaciones del algoritmo de consenso diseñado para ser comprendido.
- [CAP Twelve Years Later: How the "Rules" Have Changed](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/), Eric Brewer (2012). Gratis. El autor del teorema CAP explica lo que dice y lo que no dice.

### Documentación oficial

- [PostgreSQL: Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html), PostgreSQL Global Development Group. Gratis. El capítulo sobre MVCC, bloqueos explícitos, deadlocks y manejo de fallos de serialización.
- [PostgreSQL: Write-Ahead Logging](https://www.postgresql.org/docs/current/wal-intro.html), PostgreSQL Global Development Group. Gratis. Una explicación breve de por qué los cambios se registran antes de escribir las páginas de datos.
- [Prisma: Transactions and batch queries](https://www.prisma.io/docs/orm/fundamentals/transactions), Prisma. Gratis. Cómo el ORM usado en los mini-proyectos expone transacciones, niveles de aislamiento y control optimista.
- [Pattern: Saga](https://microservices.io/patterns/data/saga.html), Chris Richardson, microservices.io. Gratis. Una descripción compacta de las sagas por coreografía y por orquestación, vinculada al patrón transactional outbox.

### Práctica y herramientas

- [Hermitage: testing transaction isolation levels](https://github.com/ept/hermitage), Martin Kleppmann. Gratis. Un conjunto de pruebas que muestra qué anomalías permite realmente cada nivel de aislamiento de bases de datos reales.
- [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency), Brandur Leach, Stripe. Gratis. Cómo las claves de idempotencia hacen seguros los reintentos, según una empresa que depende de ello.

### Comunidades

- [Database Administrators Stack Exchange: transaction tag](https://dba.stackexchange.com/questions/tagged/transaction), Stack Exchange. Gratis. Preguntas respondidas sobre aislamiento, bloqueos y deadlocks en sistemas reales.
- [r/PostgreSQL](https://www.reddit.com/r/PostgreSQL/), Reddit. Gratis. Una comunidad activa para preguntas sobre el comportamiento de PostgreSQL.
