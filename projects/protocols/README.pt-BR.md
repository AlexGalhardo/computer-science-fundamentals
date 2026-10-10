# Protocolos

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Protocolos de aplicação são os acordos que permitem a programas escritos por pessoas diferentes conversarem entre si. Esta área acompanha o HTTP desde a semântica (métodos, códigos de status, cabeçalhos, cache, cookies), passando por seus três formatos de transmissão (HTTP/1.1, HTTP/2 e HTTP/3 sobre QUIC), pelo handshake TLS por baixo e pelos estilos de API construídos em cima: REST, GraphQL, JSON-RPC, gRPC, WebSocket e server-sent events.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| REST, GraphQL e JSON-RPC (`rest-graphql-jsonrpc`) | O que cada estilo de API custa e oferece no mesmo domínio | planejado |
| HTTP/1.1, HTTP/2 e HTTP/3 (`http-versions`) | O que a multiplexação e o QUIC mudam para uma página com muitos recursos | planejado |
| Servidor HTTP sobre TCP puro (`http-server-raw-tcp`) | O que há dentro de uma requisição e de uma resposta HTTP | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/protocols/`).
- Documentação: planejada (`docs/pt/protocols/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP), Mozilla. Gratuito. O melhor ponto de partida: visão geral, mensagens, métodos, códigos de status, cabeçalhos, cache, cookies e CORS.
- [MDN: HTTP (em português)](https://developer.mozilla.org/pt-BR/docs/Web/HTTP), Mozilla. Em português. Gratuito. A tradução para o português do Brasil dos guias e da referência de HTTP da MDN.
- [HTTP/3 explained](https://http3-explained.haxx.se/), Daniel Stenberg. Gratuito. Livro curto e gratuito do autor do curl sobre por que o QUIC existe e como o HTTP/3 funciona.
- [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/), Michael Driscoll. Gratuito. Cada byte de um handshake TLS 1.3 real, anotado e explicado.

### Livros

- [High Performance Browser Networking](https://hpbn.co/), Ilya Grigorik. Gratuito online, pago impresso. Gratuito online: TCP, TLS, HTTP/1.x, HTTP/2, WebSocket e server-sent events do ponto de vista de desempenho.
- [http2 explained](https://http2-explained.haxx.se/), Daniel Stenberg. Gratuito. Livro curto e gratuito sobre streams, multiplexação, compressão de cabeçalhos e o que o HTTP/2 corrigiu.
- [Everything curl](https://everything.curl.dev/), Daniel Stenberg. Gratuito. Livro gratuito sobre o curl que serve também como passeio prático por HTTP, TLS e proxies.

### Artigos e especificações

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110), Fielding, Nottingham and Reschke, IETF. Gratuito. A definição atual de métodos, códigos de status, cabeçalhos e negociação de conteúdo para todas as versões do HTTP.
- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113), Thomson and Benfield, IETF. Gratuito. Quadros, streams, controle de fluxo e compressão de cabeçalhos no HTTP/2.
- [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114), Mike Bishop, IETF. Gratuito. Como a semântica do HTTP é mapeada sobre streams QUIC.
- [RFC 9000: QUIC](https://www.rfc-editor.org/rfc/rfc9000), Iyengar and Thomson, IETF. Gratuito. O protocolo de transporte sob o HTTP/3: conexões, streams, recuperação de perdas e migração sobre UDP.
- [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112), Fielding, Nottingham and Reschke, IETF. Gratuito. O formato textual de mensagem a seguir ao escrever um servidor HTTP à mão.
- [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446), Eric Rescorla, IETF. Gratuito. A especificação do handshake, do agendamento de chaves e do protocolo de registros.
- [RFC 6455: The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455), Fette and Melnikov, IETF. Gratuito. O handshake de upgrade e o formato de quadros do WebSocket.
- [Architectural Styles and the Design of Network-based Software Architectures](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm), Roy Fielding (2000). Gratuito. A tese que definiu o REST e suas restrições.
- [GraphQL Specification](https://spec.graphql.org/), GraphQL Foundation. Gratuito. A definição oficial do sistema de tipos, das consultas, da validação e da execução.
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification), JSON-RPC Working Group. Gratuito. Especificação de duas páginas de requisições, respostas, notificações, lotes e códigos de erro.

### Documentação oficial

- [Learn GraphQL](https://graphql.org/learn/), GraphQL Foundation. Gratuito. A introdução oficial a esquemas, consultas, mutações e boas práticas.
- [gRPC: Core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/), gRPC Authors. Gratuito. Definições de serviço, os quatro tipos de chamada, prazos e metadados.
- [MDN: Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), Mozilla. Gratuito. Como funciona o formato de fluxo de eventos e quando ele é mais simples que o WebSocket.
- [Caddy documentation](https://caddyserver.com/docs/), Caddy project. Gratuito. O servidor usado nos miniprojetos, com HTTPS automático e HTTP/3 ativado por padrão.

### Vídeos

- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Gratuito. Vídeos detalhados comparando versões do HTTP, TLS, WebSocket, gRPC e seus prós e contras.

### Prática e ferramentas

- [Richardson Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html), Martin Fowler. Gratuito. Explica os passos de chamadas remotas sobre HTTP até recursos, verbos e hipermídia.

### Comunidades

- [Stack Overflow: http tag](https://stackoverflow.com/questions/tagged/http), Stack Overflow. Gratuito. Respostas canônicas sobre códigos de status, cabeçalhos, cache e CORS.
- [HTTP Working Group](https://github.com/httpwg), IETF. Gratuito. Onde as especificações do HTTP são escritas e discutidas abertamente.
