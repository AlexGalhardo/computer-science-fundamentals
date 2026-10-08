# nginx-vs-caddy

> English version: [README.md](README.md)

Três instâncias idênticas de uma API atrás de dois balanceadores de carga, NGINX e Caddy, configurados lado a lado. O laboratório manda o mesmo tráfego pelos dois e responde a duas perguntas com números:

1. **Como cada algoritmo de balanceamento distribui as requisições?** Round robin, round robin ponderado, least connections e IP hash, cada um comparado com a fatia que promete.
2. **O que acontece quando uma instância falha durante a carga?** Quantas requisições se perdem, por quanto tempo os clientes percebem, e quanto tempo a instância leva para voltar a receber tráfego, com a configuração padrão de cada proxy e com uma ajustada.

A explicação dos conceitos está em [docs/pt/load-balancing/nginx-vs-caddy.md](../../../docs/pt/load-balancing/nginx-vs-caddy.md).

> **Somente local.** O gerador de carga se recusa a rodar quando um alvo não é `localhost` ou um serviço deste docker-compose. Nunca aponte um teste de carga para um host que não é seu.

## Tópicos do quiz que ele demonstra

- `load-balancing` / `balancing-algorithms`: round robin, pesos, least connections com uma instância lenta, IP hash
- `load-balancing` / `health-checks-and-failover`: verificações passivas e ativas, novas tentativas, um crash contra um congelamento
- `load-balancing` / `sticky-sessions`: afinidade pelo endereço do cliente e seus limites
- `load-balancing` / `nginx-configuration`: `upstream`, `weight`, `least_conn`, `ip_hash`, `max_fails`, `fail_timeout`, `proxy_next_upstream`, `proxy_pass`
- `load-balancing` / `caddy-configuration`: `reverse_proxy`, `lb_policy`, `lb_try_duration`, `health_uri`, `fail_duration`
- `load-balancing` / `reverse-proxy-load-balancer-api-gateway`: `X-Forwarded-For` e em quais proxies confiar
- `load-balancing` / `layer-4-vs-layer-7`: roteamento pelo caminho da URL

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-nginx-vs-caddy.sh        # Linux e macOS
./setup-windows-nginx-vs-caddy.ps1    # Windows
```

O script constrói a imagem, roda os testes unitários, confere as duas configurações de proxy, sobe as duas pilhas, roda os testes de integração através delas, confere que o gerador de carga recusa um alvo que não é local e remove tudo. Leva cerca de dois minutos.

## As duas pilhas

Um comando sobe as três instâncias e os dois proxies, cada um em sua porta local:

```sh
docker compose up -d --wait nginx caddy
curl -i http://127.0.0.1:18480/rr    # NGINX
curl -i http://127.0.0.1:18481/rr    # Caddy
docker compose --profile lab down -v # para e remove tudo
```

Repita o `curl` e veja o cabeçalho `X-Instance` mudar. Defina `NGINX_PORT` ou `CADDY_PORT` antes do primeiro comando para usar outras portas. As duas portas ficam presas a `127.0.0.1`.

Os dois proxies publicam as mesmas rotas, e toda rota encaminha para `GET /work` de uma instância:

| Rota | NGINX (`nginx/nginx.conf`) | Caddy (`caddy/Caddyfile`) |
| --- | --- | --- |
| `/rr` | `upstream` sem diretiva de método | `lb_policy round_robin` |
| `/wrr` | `weight=3`, `weight=2`, `weight=1` | `lb_policy weighted_round_robin 3 2 1` |
| `/lc` | `least_conn` | `lb_policy least_conn` |
| `/iphash` | `ip_hash` | `lb_policy client_ip_hash` |
| `/tuned` | `max_fails=1 fail_timeout=3s`, timeouts de 1 s, `proxy_next_upstream` | `lb_try_duration`, `fail_duration`, `health_uri`, timeouts de 1 s |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `nginx/nginx.conf`, `caddy/Caddyfile` | As duas configurações, com as mesmas rotas. Leia lado a lado |
| `ts/src/api/` | A instância: `GET /work`, `GET /health`, `GET /stats`, e rotas de controle que a deixam lenta, a derrubam ou a congelam |
| `ts/src/lab/load.ts` | Dois geradores de carga: laço fechado (concorrência fixa) e laço aberto (taxa fixa) |
| `ts/src/lab/analysis.ts` | Funções puras: fatias, fatias esperadas, tolerância, tempo de recuperação |
| `ts/src/lab/experiments.ts` | Os experimentos: o que é enviado, e o que se espera antes de medir |
| `ts/src/lab/target.ts`, `config.ts` | A regra que recusa alvos que não são locais |
| `ts/src/cli.ts` | Roda os experimentos e escreve `results/` |
| `ts/tests/`, `ts/integration/` | Testes unitários (sem rede) e testes de integração (através dos dois proxies) |

As rotas de controle das instâncias (`/control/...`) só são alcançáveis na rede docker interna. Os proxies não encaminham nada além das rotas da tabela.

## Testes

```sh
docker compose run --rm ts-test             # checagem de tipos e 22 testes unitários, sem rede
docker compose run --rm caddy-config-test   # caddy validate e caddy fmt
docker compose run --rm nginx-config-test   # nginx -t
docker compose run --rm lab-test            # 17 testes de integração através dos dois proxies
docker compose run --rm refusal-test        # o laboratório precisa recusar https://example.com
docker compose --profile lab down -v
```

| O que é testado | Onde |
| --- | --- |
| Cada algoritmo fica a até 5 pontos percentuais das fatias esperadas, nos dois proxies | `ts/integration/proxies.test.ts` |
| IP hash: 500 de 500 clientes simulados sempre chegam à mesma instância, e o NGINX manda uma rede /24 inteira para uma instância | mesmo arquivo |
| Uma instância derrubada: os padrões do NGINX não perdem nada, os do Caddy perdem cerca de uma requisição em três, as duas configurações ajustadas não perdem nada | mesmo arquivo |
| Uma instância congelada: as duas configurações ajustadas não perdem nada | mesmo arquivo |
| As rotas de controle não são alcançáveis pelos proxies | mesmo arquivo |
| Fatias, tolerância, fixação, tempo de recuperação, mediana e dispersão | `ts/tests/analysis.test.ts` |
| A instância: rotas, validação da entrada de controle, lenta, derrubada e congelada, sem socket | `ts/tests/app.test.ts` |
| A regra de alvo local aceita loopback e nomes de serviço e recusa parecidos como `http://localhost@example.com` | `ts/tests/target.test.ts` |
| O laboratório termina com erro e não envia nada quando um alvo não é local | `ts/scripts/refusal-test.sh` |

