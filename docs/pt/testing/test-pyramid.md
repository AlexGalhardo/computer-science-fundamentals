# Pirâmide de testes completa (MP-TEST-1)

> English version: [docs/en/testing/test-pyramid.md](../../en/testing/test-pyramid.md)

Mini-projeto: [`projects/testing/test-pyramid`](../../../projects/testing/test-pyramid/README.pt-BR.md). Tópicos do quiz: `test-pyramid-levels`, `unit-tests-isolation`, `integration-tests`, `e2e-playwright`, `smoke-regression`, `ci-test-strategy`.

## O conceito

Um nível de teste é definido por quanto do sistema roda durante o teste. Quanto mais coisa roda, mais tipos de erro o teste consegue ver, e mais caro ele fica para escrever, rodar e diagnosticar.

```
            /  e2e  \          3 testes   ~0,7 s cada    navegador + HTTP + SQL
           /---------\
          / integração  \      8 testes   ~8 ms cada    handler + repositório + SQLite
         /---------------\
        /    unitário     \   10 testes   ~4 ms cada    um módulo puro
       /-------------------\
```

A pirâmide é um conselho sobre quantidade: muitos testes baratos na base, poucos caros no topo. O formato oposto (quase tudo em testes de navegador, o "cone de sorvete") dá uma suíte que demora a responder e diz pouco sobre onde está a falha.

Duas suítes do mini-projeto não são níveis. Elas são definidas pelo propósito:

- **Fumaça (smoke)**: poucas checagens rasas no serviço em execução, para saber em um segundo se o build ou a implantação estão quebrados.
- **Regressão**: testes mantidos porque um bug já chegou a um usuário. Cada um reproduz um relato e fica para sempre.

## A aplicação

Uma loja com três produtos e um único carrinho. A partir de um subtotal de 100,00 o carrinho ganha 10% de desconto.

| Parte | Arquivo | Nível que a testa diretamente |
| --- | --- | --- |
| Regras de preço, funções puras em centavos inteiros | `ts/src/pricing.ts` | unitário |
| Carrinho gravado no SQLite, com um upsert | `ts/src/cart-repository.ts` | integração |
| Handler HTTP, corpo validado com Zod | `ts/src/app.ts` | integração |
| Inicialização: banco, migração, porta | `ts/src/server.ts` | fumaça |
| Página e script do navegador | `ts/public/` | ponta a ponta |

## Um bug por nível

`SEEDED_BUG` liga um defeito. A matriz (`docker compose run --rm matrix`) roda cada suíte contra cada bug e falha se uma suíte deixar passar o bug do seu próprio nível.

| Bug semeado | unit | integration | regression | smoke | e2e |
| --- | --- | --- | --- | --- | --- |
| `unit`: `>` no lugar de `>=` no limite | **FAIL** | pass | pass | pass | pass |
| `integration`: o upsert substitui em vez de somar | pass | **FAIL** | pass | pass | **FAIL** |
| `e2e`: a página não redesenha o carrinho | pass | pass | pass | pass | **FAIL** |
| `smoke`: o serviço sobe sem a migração | pass | pass | pass | **FAIL** | **FAIL** |
| `regression`: o arredondamento do bug #17 é removido | pass | pass | **FAIL** | pass | pass |

O que cada linha ensina:

- **`unit`**. Só um carrinho de exatamente 100,00 se comporta diferente. A suíte unitária tem um teste no valor-limite, a de navegador usa 75,00 e 150,00. Um nível mais alto não cobre automaticamente o que um mais baixo cobre: ele roda muito menos casos.
- **`integration`**. O defeito está dentro de um texto SQL. Nenhum teste unitário do TypeScript consegue vê-lo, porque SQL só significa algo para um banco. A suíte de ponta a ponta também falha, 100 vezes mais devagar, e a mensagem dela é "esperava `Keyboard x 2`", sem nenhuma pista do repositório.
- **`e2e`**. O servidor e o banco estão corretos. A página simplesmente continua mostrando o carrinho antigo. Só um teste que lê a tela percebe.
- **`smoke`**. Todo teste em processo monta o seu próprio banco com a migração, então todos passam. O erro está em como o serviço foi iniciado. Três requisições HTTP o encontram em cerca de 10 ms.
- **`regression`**. 10% de 100,05 é 10,005. Os primeiros testes usavam valores redondos. O caso só existe na suíte porque um dia deu errado.

## Quanto custa

| Suíte | Testes | Duração | Por teste |
| --- | --- | --- | --- |
| unit | 10 | 36 ms | 3,6 ms |
| integration | 8 | 61 ms | 7,6 ms |
| regression | 2 | 52 ms | 26,0 ms |
| smoke | 3 | 9 ms | 3,0 ms |
| e2e | 3 | 2070 ms | 690 ms |

Medido dentro do Docker em uma máquina (veja o README). O tempo é um dos custos. Os outros não estão na tabela: a suíte de ponta a ponta precisa de um serviço em execução e de uma imagem de navegador de 2 GB, e os testes dela exigem cuidado com esperas e estado compartilhado para ficarem estáveis.

Esse também é o argumento para a ordem de um pipeline de CI: checagem de tipos e testes unitários primeiro, o navegador por último. Um erro que o primeiro estágio acha em 50 ms não deveria esperar atrás de um estágio de vários segundos.

## Detalhes que valem a leitura no código

- **Injeção de dependência.** `createApp(repository)` recebe o repositório, então um teste de integração passa um repositório montado em um banco em memória e chama o handler sem abrir um socket.
- **Um banco novo por teste.** O `beforeEach` de `tests/integration/cart.test.ts` o cria. Nenhum teste enxerga o que outro gravou.
- **Estado compartilhado nos testes de ponta a ponta.** A loja tem um carrinho para todo mundo. `tests/e2e/shop.e2e.ts` o esvazia antes de cada teste e a suíte roda com um worker.
- **Sem esperas fixas.** As asserções do Playwright (`toHaveText`, `toHaveCount`) repetem a checagem até a página chegar ao estado esperado.
- **Um health check que faz uma pergunta real.** `/health` lê a tabela do carrinho, então "saudável" significa "capaz de atender".
- **O nome do serviço é `shop`, não `app`.** O Chromium força HTTPS no domínio de topo `.app`, e um host chamado `app` cai nessa regra.

## Como rodar

```sh
./setup-unix-test-pyramid.sh        # Linux e macOS
./setup-windows-test-pyramid.ps1    # Windows
```

Cada suíte também tem o seu comando: `docker compose run --rm unit`, `integration`, `regression`, `smoke`, `e2e`, e `matrix` para a demo.
