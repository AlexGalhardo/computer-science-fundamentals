# overselling-checkout

> English version: [README.md](README.md)

Um produto tem 10 unidades e 200 pessoas clicam em "comprar" no mesmo instante. Um checkout escrito como "ler o estoque, conferir, gravar" vende muito mais que 10, mesmo dentro de uma transação. Este mini-projeto reproduz o bug com um teste de carga local do k6 contra uma API ElysiaJS com PostgreSQL, e depois o corrige de três jeitos: coluna de versão otimista, `SELECT ... FOR UPDATE`, e `SERIALIZABLE` com nova tentativa.

Código: MP-TX-2. Explicação completa: [docs/pt/transactions/overselling-checkout.md](../../../docs/pt/transactions/overselling-checkout.md).

## Resultados

200 compradores concorrentes, 10 unidades, medido com k6. Gerado pelo teste de carga. Não edite à mão.

<!-- results:start -->
| Estratégia | Rodadas | Pedidos criados | Requisições/s (média ± dp) | Rejeitadas: esgotado (média) | Rejeitadas: desistiu após conflitos (média) | Parcela rejeitada | Latência p95 (ms) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `naive` | 3 | **150 a 180** | 252 ± 76 | 35.0 | 0.0 | 17.5% | 767 |
| `optimistic` | 3 | 10 | 445 ± 72 | 190.0 | 0.0 | 95.0% | 417 |
| `pessimistic` | 3 | 10 | 260 ± 36 | 190.0 | 0.0 | 95.0% | 694 |
| `serializable` | 3 | 10 | 821 ± 67 | 190.0 | 0.0 | 95.0% | 229 |
<!-- results:end -->

`naive` cria mais pedidos do que existem unidades. Cada correção cria exatamente 10. Máquina, versões e a definição de cada coluna estão em [results/results.md](results/results.md).

## Tópicos do quiz que ele demonstra

- `transactions` / `locking`: bloqueio otimista contra pessimista, `SELECT ... FOR UPDATE`, o que um bloqueio de linha bloqueia
- `transactions` / `isolation-levels-anomalies`: a atualização perdida em `READ COMMITTED`, e `SERIALIZABLE` com nova tentativa no SQLSTATE `40001`
- `transactions` / `acid-properties`: uma transação dá atomicidade, que não é isolamento
- `transactions` / `mvcc`: leitores não são bloqueados por escritores, e é exatamente por isso que a leitura ingênua fica velha

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-overselling-checkout.sh        # Linux e macOS
./setup-windows-overselling-checkout.ps1    # Windows
```

O script constrói a imagem, roda os testes contra um contêiner PostgreSQL em uma rede interna e remove os contêineres no fim.

## Teste de carga (a demo)

```sh
./load-test-unix.sh            # Linux e macOS
./load-test-windows.ps1        # Windows
```

Um comando: sobe a API, roda o k6 três vezes por estratégia (200 usuários virtuais, uma compra cada), confere que `naive` vendeu demais e que cada correção vendeu exatamente 10, e reescreve `results/` e a tabela acima. Ele falha quando qualquer uma dessas conferências falha.

O k6 só atinge o serviço `api` deste compose: a rede é interna, nenhuma porta é publicada, e o script recusa um `BASE_URL` que não seja local.

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v
```

O contêiner roda a checagem de tipos do TypeScript e depois `bun test`. Os testes disparam as mesmas 200 compras concorrentes dentro do processo e exigem o mesmo resultado do teste de carga.

## API

| Rota | O que faz |
| --- | --- |
| `POST /checkout/:strategy` | Compra uma unidade. `strategy` é `naive`, `optimistic`, `pessimistic` ou `serializable`. Corpo: `{ "buyerId": "..." }`. Responde `201` vendido, `409` esgotado, `503` desistiu depois de conflitos demais |
| `POST /admin/reset` | Corpo `{ "stock": 10 }`. Apaga os pedidos e define o estoque |
| `GET /stats` | `{ "stock": ..., "orders": ... }` |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/checkout.ts` | As quatro estratégias e o laço de novas tentativas |
| `ts/src/app.ts` | As rotas ElysiaJS, com validação Zod |
| `ts/src/db.ts` | Schema, reset e estatísticas |
| `ts/src/report.ts` | Agrega os resumos do k6 e confere os critérios de aceite |
| `k6/checkout.js` | O teste de carga |
| `results/` | A tabela de resultados versionada |

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
