# ssrf-lab

> English version: [README.md](README.md)

Um laboratório defensivo e local sobre server-side request forgery (SSRF): como um servidor pode ser enganado para chamar serviços internos. A mesma pequena funcionalidade em ElysiaJS (uma "prévia de link" que busca uma URL dada pelo usuário e devolve parte da página) existe duas vezes: uma versão que busca qualquer coisa, rotulada `vulnerable`, e uma versão corrigida com lista de permissão de hosts, validação de esquema, validação do endereço resolvido, redirecionamentos revalidados salto a salto, limite de tamanho e tempo limite. Um cenário roda contra as duas, com um serviço interno falso e um site público falso em redes internas do Docker.

Código: MP-SEC-5. Explicação completa: [docs/pt/security/ssrf-lab.md](../../../docs/pt/security/ssrf-lab.md).

> O código em `ts/src/vulnerable/` é vulnerável de propósito. Ele existe só para ser estudado dentro deste laboratório. Nunca copie e nunca importe de outro projeto.

## Tópicos do quiz que ele demonstra

- `security` / `ssrf-path-traversal-upload`: o que é SSRF, por que a posição do servidor na rede é o problema, listas de permissão, validação do endereço resolvido, redirecionamentos
- `security` / `owasp-threat-modelling`: SSRF no OWASP Top 10, fronteiras de confiança ("interno" não é o mesmo que "confiável"), defesa em profundidade

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-ssrf-lab.sh        # Linux e macOS
./setup-windows-ssrf-lab.ps1    # Windows
```

O script constrói a imagem, sobe os dois serviços falsos, roda a checagem de tipos e os testes, e remove os contêineres e as redes no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Ela imprime um passo a passo narrado, em inglês e português: as quatro URLs do cenário, os endereços para os quais os dois nomes de host resolvem e como a correção os classifica, o cenário contra o app vulnerável (o token falso vaza, diretamente e por um redirecionamento), o mesmo cenário contra o app corrigido (as duas tentativas recusadas, as prévias normais funcionam), e a checagem de endereço ainda recusando quando a lista de permissão está mal configurada.

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

| Arquivo | O que prova |
| --- | --- |
| `ts/tests/scenario.test.ts` | App vulnerável: o serviço interno é alcançado pela funcionalidade e o token falso aparece na prévia, diretamente e por uma URL pública que responde 302. App corrigido: as mesmas duas requisições respondem 403, o serviço interno **não recebe requisição nenhuma** (ele conta), e uma prévia normal e um redirecionamento entre páginas públicas continuam funcionando. Um terceiro bloco coloca o nome interno na lista de permissão por engano e mostra a checagem de endereço recusando mesmo assim |
| `ts/tests/fixed-safe-fetch.test.ts` | Um teste por camada da correção: esquema, credenciais na URL, lista de permissão de host e de porta, literais de loopback, um nome que resolve para um endereço interno (resolvedor de mentira), vários endereços com um interno, conexão com o endereço validado, limite de redirecionamentos, limite de tamanho, tempo limite, e a validação Zod da rota |
| `ts/tests/address-classifier.test.ts` | Uma tabela de endereços IPv4 e IPv6 e a classe que cada um recebe: loopback, privado, link-local, não especificado, reservado, público, incluindo endereços IPv4 embrulhados em IPv6 |
| `ts/tests/network-isolation.test.ts` | Uma requisição de dentro do contêiner a um host externo falha |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `docker-compose.yml` | Duas redes, ambas `internal: true`, e quatro serviços: `internal-admin`, `public-site`, `ts-test`, `demo` |
| `ts/src/vulnerable/vulnerable-app.ts` | **Vulnerável de propósito**: `POST /preview` que chama `fetch(url)` sem checagem nenhuma |
| `ts/src/fixed/fixed-app.ts` | A mesma rota com validação Zod e a política de busca |
| `ts/src/fixed/fixed-safe-fetch.ts` | A busca segura: esquema, lista de permissão, endereço resolvido, conexão fixada, redirecionamentos manuais, limites |
| `ts/src/fixed/fixed-address-classifier.ts` | Classifica um endereço IPv4 ou IPv6 (loopback, privado, link-local e assim por diante) |
| `ts/src/lab-services/internal-admin.ts` | Serviço interno falso, com um token falso e sem login |
| `ts/src/lab-services/public-site.ts` | Site público falso: um artigo, redirecionamentos, um corpo enorme, uma resposta lenta |
| `ts/src/scenario.ts` | O cenário único que roda contra os dois apps, em processo |
| `ts/src/demo.ts` | A demo narrada |
| `ts/src/config.ts`, `ts/src/preview.ts` | Ambiente validado, tipos compartilhados, como uma prévia é recortada de uma página |

Rota dos dois apps: `POST /preview` com `{ "url": "<URL>" }`. A resposta traz o título e os primeiros 200 caracteres da página.

### A rede do laboratório

| Rede | Sub-rede | Quem está nela | Papel |
| --- | --- | --- | --- |
| `lab` | privada, escolhida pelo Docker (RFC 1918) | `internal-admin`, `ts-test`, `demo` | A rede da empresa |
| `lab-public` | `203.0.113.0/24` (TEST-NET-3) | `public-site`, `ts-test`, `demo` | Substituta da internet |

Todo endereço de contêiner é privado por padrão, então "recusar endereços privados" recusaria também o site público falso. Em vez de enfraquecer a regra para o laboratório, a rede "pública" usa uma faixa de documentação (RFC 5737) que não é privada e nunca é roteada na internet real. A regra de endereço no código é a regra real, sem mudanças. As duas redes são `internal: true`: a faixa é só um rótulo, e nada sai da máquina.

## Por que a falha acontece

O código vulnerável é uma linha:

```ts
const response = await fetch(url); // `url` veio do usuário
```

A requisição não sai do navegador do usuário. Ela sai do **servidor**, e carrega a posição do servidor na rede. Um servidor normalmente alcança coisas que o usuário não alcança: outros serviços da empresa sem login "porque são internos", um painel administrativo preso a `localhost`, o serviço de metadados de um provedor de nuvem em um endereço link-local. Esses serviços confiam na rede: quem consegue conectar é tratado como colega. O SSRF transforma o servidor em mensageiro do usuário dentro dessa rede, então a confiança é emprestada a um estranho.

No laboratório, `internal-admin` responde um token falso a qualquer um que consiga conectar, e só o app consegue. O cenário em `ts/src/scenario.ts` usa duas entradas de demonstração:

| Entrada | O que acontece no app vulnerável |
| --- | --- |
| `http://internal-admin:8080/secret` | O servidor busca o serviço interno e devolve os primeiros caracteres da resposta, que contêm o token falso |
| `http://public-site:8080/redirect-to-internal` | A URL cita só o site público. Esse site responde `302` com `Location: http://internal-admin:8080/secret`, o `fetch` segue por padrão, e o token vaza do mesmo jeito |

