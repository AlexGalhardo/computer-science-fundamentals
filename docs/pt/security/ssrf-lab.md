# Laboratório de SSRF (MP-SEC-5)

> English version: [docs/en/security/ssrf-lab.md](../../en/security/ssrf-lab.md) · Versión en español: [docs/es/security/ssrf-lab.md](../../es/security/ssrf-lab.md)

Mini-projeto: [`projects/security/ssrf-lab`](../../../projects/security/ssrf-lab/README.pt-BR.md). Tópicos do quiz: `ssrf-path-traversal-upload`, `owasp-threat-modelling`.

Este laboratório é defensivo e educacional. Ele roda apenas localmente, em Docker, em redes internas sem porta publicada, e todos os dados são falsos. O código vulnerável existe para ser comparado com a correção, nunca para ser reaproveitado.

## O conceito

Server-side request forgery (SSRF) acontece quando um servidor faz uma requisição de rede para um destino escolhido por um usuário. Funcionalidades que fazem isso são comuns e legítimas: prévias de link, webhooks, "importar de uma URL", buscadores de imagem, geradores de PDF.

O problema não é a requisição, é **de onde ela sai**. A requisição sai do servidor, então tem a posição de rede do servidor: ela alcança `localhost`, a rede privada da empresa, e o serviço de metadados link-local de um provedor de nuvem. Muitos desses destinos não têm autenticação porque "só máquinas internas conseguem conectar". O SSRF empresta essa confiança a quem conseguir digitar uma URL. Ele tem categoria própria no OWASP Top 10 desde 2021.

A cura sai da causa: a aplicação precisa decidir onde aceita conectar, e tomar essa decisão sobre aquilo que a conexão realmente usa, o endereço numérico, a cada salto.

## A falha

```ts
const response = await fetch(url); // `url` veio do usuário
```

O laboratório tem um serviço interno falso, `internal-admin`, em uma rede privada do Docker. Ele responde um token falso (`FAKE-INTERNAL-TOKEN-not-real`) a qualquer um que consiga conectar, e só o app consegue. Duas entradas de demonstração, montadas em `ts/src/scenario.ts`:

| Entrada | Resultado no app vulnerável |
| --- | --- |
| `http://internal-admin:8080/secret` | A prévia contém o token falso |
| `http://public-site:8080/redirect-to-internal` | A URL cita só o site público falso. Ele responde `302` para o serviço interno, o `fetch` segue o redirecionamento por padrão, e a prévia contém o token falso |

A segunda entrada é o motivo de uma checagem só na primeira URL não ser uma correção.

## A rede do laboratório

Todo endereço de contêiner é privado, então a regra real "recusar endereços privados" recusaria também o site público falso. O laboratório mantém a regra honesta dando ao lado "público" uma faixa de documentação:

| Rede | Sub-rede | Serviços |
| --- | --- | --- |
| `lab` (`internal: true`) | privada, escolhida pelo Docker | `internal-admin`, o app |
| `lab-public` (`internal: true`) | `203.0.113.0/24`, TEST-NET-3 (RFC 5737) | `public-site`, o app |

`203.0.113.0/24` não é privada e nunca é roteada na internet real, e a rede é interna de qualquer forma, então nada sai da máquina. Dentro do laboratório, `public-site` resolve para um endereço público e `internal-admin` para um privado, exatamente como o classificador espera, e um teste afirma isso.

## A correção

Cada salto da requisição passa pelo mesmo portão (`ts/src/fixed/fixed-safe-fetch.ts`):

