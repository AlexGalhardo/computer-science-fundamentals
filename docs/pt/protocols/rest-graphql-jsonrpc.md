# REST, GraphQL e JSON-RPC (MP-PROTO-1)

> English version: [docs/en/protocols/rest-graphql-jsonrpc.md](../../en/protocols/rest-graphql-jsonrpc.md)

Mini-projeto: [`projects/protocols/rest-graphql-jsonrpc`](../../../projects/protocols/rest-graphql-jsonrpc/README.pt-BR.md). Tópicos do quiz: `rest`, `graphql`, `json-rpc-grpc`, `http-semantics`.

## A pergunta

Uma API é uma forma de pedir que um servidor faça algo. Os três estilos respondem de modo diferente a três perguntas: **o que o cliente nomeia** (um recurso, um conjunto de campos, um procedimento), **quem decide o formato da resposta**, e **onde o resultado é informado**. O mini-projeto expõe um domínio (autores, livros, resenhas) pelos três, com as regras do domínio escritas uma vez em `ts/src/domain.ts`, de modo que tudo o que difere é o estilo.

## Os três estilos lado a lado

| | REST | GraphQL | JSON-RPC 2.0 |
| --- | --- | --- | --- |
| O cliente nomeia | um recurso, pela URL | os campos que quer, em uma consulta | um procedimento, pelo nome |
| Endpoints | uma URL por recurso | um (`/graphql`) | um (`/rpc`) |
| A operação está | no método HTTP | no texto da consulta (`query`, `mutation`) | em `"method"` no corpo |
| Formato da resposta decidido por | o servidor | o cliente | o servidor |
| Resultado informado em | código de status HTTP | `data` e `errors` no corpo | `result` ou `error` no corpo |
| Contrato | convenção (ou OpenAPI) | o schema tipado, obrigatório | convenção |
| Cache HTTP de leituras | funciona: `GET` em uma URL | difícil: `POST` para uma URL | difícil: `POST` para uma URL |

### REST

A URL é um substantivo (`/rest/books/7`), o método é o verbo, e o código de status é o resultado: `200` para uma leitura, `201` com o cabeçalho `Location` para uma criação, `404` para um recurso que não existe, `422` para um conteúdo que quebra uma regra. Como o significado está em partes padronizadas do HTTP, software genérico o entende: um cache pode guardar um `GET`, um proxy pode repetir um `PUT` idempotente, e uma ferramenta de monitoramento pode contar os `5xx` sem ler corpo nenhum.

O preço é que o servidor fixa a representação. `GET /rest/books` devolve livros inteiros quando a tela queria dois campos (**over-fetching**), e um livro com autor e resenhas custa três requisições (**under-fetching**).

### GraphQL

Há um endpoint e um schema tipado. O cliente envia uma consulta que lista os campos que quer, seguindo as relações até a profundidade necessária, e a resposta tem exatamente esse formato. Uma requisição substitui as três do REST, e a lista carrega só os dois campos.

O preço é pago no servidor e pela maquinaria HTTP. Toda requisição é um `POST` para a mesma URL, então o cache HTTP comum não se aplica, e pela convenção usual o status é `200` mesmo quando a operação falhou: o cliente precisa ler `errors`. E o servidor executa a consulta campo a campo, o que leva ao N+1 (abaixo).

### JSON-RPC 2.0

O corpo nomeia um procedimento e seus parâmetros, e a resposta traz `result` **ou** `error`, nunca os dois, com o `id` da requisição ecoado para que as duas possam ser casadas. Uma requisição sem `id` é uma **notificação**, que não recebe resposta nenhuma, nem mesmo um erro. Um array de requisições é um **lote**: uma ida e volta HTTP, respostas em qualquer ordem, casadas pelo `id`.

É o mais simples dos três de implementar (a API inteira é uma tabela de nomes e funções em `ts/src/jsonrpc.ts`) e não depende do HTTP. O preço é que nada genérico distingue uma leitura segura de uma escrita, e que um lote só economiza idas e voltas entre chamadas que não dependem uma da outra: o autor de um livro não pode ser pedido no mesmo lote que o livro, porque o id dele está na resposta do livro.

Os códigos de erro predefinidos são `-32700` (o corpo não é JSON), `-32600` (não é um objeto de requisição válido), `-32601` (método desconhecido), `-32602` (parâmetros inválidos) e `-32603` (erro interno). A faixa de `-32000` a `-32099` fica para o servidor, e o mini-projeto usa `-32004` para "não encontrado".

## Uma suíte de comportamento, três estilos

