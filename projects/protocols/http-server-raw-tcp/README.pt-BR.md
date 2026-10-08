# http-server-raw-tcp

> English version: [README.md](README.md)

Um servidor HTTP/1.1 escrito em Go diretamente sobre sockets TCP, **sem `net/http`**. O mini-projeto ensina o que há dentro de uma requisição e de uma resposta HTTP: uma linha de requisição, linhas de cabeçalho, uma linha vazia e um corpo cujo tamanho os cabeçalhos anunciam. Ele analisa as requisições à mão, faz o roteamento, mantém conexões abertas, transmite respostas em chunked, e recusa requisições malformadas ou grandes demais com o código de status correto. O curl e um navegador de verdade conferem que o que ele envia é HTTP válido.

Explicação dos conceitos: [docs/pt/protocols/http-server-raw-tcp.md](../../../docs/pt/protocols/http-server-raw-tcp.md).

## Rastro de fio: os bytes crus de uma requisição e de uma resposta

Saída de `docker compose run --rm trace` (primeiro cenário). `>` é o que o cliente enviou, `<` é o que o servidor respondeu. `\r\n` é o par de bytes CR LF (`0d 0a`) que termina toda linha do protocolo. As notas à direita foram acrescentadas aqui.

```text
> POST /echo HTTP/1.1\r\n            linha de requisição: MÉTODO, um espaço, ALVO, um espaço, VERSÃO
> Host: localhost\r\n                cabeçalho: qual site é desejado (obrigatório no HTTP/1.1)
> Content-Type: text/plain\r\n       cabeçalho: o que é o corpo
> Content-Length: 11\r\n             cabeçalho: o corpo tem exatamente 11 bytes
> Connection: close\r\n              cabeçalho: feche a conexão depois desta resposta
> \r\n                               linha VAZIA: fim dos cabeçalhos, o corpo começa em seguida
> hello world                        corpo: 11 bytes, sem fim de linha, nada marca o fim dele

< HTTP/1.1 200 OK\r\n                linha de status: VERSÃO, CÓDIGO, frase de motivo (só para pessoas)
< Connection: close\r\n              o servidor concorda em fechar
< Content-Length: 11\r\n             o corpo da resposta tem 11 bytes
< Content-Type: text/plain; charset=utf-8\r\n
< X-Body-Bytes: 11\r\n               um cabeçalho desta aplicação: bytes que ela leu da requisição
< \r\n                               linha VAZIA: fim dos cabeçalhos
< hello world                        corpo: os 11 bytes anunciados acima
```

A mesma requisição como os 116 bytes que viajam no fluxo TCP:

```text
0000  50 4f 53 54 20 2f 65 63 68 6f 20 48 54 54 50 2f  POST /echo HTTP/
0010  31 2e 31 0d 0a 48 6f 73 74 3a 20 6c 6f 63 61 6c  1.1..Host: local
0020  68 6f 73 74 0d 0a 43 6f 6e 74 65 6e 74 2d 54 79  host..Content-Ty
0030  70 65 3a 20 74 65 78 74 2f 70 6c 61 69 6e 0d 0a  pe: text/plain..
0040  43 6f 6e 74 65 6e 74 2d 4c 65 6e 67 74 68 3a 20  Content-Length:
0050  31 31 0d 0a 43 6f 6e 6e 65 63 74 69 6f 6e 3a 20  11..Connection:
0060  63 6c 6f 73 65 0d 0a 0d 0a 68 65 6c 6c 6f 20 77  close....hello w
0070  6f 72 6c 64                                      orld
```

- `20` é o espaço que separa as três partes da linha de requisição.
- `0d 0a` (mostrado como `..`) termina cada linha. No deslocamento `0x65` há dois seguidos, `0d 0a 0d 0a`: o fim do último cabeçalho e a linha vazia. O parser procura exatamente isso.
- Os 11 bytes depois disso (`68 65 6c 6c 6f 20 77 6f 72 6c 64`) são o corpo. O servidor só sabe onde parar por causa de `Content-Length: 11`.

### Uma resposta em chunked

Quando o tamanho não é conhecido de antemão, o corpo vai em pedaços. Cada pedaço (chunk) é o tamanho em hexadecimal, CR LF, os dados, CR LF. Um pedaço de tamanho zero encerra o corpo.

```text
> GET /stream HTTP/1.1\r\n
> Host: localhost\r\n
> Connection: close\r\n
> \r\n

< HTTP/1.1 200 OK\r\n
< Connection: close\r\n
< Content-Type: text/plain; charset=utf-8\r\n
< Transfer-Encoding: chunked\r\n     sem Content-Length: o corpo é delimitado pelos pedaços
< \r\n
< 7\r\n                              tamanho do pedaço: seguem 7 bytes
< line 1\n                           os 7 bytes ("line 1" e uma quebra de linha)
< \r\n                               fim do pedaço
< 7\r\n
< line 2\n
< \r\n
  ... mais três pedaços ...
< 0\r\n                              pedaço de tamanho zero: não há mais dados
< \r\n                               fim do corpo
```

Os outros cenários que o comando imprime são duas requisições em uma conexão keep-alive e uma linha de requisição malformada respondida com `400`.