Linter e formatador: Biome com a configuração da raiz do repositório, e `caddy fmt` para o Caddyfile.

```sh
bunx biome check projects/load-balancing/nginx-vs-caddy
```

## Experimentos

```sh
docker compose --profile lab run --rm lab    # cerca de seis minutos, escreve results/
docker compose --profile lab down -v
```

Ele escreve [results/distribution.md](results/distribution.md) e [results/failure.md](results/failure.md), com a máquina, as versões das imagens e o método. Defina `REPETITIONS` para mudar o número de execuções de cada caso (3 por padrão).

### Distribuição

3000 requisições por execução, 30 em andamento, três execuções por caso. Fatia de cada instância (mediana):

| Algoritmo | Esperado | NGINX | Caddy |
| --- | --- | --- | --- |
| Round robin | 33,3 / 33,3 / 33,3 | 33,3 / 33,3 / 33,3 | 33,3 / 33,3 / 33,3 |
| Round robin ponderado (3, 2, 1) | 50,0 / 33,3 / 16,7 | 50,0 / 33,3 / 16,7 | 50,0 / 33,3 / 16,7 |
| Least connections, `api-3` quatro vezes mais lenta | 44,4 / 44,4 / 11,1 | 44,0 / 43,9 / 12,0 | 43,9 / 43,9 / 12,3 |
| IP hash, 500 clientes | 33,3 / 33,3 / 33,3 | 33,4 / 33,2 / 33,4 | 31,4 / 33,2 / 35,4 |

Todo caso fica a até 5 pontos percentuais da fatia esperada (o pior é 2,1 pontos), que é o critério de aceite do mini-projeto.

