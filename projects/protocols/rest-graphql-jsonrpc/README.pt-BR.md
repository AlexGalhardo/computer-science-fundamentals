# rest-graphql-jsonrpc

> English version: [README.md](README.md)

Um domínio pequeno (autores, livros, resenhas) exposto em três estilos de API pelo mesmo servidor ElysiaJS: **REST** (`/rest/...`), **GraphQL** (`/graphql`) e **JSON-RPC 2.0** (`/rpc`). As regras do domínio são escritas uma vez, então a única coisa que muda é como uma chamada viaja sobre HTTP. O mini-projeto ensina o que cada estilo custa e oferece: quantas idas e voltas uma tela precisa, quantos bytes voltam, onde o resultado de uma chamada é informado, e por que o GraphQL precisa de agrupamento em lote para evitar o problema N+1.

Explicação dos conceitos: [docs/pt/protocols/rest-graphql-jsonrpc.md](../../../docs/pt/protocols/rest-graphql-jsonrpc.md).

## A mesma chamada nos três estilos

"Me dê o livro 7":

```http
GET /rest/books/7 HTTP/1.1
```

```http
POST /graphql HTTP/1.1
Content-Type: application/json

{"query":"query Card($id: Int!) { book(id: $id) { id title year pages } }","variables":{"id":7}}
```

```http
POST /rpc HTTP/1.1
Content-Type: application/json

{"jsonrpc":"2.0","method":"books.get","params":{"id":7},"id":1}
```

E o "livro 9999", que não existe:

| Estilo | Status HTTP | Onde está a falha |
| --- | --- | --- |
| REST | `404` | no próprio código de status |
| GraphQL | `200` | `"data": {"book": null}` em uma leitura, um item em `"errors"` com `extensions.code` em uma mutation que falhou |
| JSON-RPC | `200` | `"error": {"code": -32004, "message": "..."}` no corpo, sem `"result"` |

## Latência e tamanho da resposta por estilo

Medido por `docker compose run --rm bench` (relatório completo, com máquina e método, em [results/results.md](results/results.md)). Cliente, servidor e PostgreSQL rodaram na mesma máquina, em loopback, com corpos sem compressão.