## O que o servidor faz

| Parte | Arquivo | Comportamento |
| --- | --- | --- |
| Parser de requisição | `go/httpraw/request.go` | linha de requisição, cabeçalhos, corpo por `Content-Length`. Limites em cada parte |
| Escritor de resposta | `go/httpraw/response.go` | linha de status, cabeçalhos, `Content-Length` ou `Transfer-Encoding: chunked` |
| Roteador | `go/httpraw/router.go` | método e caminho, segmentos `:name`, `404`, `405` com `Allow`, `HEAD` |
| Laço da conexão | `go/httpraw/server.go` | keep-alive, `Connection: close`, HTTP/1.0, tempo limite de ociosidade, uma resposta e fechamento depois de um erro |
| Site de demonstração | `go/app/app.go` | `/`, `/hello/:name`, `POST /echo`, `/stream`, `/health` |
| Rastro de fio | `go/trace/`, `go/cmd/trace/` | envia bytes crus por TCP e imprime os dois sentidos |

Como uma requisição recusada é respondida:

| Problema | Status |
| --- | --- |
| linha de requisição malformada, cabeçalho sem dois-pontos, espaço antes dos dois-pontos, dobra de linha, CR solto, `Host` ausente ou repetido, `Content-Length` inválido ou conflitante, corpo menor que o anunciado | `400 Bad Request` |
| linha de requisição maior que o limite | `414 URI Too Long` |
| seção de cabeçalhos maior que o limite, ou campos de cabeçalho demais | `431 Request Header Fields Too Large` |
| corpo maior que o limite | `413 Content Too Large` |
| requisição com `Transfer-Encoding` (corpos de requisição são lidos só por `Content-Length`) | `501 Not Implemented` |
| versão diferente de HTTP/1.0 e HTTP/1.1 | `505 HTTP Version Not Supported` |

Depois de qualquer um desses casos o servidor envia uma resposta e fecha a conexão: ele não tem mais como saber onde a próxima requisição começaria.

Este é um servidor didático. Ele não tem TLS, nem corpo de requisição em chunked, nem `Expect: 100-continue`, nem HTTP/2. Não o use em produção.

## Tópicos do quiz que ele demonstra

Área `protocols`, tópico `http-semantics`: formato das mensagens de requisição e resposta, `Host`, `Content-Length` contra `Transfer-Encoding: chunked`, conexões persistentes, `HEAD`, `404` contra `405`, `400` e `431`.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-http-server-raw-tcp.sh        # Linux e macOS
./setup-windows-http-server-raw-tcp.ps1    # Windows
```

O script constrói a imagem e roda três checagens: os testes em Go, o curl contra o servidor, e um Chromium headless contra o servidor. Depois remove os contêineres.

## Demo

O rastro de fio (quatro cenários):

```sh
docker compose run --rm trace
```

O servidor no seu próprio navegador e com o seu próprio curl, em uma porta presa a `127.0.0.1`:

```sh
docker compose --profile demo up --build demo
# em outro terminal
curl -v http://127.0.0.1:8089/hello/voce
curl -N http://127.0.0.1:8089/stream           # as linhas chegam uma a uma
curl --raw http://127.0.0.1:8089/stream        # os pedaços como estão no fio
# e abra http://127.0.0.1:8089/ em um navegador
docker compose --profile demo down
```

`DEMO_PORT` muda a porta.

## Testes

```sh
docker compose run --rm go-test                 # gofmt, go vet, golangci-lint, go test
docker compose run --rm curl-check              # curl 7.88 contra o servidor
docker compose run --rm browser-check           # Chromium headless contra o servidor
docker compose down -v
```

| Onde | O que prova |
| --- | --- |
| `go/httpraw/request_test.go` | o parser: uma requisição completa, 22 requisições malformadas, 6 grandes demais, uma requisição exatamente nos limites, e que um cabeçalho grande demais é recusado sem ser lido até o fim |
| `go/app/app_test.go` | sobre TCP de verdade em loopback: roteamento, eco de um corpo de 50 kB, `HEAD`, keep-alive (o cliente `net/http` do próprio Go reaproveita a conexão), pipelining, `Connection: close`, HTTP/1.0, tempo limite de ociosidade, os bytes do chunked no fio, pedaços chegando um a um, erros fechando a conexão |
| `scripts/curl-check.sh` | o curl recebe respostas corretas: parâmetros, POST, chunked (decodificado e cru), reaproveitamento de conexão, `HEAD`, 404, 405, 431 |
| `scripts/browser-check.sh` | o Chromium renderiza a página e as chamadas `fetch()` dela recebem respostas corretas, inclusive a em chunked |

## Versões

| Componente | Versão |
| --- | --- |
| Go | 1.27.1 (`golang:1.27.1-bookworm`), só a biblioteca padrão |
| golangci-lint | 2.14.0 (`golangci/golangci-lint:v2.14.0`) |
| curl (checagem) | 7.88.1, o que vem na imagem do Go |
| Chromium (checagem) | 153, de `mcr.microsoft.com/playwright:v1.63.0-noble` |
