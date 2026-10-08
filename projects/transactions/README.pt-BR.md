# Transações

> English version: [README.md](README.md)

Uma transação agrupa várias operações para que tenham sucesso ou falhem juntas e não corrompam umas às outras quando executam ao mesmo tempo. ACID, níveis de isolamento, travas, concorrência multiversão e o log de escrita antecipada são como os bancos cumprem essa promessa, e sagas, o padrão outbox e a idempotência são como as aplicações a cumprem entre serviços, onde uma única transação de banco já não está disponível.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| [Níveis de isolamento no PostgreSQL](isolation-levels/) | Qual anomalia cada nível de isolamento permite | disponível |
| [Venda além do estoque no checkout](overselling-checkout/) | Como compras concorrentes vendem além do estoque e três formas de impedir | disponível |
| [Prisma, Drizzle e SQL puro](orm-vs-sql/) | Quanto custa um ORM e que SQL ele gera | disponível |
| [Outbox e saga](outbox-saga/) | Como manter dois serviços consistentes sem uma transação distribuída | disponível |

## Quiz e documentação

- Perguntas do quiz: [quiz/content/transactions/](../../quiz/content/transactions/)
- Documentação: [docs/pt/transactions/](../../docs/pt/transactions/)
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL Global Development Group. Gratuito. A tabela oficial de quais anomalias cada nível impede, com exemplos do que realmente acontece.
- [Consistency Models](https://jepsen.io/consistency), Kyle Kingsbury, Jepsen. Gratuito. Mapa clicável de modelos de consistência e isolamento, cada um com uma definição curta e precisa.
- [Transactions: myths, surprises and opportunities](https://www.youtube.com/watch?v=5ZjhNTM8XU8), Martin Kleppmann, Strange Loop. Gratuito. Palestra que mostra o que ACID e os nomes dos níveis de isolamento realmente significam em bancos diferentes.

### Livros

- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Pago. Os capítulos sobre transações, problemas de sistemas distribuídos e consistência são o melhor resumo moderno.
- [Concurrency Control and Recovery in Database Systems](https://www.microsoft.com/en-us/research/people/philbe/book/), Bernstein, Hadzilacos and Goodman. Gratuito. O texto clássico sobre serializabilidade, bloqueio em duas fases, controle multiversão e recuperação, gratuito pelo autor.
- [An Introduction to Database Systems, 8th edition](https://en.wikipedia.org/wiki/Christopher_J._Date), C. J. Date (Addison-Wesley, 2004). Pago. O livro-texto que o quiz segue em transações, recuperação e concorrência; o link é o artigo de enciclopédia sobre o autor.

### Cursos e aulas

- [CMU 15-445/645 Database Systems](https://15445.courses.cs.cmu.edu/), Andy Pavlo, Carnegie Mellon University. Gratuito. Aulas sobre teoria de controle de concorrência, bloqueio em duas fases, MVCC, log e recuperação.
- [MIT 6.5840 Distributed Systems](https://pdos.csail.mit.edu/6.824/), MIT PDOS, Robert Morris and Frans Kaashoek. Gratuito. Aulas, artigos e laboratórios sobre replicação, commit em duas fases e consistência, com Raft feito à mão.

### Artigos e especificações

- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/publication/a-critique-of-ansi-sql-isolation-levels/), Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil (1995). Gratuito. O artigo que mostrou que os níveis do padrão são ambíguos e definiu snapshot isolation e write skew.
- [Sagas](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf), Hector Garcia-Molina and Kenneth Salem (1987). Gratuito. A origem da saga: uma transação longa dividida em passos, cada um com uma ação de compensação.
- [The Transaction Concept: Virtues and Limitations](https://jimgray.azurewebsites.net/papers/thetransactionconcept.pdf), Jim Gray (1981). Gratuito. O artigo que definiu o que é uma transação e como o log a torna atômica e durável.
- [Serializable Snapshot Isolation in PostgreSQL](https://drkp.net/papers/ssi-vldb12.pdf), Dan Ports and Kevin Grittner (2012). Gratuito. Como o nível SERIALIZABLE do PostgreSQL detecta padrões perigosos sem bloquear leitores.
- [The Raft Consensus Algorithm](https://raft.github.io/), Diego Ongaro and John Ousterhout. Gratuito. O artigo, uma visualização e implementações do algoritmo de consenso projetado para ser compreendido.
- [CAP Twelve Years Later: How the "Rules" Have Changed](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/), Eric Brewer (2012). Gratuito. O autor do teorema CAP explica o que ele diz e o que não diz.

### Documentação oficial

- [PostgreSQL: Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html), PostgreSQL Global Development Group. Gratuito. O capítulo sobre MVCC, travas explícitas, deadlocks e tratamento de falhas de serialização.
- [PostgreSQL: Write-Ahead Logging](https://www.postgresql.org/docs/current/wal-intro.html), PostgreSQL Global Development Group. Gratuito. Explicação curta de por que as mudanças vão para o log antes de as páginas de dados serem gravadas.
- [Prisma: Transactions and batch queries](https://www.prisma.io/docs/orm/fundamentals/transactions), Prisma. Gratuito. Como o ORM usado nos miniprojetos expõe transações, níveis de isolamento e controle otimista.
- [Pattern: Saga](https://microservices.io/patterns/data/saga.html), Chris Richardson, microservices.io. Gratuito. Descrição compacta de sagas por coreografia e por orquestração, ligada ao padrão transactional outbox.

### Prática e ferramentas

- [Hermitage: testing transaction isolation levels](https://github.com/ept/hermitage), Martin Kleppmann. Gratuito. Conjunto de testes que mostra quais anomalias cada nível de isolamento de bancos reais realmente permite.
- [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency), Brandur Leach, Stripe. Gratuito. Como chaves de idempotência tornam as retentativas seguras, por uma empresa que depende disso.

### Comunidades

- [Database Administrators Stack Exchange: transaction tag](https://dba.stackexchange.com/questions/tagged/transaction), Stack Exchange. Gratuito. Perguntas respondidas sobre isolamento, travas e deadlocks em sistemas reais.
- [r/PostgreSQL](https://www.reddit.com/r/PostgreSQL/), Reddit. Gratuito. Comunidade ativa para dúvidas sobre o comportamento do PostgreSQL.
