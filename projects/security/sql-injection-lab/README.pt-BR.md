# sql-injection-lab

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Um laboratório defensivo e local sobre SQL injection. O mesmo pequeno app ElysiaJS (um login e uma busca de produtos em PostgreSQL) existe duas vezes: uma versão que monta o SQL concatenando strings, rotulada `vulnerable`, e uma versão corrigida com consultas parametrizadas, validação de entrada e um papel de banco com menor privilégio. Um único cenário roda contra as duas e mostra por que a concatenação de strings é explorável e por que os marcadores são a correção.

Código: MP-SEC-1. Explicação completa: [docs/pt/security/sql-injection-lab.md](../../../docs/pt/security/sql-injection-lab.md).

> O código em `ts/src/vulnerable/` é vulnerável de propósito. Ele existe só para ser estudado dentro deste laboratório. Nunca copie e nunca importe em outro projeto.

## Tópicos do quiz que ele demonstra

- `security` / `injection`: SQL concatenado, consultas parametrizadas, por que listas de bloqueio e escape manual falham
- `security` / `owasp-threat-modelling`: injeção no OWASP Top 10, defesa em profundidade, menor privilégio como limitação de dano

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-sql-injection-lab.sh        # Linux e macOS
./setup-windows-sql-injection-lab.ps1    # Windows
```

O script constrói a imagem, roda a checagem de tipos e os testes contra um contêiner PostgreSQL em uma rede interna, e remove os contêineres e volumes no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Ela imprime um passo a passo narrado, em inglês, português e espanhol (cada passo tem uma linha `EN:`, uma `PT:` e uma `ES:`): o texto SQL que a versão vulnerável envia ao banco, o cenário contra o app vulnerável (login sem senha, os segredos falsos no resultado da busca), o mesmo cenário contra o app corrigido (as duas tentativas falham, o uso normal funciona), e o efeito do papel somente leitura.

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

| Arquivo | O que prova |
| --- | --- |
| `ts/tests/scenario.test.ts` | App vulnerável: a tautologia faz login e o `UNION` devolve a tabela de segredos. App corrigido: as mesmas duas requisições são barradas, e um login válido, uma senha errada e uma busca normal continuam se comportando corretamente. Outros dois testes chamam as consultas corrigidas diretamente, sem a camada de validação, para mostrar que os marcadores sozinhos barram a injeção |
| `ts/tests/least-privilege.test.ts` | O papel do app corrigido lê `users` e `products`, não lê `secrets`, e não consegue `INSERT`, `UPDATE`, `DELETE` nem `CREATE TABLE`. Nem a consulta vulnerável vaza os segredos por esse papel |
| `ts/tests/network-isolation.test.ts` | Uma requisição de dentro do contêiner para um host externo falha |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `db/init.sql` | Schema, dados falsos, e o papel `lab_readonly` |
| `ts/src/vulnerable/vulnerable-queries.ts` | **Vulnerável de propósito**: SQL montado por concatenação de strings |
| `ts/src/vulnerable/vulnerable-app.ts` | **Vulnerável de propósito**: rotas ElysiaJS sem validação, conectadas como dono do banco |
| `ts/src/fixed/fixed-queries.ts` | As mesmas consultas com marcadores (`$1`, `$2`) |
| `ts/src/fixed/fixed-app.ts` | As mesmas rotas com validação Zod, conectadas com o papel somente leitura |
| `ts/src/scenario.ts` | O único cenário que roda contra os dois apps, em processo |
| `ts/src/demo.ts` | A demo narrada |
| `ts/src/config.ts`, `ts/src/db.ts` | Ambiente validado, pool de conexões, tipos compartilhados |

Rotas dos dois apps: `POST /login` com `{ "username", "password" }`, e `GET /products?q=<termo>`.

## Por que a falha acontece

O código vulnerável monta a consulta assim:

```ts
`SELECT id, username FROM users WHERE username = '${username}' AND password_hash = '${hash}'`
```

O banco recebe uma única string. Ele não tem como saber quais caracteres o programador escreveu e quais o usuário digitou, então interpreta tudo como SQL. **Dado está sendo interpretado como código.** Uma aspa digitada pelo usuário encerra o literal de texto que o programador abriu, e o que vier depois é lido como SQL.

O laboratório usa duas entradas de demonstração, fixas em `ts/src/scenario.ts`:

| Onde | Entrada | O que o banco acaba executando |
| --- | --- | --- |
| Nome de usuário do login | `' OR '1'='1' --` | `... WHERE username = '' OR '1'='1' --' AND password_hash = '...'`. A condição é verdadeira para toda linha e a checagem da senha virou comentário, então o primeiro usuário entra sem senha |
| Termo de busca | `%' UNION SELECT id, label, secret_value FROM secrets --` | A consulta de produtos, seguida de uma segunda consulta cujas linhas são acrescentadas ao resultado. A resposta de uma busca de produtos passa a conter a tabela `secrets` |

