# Cache

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Um cache guarda uma cópia de algo caro de calcular ou de buscar, para que a próxima requisição seja atendida mais rápido. Há caches em todos os níveis (navegador, CDN, aplicação, banco de dados, CPU), e todos levantam as mesmas perguntas: o que guardar, quando descartar, como saber que está desatualizado e o que acontece quando muitos clientes erram ao mesmo tempo. Errar nessas respostas troca um sistema lento por um incorreto.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Estratégias de cache e stampede (`cache-strategies`) | Como os padrões de cache se comportam e como falham | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/cache/`).
- Documentação: planejada (`docs/pt/cache/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [MDN: HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), Mozilla. Gratuito. O guia mais claro sobre caches privados e compartilhados, validade, validação e as diretivas de Cache-Control.
- [Caching Best Practices](https://aws.amazon.com/caching/best-practices/), Amazon Web Services. Gratuito. Visão geral curta de carga preguiçosa, write-through, tempo de vida e descarte.
- [Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), Microsoft Azure Architecture Center. Gratuito. O padrão de aplicação mais comum descrito com seus problemas de consistência e quando usá-lo.
- [Caching Tutorial for Web Authors and Webmasters](https://mnot.net/cache_docs/), Mark Nottingham. Gratuito. Tutorial clássico e direto sobre como caches de navegador e de proxy decidem o que guardar e servir.

### Livros

- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Pago. Trata caches como dados derivados e explica os problemas de consistência de manter duas cópias.
- [Computer Systems: A Programmer's Perspective, 3rd edition](https://csapp.cs.cmu.edu/), Randal E. Bryant and David R. O'Hallaron. Pago. O capítulo sobre a hierarquia de memória explica a localidade e como funcionam os caches de CPU.

### Artigos e especificações

- [RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111), Fielding, Nottingham and Reschke, IETF. Gratuito. A especificação de validade, validação, invalidação e de cada diretiva de cache.
- [Scaling Memcache at Facebook](https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala), Nishtala and others (2013). Gratuito. Como uma camada de cache muito grande lida com gravações obsoletas, manadas e consistência entre regiões.
- [Optimal Probabilistic Cache Stampede Prevention](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf), Vattani, Chierichetti and Lowenstein (2015). Gratuito. O artigo por trás da expiração antecipada probabilística, uma correção simples para o stampede.
- [RFC 5861: HTTP Cache-Control Extensions for Stale Content](https://www.rfc-editor.org/rfc/rfc5861), Mark Nottingham, IETF. Gratuito. A definição de stale-while-revalidate e stale-if-error.
- [TinyLFU: A Highly Efficient Cache Admission Policy](https://arxiv.org/abs/1512.00727), Einziger, Friedman and Manes (2015). Gratuito. Um projeto moderno de descarte que combina frequência e recência, usado na biblioteca Caffeine.
- [Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/), Matt Brinkley and Jas Chhabra, Amazon Builders' Library. Gratuito. Conselhos conquistados a duras penas sobre quando um cache compensa e como ele vira fonte de indisponibilidade.

### Documentação oficial

- [Redis documentation](https://redis.io/docs/latest/), Redis. Gratuito. A referência oficial de tipos de dados, comandos, expiração e cache no cliente.
- [Redis: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/), Redis. Gratuito. Como funcionam as políticas de maxmemory e como o Redis aproxima LRU e LFU.
- [Redis persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/), Redis. Gratuito. Os prós e contras entre snapshots (RDB) e o arquivo somente de acréscimo (AOF).
- [NGINX Content Caching](https://docs.nginx.com/nginx/admin-guide/content-cache/content-caching/), F5 NGINX. Gratuito. Como se configura o cache de um proxy reverso, incluindo o bloqueio de cache contra stampedes.
- [Cloudflare Cache documentation](https://developers.cloudflare.com/cache/), Cloudflare. Gratuito. Como uma CDN decide o que guardar em cache, por quanto tempo e como funciona a purga.

### Vídeos

- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Gratuito. Vídeos curtos e animados sobre estratégias de cache, descarte e os modos clássicos de falha de cache.

### Prática e ferramentas

- [Caffeine: Efficiency](https://github.com/ben-manes/caffeine/wiki/Efficiency), Ben Manes. Gratuito. Comparações de taxa de acerto de políticas de descarte em traces reais.
- [REDbot](https://redbot.org/), Mark Nottingham. Gratuito. Verifica os cabeçalhos de cache de uma URL sua e explica o que os caches farão com eles.

### Comunidades

- [Stack Overflow: caching tag](https://stackoverflow.com/questions/tagged/caching), Stack Overflow. Gratuito. Perguntas respondidas sobre invalidação, cabeçalhos e projeto de cache.
- [r/redis](https://www.reddit.com/r/redis/), Reddit. Gratuito. Dúvidas da comunidade sobre uso e operação do Redis.
