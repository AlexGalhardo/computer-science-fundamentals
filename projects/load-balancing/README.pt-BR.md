# Balanceamento de carga

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Um balanceador de carga distribui requisições entre vários servidores para que um serviço aguente mais tráfego do que uma máquina e sobreviva à perda de uma delas. O tema cobre onde o balanceamento acontece (camada de transporte ou de aplicação), como um servidor é escolhido (round robin, menos conexões, hashing), como servidores mortos são detectados e evitados, e os papéis relacionados de proxy reverso, terminação TLS e gateway de API.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| NGINX contra Caddy (`nginx-vs-caddy`) | Como os algoritmos de balanceamento distribuem requisições e sobrevivem a um nó morto | planejado |
| Balanceador de carga L7 escrito à mão (`l7-load-balancer`) | O que um balanceador de carga faz a cada requisição | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/load-balancing/`).
- Documentação: planejada (`docs/pt/load-balancing/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [Load Balancing](https://samwho.dev/load-balancing/), Sam Rose. Gratuito. Ensaio visual interativo que mostra round robin, menos conexões e seu efeito na latência.
- [What is load balancing?](https://www.cloudflare.com/learning/performance/what-is-load-balancing/), Cloudflare Learning Center. Gratuito. Definição curta e direta com os algoritmos comuns e a ideia de health checks.
- [Using nginx as HTTP load balancer](https://nginx.org/en/docs/http/load_balancing.html), NGINX. Gratuito. A introdução oficial: um bloco upstream, os métodos de balanceamento, pesos e health checks passivos.

### Livros

- [Site Reliability Engineering: Load Balancing at the Frontend](https://sre.google/sre-book/load-balancing-frontend/), Google. Gratuito. Como o tráfego chega a um datacenter: DNS, IPs virtuais e hashing consistente no nível de rede.
- [Site Reliability Engineering: Load Balancing in the Datacenter](https://sre.google/sre-book/load-balancing-datacenter/), Google. Gratuito. Por que políticas simples falham em escala, com subconjuntos e round robin ponderado.
- [Designing Data-Intensive Applications](https://dataintensive.net/), Martin Kleppmann. Pago. Os capítulos sobre replicação e particionamento explicam o roteamento de requisições e o rebalanceamento.

### Artigos e especificações

- [Consistent Hashing and Random Trees](https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf), Karger and others (1997). Gratuito. O artigo que apresentou o hashing consistente, para que acrescentar um servidor mova poucas chaves.
- [Maglev: A Fast and Reliable Software Network Load Balancer](https://research.google/pubs/maglev-a-fast-and-reliable-software-network-load-balancer/), Eisenbud and others, Google (2016). Gratuito. Como um balanceador de camada 4 é construído com servidores comuns, com seu próprio hashing consistente.
- [The Tail at Scale](https://research.google/pubs/the-tail-at-scale/), Jeffrey Dean and Luiz André Barroso (2013). Gratuito. Por que as requisições mais lentas dominam sistemas grandes e como requisições redundantes e balanceamento as reduzem.
- [The Power of Two Random Choices: A Survey of Techniques and Results](https://www.eecs.harvard.edu/~michaelm/postscripts/handbook2001.pdf), Mitzenmacher, Richa and Sitaraman (2001). Gratuito. A matemática por trás de escolher o menos carregado entre dois servidores aleatórios.
- [Implementing health checks](https://aws.amazon.com/builders-library/implementing-health-checks/), David Yanacek, Amazon Builders' Library. Gratuito. Os tipos de health check, o que cada um detecta e como podem causar indisponibilidade.

### Documentação oficial

- [nginx: ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html), NGINX. Gratuito. A referência de cada diretiva: least_conn, ip_hash, hash, max_fails, fail_timeout, keepalive.
- [Caddy: reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy), Caddy project. Gratuito. Políticas de balanceamento, health checks ativos e passivos e retentativas no Caddyfile.
- [HAProxy documentation](https://docs.haproxy.org/), HAProxy. Gratuito. O manual do balanceador de código aberto clássico, para comparar opções e vocabulário.
- [Envoy: Load balancing](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/overview), Envoy Project Authors. Gratuito. Descrição clara de tipos de balanceador, detecção de anomalias, reconhecimento de zonas e limiares de pânico.
- [Go: httputil.ReverseProxy](https://pkg.go.dev/net/http/httputil#ReverseProxy), The Go Authors. Gratuito. O bloco da biblioteca padrão para escrever um proxy de camada 7 em Go.

### Vídeos

- [Hussein Nasser](https://www.youtube.com/@hnasr), Hussein Nasser. Gratuito. Vídeos sobre balanceamento de camada 4 e de camada 7, proxies, NGINX e HAProxy.
- [ByteByteGo](https://www.youtube.com/@ByteByteGo), Alex Xu and Sahn Lam. Gratuito. Vídeos curtos e animados sobre algoritmos de balanceamento, proxies reversos e gateways de API.

### Prática e ferramentas

- [Grafana k6 documentation](https://grafana.com/docs/k6/latest/), Grafana Labs. Gratuito. A ferramenta de teste de carga usada para exercitar os balanceadores nos miniprojetos, apenas em alvos locais.

### Comunidades

- [Server Fault: load-balancing tag](https://serverfault.com/questions/tagged/load-balancing), Stack Exchange. Gratuito. Dúvidas operacionais respondidas por administradores de sistemas.
- [Caddy Community](https://caddy.community/), Caddy project. Gratuito. O fórum oficial, onde os mantenedores respondem dúvidas de configuração.
