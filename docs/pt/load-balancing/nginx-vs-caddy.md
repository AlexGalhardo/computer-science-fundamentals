# NGINX contra Caddy

> English version: [docs/en/load-balancing/nginx-vs-caddy.md](../../en/load-balancing/nginx-vs-caddy.md)

Mini-projeto: [projects/load-balancing/nginx-vs-caddy](../../../projects/load-balancing/nginx-vs-caddy/README.pt-BR.md) (MP-LB-1). Linguagens: arquivos de configuração e TypeScript.

## O problema

Um servidor tem um teto. Para passar dele você roda várias cópias da aplicação e coloca na frente algo que decide, a cada requisição, qual cópia responde. Esse algo é um balanceador de carga, e duas decisões o definem:

- **Quem recebe a próxima requisição?** O algoritmo de balanceamento.
- **E se o escolhido estiver morto?** Verificações de saúde e novas tentativas.

NGINX e Caddy respondem a essas perguntas, com palavras diferentes e, mais importante, com padrões diferentes. O mini-projeto coloca as mesmas três instâncias atrás dos dois e mede.

## Os algoritmos

| Algoritmo | O que ele olha | Promessa | Ponto fraco |
| --- | --- | --- | --- |
| Round robin | Um contador | Fatias iguais | Cego para a carga: uma instância lenta continua recebendo a fatia inteira |
| Round robin ponderado | Um contador e um peso | Fatias proporcionais aos pesos | Os pesos são um palpite feito antes |
| Least connections | Requisições em andamento | A instância mais ocupada recebe menos | Precisa que os contadores sejam compartilhados por todos os workers do balanceador |
| IP hash | O endereço do cliente | O mesmo cliente chega à mesma instância | Desigual quando muitos usuários dividem um endereço, e o NGINX só usa os três primeiros octetos do IPv4 no hash |

### Por que o least connections dá um nono a uma instância lenta

O laboratório faz a `api-3` responder em 40 ms e as outras em 10 ms, e mantém 30 requisições em andamento. O least connections mantém cerca de 10 em cada instância. Uma instância que segura 10 requisições de 10 ms termina 1000 por segundo, e uma que segura 10 requisições de 40 ms termina 250 por segundo:

```
taxa     = em andamento / tempo por requisição
api-1    = 10 / 0,010 s = 1000 requisições/s
api-2    = 10 / 0,010 s = 1000 requisições/s
api-3    = 10 / 0,040 s =  250 requisições/s
fatia da api-3 = 250 / 2250 = 1/9 = 11,1%
```

Medido: 12,0% no NGINX e 12,3% no Caddy. O round robin, sob a mesma carga, manda um terço das requisições para a instância lenta, onde elas se acumulam.

### De onde vem o endereço do cliente

O IP hash precisa do endereço do cliente, e atrás de qualquer proxy a conexão TCP vem do proxy. O endereço então viaja em `X-Forwarded-For`, um cabeçalho que qualquer cliente também pode escrever. As duas configurações dizem explicitamente em quem acreditam: `set_real_ip_from` no NGINX e `trusted_proxies` no Caddy. No laboratório é a rede privada do docker-compose. Na internet precisam ser só os endereços dos seus próprios proxies, senão um cliente escolhe o próprio "endereço" e, com ele, a sua instância.

## Quando uma instância falha

Há dois jeitos de descobrir que um back end morreu:

- **Verificação passiva**: o balanceador observa as requisições reais. Uma falha custa pelo menos uma requisição real, e depois de um período de punição uma requisição real é usada para testar de novo.
- **Verificação ativa**: o balanceador manda a própria sonda em intervalo fixo, com ou sem tráfego.

E há o que fazer com a requisição que encontrou a falha: responder com erro, ou **tentar de novo** em outra instância. Uma nova tentativa é sempre segura quando a conexão nem chegou a abrir. Depois que a requisição foi enviada, só é segura para requisições idempotentes como GET, porque um POST pode já ter sido executado.

O laboratório quebra a `api-3` de dois jeitos:

| Falha | O que o proxy vê | O que a revela |
| --- | --- | --- |
| Crash | Conexão recusada, na hora | A primeira tentativa |
| Congelamento | Conexão aceita, nenhuma resposta | Só um timeout |

Resultados, com 100 requisições por segundo e uma falha de 4 s (tabela completa em [results/failure.md](../../../projects/load-balancing/nginx-vs-caddy/results/failure.md)):

| | NGINX padrão | Caddy padrão | Os dois, ajustados |
| --- | --- | --- | --- |
| Crash | 0 erros | 133 erros, enquanto a instância estiver fora | 0 erros |
| Congelamento | 33 erros, 92 lentas | 34 erros, 92 lentas | 0 erros, 34 lentas por cerca de 1 s |

As lições:

1. **Padrões são uma decisão de projeto de cada produto.** O NGINX tenta o próximo servidor depois de um erro de conexão e pula o servidor que falhou por 10 s. O Caddy não faz nenhuma das duas coisas até ser pedido (`lb_try_duration`, `fail_duration`, `health_uri`).
2. **Timeouts fazem parte da verificação de saúde.** Com um timeout de 60 s, um back end congelado segura requisições por 60 s. Nada mais na configuração importa enquanto o timeout não for curto.
3. **O NGINX de código aberto não tem verificação ativa.** A diretiva `health_check` pertence à versão comercial. A verificação passiva dele é o par `max_fails` e `fail_timeout`.
4. **O NGINX resolve os nomes dos upstreams uma vez.** Se o contêiner de uma instância é recriado com outro endereço, o NGINX fica com o antigo. O laboratório caiu nisso enquanto era escrito: depois que as instâncias foram recriadas, os pesos 3, 2, 1 estavam sendo aplicados às instâncias erradas. O parâmetro `resolve` com um `resolver` corrige.

## As duas configurações lado a lado

| Ideia | NGINX | Caddy |
| --- | --- | --- |
| Grupo de back ends | `upstream nome { server ...; }` mais `proxy_pass http://nome;` | `reverse_proxy a b c` |
| Algoritmo padrão | Round robin ponderado | `random` |
| Least connections | `least_conn;` | `lb_policy least_conn` |
| Hash do endereço do cliente | `ip_hash;` | `lb_policy client_ip_hash` |
| Verificação passiva | `max_fails=1 fail_timeout=10s` (padrões) | `fail_duration`, desligada por padrão |
| Verificação ativa | Só na versão comercial | `health_uri`, `health_interval` |
| Nova tentativa | `proxy_next_upstream error timeout` (padrão) | `lb_try_duration`, desligada por padrão |
| Proxies confiáveis | `set_real_ip_from`, `real_ip_header` | `trusted_proxies` |

## Somente alvos locais

O gerador de carga é um pequeno programa em TypeScript, e segue a mesma regra do k6 nos outros mini-projetos: todo alvo é conferido contra uma lista fechada (loopback e os nomes de serviço do compose) antes da primeira requisição, um teste prova que `https://example.com` é recusado, e os back ends vivem em uma rede docker marcada como `internal`.

## Quiz

Tópicos da área `load-balancing` que este mini-projeto demonstra: `balancing-algorithms`, `health-checks-and-failover`, `sticky-sessions`, `nginx-configuration`, `caddy-configuration`, `reverse-proxy-load-balancer-api-gateway` e `layer-4-vs-layer-7`.