Outros dois erros pioram a situação. O app aceita qualquer entrada sem conferir. E ele conecta ao PostgreSQL como dono do banco, então uma consulta injetada lê todas as tabelas.

## Como prevenir

1. **Consultas parametrizadas. Esta é a correção.** O texto do SQL é uma constante com marcadores, e os valores são enviados à parte:

   ```ts
   pool.query("SELECT id, username FROM users WHERE username = $1 AND password_hash = $2", [username, hash]);
   ```

   O PostgreSQL interpreta o texto SQL primeiro e só depois encaixa os valores. Um valor nunca é interpretado, então não tem como virar SQL, não importa quais caracteres tenha. A tautologia passa a ser apenas um nome de usuário que não existe. ORMs e query builders fazem o mesmo por você, desde que você não volte a interpolar strings em SQL cru dentro deles.
2. **Valide a entrada (lista de permissão).** O app corrigido descreve com Zod como é um nome de usuário (`^[a-z0-9-]{3,32}$`) e limita o tamanho do termo de busca. Isso recusa lixo cedo e é boa higiene, mas é uma segunda camada: campos de texto livre, como a busca, precisam aceitar aspas, e só continuam seguros por causa dos marcadores.
3. **Menor privilégio.** O app corrigido conecta como `lab_readonly`, que tem `SELECT` em `users` e `products` e mais nada. Se uma consulta concatenada escapar para o código um dia, ela não lê `secrets` e não escreve. Isso não elimina uma injeção, limita o que ela alcança.
4. **Identificadores não podem ser parâmetros.** Um nome de tabela ou coluna (por exemplo uma opção de "ordenar por") não pode ser enviado como `$1`. Mapeie a escolha do usuário para uma lista fixa de nomes escrita no código, e nunca coloque a entrada em si no texto do SQL.

## O que não funciona como correção

- **Listas de bloqueio.** Remover ou recusar trechos "perigosos" como `'`, `--`, `OR` ou `UNION` falha nas duas direções. Quebra entrada legítima (uma cliente chamada O'Brien, um produto chamado "Union Jack flag"), e é incompleta por natureza: o SQL tem muitas formas de escrever a mesma coisa, e a lista só conhece as que o autor lembrou. O filtro deixa o problema real no lugar, que é dado sendo interpretado como código.
- **Escape manual.** Duplicar aspas com um `replace` é o trabalho do driver do banco feito de forma ruim. É fácil esquecer em uma de cinquenta consultas, não faz nada por valores colocados fora de aspas (um `id` numérico não precisa de aspa para ser injetado), e as regras corretas dependem do banco, da configuração dele e da codificação de caracteres.
- **Só validação.** Útil, mas um campo de texto livre não pode proibir aspas, e basta um campo que alguém esqueceu de validar.
- **Esconder mensagens de erro.** Não mostrar erros do banco ao usuário é correto, mas a consulta continua injetável sem elas.
- **Stored procedures que concatenam.** Uma procedure que monta texto SQL a partir dos argumentos e o executa tem a mesma falha, só que em outro lugar.
- **Só menor privilégio.** Neste laboratório o papel somente leitura impede o `UNION` de ler `secrets`, mas o desvio do login continuaria funcionando, porque ler `users` é algo de que o app legitimamente precisa.

## Escopo de segurança do laboratório

- Tudo roda localmente em Docker. A rede do compose é `internal: true`, então nenhum contêiner alcança a internet, e um teste prova isso.
- **Nenhuma porta é publicada no host.** O plano permitia ligar o app a `127.0.0.1`. Esta área vai além: os apps nem chegam a subir como servidores. Os testes e a demo os chamam em processo, então o cenário não tem como ser apontado para uma URL.
- Todos os dados são falsos: usuários como `alice-fake`, senhas como `lab-fake-password`, e "segredos" como `FAKE-CARD-0000-0000-0000-0001`.
- As duas entradas de demonstração só fazem sentido contra o schema deste laboratório. Não há scanner, lista de payloads nem técnica de evasão aqui.
- O pacote é `private` e os arquivos vulneráveis são rotulados como tal no nome e nas primeiras linhas.

## Versões

| Componente | Versão |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| pg (node-postgres) | 8.23.1 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