Mostrar a resposta nem é necessário para haver dano. Uma requisição que chega a uma rota interna pode mudar estado só por ter sido feita (SSRF cego), e pode ser usada para descobrir quais hosts e portas internos existem. Por isso os testes conferem que o app corrigido **não faz requisição nenhuma**, e não só que ele não mostra o token.

Dois outros erros pioram a situação: não há limite para o tamanho da resposta nem tempo limite, então uma requisição consegue prender uma conexão e memória do servidor pelo tempo que o lado remoto quiser.

## Como prevenir

A versão corrigida (`ts/src/fixed/fixed-safe-fetch.ts`) faz cada salto da requisição passar pelo mesmo portão.

1. **Pergunte se a funcionalidade precisa mesmo de URLs arbitrárias.** O controle mais forte é uma **lista de permissão de nomes de host**: a funcionalidade busca só os sites para os quais foi feita. No laboratório essa lista tem uma entrada, o site público falso. A comparação é exata e feita sobre o nome de host devolvido pelo parser de URL, nunca com `includes` ou `endsWith` no texto cru.
2. **Aceite só `http` e `https`.** Um `fetch` do lado do servidor entende mais do que a web. No Bun, por exemplo, uma URL `file:` lê o disco do servidor.
3. **Valide o endereço resolvido, não o nome.** O nome de host é resolvido com `node:dns` e **todos** os endereços devolvidos precisam ser públicos. Loopback (`127.0.0.0/8`, `::1`), privado (`10/8`, `172.16/12`, `192.168/16`, `fc00::/7`), link-local (`169.254/16`, `fe80::/10`), não especificado (`0.0.0.0`, `::`) e faixas reservadas são recusados, em IPv4 e IPv6, incluindo endereços IPv4 embrulhados em IPv6 (`::ffff:a.b.c.d`). A regra é "só público passa", não uma lista do que é proibido.
4. **Conecte no endereço que foi validado.** Veja a seção sobre DNS abaixo.
5. **Siga redirecionamentos manualmente.** Com `redirect: "manual"`, uma resposta `3xx` volta para o código em vez de ser seguida. Cada `Location` é uma URL nova escolhida pelo servidor remoto, então ela passa de novo pelos passos 1 a 4, até um número pequeno de saltos.
6. **Limite tamanho e tempo.** Um prazo único cobre a operação inteira (todos os saltos e o corpo), e o corpo é contado enquanto é lido e descartado quando passa do limite. `Content-Length` é só uma dica do outro lado.
7. **Valide a entrada com Zod** (uma URL de no máximo 2048 caracteres). Isso responde "é uma URL?", não "é seguro buscar?".
8. **Responda com pouco.** Uma recusa diz qual regra recusou, nunca o que a rede interna respondeu. Erros detalhados ("conexão recusada", "tempo esgotado") contariam ao usuário quais hosts internos existem.