| Leitura | Estilo | Requisições HTTP | Bytes da requisição | Bytes da resposta | Comandos SQL | Média (ms) | Desvio padrão (ms) | p50 (ms) | p95 (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| lista (id e título de 50 livros) | rest | 1 | 0 | 27596 | 1 | 1.505 | 0.670 | 0.946 | 3.548 |
| lista (id e título de 50 livros) | graphql | 1 | 101 | 2999 | 1 | 1.955 | 0.775 | 1.226 | 4.521 |
| lista (id e título de 50 livros) | jsonrpc | 1 | 68 | 27630 | 1 | 1.645 | 0.497 | 0.973 | 3.256 |
| detalhe (4 campos de 1 livro) | rest | 1 | 0 | 538 | 1 | 0.605 | 0.113 | 0.502 | 0.764 |
| detalhe (4 campos de 1 livro) | graphql | 1 | 96 | 95 | 1 | 1.184 | 0.219 | 0.891 | 1.523 |
| detalhe (4 campos de 1 livro) | jsonrpc | 1 | 63 | 572 | 1 | 0.951 | 0.561 | 0.526 | 0.800 |
| aninhada (1 livro, seu autor, suas resenhas) | rest | 3 | 0 | 1322 | 4 | 1.669 | 0.164 | 1.569 | 2.245 |
| aninhada (1 livro, seu autor, suas resenhas) | graphql | 1 | 129 | 229 | 3 | 1.809 | 0.260 | 1.552 | 3.259 |
| aninhada (1 livro, seu autor, suas resenhas) | jsonrpc | 2 | 208 | 1427 | 4 | 1.805 | 0.111 | 1.585 | 2.511 |

Como ler:

- **É no tamanho da resposta que os estilos realmente diferem.** Na lista, REST e JSON-RPC devolvem todos os campos de todos os livros (cerca de 27,6 kB) quando a tela queria dois campos: isso é **over-fetching**. O GraphQL devolve 3,0 kB, cerca de 9 vezes menos.
- **Idas e voltas.** A leitura aninhada custa três requisições ao REST e duas ao JSON-RPC (um lote, depois o autor, cujo id só é conhecido quando o livro chega): isso é **under-fetching**. O GraphQL precisa de uma.
- **A latência em loopback não mostra o ganho de ter menos idas e voltas.** Aqui uma ida e volta custa uma fração de milissegundo, então três requisições REST levam mais ou menos o mesmo que uma requisição GraphQL, e as diferenças entre estilos ficam dentro do desvio padrão na lista e na leitura aninhada. O GraphQL é o mais lento na leitura de detalhe, que é minúscula, porque analisa e valida uma consulta a cada chamada. Em uma rede real, em que cada ida e volta custa dezenas de milissegundos, o número de requisições domina e a ordem muda.
- Uma máquina, um tamanho de dados, uma execução. Isto não é um ranking de estilos.

## N+1 no GraphQL e a correção com lote

A requisição pede 100 livros, cada um com seu autor e suas resenhas:

```graphql
query Shelf($limit: Int!) { books(limit: $limit) { id title author { name } reviews { rating } } }
```

| Endpoint | Comandos SQL | Média (ms) | Desvio padrão (ms) |
| --- | ---: | ---: | ---: |
| `/graphql-naive` | 201 | 31.666 | 6.986 |
| `/graphql` | 3 | 7.579 | 5.966 |

Os resolvers ingênuos buscam um autor e uma lista de resenhas **por livro**: 1 + 100 + 100 = 201 comandos. Com o loader em lote de [ts/src/loader.ts](ts/src/loader.ts) cada resolver só registra uma chave, e um `WHERE id = ANY(...)` por relação responde todas: 1 + 1 + 1 = 3 comandos, para a mesma resposta. O servidor informa a contagem no cabeçalho de resposta `x-db-queries`, e um teste confere os dois números.

## Tópicos do quiz que ele demonstra

Área `protocols`:

- `rest`: recursos e métodos, códigos de status das operações CRUD, over-fetching e under-fetching
- `graphql`: seleção de campos, endpoint único, erros no corpo, o problema N+1 e o agrupamento em lote
- `json-rpc-grpc`: requisição, resposta, objeto de erro, notificação e lote do JSON-RPC 2.0
- `http-semantics`: 201 com `Location`, 404, 422

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-rest-graphql-jsonrpc.sh        # Linux e macOS
./setup-windows-rest-graphql-jsonrpc.ps1    # Windows
```

O script constrói a imagem, sobe um PostgreSQL local em uma rede interna, roda a checagem de tipos e os testes, e remove os contêineres.

## Benchmark (a demo)

```sh
docker compose run --rm bench && docker compose down -v
```

Mostra as duas tabelas acima e grava `results/results.md` e `results/results.json`. `BENCH_ITERATIONS` (padrão 300) e `BENCH_ROUNDS` (padrão 3) mudam o tamanho da execução.

## Testes

```sh
docker compose run --rm ts-test && docker compose down -v
```

| Arquivo | O que prova |
| --- | --- |
| `ts/tests/behaviour.test.ts` | uma suíte de comportamento (9 testes) passa nos três estilos |
| `ts/tests/styles.test.ts` | códigos de status no REST, `errors` no GraphQL, códigos de erro, notificação e lote no JSON-RPC, N+1 com 201 comandos contra 3, requisições por leitura aninhada |
| `ts/tests/unit.test.ts` | o loader em lote, as estatísticas, os dados determinísticos |

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `ts/src/domain.ts` | as regras do domínio e o SQL, compartilhados pelos três estilos |
| `ts/src/rest.ts`, `ts/src/graphql.ts`, `ts/src/jsonrpc.ts` | um adaptador por estilo |
| `ts/src/loader.ts` | o loader em lote que corrige o N+1 |
| `ts/src/clients.ts` | três clientes atrás de uma interface, com um medidor de requisições e bytes |
| `ts/src/bench.ts` | o benchmark |
| `ts/sql/schema.sql`, `ts/src/seed.ts` | tabelas e dados determinísticos (25 autores, 120 livros, 360 resenhas) |

Tudo é local: os serviços rodam em uma rede interna do docker-compose, nenhuma porta é publicada no host, e a senha do banco é um valor de laboratório claramente falso.

## Versões

| Componente | Versão |
| --- | --- |
| Bun | 1.4.2 (`oven/bun:1.4.2`) |
| PostgreSQL | 18.6 (`postgres:18.6-alpine`) |
| ElysiaJS | 1.4.30 |
| graphql (graphql-js) | 17.0.2 |
| pg | 8.23.1 |
| Zod | 4.6.5 |

**Por que `graphql`.** É o graphql-js, a implementação de referência da especificação, mantida pela GraphQL Foundation, e o motor sobre o qual os servidores populares (Apollo Server, GraphQL Yoga) são construídos. Roda no Bun sem adaptador, e não precisa de plugin para ficar atrás de uma rota `POST` do ElysiaJS, o que mantém a parte HTTP visível: o handler tem uma dúzia de linhas em `ts/src/graphql.ts`. O loader em lote é escrito à mão em vez de adicionar o pacote `dataloader`, porque o mecanismo é a lição.
