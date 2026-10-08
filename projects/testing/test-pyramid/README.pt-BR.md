# test-pyramid

> English version: [README.md](README.md)

Uma loja minúscula (um catálogo, um carrinho, 10% de desconto a partir de 100,00) testada em todos os níveis da pirâmide de testes: unitário, integração, ponta a ponta com Playwright, mais uma suíte de fumaça e uma de regressão. Um bug é semeado de propósito em cada nível, e uma matriz mostra qual suíte percebe qual bug e quanto cada suíte custa. A lição: cada nível enxerga algo que os outros não enxergam, e o preço de um teste cresce conforme ele sobe.

Código: MP-TEST-1. Explicação completa: [docs/pt/testing/test-pyramid.md](../../../docs/pt/testing/test-pyramid.md).

## Tópicos do quiz que ele demonstra

- `testing` / `test-pyramid-levels`: o que cada nível verifica, quanto custa, por que a base é larga
- `testing` / `unit-tests-isolation`: um módulo puro testado sozinho, valores-limite
- `testing` / `integration-tests`: handler HTTP, repositório e um SQLite de verdade juntos, um banco novo por teste
- `testing` / `e2e-playwright`: localizadores por papel, asserções web-first, estado zerado antes de cada teste
- `testing` / `smoke-regression`: checagens rasas no serviço em execução, um teste por relato de bug antigo
- `testing` / `ci-test-strategy`: rodar primeiro as suítes baratas

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-test-pyramid.sh        # Linux e macOS
./setup-windows-test-pyramid.ps1    # Windows
```

O script constrói as imagens, roda a checagem de tipos, as cinco suítes e a matriz de bugs, e remove os contêineres no fim.

## As cinco suítes, um comando cada

```sh
docker compose run --rm unit           # bun test, funções puras
docker compose run --rm integration    # bun test, handler + repositório + SQLite em memória
docker compose run --rm regression     # bun test, um teste por relato de bug antigo
docker compose run --rm smoke          # bun test, contra o serviço `shop` em execução
docker compose run --rm e2e            # Playwright (Chromium), contra o serviço `shop` em execução
docker compose down -v --remove-orphans
```

`SEEDED_BUG=<nome>` na frente de qualquer comando planta um bug: `unit`, `integration`, `e2e`, `smoke` ou `regression`. Para `smoke` e `e2e` o bug mora no serviço `shop`, então recrie-o: rode `docker compose down` antes.

## Demo: a matriz de bugs

```sh
docker compose run --rm matrix
```

Ela roda as 5 suítes contra o código correto e contra cada um dos 5 bugs semeados (30 execuções, cerca de um minuto), imprime a tabela e a grava em [`results/bug-matrix.md`](results/bug-matrix.md). O comando falha se uma suíte deixar passar o bug do seu próprio nível.

| Bug semeado | Onde está | unit | integration | regression | smoke | e2e |
| --- | --- | --- | --- | --- | --- | --- |
| none | | pass | pass | pass | pass | pass |
| `unit` | `pricing.ts`: `>` no lugar de `>=` no limite do desconto | **FAIL** | pass | pass | pass | pass |
| `integration` | `cart-repository.ts`: o upsert em SQL substitui a quantidade em vez de somar | pass | **FAIL** | pass | pass | **FAIL** |
| `e2e` | `public/app.js`: a página não redesenha o carrinho após um clique | pass | pass | pass | pass | **FAIL** |
| `smoke` | `server.ts`: o serviço sobe sem rodar a migração | pass | pass | pass | **FAIL** | **FAIL** |
| `regression` | `pricing.ts`: o arredondamento que corrigiu o relato de bug #17 é removido | pass | pass | **FAIL** | pass | pass |

Como ler:

- A suíte de ponta a ponta pega três dos cinco bugs, mas deixa passar os dois que exigem um valor preciso (exatamente 100,00, e 100,05). Cobrir cada valor por um navegador seria lento demais, e é por isso que esses casos moram na base.
- A suíte unitária não enxerga o SQL, o script do navegador nem a forma como o serviço foi iniciado.
- Quando `integration` e `e2e` falham juntas, o teste de integração aponta o método do repositório. O teste de ponta a ponta só diz que um texto não apareceu na tela.

## Quantidade e duração de cada suíte

Medido pela matriz no código correto, dentro do Docker (Docker Desktop no Windows 11, AMD64, Bun 1.4.2, Playwright 1.63.0 com Chromium). A duração é o comando inteiro, incluindo a partida do executor de testes.

| Suíte | Testes | Duração | Por teste |
| --- | --- | --- | --- |
| unit | 10 | 36 ms | 3,6 ms |
| integration | 8 | 61 ms | 7,6 ms |
| regression | 2 | 52 ms | 26,0 ms |
| smoke | 3 | 9 ms | 3,0 ms |
| e2e | 3 | 2070 ms | 690 ms |

Um teste de ponta a ponta custa mais ou menos o mesmo que 200 testes unitários, sem contar a imagem do Chromium (cerca de 2 GB contra cerca de 250 MB da imagem do Bun) e um serviço em execução. Os números mudam a cada execução e de máquina para máquina. A ordem de grandeza não.

## Estrutura

```
ts/src/pricing.ts            regras puras (nível unitário)
ts/src/cart-repository.ts    SQL no SQLite (nível de integração)
ts/src/app.ts                handler HTTP, entrada validada com Zod
ts/src/server.ts             inicia o serviço (o que a fumaça confere)
ts/public/                   a página e o script dela (o que só o e2e roda)
ts/src/seeded-bugs.ts        a chave SEEDED_BUG
ts/tests/{unit,integration,regression,smoke,e2e}/
ts/scripts/bug-matrix.ts     a demo
```

Dependências, fixadas: `zod` 4.6.5, `@playwright/test` 1.63.0 (imagem `mcr.microsoft.com/playwright:v1.63.0-noble`), `typescript` 7.0.2, `@types/bun` 1.4.2, sobre `oven/bun:1.4.2`. O banco é o SQLite embutido no Bun.

## Segurança

Nenhuma porta é publicada e a única rede é `internal`. As suítes de fumaça e de ponta a ponta recusam um `BASE_URL` que não seja `localhost`, `127.0.0.1` ou o serviço `shop` do compose.
