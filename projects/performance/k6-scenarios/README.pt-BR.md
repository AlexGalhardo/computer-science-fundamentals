# k6-scenarios

> English version: [README.md](README.md)

Uma API local sobre PostgreSQL com um gargalo proposital (um pool de 2 conexões), e quatro cenários de k6 que olham para ele cada um de um ângulo: **load** (carga), **stress** (estresse), **spike** (pico) e **soak** (resistência). Todo cenário tem thresholds, falha neles com o pool pequeno, e passa com um pool de 20. Nada mais muda entre as duas execuções. A lição é para que serve cada tipo de teste de carga, e como um gargalo que nenhum gráfico de CPU mostra aparece como um joelho na curva de latência.

Código: MP-PERF-2. Explicação completa: [docs/pt/performance/k6-scenarios.md](../../../docs/pt/performance/k6-scenarios.md).

> **Somente local.** O k6 roda em uma rede Docker interna, sem porta publicada, e o script se recusa a rodar quando o alvo não é `localhost` ou o serviço `api` deste docker-compose. Nunca aponte um teste de carga para um host que não é seu.

## Resultados

Gerado pelo teste de carga. Não edite à mão. O nome de cada cenário leva ao seu resumo em Markdown (em inglês).

<!-- results:start -->
| Cenário | Forma | Antes (pool de 2) | Depois (pool de 20) |
| --- | --- | --- | --- |
| [`load`](results/load.md) | sobe a 150 req/s em 5 s, mantém 20 s, desce | **FALHOU**: p95 2020 ms, 25.20% com erro | passou: p95 21.2 ms, 0.00% com erro |
| [`stress`](results/stress.md) | degraus de 6 s: 50, 100, 150, 200, 250, 300 req/s | **FALHOU**: p95 2020 ms, 42.79% com erro | passou: p95 21.2 ms, 0.00% com erro |
| [`spike`](results/spike.md) | 40 req/s, salto para 500 req/s por 6 s, volta a 40 req/s por 16 s | **FALHOU**: p95 2020 ms, 47.15% com erro | passou: p95 21.4 ms, 0.00% com erro |
| [`soak`](results/soak.md) | 130 req/s constantes por 60 s (reduzido: um soak real roda por horas) | **FALHOU**: p95 2020 ms, 23.08% com erro | passou: p95 27.4 ms, 0.00% com erro |
<!-- results:end -->

Um cenário falha quando ultrapassa um threshold: latência p95 de 250 ms ou mais, no total ou em qualquer fase, ou 1% ou mais de requisições com erro. Máquina, versões e a lista de resumos estão em [results/results.md](results/results.md). O joelho de latência está em [results/stress.md](results/stress.md).

## Tópicos do quiz que ele demonstra

