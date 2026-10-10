# http-versions

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Uma página com **200 imagens pequenas**, servida pelo mesmo Caddy em **HTTP/1.1, HTTP/2 e HTTP/3**, e carregada por um Chromium de verdade. O mini-projeto ensina o que a multiplexação e o QUIC mudam para uma página com muitos recursos: como o protocolo é negociado, por que o HTTP/1.1 sofre assim que a rede tem latência, como é uma conexão carregando todas as requisições, e o que a perda de pacotes faz com cada versão.

Explicação dos conceitos: [docs/pt/protocols/http-versions.md](../../../docs/pt/protocols/http-versions.md).

## O laboratório

| Porta | Condição de rede | Maior versão oferecida | Negociado pelo navegador |
| ---: | --- | --- | --- |
| 8001, 8002, 8003 | sem moldagem | HTTP/1.1, HTTP/2, HTTP/3 | `http/1.1`, `h2`, `h3` |
| 8101, 8102, 8103 | latência: `netem delay 50ms` | HTTP/1.1, HTTP/2, HTTP/3 | `http/1.1`, `h2`, `h3` |
| 8201, 8202, 8203 | latência e perda: `netem delay 50ms loss 2%` | HTTP/1.1, HTTP/2, HTTP/3 | `http/1.1`, `h2`, `h3` |

- As nove portas usam TLS, com um certificado da **autoridade certificadora interna do Caddy**, criada dentro do contêiner. Nenhuma CA pública e nenhum domínio público.
- O nome do host é `site.http-versions.test`, um alias na rede interna do docker-compose. `.test` é um domínio de topo reservado.
- Latência e perda são injetadas com `tc netem` nos pacotes de saída do contêiner do Caddy, separados pela porta de origem ([caddy/entrypoint.sh](caddy/entrypoint.sh)). Esse contêiner é o único com a capability `NET_ADMIN`.
- Nada é publicado no host e nenhum contêiner alcança a internet (`internal: true`).

## Tempo total de carga por protocolo e condição

Medido por `docker compose run --rm bench` (máquina e método em [results/results.md](results/results.md)): 10 cargas a frio por porta, cada uma em um contexto novo do navegador (cache vazio, conexão nova), portas intercaladas.

| Condição | Protocolo | Porta | Média (ms) | Desvio padrão (ms) | Mediana (ms) | Mín (ms) | Máx (ms) | Abertura da conexão (ms) | Metade das imagens (ms) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| sem moldagem | HTTP/1.1 | 8001 | 598 | 149 | 561 | 395 | 915 | 2 | 359 |
| sem moldagem | HTTP/2 | 8002 | 605 | 214 | 533 | 455 | 1175 | 2 | 405 |
| sem moldagem | HTTP/3 | 8003 | 926 | 365 | 786 | 536 | 1585 | 2 | 775 |
| latência (`netem delay 50ms`) | HTTP/1.1 | 8101 | 2455 | 191 | 2453 | 2211 | 2811 | 102 | 1351 |
| latência (`netem delay 50ms`) | HTTP/2 | 8102 | 742 | 78 | 752 | 615 | 847 | 102 | 533 |
| latência (`netem delay 50ms`) | HTTP/3 | 8103 | 735 | 73 | 721 | 642 | 877 | 52 | 518 |
| latência e perda (`netem delay 50ms loss 2%`) | HTTP/1.1 | 8201 | 2539 | 191 | 2470 | 2294 | 2846 | 127 | 1385 |
| latência e perda (`netem delay 50ms loss 2%`) | HTTP/2 | 8202 | 1024 | 333 | 987 | 675 | 1567 | 102 | 645 |
| latência e perda (`netem delay 50ms loss 2%`) | HTTP/3 | 8203 | 1159 | 484 | 1009 | 678 | 2041 | 53 | 732 |

Como ler:

- **Sem latência a versão quase não importa.** Uma ida e volta custa quase nada, então seis conexões se revezando são tão boas quanto uma conexão multiplexada. A maior parte dos 0,4 a 0,6 s é trabalho do próprio navegador (decodificar e posicionar 200 imagens em um Chromium headless dentro de um contêiner), não da rede. O HTTP/3 é o mais lento aqui: o QUIC roda em espaço de usuário, tanto no navegador quanto no Caddy, e custa mais CPU por pacote que o TCP no kernel. As diferenças entre HTTP/1.1 e HTTP/2 ficam dentro do desvio padrão.
- **Com 50 ms de latência o HTTP/1.1 leva cerca de 3,3 vezes mais** (2455 ms contra 742 ms). O navegador abre seis conexões por origem e cada uma carrega uma requisição por vez, então 200 imagens precisam de cerca de 34 rodadas, e cada rodada custa uma ida e volta: 34 x 50 ms dá cerca de 1,7 s além do resto. HTTP/2 e HTTP/3 enviam as 200 requisições de uma vez em uma conexão.
- **A abertura da conexão mostra o handshake do QUIC.** TCP e depois TLS 1.3 precisam de duas idas e voltas antes da primeira requisição (cerca de 102 ms), o QUIC faz transporte e TLS juntos em uma (cerca de 52 ms).
- **Com 2% de perda, o HTTP/3 não foi mais rápido que o HTTP/2 nesta execução.** As duas médias (1024 e 1159 ms) diferem menos que os seus desvios padrão (333 e 484 ms), então esta execução não mostra diferença. Veja os limites abaixo antes de concluir algo sobre bloqueio de cabeça de fila.

