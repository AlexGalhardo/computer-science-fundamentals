# cache-strategies

> English version: [README.md](README.md)

Um cache é uma segunda cópia do dado, e toda a dificuldade está em manter as duas cópias juntas. Este mini-projeto coloca o Redis na frente do PostgreSQL, atrás de uma API em ElysiaJS, e mostra duas coisas. Primeiro, como as três estratégias clássicas se comportam em uma escrita (cache-aside, write-through e write-behind), cada uma com um teste que diz o que ela garante e o que não garante. Segundo, o estouro da manada (cache stampede): 300 leitores de uma chave popular mandam centenas de consultas idênticas ao banco toda vez que a chave expira, e uma trava ou uma renovação antecipada reduzem isso a uma.

Código: MP-CACHE-1. Explicação completa: [docs/pt/cache/cache-strategies.md](../../../docs/pt/cache/cache-strategies.md).

## Resultados

Medido com k6 contra a API local. Gerado pelo teste de carga. Não edite à mão.

### Estouro da manada: consultas ao banco por expiração

300 usuários virtuais leem uma chave quente. A cópia em cache vive 2 s e a consulta por trás dela leva 100 ms.

<!-- stampede:start -->
| Proteção | Rodadas | Expirações | Consultas ao banco | Consultas por expiração (mediana) | Consultas por expiração (faixa) | Latência p95, ms (média ± dp) | Requisição mais lenta (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `none` | 3 | 9 | 2627 | **299** | 260 a 300 | 64 ± 51 | 1729 |
| `lock` | 3 | 15 | 15 | **1** | 1 | 107 ± 32 | 365 |
| `early` | 3 | 18 | 18 | **1** | 1 | 39 ± 23 | 289 |
<!-- stampede:end -->

Sem proteção, cada expiração é paga pela manada inteira. Com `lock` ou `early` ela é paga uma vez. O `early` ainda mantém a latência plana, porque ninguém espera a recarga.

### Taxa de acerto e latência por estratégia e tempo de vida

20 usuários virtuais, 200 produtos, 2% de escritas. Cada leitura no banco custa 5 ms a mais.

<!-- hit-rate:start -->
| Estratégia | Tempo de vida | Rodadas | Taxa de acerto (média ± dp) | Leitura, mediana (ms) | Leitura p95, ms (média ± dp) | Escrita, mediana (ms) | Escrita p95 (ms) | Leituras no banco por 1000 requisições | Escritas no banco por 1000 requisições |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cache-aside` | 250 ms | 3 | 59.2% ± 4.2 | 3.34 | 17.3 ± 10.7 | 23.12 | 493.4 | 403.2 | 20.3 |
| `cache-aside` | 1000 ms | 3 | 85.1% ± 1.7 | 1.40 | 9.9 ± 4.7 | 13.80 | 50.0 | 147.5 | 21.5 |
| `cache-aside` | 5000 ms | 3 | 95.2% ± 0.6 | 1.29 | 8.0 ± 7.0 | 43.64 | 442.2 | 47.7 | 19.7 |
| `write-through` | 250 ms | 3 | 62.9% ± 5.9 | 3.06 | 16.7 ± 16.6 | 19.19 | 60.4 | 360.7 | 21.4 |
| `write-through` | 1000 ms | 3 | 83.8% ± 3.2 | 3.46 | 20.9 ± 10.0 | 20.92 | 77.2 | 157.3 | 20.1 |
| `write-through` | 5000 ms | 3 | 96.7% ± 1.3 | 2.31 | 15.0 ± 9.2 | 48.52 | 236.9 | 30.1 | 21.5 |
| `write-behind` | 250 ms | 3 | 55.2% ± 2.3 | 8.02 | 36.6 ± 10.9 | 11.14 | 39.9 | 455.3 | 5.5 |
| `write-behind` | 1000 ms | 3 | 83.2% ± 3.8 | 3.25 | 27.5 ± 15.2 | 7.04 | 33.2 | 164.0 | 4.5 |
| `write-behind` | 5000 ms | 3 | 97.4% ± 0.8 | 1.71 | 9.8 ± 8.2 | 2.43 | 13.6 | 25.4 | 3.2 |
<!-- hit-rate:end -->

A máquina, as versões e a definição de cada coluna estão em [results/results.md](results/results.md) (em inglês). As execuções são curtas e a máquina estava compartilhada, então as latências têm ruído. As contagens de consultas da tabela do estouro são a parte estável.

## Tópicos do quiz que ele demonstra

- `cache` / `caching-strategies`: quem escreve onde e em que ordem no cache-aside, write-through e write-behind, e quanto custa uma escrita em cada um
- `cache` / `consistency-trade-offs`: a leitura que repovoa o cache com um valor antigo, o banco atrasado em relação ao cache no write-behind, a escrita confirmada que se perde
- `cache` / `stampede-penetration-avalanche`: o estouro da manada, a trava (`SET key token NX PX`) e a renovação antecipada
- `cache` / `invalidation-ttl`: o tempo de vida como limite da defasagem, e o efeito dele na taxa de acerto

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-cache-strategies.sh        # Linux e macOS
./setup-windows-cache-strategies.ps1    # Windows
```

O script constrói a imagem, roda os testes contra um contêiner de Redis e um de PostgreSQL em uma rede interna, e remove os contêineres no fim.

## Teste de carga (a demonstração)

```sh
./load-test-unix.sh            # Linux e macOS
./load-test-windows.ps1        # Windows
```

Um comando, cerca de 6 minutos: sobe a API, roda o experimento do estouro para `none`, `lock` e `early`, roda o experimento de taxa de acerto para 3 estratégias e 3 tempos de vida, três rodadas de cada, e reescreve `results/` e as duas tabelas acima. Ele falha quando a execução sem proteção não mostra pelo menos 100 consultas por expiração, ou quando uma correção deixa passar mais de 1. Passe um número de rodadas para mudar o padrão (`./load-test-unix.sh 1`, `.\load-test-windows.ps1 -Rounds 1`).

O k6 só atinge o serviço `api` deste compose: a rede é interna, nenhuma porta é publicada, e os dois scripts recusam um `BASE_URL` que não seja local (`k6/guard.js`).

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v
```

O contêiner roda a checagem de tipos do TypeScript e depois `bun test`, contra o Redis e o PostgreSQL de verdade.

| Estratégia | Garantia provada por um teste | Limite provado por um teste |
| --- | --- | --- |
| `cache-aside` | Depois que a escrita retorna, a cópia no cache sumiu e a próxima leitura é fresca | Uma leitura que corre junto com uma escrita pode guardar o valor antigo no cache, e só o tempo de vida o remove |
| `write-through` | Quando a escrita retorna, banco e cache têm o valor novo, e a leitura seguinte é um acerto sem consulta. Uma escrita que o banco recusa nunca chega ao cache | A cópia no cache continua precisando de um tempo de vida |
| `write-behind` | Os leitores do cache veem a escrita na hora. Muitas escritas no mesmo produto dentro de um intervalo viram uma escrita no banco | O banco fica atrasado até a descarga, e uma escrita confirmada se perde quando o cache morre antes dela |

Os testes do estouro disparam 200 leituras simultâneas dentro do processo e conferem as mesmas contagens do teste de carga: 200 consultas sem proteção, 1 com a trava, 1 com a renovação antecipada.

## API

| Rota | O que faz |
| --- | --- |
| `GET /products/:strategy/:id` | Lê um produto. `strategy` é `cache-aside`, `write-through` ou `write-behind`. O cabeçalho `X-Cache` diz `hit` ou `miss` |
| `PUT /products/:strategy/:id` | Corpo `{ "price": 1234 }` (centavos). Escreve com a estratégia escolhida |
| `GET /hot/:mode` | Lê a chave quente do experimento do estouro. `mode` é `none`, `lock` ou `early` |
| `POST /admin/reset` | Esvazia o Redis, recria os produtos e aplica as configurações do próximo experimento (`products`, `ttlMs`, `queryCostMs`, `slowQueryMs`, `earlyRefreshMs`) |
| `POST /admin/flush` | Roda a descarga do write-behind agora |
| `POST /admin/counters/reset` | Zera os contadores, para deixar um aquecimento fora da medição |
| `GET /stats` | Acertos, falhas, leituras e escritas no banco, e as consultas de cada expiração da chave quente |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/strategies.ts` | O caminho de leitura comum e as três estratégias de escrita, com a descarga do write-behind |
| `ts/src/stampede.ts` | A chave quente: sem proteção, trava, renovação antecipada, e a contagem de consultas por expiração |
| `ts/src/cache.ts` | Os comandos do Redis usados, incluindo a trava e o script que a solta |
| `ts/src/db.ts` | A tabela `products` e as consultas contadas |
| `ts/src/app.ts` | As rotas em ElysiaJS, com validação em Zod |
| `ts/src/report.ts` | Agrega os resumos do k6 e confere os critérios de aceite |
| `k6/stampede.js`, `k6/hit-rate.js` | Os dois testes de carga. O `k6/guard.js` recusa alvos que não sejam locais |
| `results/` | As tabelas de resultados versionadas |

Nada é importado de outro mini-projeto. A organização do compose, dos scripts e do relatório segue `projects/transactions/overselling-checkout`, copiada e adaptada.

## Versões

| Componente | Versão |
| --- | --- |
| Redis | `redis:8.10.2-alpine` |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2`, com o cliente Redis embutido |
| k6 | `grafana/k6:2.3.0` |
| ElysiaJS | 1.4.30 |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
