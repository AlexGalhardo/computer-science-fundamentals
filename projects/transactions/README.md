# Transactions

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A transaction groups several operations so that they succeed or fail together and do not corrupt each other when they run at the same time. ACID, isolation levels, locking, multiversion concurrency and the write-ahead log are how databases keep that promise, and sagas, the outbox pattern and idempotency are how applications keep it across services, where one database transaction is no longer available.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| [Isolation levels in PostgreSQL](isolation-levels/) | Which anomaly each isolation level allows | available |
| [Overselling at checkout](overselling-checkout/) | How concurrent purchases oversell stock and three ways to stop it | available |
| [Prisma, Drizzle and raw SQL](orm-vs-sql/) | What an ORM costs and what SQL it generates | available |
| [Outbox and saga](outbox-saga/) | How to keep two services consistent without a distributed transaction | available |

## Quiz and documentation

- Quiz questions: [quiz/content/transactions/](../../quiz/content/transactions/)
- Documentation: [docs/en/transactions/](../../docs/en/transactions/)
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL Global Development Group. Free. The official table of which anomalies each level prevents, with examples of what really happens.
- [Consistency Models](https://jepsen.io/consistency), Kyle Kingsbury, Jepsen. Free. A clickable map of consistency and isolation models, each with a short precise definition.
- [Transactions: myths, surprises and opportunities](https://www.youtube.com/watch?v=5ZjhNTM8XU8), Martin Kleppmann, Strange Loop. Free. A talk showing what ACID and the isolation level names really mean in different databases.

### Books

- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Paid. The chapters on transactions, distributed systems trouble and consistency are the best modern summary.
- [Concurrency Control and Recovery in Database Systems](https://www.microsoft.com/en-us/research/people/philbe/book/), Bernstein, Hadzilacos and Goodman. Free. The classic text on serialisability, two-phase locking, multiversion control and recovery, free from the author.
- [An Introduction to Database Systems, 8th edition](https://en.wikipedia.org/wiki/Christopher_J._Date), C. J. Date (Addison-Wesley, 2004). Paid. The textbook the quiz follows for transactions, recovery and concurrency; the link is the encyclopedia article on the author.

### Courses and lectures

- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Free. Lectures on concurrency control theory, two-phase locking, MVCC, logging and recovery.
- [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/), MIT PDOS, Robert Morris and Frans Kaashoek. Free. Lectures, papers and labs on replication, two-phase commit and consistency, with Raft built by hand.

### Papers and specifications

- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/publication/a-critique-of-ansi-sql-isolation-levels/), Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil (1995). Free. The paper that showed the standard levels are ambiguous and defined snapshot isolation and write skew.
- [Sagas](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf), Hector Garcia-Molina and Kenneth Salem (1987). Free. The origin of the saga: a long transaction split into steps, each with a compensating action.
- [The Transaction Concept: Virtues and Limitations](https://jimgray.azurewebsites.net/papers/thetransactionconcept.pdf), Jim Gray (1981). Free. The paper that stated what a transaction is and how logging makes it atomic and durable.
- [Serializable Snapshot Isolation in PostgreSQL](https://drkp.net/papers/ssi-vldb12.pdf), Dan Ports and Kevin Grittner (2012). Free. How the SERIALIZABLE level of PostgreSQL detects dangerous patterns without blocking readers.
- [The Raft Consensus Algorithm](https://raft.github.io/), Diego Ongaro and John Ousterhout. Free. The paper, a visualisation and implementations of the consensus algorithm designed to be understood.
- [CAP Twelve Years Later: How the "Rules" Have Changed](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/), Eric Brewer (2012). Free. The author of the CAP theorem explains what it does and does not say.

### Official documentation

- [PostgreSQL: Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html), PostgreSQL Global Development Group. Free. The chapter on MVCC, explicit locking, deadlocks and serialisation failure handling.
- [PostgreSQL: Write-Ahead Logging](https://www.postgresql.org/docs/current/wal-intro.html), PostgreSQL Global Development Group. Free. A short explanation of why changes are logged before data pages are written.
- [Prisma: Transactions and batch queries](https://www.prisma.io/docs/orm/fundamentals/transactions), Prisma. Free. How the ORM used in the mini-projects exposes transactions, isolation levels and optimistic control.
- [Pattern: Saga](https://microservices.io/patterns/data/saga.html), Chris Richardson, microservices.io. Free. A compact description of choreography and orchestration sagas, linked to the transactional outbox pattern.

### Practice and tools

- [Hermitage: testing transaction isolation levels](https://github.com/ept/hermitage), Martin Kleppmann. Free. A test suite that shows which anomalies each isolation level of real databases actually allows.
- [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency), Brandur Leach, Stripe. Free. How idempotency keys make retries safe, from a company that depends on it.

### Communities

- [Database Administrators Stack Exchange: transaction tag](https://dba.stackexchange.com/questions/tagged/transaction), Stack Exchange. Free. Answered questions on isolation, locking and deadlocks in real systems.
- [r/PostgreSQL](https://www.reddit.com/r/PostgreSQL/), Reddit. Free. An active community for questions on PostgreSQL behaviour.