### Limites desta medição

- A perda injetada é aleatória e independente por pacote, só no sentido servidor para cliente, e a página é pequena (cerca de 400 kB). Cada carga vê só um punhado de pacotes perdidos, e por isso a dispersão sob perda é grande.
- "Tempo total de carga" é a pior métrica para ver a vantagem do QUIC. O QUIC remove o bloqueio de cabeça de fila **entre streams**: um pacote perdido atrasa só a imagem a que pertence, enquanto sobre TCP atrasa tudo o que vem atrás. Mas o evento de load espera a **última** imagem, e essa espera a sua retransmissão nos dois protocolos.
- O TCP aqui é a implementação do kernel Linux e o QUIC são duas implementações em espaço de usuário (o Chromium e o quic-go do Caddy), com ajustes diferentes de recuperação de perda. A tabela compara essas implementações nesta máquina, não os protocolos em abstrato.
- Uma máquina compartilhada com outras cargas, 10 cargas por célula. Isto não é um ranking.

## Cascatas

Abra [dashboard/index.html](dashboard/index.html) em um navegador (direto do disco, sem servidor). Ele desenha as três cascatas da condição escolhida a partir do `results/results.js` versionado: uma barra por imagem, no mesmo eixo de tempo. Com latência, o HTTP/1.1 é um triângulo largo cujos degraus são grupos de seis imagens, e HTTP/2 e HTTP/3 são blocos estreitos.

## Tópicos do quiz que ele demonstra

Área `protocols`:

- `http2`: multiplexação, o limite de conexões por origem do HTTP/1.1, negociação com ALPN, bloqueio de cabeça de fila do TCP
- `http3-quic`: QUIC sobre UDP, o handshake de uma ida e volta, descoberta com `Alt-Svc`, comportamento sob perda
- `tls-handshake`: ALPN, idas e voltas do handshake

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-http-versions.sh        # Linux e macOS
./setup-windows-http-versions.ps1    # Windows
```

O script constrói as duas imagens, sobe o Caddy, roda a checagem de tipos e os testes, e remove os contêineres.

## Medição (a demo)

```sh
docker compose run --rm bench && docker compose down -v
```

Leva cerca de dois minutos, mostra a tabela e regrava `results/results.md`, `results/results.json` e `results/results.js` (os dados do dashboard). `BENCH_RUNS` (padrão 10) muda o número de cargas por porta. Para mudar as condições, edite `NETEM_LATENCY` e `NETEM_LATENCY_LOSS` no `docker-compose.yml`.

O `tc netem` precisa de um kernel Linux com os módulos `sch_netem`, `sch_prio` e `cls_u32`. Funcionou no Docker Desktop para Windows (kernel 6.18 do WSL 2). Se o kernel não os tiver, o contêiner do Caddy termina na partida com o erro do `tc`.

## Testes

```sh
docker compose run --rm ts-test && docker compose down -v
```

| Arquivo | O que prova |
| --- | --- |
| `ts/tests/protocol.spec.ts` | em cada uma das nove portas, o documento e as 200 imagens foram carregados pelo protocolo esperado (`nextHopProtocol`). A porta HTTP/1.1 não negocia `h2`. A porta h3 anuncia `Alt-Svc`, e um navegador que não foi avisado começa com `h2` |
| `ts/tests/unit.spec.ts` | a página e as imagens geradas, a grade de portas e a máscara do `tc`, a recusa de alvos não locais, as estatísticas e o relatório |

## Como o navegador confia no certificado do laboratório

Nenhum navegador confia na CA interna do Caddy, e desligar a checagem de certificados esconderia erros de verdade. Os testes, em vez disso, leem o certificado que o servidor do laboratório apresenta, calculam o SHA-256 da chave pública dele, e iniciam o Chromium com `--ignore-certificate-errors-spki-list=<esse hash>`: a checagem de certificados continua ligada, com exatamente uma chave a mais aceita. `--origin-to-force-quic-on` faz o navegador usar QUIC nas portas h3 desde a primeira requisição (veja `ts/src/browser.ts`).

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `caddy/Caddyfile` | nove listeners, protocolos por listener, TLS interno |
| `caddy/entrypoint.sh` | `tc netem` por porta de origem, depois o Caddy |
| `ts/src/site.ts` | a página e as 200 peças PNG, geradas quando a imagem do Caddy é construída |
| `ts/src/browser.ts` | flags do Chromium, uma carga de página a frio, tempos vindos do navegador |
| `ts/src/report.ts`, `ts/bench/measure.spec.ts` | estatísticas, tabela, dados das cascatas, a medição |
| `dashboard/` | a página estática com as três cascatas |

## Versões

| Componente | Versão |
| --- | --- |
| Caddy | 2.11.7 (`caddy:2.11.7-alpine`) |
| Playwright e o seu Chromium | 1.63.0 (`mcr.microsoft.com/playwright:v1.63.0-noble`, Chromium 153) |
| Bun | 1.4.2 (`oven/bun:1.4.2`) |
| Zod | 4.6.5 |
| Tailwind CSS | 4.3.3 (CSS do dashboard, construído com `bun run dashboard:css`) |
