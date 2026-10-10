# Limitação de taxa

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

A limitação de taxa restringe quantas requisições um cliente pode fazer em um período, para proteger um serviço de sobrecarga, abuso e uso injusto. Os algoritmos (janela fixa, janela deslizante, token bucket, leaky bucket) diferem em como tratam rajadas e em quanto estado exigem, e executá-los em vários servidores levanta questões de atomicidade. A outra metade do assunto é o cliente: o status 429, os cabeçalhos de retentativa e o backoff.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Algoritmos de limitação de taxa (`rate-limiter`) | Como cada algoritmo trata rajadas | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/rate-limiting/`).
- Documentação: planejada (`docs/pt/rate-limiting/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Visualizing algorithms for rate limiting](https://smudge.ai/blog/ratelimit-algorithms), smudge.ai. Gratuito. Demonstrações interativas de janela fixa, janela deslizante e token bucket, lado a lado.
- [Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters), Paul Tarjan, Stripe. Gratuito. Os quatro tipos de limitador que uma API de pagamentos roda em produção, e por que cada um existe.
- [What is rate limiting?](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/), Cloudflare Learning Center. Gratuito. Definição curta e direta da ideia e do que ela protege.

### Livros

- [Site Reliability Engineering: Handling Overload](https://sre.google/sre-book/handling-overload/), Google. Gratuito. Limites por cliente, limitação no lado do cliente e degradação graciosa em um serviço grande.
- [Computer Networks, 6th edition](https://www.pearson.com/en-us/subject-catalog/p/computer-networks/P200000003188), Tanenbaum, Feamster and Wetherall. Pago. A fonte do quiz para a modelagem de tráfego com leaky bucket e token bucket.

### Artigos e especificações

- [RFC 6585: Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585), Fielding and Nottingham, IETF. Gratuito. A definição de 429 Too Many Requests e de seu uso com Retry-After.
- [Token bucket](https://en.wikipedia.org/wiki/Token_bucket), Wikipedia. Gratuito. O algoritmo, seus parâmetros, a fórmula do tamanho de rajada e a relação com o leaky bucket.
- [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/), Marc Brooker, AWS Architecture Blog. Gratuito. Simulações que mostram por que clientes que tentam de novo precisam de aleatoriedade, não só de esperas crescentes.
- [RateLimit header fields for HTTP](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/), IETF HTTPAPI Working Group. Gratuito. O rascunho de padrão para informar aos clientes sua cota e quando ela é renovada.
- [Rate Limiting, Cells, and GCRA](https://brandur.org/rate-limiting), Brandur Leach. Gratuito. Explica o generic cell rate algorithm, um leaky bucket que precisa de apenas um timestamp por chave.
- [How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/), Julien Desgats, Cloudflare. Gratuito. A aproximação por contador de janela deslizante e seu erro medido em escala.
- [Using load shedding to avoid overload](https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/), David Yanacek, Amazon Builders' Library. Gratuito. Por que um servidor deve rejeitar cedo o trabalho excedente em vez de ficar lento para todos.

### Documentação oficial

- [nginx: ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html), NGINX. Gratuito. A referência do limitador leaky bucket do NGINX: rate, burst, nodelay e delay.
- [Redis: INCR](https://redis.io/docs/latest/commands/incr/), Redis. Gratuito. A página do comando inclui os padrões clássicos de limitador de taxa e a corrida que precisam evitar.
- [Redis: Scripting with Lua](https://redis.io/docs/latest/develop/programmability/eval-intro/), Redis. Gratuito. Como tornar atômica no servidor a lógica de ler e depois escrever, a base dos limitadores distribuídos.
- [Rate limits for the GitHub REST API](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), GitHub. Gratuito. Uma API pública real explicando limites primários e secundários e seus cabeçalhos de resposta.
- [Go: golang.org/x/time/rate](https://pkg.go.dev/golang.org/x/time/rate), The Go Authors. Gratuito. Uma pequena implementação de token bucket que vale ler pela interface.

### Vídeos

- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Gratuito. Explicações curtas e animadas dos algoritmos de limitação de taxa do livro System Design Interview.

### Prática e ferramentas

- [Rate Limiting with NGINX](https://blog.nginx.org/blog/rate-limiting-nginx), NGINX Community Blog. Gratuito. Uma configuração comentada que mostra o efeito de burst e nodelay.

### Comunidades

- [Stack Overflow: rate-limiting tag](https://stackoverflow.com/questions/tagged/rate-limiting), Stack Overflow. Gratuito. Perguntas respondidas sobre implementação e configuração de limitadores.