| Camada | O que faz | O que não faz |
| --- | --- | --- |
| Zod na rota | Aceita só uma URL de no máximo 2048 caracteres | Não diz nada sobre para onde a URL aponta |
| Checagem de esquema | Só `http` e `https` | |
| Lista de permissão de host e porta | Comparação exata sobre o host interpretado por `new URL()`. **O controle mais forte** quando a funcionalidade tem um conjunto conhecido de destinos | Um nome da lista ainda pode resolver para um endereço interno |
| Checagem do endereço resolvido | Resolve com `node:dns`; todos os endereços precisam ser públicos. Recusa loopback, privado, link-local, não especificado e faixas reservadas, em IPv4 e IPv6, incluindo IPv4 embrulhado em IPv6 | Sozinha, deixa um intervalo entre a checagem e a conexão |
| Conexão fixada | Conecta no endereço validado e envia o nome no cabeçalho `Host`, então o DNS não é consultado uma segunda vez | |
| Redirecionamentos manuais | `redirect: "manual"`; cada `Location` recomeça da checagem de esquema, até 3 saltos | |
| Limites | Um prazo único de 2 s para todos os saltos e o corpo; corpo contado durante a leitura, no máximo 64 KiB | |

O intervalo entre tempo de checagem e tempo de uso merece uma nota. Se o código valida o endereço de um nome e depois entrega o nome ao cliente HTTP, o cliente resolve de novo, e um servidor DNS controlado por outra pessoa pode dar uma resposta diferente na segunda vez (DNS rebinding). A resposta usual é conectar no endereço que foi validado, que é o que a conexão fixada faz.

O que não funciona: listas de bloqueio de textos como `localhost` (o mesmo endereço tem muitas grafias, e qualquer nome DNS pode apontar para dentro), validar só a primeira URL (redirecionamentos), `startsWith` ou expressões regulares na URL crua, esconder a resposta do usuário (a requisição é feita do mesmo jeito: SSRF cego), e confiar no `Content-Length`.

As checagens da aplicação são uma camada. A rede deve impor a mesma regra: um segmento isolado ou um proxy de saída para o componente que busca URLs de usuários, autenticação entre serviços internos, e o serviço de metadados endurecido na nuvem.

## O que os testes provam

Uma função de cenário pede aos dois apps as mesmas quatro prévias: um artigo público, uma página pública que redireciona para outra página pública, a URL interna, e a URL pública que redireciona para o serviço interno. O serviço interno falso conta as requisições que recebe.

| Item | Como é verificado |
| --- | --- |
| MP-SEC-5.1 funcionalidade vulnerável e serviço interno falso em redes internas; um teste alcança o serviço interno pela funcionalidade | `tests/scenario.test.ts`, bloco vulnerável: a URL direta e o redirecionamento respondem `200` com o token falso na prévia, e o contador interno subiu 2. `tests/network-isolation.test.ts`: uma requisição a `http://example.com` falha de dentro do contêiner. O `docker-compose.yml` não publica porta e as duas redes são `internal: true` |
| MP-SEC-5.2 a correção barra o mesmo teste, inclusive por redirecionamento, e o uso normal funciona | `tests/scenario.test.ts`, bloco corrigido: as duas tentativas respondem `403` (`host-not-allowed`), o contador interno não se moveu, o artigo público e o redirecionamento público continuam respondendo `200`. Terceiro bloco: com o nome interno colocado por engano na lista de permissão, as duas tentativas respondem `403` (`address-not-allowed`) e o contador continua parado. `tests/address-classifier.test.ts`: tabela de endereços IPv4 e IPv6. `tests/fixed-safe-fetch.test.ts`: esquema, credenciais, lista de permissão, literais de loopback, resolvedor de mentira respondendo endereços internos, conexão fixada, limite de redirecionamentos, limite de tamanho, tempo limite, validação Zod |
| MP-SEC-5.3 definição de pronto | Scripts de setup, demo, os três READMEs com "Por que a falha acontece", "Como prevenir" e "O que não funciona como correção", e esta página nos três idiomas |

## Como rodar

```sh
cd projects/security/ssrf-lab
./setup-unix-ssrf-lab.sh              # checagem de tipos e testes, depois limpeza
docker compose run --rm demo          # passo a passo narrado
docker compose down -v --remove-orphans
```
