# HTTP/1.1, HTTP/2 e HTTP/3 (MP-PROTO-2)

> English version: [docs/en/protocols/http-versions.md](../../en/protocols/http-versions.md) · Versión en español: [docs/es/protocols/http-versions.md](../../es/protocols/http-versions.md)

Mini-projeto: [`projects/protocols/http-versions`](../../../projects/protocols/http-versions/README.pt-BR.md). Tópicos do quiz: `http2`, `http3-quic`, `tls-handshake`.

## A pergunta

As três versões carregam a mesma coisa: métodos, códigos de status, cabeçalhos e corpos não mudaram. O que mudou é **como as mensagens são colocadas no fio**, e isso decide quantas requisições podem estar em andamento ao mesmo tempo e quanto custa um pacote perdido. Uma página com 200 imagens pequenas torna a diferença visível, porque o tempo de carga dela depende de concorrência, não de banda.

## O que cada versão muda

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
| --- | --- | --- | --- |
| Transporte | TCP | TCP | QUIC, sobre UDP |
| Formato das mensagens | texto | frames binários | frames binários |
| Requisições em andamento por conexão | 1 | muitas (streams) | muitas (streams) |
| O que os navegadores fazem a respeito | cerca de 6 conexões por origem | 1 conexão | 1 conexão |
| Compressão de cabeçalhos | nenhuma | HPACK | QPACK |
| Handshake antes da primeira requisição (com TLS 1.3) | 2 idas e voltas | 2 idas e voltas | 1 ida e volta |
| Um pacote perdido atrasa | a conexão dele | todos os streams da conexão | só o stream dele |

### HTTP/1.1: uma requisição por vez em cada conexão

Uma conexão carrega uma requisição, espera a resposta inteira, e só então carrega a próxima. Os navegadores contornam isso abrindo cerca de seis conexões por origem. Com 200 imagens são 34 rodadas de seis, e cada rodada custa uma ida e volta. Em um enlace sem latência ninguém percebe. Com 50 ms por ida e volta a página leva cerca de 1,7 s a mais.

### HTTP/2: multiplexação

O HTTP/2 divide cada mensagem em **frames** binários marcados com um número de **stream**, então frames de muitas requisições podem ser intercalados em uma conexão e remontados do outro lado. O navegador envia as 200 requisições de uma vez, e o custo da ida e volta é pago cerca de uma vez, não 34.

O que sobra é o **bloqueio de cabeça de fila no TCP**. O TCP entrega bytes em ordem. Quando um pacote se perde, tudo o que foi recebido depois dele espera no kernel até a retransmissão chegar, mesmo os frames de streams que não perderam nada. Uma conexão significa que um pacote perdido trava todos os streams.

### HTTP/3: QUIC

O QUIC é um transporte construído sobre UDP que conhece streams. Cada stream é entregue em ordem por si só, então um pacote perdido atrasa apenas os streams cujos dados ele carregava. O QUIC também funde o handshake de transporte com o TLS 1.3: uma ida e volta em vez de duas. E, por rodar em espaço de usuário, dentro do navegador e do servidor, custa mais CPU por pacote que o TCP do kernel.

## Negociação: como cliente e servidor combinam a versão

- **HTTP/1.1 ou HTTP/2: ALPN.** Dentro do handshake do TLS o cliente lista os protocolos que fala (`h2`, `http/1.1`) e o servidor escolhe um. Sem ida e volta extra. Na porta 8001 o servidor oferece só `http/1.1`, na 8002 oferece os dois e `h2` vence.
- **HTTP/3: Alt-Svc.** O HTTP/3 está sobre UDP, então não pode ser escolhido dentro de um handshake TCP. Um navegador sem conhecimento prévio começa por TCP, e o servidor avisa em um cabeçalho de resposta que a mesma origem também está disponível por QUIC: `alt-svc: h3=":8003"`. O navegador usa HTTP/3 a partir da conexão seguinte. O teste confere as duas metades: o cabeçalho está lá, e o primeiro documento de um navegador não avisado chega por `h2`.
- Para a medição o navegador é iniciado com `--origin-to-force-quic-on`, para que a primeira carga já use HTTP/3 e as três versões sejam comparadas em uma conexão a frio.

O teste de cada porta não confia na configuração. Ele pergunta ao navegador qual protocolo carregou o documento e cada imagem (`nextHopProtocol` da API Resource Timing).

## TLS dentro do laboratório

