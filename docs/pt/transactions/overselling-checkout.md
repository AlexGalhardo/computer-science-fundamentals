# Venda além do estoque no checkout (MP-TX-2)

> English version: [docs/en/transactions/overselling-checkout.md](../../en/transactions/overselling-checkout.md) · Versión en español: [docs/es/transactions/overselling-checkout.md](../../es/transactions/overselling-checkout.md)

Mini-projeto: [`projects/transactions/overselling-checkout`](../../../projects/transactions/overselling-checkout/README.pt-BR.md). Tópicos do quiz: `locking`, `isolation-levels-anomalies`, `acid-properties`, `mvcc`.

## O bug

```text
comprador A: SELECT stock  -> 10
comprador B: SELECT stock  -> 10      (A ainda não gravou)
comprador A: UPDATE stock = 9, INSERT pedido
comprador B: UPDATE stock = 9, INSERT pedido     <- dois pedidos, uma unidade a menos
```

Isto é uma **atualização perdida** causada por uma leitura, uma decisão na aplicação e uma escrita baseada na leitura antiga. Envolver tudo em `BEGIN ... COMMIT` não resolve: em `READ COMMITTED`, o padrão do PostgreSQL, um `SELECT` simples não pega bloqueio de linha e toda transação fica livre para ler o mesmo estoque. Uma transação dá atomicidade (a baixa do estoque e o pedido andam juntos), que é uma promessa diferente de isolamento.

A coluna de estoque nunca fica negativa, porque cada comprador grava um valor absoluto. O estrago só aparece na tabela `orders`, e é por isso que este bug sobrevive a uma olhada rápida no produto.

## Três correções

| Correção | Ideia | O que o comprador paga |
| --- | --- | --- |
| Otimista, coluna de versão | Ler `stock` e `version`. Gravar com `WHERE version = <a que eu li>`. Zero linhas atualizadas significa que outro ganhou: ler de novo e tentar outra vez | Trabalho perdido e novas tentativas quando muitos disputam a mesma linha |
| Pessimista, `SELECT ... FOR UPDATE` | Bloquear a linha já na leitura. O próximo comprador espera no seu próprio `SELECT` e depois vê o estoque novo | Espera na fila. O bloqueio fica preso enquanto a aplicação pensa |
| `SERIALIZABLE` com nova tentativa | O mesmo código do bug, nível de isolamento mais forte. O PostgreSQL aborta com SQLSTATE `40001` as transações que não poderiam ter rodado uma depois da outra | A aplicação precisa capturar `40001` e executar a transação inteira de novo |

Todas as novas tentativas usam uma pausa aleatória curta (jitter), para os perdedores não voltarem no mesmo instante, e param depois de um número máximo de tentativas com um `503` honesto.

Um único comando SQL, `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0`, também corrige este caso específico, porque a conferência e a escrita acontecem dentro do banco sobre a linha atual. O mini-projeto mantém a leitura e a escrita separadas de propósito: checkouts reais trabalham entre uma e outra (preços, cupons, pagamento), e é aí que as três correções acima são necessárias.

## Resultados

A tabela versionada está no [README](../../../projects/transactions/overselling-checkout/README.pt-BR.md#resultados) e em `results/results.md`, com a máquina e as versões. Na execução medida, `naive` criou de 150 a 180 pedidos para 10 unidades, e cada correção criou exatamente 10 em todas as rodadas.

Como ler a coluna de vazão sem se enganar:

- Só 10 das 200 requisições podem dar certo. Depois que o estoque chega a zero, os demais compradores só leem e recebem `409`, e a rapidez disso domina o número.
- `pessimistic` é a mais lenta porque os 200 compradores ficam na mesma fila, inclusive os 190 que só vão descobrir que o produto esgotou.
- `serializable` e `optimistic` não fazem fila para ler, então as respostas de esgotado voltam rápido. O custo delas são as novas tentativas dos perdedores, que cresce com o número de unidades realmente disputadas.
- A dispersão entre rodadas é grande (veja a coluna ±). Uma diferença menor que ela não é resultado.

A carga é uma única linha quente. Com muitos produtos e pouca disputa, o quadro muda: o controle otimista quase nunca tenta de novo, e os bloqueios pessimistas raramente são esperados.

## Regras do teste de carga

O k6 roda da imagem fixada `grafana/k6:2.3.0` na rede interna do docker-compose. Nenhuma porta é publicada, o alvo padrão é o serviço `api`, e o script lança erro antes de enviar qualquer coisa quando `BASE_URL` não é `localhost`, `127.0.0.1` ou `api`. A saída bruta do k6 vai para `k6-results/`, que o git ignora.

## Critérios de aceite

| Item | Como é verificado |
| --- | --- |
| MP-TX-2.1 checkout ingênuo vende mais de 10 com 200 compradores concorrentes | `./load-test-unix.sh` (ou `.ps1`): a etapa de relatório falha a menos que toda rodada `naive` tenha vendido demais. Também `tests/checkout.test.ts` |
| MP-TX-2.2 cada correção vende exatamente 10 | Mesmo comando: a etapa de relatório falha a menos que toda rodada de toda correção termine com 10 pedidos e estoque 0. Também `tests/checkout.test.ts` |
| MP-TX-2.3 tabela com requisições por segundo e requisições rejeitadas | `results/results.md`, escrito pela etapa de relatório |

## Como rodar

```sh
cd projects/transactions/overselling-checkout
./setup-unix-overselling-checkout.sh     # testes
./load-test-unix.sh                      # k6 e a tabela de resultados
```