`ts/src/clients.ts` tem três clientes atrás de uma interface (`listTitles`, `getCard`, `getPage`, `addReview`). `ts/tests/behaviour.test.ts` roda os mesmos nove testes contra cada um: leituras, um livro que não existe, uma escrita, uma escrita em um livro que não existe, uma nota inválida. Cada cliente traduz o vocabulário de falha do seu estilo de volta para os mesmos dois tipos, "não encontrado" e "inválido":

| Erro de domínio | REST | GraphQL | JSON-RPC |
| --- | --- | --- | --- |
| não encontrado | status `404` | `extensions.code: "NOT_FOUND"` | código de erro `-32004` |
| inválido | status `422` | `extensions.code: "BAD_USER_INPUT"` | código de erro `-32602` |

## O problema N+1

Um servidor GraphQL responde a uma consulta chamando uma função, um **resolver**, por campo. Para `books { author { name } }` o resolver de `author` roda uma vez por livro. Se ele executa `SELECT ... WHERE id = $1`, uma lista de 100 livros envia 1 comando para a lista e 100 para os autores. Peça também as resenhas e são 201. Cada comando é rápido. A soma não é, e ela cresce com o tamanho da lista.

A correção é o **agrupamento em lote**. O resolver não consulta: ele pede uma chave a um loader e recebe uma promise. O loader junta todas as chaves pedidas durante a volta atual do event loop e então envia um comando para todas, `WHERE id = ANY(...)`. O mini-projeto escreve esse loader à mão em cerca de 40 linhas (`ts/src/loader.ts`), que é a ideia por trás da biblioteca DataLoader. Dois detalhes importam:

- O loader espera com `setImmediate`, que roda depois que o executor chamou os resolvers de todos os itens da lista, então todas as chaves já foram coletadas.
- Um loader vive por **uma requisição**. O cache dele evita chaves repetidas dentro da requisição e não pode vazar linhas entre clientes.

O servidor conta seus comandos SQL por requisição e devolve a contagem no cabeçalho `x-db-queries`. O teste confere 201 comandos em `/graphql-naive` e 3 em `/graphql`, com a mesma resposta.

## Lendo as tabelas

Os números versionados estão no [README](../../../projects/protocols/rest-graphql-jsonrpc/README.pt-BR.md#latência-e-tamanho-da-resposta-por-estilo) e em `results/results.md`.

- Tamanho: a lista é cerca de 9 vezes menor no GraphQL (3,0 kB contra 27,6 kB), e a leitura aninhada cerca de 6 vezes menor.
- Idas e voltas na leitura aninhada: REST 3, JSON-RPC 2, GraphQL 1.
- Latência: em loopback uma ida e volta custa uma fração de milissegundo, então os estilos ficam dentro do desvio padrão um do outro na lista e na leitura aninhada, e o GraphQL é o mais lento na leitura pequena de detalhe, porque analisa e valida a consulta a cada chamada. O ganho de uma única ida e volta aparece em uma rede real, em que cada uma custa dezenas de milissegundos. O benchmark não simula isso, e diz isso.
- N+1: 201 comandos contra 3, e cerca de 4 vezes mais lento nesta execução, com o banco na mesma máquina.

O executor de benchmarks do repositório (`bun run bench`, hyperfine) sobe contêineres sem rede, então não serve para um benchmark que precisa de banco de dados. Este mede dentro do processo, com aquecimento descartado, várias rodadas, a dispersão informada, e a máquina, as versões e o comando registrados.

## Qual escolher

- **REST** quando a API é pública ou de vida longa, os dados se encaixam em recursos, e o cache HTTP e as ferramentas padrão importam.
- **GraphQL** quando muitas telas diferentes leem os mesmos dados conectados e cada uma precisa de uma fatia diferente, e a equipe pode pagar pelo cuidado no servidor (lote, limites de profundidade e de complexidade).
- **JSON-RPC** para ações que não são recursos (`reports.rebuild`), para serviços internos, e para transportes que não são HTTP.

## Critérios de aceitação

| Item | Como é verificado |
| --- | --- |
| MP-PROTO-1.1 mesmo domínio nos três estilos | `ts/tests/behaviour.test.ts`: uma suíte de 9 testes, executada com `describe.each` contra REST, GraphQL e JSON-RPC |
| MP-PROTO-1.2 N+1 e a correção com lote | `ts/tests/styles.test.ts`, "the N+1 problem": 201 comandos em `/graphql-naive`, 3 em `/graphql` |
| MP-PROTO-1.3 tabela de latência e tamanho | `docker compose run --rm bench` grava `results/results.md`: uma linha por estilo para uma lista, um detalhe e uma leitura aninhada |

## Como rodar

```sh
cd projects/protocols/rest-graphql-jsonrpc
./setup-unix-rest-graphql-jsonrpc.sh        # ou ./setup-windows-rest-graphql-jsonrpc.ps1
docker compose run --rm bench && docker compose down -v
```