### O intervalo entre checagem e uso do DNS

O passo 3 resolve o nome e confere o endereço. Se depois o código entregasse o **nome** ao `fetch`, o cliente HTTP resolveria esse nome uma segunda vez. Nada garante que a segunda resposta seja igual à primeira: um servidor DNS controlado por outra pessoa pode responder um endereço público para a checagem e um interno, um instante depois, para a conexão. Isso é conhecido como DNS rebinding, e é uma falha clássica de tempo de checagem contra tempo de uso (TOCTOU): o que foi conferido não é o que foi usado.

A resposta usual é **usar o que foi conferido**: resolver uma vez, validar, e conectar naquele endereço. A versão corrigida faz isso: ela troca o host da URL pelo endereço validado e envia o nome original no cabeçalho `Host` (e, em https, como nome de servidor do TLS, para que o certificado continue sendo verificado contra o nome). `ts/tests/fixed-safe-fetch.test.ts` prova isso com um nome que só existe em um resolvedor de mentira: a busca só funciona porque a conexão vai para o endereço que o resolvedor devolveu, e o resolvedor é consultado exatamente uma vez por salto. O laboratório não tem serviço HTTPS, então o ramo https não é coberto por testes aqui.

### Filtragem de saída na rede (defesa em profundidade)

Tudo o que está acima vive no código da aplicação, e código tem bugs: outra funcionalidade pode buscar uma URL e esquecer a função segura, uma biblioteca pode buscar por conta própria (processamento de imagem, geração de PDF, webhooks, parsers de XML). A rede deve impor a mesma regra de forma independente:

- Rode o componente que busca URLs fornecidas por usuários em um segmento de rede próprio, com regras de firewall que o deixem sair para a internet mas **não** para as faixas internas, ou passe o tráfego dele por um proxy de saída que aplique a lista de permissão.
- Não deixe serviços internos confiarem na rede. O `internal-admin` não tem login "porque é interno"; com autenticação entre serviços, alcançá-lo não bastaria.
- Na nuvem, use a versão endurecida do serviço de metadados (a que exige um token de sessão e um cabeçalho especial), e dê à instância só as permissões de que ela precisa.

