# Laboratório de SQL injection (MP-SEC-1)

> English version: [docs/en/security/sql-injection-lab.md](../../en/security/sql-injection-lab.md) · Versión en español: [docs/es/security/sql-injection-lab.md](../../es/security/sql-injection-lab.md)

Mini-projeto: [`projects/security/sql-injection-lab`](../../../projects/security/sql-injection-lab/README.pt-BR.md). Tópicos do quiz: `injection`, `owasp-threat-modelling`.

Este laboratório é defensivo e educacional. Ele roda apenas localmente, em Docker, em uma rede interna sem porta publicada, e todos os dados são falsos. O código vulnerável existe para ser comparado com a correção, nunca para ser reaproveitado.

## O conceito

Uma injeção acontece sempre que um programa monta um comando para outro interpretador (SQL, um shell, HTML) misturando o próprio texto com texto que veio de fora. O interpretador recebe uma única string e interpreta tudo. Se o texto de fora contém os caracteres que têm significado naquela linguagem, **dado vira código**.

SQL injection é o caso mais conhecido, e injeção como categoria está no OWASP Top 10 desde a primeira edição. A causa é sempre a mesma, e a cura também: manter código e dado em canais separados.

## A falha

```ts
`SELECT id, username FROM users WHERE username = '${username}' AND password_hash = '${hash}'`
```

Com o nome de usuário `' OR '1'='1' --`, o banco recebe:

```sql
SELECT id, username FROM users WHERE username = '' OR '1'='1' --' AND password_hash = '...'
```

A aspa fechou o literal, `OR '1'='1'` é verdadeiro para toda linha, e `--` transformou a checagem da senha em comentário. O app pega a primeira linha e faz o login daquele usuário.

A busca tem a mesma falha em um padrão `LIKE`. Com um `UNION SELECT` acrescentado, o resultado de uma busca de produtos carrega as linhas de uma tabela que nenhuma rota deveria ler. Na versão vulnerável isso alcança todas as tabelas, porque o app também conecta como dono do banco.

As duas entradas estão fixas em `ts/src/scenario.ts` e só fazem sentido contra o schema do laboratório.

## A correção

| Camada | O que faz | O que não faz |
| --- | --- | --- |
| Consultas parametrizadas | O texto SQL é uma constante com `$1`, `$2`. Os valores são encaixados depois que o texto foi interpretado, então eles próprios nunca são interpretados. **Isto elimina a falha** | Não parametriza identificadores (nomes de tabela e coluna): mapeie-os para uma lista fixa no código |
| Validação de entrada (Zod) | Recusa entrada fora do formato esperado, como um nome de usuário com aspas | Não pode proibir aspas em texto livre, então nunca substitui os marcadores |
| Papel com menor privilégio | O app corrigido conecta como `lab_readonly`: `SELECT` apenas em `users` e `products` | Não barra uma injeção que fique dentro do que o papel pode ler |

O que não funciona: listas de bloqueio de palavras ou caracteres "perigosos" (quebram entrada legítima e nunca cobrem todas as formas de escrever o mesmo SQL), escapar aspas à mão (esquecido em uma consulta, inútil para valores fora de aspas, dependente do banco e da codificação), só validação, esconder mensagens de erro, e stored procedures que concatenam texto por conta própria.

Um detalhe encontrado ao construir o laboratório: com um schema Zod na opção `query` de uma rota, o Elysia 1.4 quebra o valor da query nas vírgulas, formando um array, antes de validar. Por isso a rota de busca corrigida valida o termo com Zod dentro do handler, e uma busca legítima com vírgula é aceita e chega ao banco como um único parâmetro.

## O que os testes provam

Uma função de cenário faz as mesmas cinco requisições aos dois apps: um login válido, um login com senha errada, o login com a tautologia, uma busca normal e a busca com `UNION`.

| Item | Como é verificado |
| --- | --- |
| MP-SEC-1.1 rede interna, dados falsos, sem acesso externo | `tests/network-isolation.test.ts`: uma requisição a `http://example.com` falha de dentro do contêiner. O `docker-compose.yml` não publica porta e a única rede é `internal: true` |
| MP-SEC-1.2 a versão vulnerável tem as duas falhas | `tests/scenario.test.ts`, bloco vulnerável: a tautologia responde `200` com um usuário logado, e a busca com `UNION` devolve os três segredos falsos |
| MP-SEC-1.3 a versão corrigida as barra e o uso normal funciona | `tests/scenario.test.ts`, bloco corrigido: a tautologia responde `422`, a busca com `UNION` responde `200` com zero linhas, um login válido e uma busca normal continuam funcionando. Dois testes chamam as consultas parametrizadas diretamente, sem validação, e obtêm o mesmo resultado seguro. `tests/least-privilege.test.ts`: `lab_readonly` recebe SQLSTATE `42501` ao ler `secrets` ou ao escrever |
| MP-SEC-1.4 documentação | Os três READMEs têm "Por que a falha acontece", "Como prevenir" e "O que não funciona como correção" |

## Como rodar

```sh
cd projects/security/sql-injection-lab
./setup-unix-sql-injection-lab.sh     # checagem de tipos e testes, depois a limpeza
docker compose run --rm demo          # passo a passo narrado
docker compose down -v --remove-orphans
```