- O round robin é exato: ele conta requisições e mais nada.
- O least connections é onde o algoritmo enxerga a carga. A `api-3` responde em 40 ms e as outras em 10 ms. Com o mesmo número de requisições em andamento em cada uma, uma instância termina requisições a uma taxa proporcional a 1/tempo, então as fatias são 4 : 4 : 1 e a instância lenta atende cerca de um nono. O round robin continuaria dando a ela um terço.
- O IP hash é fixo (500 de 500 clientes sempre chegaram à mesma instância) e só aproximadamente equilibrado: depende de como os endereços dos clientes caem no hash. Os números se repetem exatamente de uma execução para outra porque o hash é determinístico.

### Uma instância falha durante a carga

100 requisições por segundo durante 14 s. Aos 2 s a `api-3` falha por 4 s. Três execuções por caso, mediana mostrada:

| Falha | Proxy | Configuração | Erros | Lentas (mais de 250 ms) | Tempo de recuperação | De volta à rotação depois do retorno |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| crash | NGINX | padrão | 0 | 0 | 0 ms | 6980 ms |
| crash | NGINX | ajustada | 0 | 0 | 0 ms | 3980 ms |
| crash | Caddy | padrão | 133 | 0 | 4000 ms | 30 ms |
| crash | Caddy | ajustada | 0 | 0 | 0 ms | 691 ms |
| congelamento | NGINX | padrão | 33 | 92 | 3740 ms | 10 ms |
| congelamento | NGINX | ajustada | 0 | 34 | 999 ms | 1900 ms |
| congelamento | Caddy | padrão | 34 | 92 | 3740 ms | 20 ms |
| congelamento | Caddy | ajustada | 0 | 34 | 1007 ms | 1018 ms |

O que a tabela mostra:

- **Os padrões são diferentes.** Quando uma conexão é recusada, o NGINX passa a requisição ao próximo servidor e pula o que falhou por 10 s (`proxy_next_upstream error timeout`, `max_fails=1`, `fail_timeout=10s`), então um crash não custa nada. O Caddy, só com `lb_policy`, não tem nova tentativa nem verificação de saúde: ele continua escolhendo a instância morta, e uma requisição em três falha (133 das 400 enviadas durante os 4 s) até a instância voltar.
- **Um congelamento é pior que um crash.** Uma conexão recusada é uma resposta imediata. Um processo congelado aceita a conexão e não diz nada, e só um timeout o revela. Com os timeouts padrão (60 s no NGINX, nenhum no Caddy) nenhum dos dois proxies percebe dentro dos 4 s: as requisições enviadas no primeiro segundo são abandonadas pelo cliente depois de 3 s, e as demais voltam atrasadas.
- **Ajustar é timeouts mais novas tentativas mais verificações de saúde.** Com timeouts de 1 s os dois proxies não perdem nada. As 34 requisições lentas são as que encontraram a falha durante o primeiro segundo, cada uma esperando o timeout antes de ser repetida em outra instância.
- **Passiva contra ativa.** O NGINX de código aberto só tem verificação passiva: uma requisição real descobre a falha, e uma requisição real testa o servidor de novo depois de `fail_timeout`. Por isso a instância leva segundos para voltar a receber tráfego. A verificação ativa do Caddy pede `/health` a cada segundo por conta própria.
- **Remover rápido e voltar rápido são uma troca.** Um proxy que nunca remove a instância (Caddy padrão) manda tráfego para ela no instante em que ela volta, e também durante a falha inteira.

As contagens são idênticas ou diferem em uma requisição entre as três execuções, e os tempos variam cerca de 10 ms, porque este experimento depende de timeouts e não de velocidade. A máquina estava compartilhada com outras cargas. Vazão não é medida aqui.

### O que "parada" significa aqui

O critério de aceite diz "uma instância parada durante a carga". A instância para a si mesma sob comando (`POST /control/outage` na rede interna): em um crash ela fecha o socket de escuta e todas as conexões abertas, que é o que um proxy vê quando o processo morre e o host continua de pé. Isso mantém o experimento dentro de um único `docker compose run`, repetível e cronometrado ao milissegundo, sem acesso ao socket do Docker. Parar o contêiner (`docker compose stop api-3`) é um terceiro caso, não medido aqui: o próprio endereço pode parar de responder, e então uma tentativa de conexão espera o timeout de conexão em vez de ser recusada na hora.