- `performance` / `load-test-types`: o que os testes de carga, estresse, pico e resistência revelam, e a forma de cada um
- `performance` / `k6-fundamentals`: cenários, o executor `ramping-arrival-rate` (modelo aberto), estágios, thresholds e o código de saída 99, checks, tags, `handleSummary`, o alvo vindo de `__ENV`
- `performance` / `database-performance`: o pool de conexões, o que acontece quando todas as conexões estão ocupadas
- `performance` / `capacity-planning-queueing`: capacidade de um pool como conexões divididas pelo tempo de posse, o joelho de latência na saturação
- `performance` / `latency-throughput-percentiles`: p95 contra a mediana, requisições com erro, latência por fase

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-k6-scenarios.sh        # Linux e macOS
./setup-windows-k6-scenarios.ps1    # Windows
```

O script constrói a imagem, roda a checagem de tipos, os testes de unidade e os testes contra um contêiner PostgreSQL em uma rede interna, confere que o k6 recusa um alvo que não é local em cada um dos quatro cenários, e remove os contêineres no fim.

## Teste de carga (a demonstração)

```sh
./load-test-unix.sh            # Linux e macOS, argumentos opcionais: pool antes, pool depois
./load-test-windows.ps1        # Windows, opcional: -PoolBefore 2 -PoolAfter 20
```

Um comando, cerca de seis minutos. Ele roda os quatro cenários com um pool de 2 conexões, roda de novo com um pool de 20, e então o relatório grava `results/` e a tabela acima. O relatório falha a menos que todo cenário tenha ultrapassado um threshold antes da correção e nenhum depois, e a menos que o teste de estresse mostre um joelho de latência antes da correção e nenhum depois. Os resumos brutos do k6 vão para `k6-results/`, que o git ignora.

Um cenário à mão:

```sh
docker compose up -d --wait api
docker compose run --rm -e SCENARIO=stress -e VARIANT=before k6    # código de saída 99: um threshold foi ultrapassado
docker compose down -v
```

## Os quatro cenários

| Cenário | Forma | A pergunta que ele responde |
| --- | --- | --- |
| `load` | sobe a 150 req/s, mantém, desce | O sistema cumpre o nível de serviço no tráfego para o qual foi feito? |
| `stress` | degraus de 50 a 300 req/s | Onde ele deixa de dar conta, e como se comporta ali? |
| `spike` | 40 req/s, 500 req/s por 6 s, 40 req/s de novo | Ele sobrevive a uma rajada, e em quanto tempo se recupera? |
| `soak` | 130 req/s, constante | O que só degrada com o tempo? (um minuto aqui, horas na vida real) |

Os quatro usam o modelo aberto (`ramping-arrival-rate`): o k6 inicia requisições na taxa pedida, tenham as anteriores sido respondidas ou não. Um modelo fechado esconderia o gargalo, porque usuários virtuais que esperam as suas respostas reduzem a carga sozinhos.

## Testes

```sh
docker compose run --rm ts-test           # checagem de tipos, testes de unidade, testes contra o PostgreSQL
docker compose run --rm k6-refusal-test   # o k6 precisa recusar https://example.com
docker compose down -v
```

| O que é provado | Onde |
| --- | --- |
| Seis requisições concorrentes demoram cerca de seis vezes mais em um pool de 1 do que em um pool de 6 | `ts/tests/integration/pool.test.ts` |
| Uma requisição que espera mais que o limite recebe `503` (load shedding) | `ts/tests/integration/pool.test.ts` |
| Todo cenário pede mais do que o pool de 2 atende e no máximo 60% do pool de 20 | `ts/tests/unit/profiles.test.ts` |
| Cada perfil tem a forma do seu tipo de teste | `ts/tests/unit/profiles.test.ts` |
| O relatório exige falha antes e aprovação depois, e encontra o joelho | `ts/tests/unit/report.test.ts` |
| A regra de alvo local recusa parecidos como `http://api.example.com` | `ts/tests/unit/profiles.test.ts` |
| O k6 termina com erro e não envia nada quando `BASE_URL` não é local | `k6/refusal-test.sh` |

## API

| Rota | O que faz |
| --- | --- |
| `GET /products/:id` | Lê um produto. Segura uma conexão do pool por cerca de `QUERY_MS` (20 ms). `404` id desconhecido, `503` nenhuma conexão ficou livre dentro de `POOL_WAIT_MS` (2 s) |
| `GET /stats` | Tamanho do pool, conexões abertas, ociosas e em espera, requisições descartadas |
| `GET /health` | Verificação de vida |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `k6/profiles.js` | Os quatro perfis de carga, como dados compartilhados pelo k6, pelos testes e pelo relatório |
| `k6/scenario.js` | O script do k6: executor, thresholds, tags por fase, resumo |
| `k6/target.js` | A regra que recusa alvos que não são locais |
| `ts/src/db.ts` | O pool de conexões, a consulta, o limite de espera |
| `ts/src/app.ts` | As rotas ElysiaJS, com validação Zod |
| `ts/src/report.ts` | Monta os resumos em Markdown e confere os critérios de aceite |
| `results/` | Os resumos em Markdown versionados, um por cenário |

`k6/target.js` é uma cópia da regra usada pelos outros testes de carga do repositório, com o nome de serviço deste projeto. Um mini-projeto nunca importa código de outro.

## Versões

| Componente | Versão |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| k6 | `grafana/k6:2.3.0` |
| ElysiaJS | 1.4.30 |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