Toda porta usa TLS, com `tls internal` no Caddyfile: o Caddy cria a sua própria autoridade certificadora dentro do contêiner e emite o certificado para `site.http-versions.test`. Nada público está envolvido. O navegador não é instruído a ignorar erros de certificado. Ele recebe o SHA-256 da chave pública do certificado do laboratório (`--ignore-certificate-errors-spki-list`), lido pelo teste do próprio servidor, e aceita essa única chave.

## Latência e perda injetadas

O `tc netem` é o emulador de rede do kernel Linux. O `caddy/entrypoint.sh` o prende à interface de saída do contêiner do Caddy e seleciona os pacotes pela **porta de origem**, então um servidor oferece as três condições ao mesmo tempo:

```text
qdisc prio (3 faixas)
  faixa 1                              portas 80xx   intocada
  faixa 2  netem delay 50ms            portas 81xx   filtro: sport & 0xfffc == 8100
  faixa 3  netem delay 50ms loss 2%    portas 82xx   filtro: sport & 0xfffc == 8200
```

Três detalhes:

- A moldagem fica nos pacotes de saída do servidor porque é nesse sentido que as imagens viajam. O atraso é em um sentido só, então acrescenta cerca de 50 ms a uma ida e volta.
- O segmentation offload é desligado (`ethtool -K eth0 tso off gso off gro off`). Com ele ligado, o kernel entrega ao netem um buffer grande que vira vários segmentos TCP depois, e um "descarte" jogaria todos fora.
- Isso exige a capability `NET_ADMIN`, dada apenas ao contêiner do Caddy. Ela deixa o contêiner configurar a própria interface, dentro do seu próprio namespace de rede.

## Lendo os resultados

A tabela versionada está no [README](../../../projects/protocols/http-versions/README.pt-BR.md#tempo-total-de-carga-por-protocolo-e-condição) e em `results/results.md`.

- Sem moldagem: as versões ficam dentro do desvio padrão uma da outra, exceto o HTTP/3, que é mais lento por causa do custo de CPU do QUIC em espaço de usuário. A maior parte do tempo é trabalho do navegador.
- Latência: o HTTP/1.1 leva cerca de 3,3 vezes mais que HTTP/2 e HTTP/3, que empatam. Isso é a multiplexação, a lição principal do mini-projeto.
- Abertura da conexão: cerca de 102 ms para TCP + TLS 1.3 e cerca de 52 ms para o QUIC, com ida e volta de 50 ms. Duas idas e voltas contra uma.
- Latência e perda: HTTP/2 e HTTP/3 ficam ambos mais lentos e mais ruidosos, e **esta medição não mostra o HTTP/3 à frente**. A diferença entre eles é menor que o desvio padrão.

Por que a vantagem de livro do QUIC sob perda não aparece aqui, e o que a medição pode e não pode dizer:

- O evento de load espera a última imagem. Remover o bloqueio de cabeça de fila ajuda as imagens que **não** foram atingidas por uma perda a terminar cedo. Não ajuda a que foi atingida, e o total é decidido por ela.
- A página é pequena e a perda é aleatória, então cada carga vê um punhado de perdas. Uma transferência maior, ou perdas em rajada, separaria mais os dois.
- A comparação é entre implementações: o TCP do kernel, com décadas de ajuste de recuperação de perda, contra pilhas QUIC em espaço de usuário.

## A cascata

O `dashboard/index.html` desenha, para a condição escolhida, uma barra por imagem para cada versão, a partir do `results/results.js` versionado. Uma barra começa quando o navegador quis a imagem e termina quando o último byte dela chegou. Com latência:

- O HTTP/1.1 é um triângulo largo. Todas as barras começam cedo, e a maior parte de cada barra é tempo **esperando uma das seis conexões**. A borda direita é uma escada com degraus de seis imagens.
- HTTP/2 e HTTP/3 são blocos estreitos: todas as requisições saem de uma vez.

## Critérios de aceitação

| Item | Como é verificado |
| --- | --- |
| MP-PROTO-2.1 página com 200 imagens nas três versões | `ts/tests/protocol.spec.ts`: um teste por porta (9 portas) confere o `nextHopProtocol` do documento e das 200 imagens |
| MP-PROTO-2.2 medição com e sem latência e perda | `docker compose run --rm bench` grava a tabela de tempo total de carga por protocolo e condição em `results/results.md` |
| MP-PROTO-2.3 visual de cascata | `dashboard/index.html` desenha as três cascatas a partir do `results/results.js` versionado |

## Como rodar

```sh
cd projects/protocols/http-versions
./setup-unix-http-versions.sh        # ou ./setup-windows-http-versions.ps1
docker compose run --rm bench && docker compose down -v
```
