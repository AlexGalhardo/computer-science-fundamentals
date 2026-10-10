# Balanceador de carga de camada 7 escrito à mão

> English version: [docs/en/load-balancing/l7-load-balancer.md](../../en/load-balancing/l7-load-balancer.md) · Versión en español: [docs/es/load-balancing/l7-load-balancer.md](../../es/load-balancing/l7-load-balancer.md)

Mini-projeto: [projects/load-balancing/l7-load-balancer](../../../projects/load-balancing/l7-load-balancer/README.pt-BR.md) (MP-LB-2). Linguagem: Go.

## O problema

NGINX e Caddy escondem o trabalho atrás de uma linha de configuração. Escrever o balanceador à mão mostra que o trabalho é curto de descrever e cheio de decisões:

```text
cliente ──TCP 1──> balanceador ──TCP 2──> back end
                      │
                      ├─ 1. escolher um back end          strategy.go
                      ├─ 2. reescrever os cabeçalhos      proxy.go
                      ├─ 3. encaminhar e copiar de volta  proxy.go
                      ├─ 4. na falha: tentar de novo?     proxy.go
                      └─ enquanto isso: quem está vivo?   health.go
```

Ele é um balanceador de **camada 7** porque lê a requisição HTTP. A conexão TCP do cliente termina no balanceador, e a requisição viaja em uma segunda conexão, normalmente uma que já está aberta e é reaproveitada. Um balanceador de camada 4 encaminharia os bytes de uma conexão sem saber onde uma requisição começa ou termina.

## 1. Escolher

O **round robin** é um contador: a requisição número `n` vai para o back end utilizável `n mod quantidade`. O detalhe que importa é o que é "quantidade". Fazer o rodízio sobre a lista inteira e pular os mortos parece equivalente e não é: com B fora em A, B, C, toda vez que a vez cai em B ela escorrega para C, e C recebe dois terços. O rodízio precisa correr sobre os back ends utilizáveis.

O **least connections** guarda, por back end, o número de requisições enviadas e ainda não terminadas, e escolhe o menor. Com requisições de mesma duração ele se comporta como o round robin. Com um back end quatro vezes mais lento ele dá a esse back end cerca de um nono das requisições em vez de um terço, porque cada back end termina requisições a uma taxa de (requisições em andamento) / (tempo por requisição):

```text
rápido: 10 em andamento / 20 ms = 500 requisições/s   (duas vezes)
lento:  10 em andamento / 80 ms = 125 requisições/s
fatia do lento = 125 / 1125 = 1/9
```

O contador só conhece as requisições deste balanceador. Dois balanceadores na frente dos mesmos back ends enxergam metade do quadro cada um, e é por isso que o NGINX precisa de uma `zone` de memória compartilhada para seus workers.

## 2. Reescrever os cabeçalhos

- **Cabeçalhos hop-by-hop** (`Connection`, `Keep-Alive`, `Transfer-Encoding`, `Upgrade` e os nomeados dentro de `Connection`) descrevem uma conexão. O balanceador tem duas conexões, então ele os remove nos dois sentidos.
- **`X-Forwarded-For`**: o back end vê uma conexão vinda do balanceador, então o endereço do cliente viaja nesse cabeçalho, com cada proxy acrescentando o par de quem recebeu a requisição. Um back end só pode acreditar nele quando a conexão vem de um proxy em que confia.

## 3 e 4. Encaminhar, e o que fazer quando falha

Uma tentativa que falha levanta uma pergunta: a mesma requisição pode ser enviada a outro back end?

| O que aconteceu | O back end viu a requisição? | Nova tentativa |
| --- | --- | --- |
| Conexão recusada ou timeout de conexão | Não | Sempre, qualquer método |
| Enviada, e depois a conexão caiu ou a resposta estourou o tempo | Talvez, e talvez tenha sido executada | Só GET, HEAD e OPTIONS |

Um POST que pode ter sido executado é respondido com 502, porque repeti-lo poderia criar o pedido duas vezes. É a mesma regra do `proxy_next_upstream` sem `non_idempotent` no NGINX.

Uma tentativa que falha também tira o back end da rotação na hora. Isso é uma **verificação de saúde passiva**: o tráfego real encontrou a falha.

## Enquanto isso: quem está vivo

A **verificação de saúde ativa** pede `GET /health` a cada back end em intervalo fixo e remove os que não respondem 200 a tempo. O intervalo é o preço da detecção: um back end que morre logo depois de uma sonda bem sucedida fica em rotação por até um intervalo, vezes o número de falhas consecutivas exigido. Exigir vários resultados seguidos antes de mudar o estado evita o flapping.

As duas verificações se completam. A passiva é imediata e precisa de tráfego. A ativa funciona sem tráfego e é a única que consegue trazer um back end de volta, porque ninguém manda requisições para um back end que está fora.

O teste de aceite do mini-projeto para um de três back ends no meio de 3000 requisições: nenhuma falha, porque as requisições que atingem o back end que está morrendo são repetidas, e o back end sai da rotação na primeira falha ou na sonda seguinte. Sem tráfego nenhum, uma verificação de 100 ms removeu um back end parado 54 ms depois de ele parar, em uma das execuções do teste.

## O benchmark

O k6 manda `GET /work` com 50 usuários virtuais por este balanceador e pelo NGINX, um de cada vez, em cinco rodadas. Resultado versionado ([results/benchmark.md](../../../projects/load-balancing/l7-load-balancer/results/benchmark.md)), mediana e faixa:

| Proxy | Vazão (requisições/s) | Latência p99 (ms) |
| --- | ---: | ---: |
| Este balanceador, round robin | 10584 (7863 a 17198) | 22,31 (12,15 a 34,70) |
| Este balanceador, least connections | 9405 (7561 a 11521) | 28,72 (21,88 a 40,73) |
| NGINX, round robin | 10129 (9983 a 12968) | 26,47 (18,83 a 30,52) |

A leitura honesta é que as faixas se sobrepõem e nenhum vencedor pode ser apontado. A máquina estava compartilhada, o gerador de carga rodou nos mesmos núcleos, e outras duas execuções no mesmo dia tiveram medianas entre cerca de 5000 e 9600 requisições por segundo. O que a tabela sustenta é a ordem de grandeza: encaminhar requisições pequenas em conexões reaproveitadas custa mais ou menos o mesmo nos dois.

### O que o balanceador escrito à mão deixa de fora

Transmissão de corpos grandes aos poucos (ele guarda até 1 MiB na memória para que uma nova tentativa possa reenviar o corpo), TLS, upgrades de WebSocket, pesos, slow start, drenagem das conexões de um back end removido, recarga de configuração, métricas e logs de acesso. Cada item é um motivo para usar NGINX ou Caddy em produção, e um motivo para os arquivos de configuração deles terem tantas diretivas.

## Somente alvos locais

`load/target.js` aceita só `localhost`, `127.0.0.1`, `[::1]` e os três proxies do compose, antes de o k6 enviar qualquer coisa. O `k6-refusal-test` roda o k6 com oito alvos que não são locais e só passa se todos forem recusados. A rede docker é `internal`.

## Quiz

Tópicos da área `load-balancing` que este mini-projeto demonstra: `layer-4-vs-layer-7`, `balancing-algorithms`, `health-checks-and-failover` e `reverse-proxy-load-balancer-api-gateway`.
