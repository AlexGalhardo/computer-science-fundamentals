# Servidor HTTP sobre TCP puro (MP-PROTO-3)

> English version: [docs/en/protocols/http-server-raw-tcp.md](../../en/protocols/http-server-raw-tcp.md)

Mini-projeto: [`projects/protocols/http-server-raw-tcp`](../../../projects/protocols/http-server-raw-tcp/README.pt-BR.md). Tópico do quiz: `http-semantics`.

## A pergunta

O TCP entrega a um programa um fluxo de bytes, sem nenhuma noção de "mensagem". O HTTP/1.1 é um conjunto de regras para cortar esse fluxo em requisições e respostas. Escrever o servidor sem uma biblioteca HTTP obriga cada regra a aparecer no código: onde uma linha termina, onde os cabeçalhos terminam, onde o corpo termina, e quando a conexão pode ser reaproveitada.

## O formato de uma mensagem

```
linha de requisição   POST /echo HTTP/1.1\r\n
campos de cabeçalho   Host: localhost\r\n
                      Content-Length: 11\r\n
linha vazia           \r\n
corpo                 hello world
```

- Toda linha termina com CR LF (`\r\n`, bytes `0d 0a`).
- A **linha de requisição** tem três partes separadas por um espaço: método, alvo, versão. Uma resposta começa com uma **linha de status**: versão, código de status, frase de motivo.
- Cada **campo de cabeçalho** é `Nome: valor`. Os nomes não diferenciam maiúsculas de minúsculas. Não é permitido espaço antes dos dois-pontos.
- Uma **linha vazia** encerra os cabeçalhos. É o único separador entre cabeçalhos e corpo.
- O **corpo** são bytes puros. Nada dentro dele marca o seu fim.

Os bytes anotados de uma troca real estão no [README](../../../projects/protocols/http-server-raw-tcp/README.pt-BR.md#rastro-de-fio-os-bytes-crus-de-uma-requisição-e-de-uma-resposta).

## Onde o corpo termina?

Esta é a pergunta central do HTTP/1.1, porque a conexão continua aberta e a próxima mensagem vem logo em seguida. Há duas respostas:

| | `Content-Length: N` | `Transfer-Encoding: chunked` |
| --- | --- | --- |
| Quando | o tamanho é conhecido antes do envio | o tamanho ainda não é conhecido |
| Como | ler exatamente N bytes | ler pedaços até o de tamanho zero |
| No fio | `hello world` | `b\r\nhello world\r\n0\r\n\r\n` |

Um pedaço (chunk) é o tamanho em **hexadecimal**, CR LF, os dados, CR LF. O mini-projeto lê corpos de requisição por `Content-Length` e escreve **respostas** em chunked na rota `/stream`, enviando cada pedaço assim que ele é produzido: com `curl -N` as linhas aparecem uma a uma.

Uma mensagem com os dois cabeçalhos é uma fonte clássica de ataques (request smuggling): um proxy que acredita em um e um servidor que acredita no outro discordam sobre onde a requisição termina, e os bytes que sobram são lidos como uma nova requisição. Este servidor recusa uma requisição com `Transfer-Encoding` (`501`) em vez de adivinhar, e recusa dois valores de `Content-Length` que discordam (`400`).

## Análise defensiva

Um parser lê o que um desconhecido envia, então é escrito contra a pior entrada:

- **Limites em tudo.** Linha de requisição, seção de cabeçalhos, número de cabeçalhos e corpo têm cada um o seu máximo. Sem eles, um cliente que nunca envia o fim de uma linha faz o servidor segurar memória para sempre. O parser para de ler assim que um limite é ultrapassado, e um teste prova isso com um leitor que conta os bytes consumidos.
- **O status certo para cada recusa.** `400` para uma mensagem malformada, `414` para uma linha de requisição longa demais, `431` para cabeçalhos grandes demais, `413` para um corpo grande demais, `505` para uma versão não suportada.
- **Rígido onde a ambiguidade é perigosa.** Um espaço antes dos dois-pontos, um cabeçalho continuado na linha seguinte, um CR solto, um `Content-Length` que não é só dígitos: tudo recusado, porque dois programas lendo os mesmos bytes de formas diferentes é a raiz do smuggling.
- **Um erro, e fecha.** Depois de uma requisição malformada o servidor não tem como saber onde a próxima começa, então responde uma vez e fecha a conexão.

## Keep-alive

Abrir uma conexão TCP custa uma ida e volta (e o TLS custa mais). Por isso o HTTP/1.1 mantém a conexão aberta por padrão: depois da resposta o servidor espera outra requisição no mesmo socket. Ela fecha quando um dos lados envia `Connection: close`, quando a conexão fica ociosa por tempo demais, ou depois de um erro. O HTTP/1.0 é o contrário: fecha, a menos que o cliente peça `Connection: keep-alive`.

No código isso é um laço em volta de "ler uma requisição, escrever uma resposta", com **um único leitor com buffer para a conexão inteira**. Um cliente pode enviar a segunda requisição antes de a primeira resposta chegar (pipelining), então bytes da requisição 2 já podem estar no buffer quando a requisição 1 termina. Eles não se perdem porque o parser consumiu exatamente os bytes da requisição 1.

## Roteamento

O roteador responde a duas perguntas, e cada uma tem o seu erro:

- Alguma rota conhece este **caminho**? Se não, `404 Not Found`.
- Alguma rota deste caminho aceita este **método**? Se não, `405 Method Not Allowed`, com um cabeçalho `Allow` listando os métodos que funcionam.

O `HEAD` é atendido pelo handler do `GET`: mesmo status e mesmos cabeçalhos, incluindo o `Content-Length` que o corpo teria, e nenhum corpo.

## Conferido por clientes que não escrevemos

Um servidor testado só com o seu próprio parser pode estar errado de forma coerente. Três clientes independentes conferem este:

- O cliente `net/http` do Go, nos testes de unidade: ele decodifica a resposta em chunked e informa que **reaproveitou** a conexão na segunda e na terceira requisição.
- O **curl**: parâmetros, POST, chunked (decodificado e com `--raw`), reaproveitamento de conexão, `HEAD`, 404, 405, 431.
- O **Chromium**, headless: ele renderiza a página HTML, e as chamadas `fetch()` da página recebem o texto esperado, inclusive o stream em chunked.

## Critérios de aceitação

| Item | Como é verificado |
| --- | --- |
| MP-PROTO-3.1 parser de requisição | `go/httpraw/request_test.go`: 22 requisições malformadas e 6 grandes demais, cada uma com o status esperado. `docker compose run --rm go-test` |
| MP-PROTO-3.2 roteador, keep-alive e respostas em chunked | `docker compose run --rm curl-check` e `docker compose run --rm browser-check`, além de `go/app/app_test.go` |
| MP-PROTO-3.3 rastro de fio | o README mostra os bytes anotados de uma requisição e de uma resposta, produzidos por `docker compose run --rm trace` |

## Como rodar

```sh
cd projects/protocols/http-server-raw-tcp
./setup-unix-http-server-raw-tcp.sh        # ou ./setup-windows-http-server-raw-tcp.ps1
docker compose run --rm trace
```