O laboratório mostra a ideia no próprio arquivo compose: o `public-site` não está ligado à rede `lab`, então ele não alcança o `internal-admin`, seja qual for o código dele. Só o app alcança, e é exatamente por isso que o app é o alvo.

## O que não funciona como correção

- **Uma lista de bloqueio de textos como `localhost` ou `127.0.0.1`.** O mesmo endereço tem muitas grafias: um único número decimal, partes em hexadecimal ou octal, as formas curtas do IPv4, um endereço IPv4 embrulhado em IPv6, a faixa `127.0.0.0/8` inteira, `0.0.0.0`. E qualquer nome DNS pode simplesmente ter um registro que aponta para um endereço interno, então o texto da URL não contém nada suspeito. Comparar texto é tentar adivinhar o que a pilha de rede vai fazer; classifique o endereço numérico resolvido.
- **Validar só a primeira URL.** Uma URL perfeitamente pública pode responder com um redirecionamento para uma interna, como `/redirect-to-internal` faz no laboratório. Se o cliente HTTP segue redirecionamentos sozinho, a checagem rodou sobre uma URL que não é a que foi buscada no fim.
- **Validar o nome e depois deixar o cliente resolver de novo.** É o intervalo TOCTOU descrito acima.
- **Conferir com expressão regular ou `startsWith` na URL crua.** URLs têm informações de usuário, portas, fragmentos e codificações; `http://allowed.test@other.test/` começa com o nome permitido e aponta para outro lugar. Interprete com `new URL()` e compare o host interpretado de forma exata.
- **Só uma lista de permissão de nomes, quando a lista é ampla.** Um curinga como `*.example.test` confia em todo registro que qualquer pessoa consiga criar sob aquele domínio. É por isso que a checagem de endereço continua existindo mesmo com lista de permissão: o terceiro bloco de `scenario.test.ts` mostra a checagem pegando uma entrada errada.
- **Não mostrar a resposta ao usuário.** A requisição foi feita do mesmo jeito. O SSRF cego consegue mudar estado e mapear a rede interna por diferenças de tempo e de erro.
- **Confiar no `Content-Length` para o limite de tamanho.** O cabeçalho é escrito pelo lado remoto e pode faltar ou mentir; conte os bytes.
- **Só filtragem de rede.** Ela normalmente não distingue `http://public-site/` de uma cadeia de redirecionamentos entre hosts permitidos, e não cobre serviços no mesmo host (`localhost`). As checagens da aplicação e as da rede cobrem as lacunas umas das outras.

## Escopo de segurança do laboratório

- Tudo roda localmente em Docker. As duas redes do compose são `internal: true`, então nenhum contêiner alcança a internet, e um teste prova isso. `203.0.113.0/24` é uma faixa de documentação que nunca é roteada na internet real.
- **Nenhuma porta é publicada no host.** Os apps nunca são iniciados como servidores: os testes e a demo os chamam em processo. Os únicos processos escutando são os dois serviços falsos, alcançáveis só de dentro das redes do laboratório.
- As URLs do cenário são montadas a partir da configuração do laboratório e citam só `public-site` e `internal-admin`. Nada aqui tem como alvo um host fora do laboratório.
- Todos os dados são falsos: o "segredo" é `FAKE-INTERNAL-TOKEN-not-real`.
- Não há scanner, lista de payloads nem técnica de evasão aqui. A seção sobre listas de bloqueio explica por que as grafias existem; ela não é uma lista para tentar.
- O pacote é `private` e o arquivo vulnerável é rotulado como tal no nome e nas primeiras linhas.

## Versões

| Componente | Versão |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| `@types/bun` | 1.4.2 |
