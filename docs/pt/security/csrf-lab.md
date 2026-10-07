# Laboratório de CSRF (MP-SEC-3)

> English version: [docs/en/security/csrf-lab.md](../../en/security/csrf-lab.md)

Mini-projeto: [`projects/security/csrf-lab`](../../../projects/security/csrf-lab/README.pt-BR.md). Tópicos do quiz: `csrf-samesite`, `sessions-cookies`.

Laboratório defensivo e educacional. Roda apenas em Docker, em uma rede interna sem porta publicada, com dados falsos. O app vulnerável e a página forjadora existem apenas para tornar a falha observável ali.

## O conceito

Um cookie de sessão responde a uma pergunta: "qual navegador logado é este?". O navegador o anexa a toda requisição para o host que o definiu, seja qual for a página que iniciou a requisição.

```
1. usuário -> app           POST /login                 o app define o cookie de sessão
2. usuário -> outro site    GET  /alguma-pagina         (mesmo navegador, outra aba ou um link)
3. a página do outro site faz o navegador enviar:
   navegador -> app         POST /email/change          Cookie: session=...   <- anexado pelo navegador
4. app: "sessão válida"     -> troca o e-mail
```

O outro site nunca vê o cookie e não consegue ler a resposta do app (política de mesma origem). Nem precisa. A requisição chega com uma sessão válida, e o app não tem como distingui-la de uma requisição que o usuário fez de propósito. Isso é a falsificação de requisição entre sites (CSRF).

**Site e origem.** Uma origem é esquema + host + porta. Um site é mais amplo: esquema + domínio registrável (`app.example.com` e `blog.example.com` são origens diferentes do mesmo site). Os cookies `SameSite` usam o site. No laboratório cada nome de contêiner (`app-vulnerable`, `other-origin`) é um host de rótulo único sem pai em comum, então cada um é um site diferente.

## A falha

O `app-vulnerable` (`ts/src/vulnerable/vulnerable-app.ts`) tem três falhas, cada uma marcada no código:

1. O cookie de sessão é a única coisa que a troca de e-mail pede.
2. O cookie não tem o atributo `SameSite`, então cada navegador aplica o seu padrão.
3. `GET /email/change?email=...` altera estado.

O `other-origin` (`ts/src/other-origin/forging-page.ts`) é a página forjadora do laboratório. Ele tem duas páginas, e as duas só conseguem atingir os hosts de app do próprio laboratório (uma lista fechada validada com Zod):

- `/forge/get`: um link para o app que a página clica sozinha. Uma navegação GET cross-site de nível superior.
- `/forge/post`: um formulário oculto cujo `action` é o app, enviado por script. Um POST cross-site de nível superior.

### Padrões dos navegadores para um cookie sem `SameSite`

Medido com os navegadores da imagem fixada do Playwright (`v1.63.0-noble`):

| Navegador | GET cross-site (link) | POST cross-site (formulário) |
| --- | --- | --- |
| Chromium 153 | enviado | enviado enquanto o cookie tem menos de 2 minutos ("Lax + POST"), não enviado depois |
| Firefox 155 | enviado | enviado |
| WebKit 26.6 | enviado | não enviado |

Então a forja por GET funciona nos três, e a forja por POST funciona no Chromium e no Firefox. No WebKit o app vulnerável sobrevive ao POST apenas por causa do padrão daquele navegador, e cai para o GET no mesmo navegador. Os padrões diferem e mudam entre versões, e é por isso que um app não pode depender deles.

`SameSite=None` faria o cookie viajar para todo lado, mas os navegadores só o aceitam junto com `Secure`, e uma origem em HTTP puro não consegue definir um cookie `Secure`. O laboratório usa HTTP puro dentro do Docker, então a demonstração honesta é o atributo ausente. Pelo mesmo motivo (HTTP puro) os navegadores não enviam `Sec-Fetch-Site` aos apps do laboratório.

## A correção

O `app-fixed` (`ts/src/fixed/fixed-app.ts`) aplica três mudanças:

| Correção | O que faz | Quem aplica |
| --- | --- | --- |
| Token sincronizador | Um segredo aleatório (32 bytes) criado junto com a sessão, guardado no servidor, escrito como campo oculto no formulário do próprio app. O POST precisa trazê-lo de volta. Validado com Zod e comparado em tempo constante (`timingSafeEqual` sobre resumos SHA-256) | O servidor |
| `SameSite=Strict` | O navegador não anexa o cookie a requisições iniciadas por outro site | O navegador |
| Apenas POST | `GET /email/change` responde `405` e não altera nada | O servidor |

O token funciona por causa da política de mesma origem: o outro site consegue *enviar* um formulário ao app, mas não consegue *ler* a página do app, então não descobre o valor. Ele precisa ser amarrado à sessão, senão o atacante usaria o token da própria conta.

`Strict` ou `Lax`? O `Lax` ainda envia o cookie quando o usuário segue um link vindo de outro site, para que links de e-mails e buscas caiam em uma página logada, e só é seguro quando nenhum GET altera estado. O `Strict` retém o cookie também nesse caso. O laboratório usa `Strict` para deixar o efeito visível nas duas forjas.

Por que as duas defesas: o token é aplicado pelo servidor em toda requisição. O `SameSite` depende do navegador, e trata subdomínios irmãos como o mesmo site. Cada uma cobre uma falha da outra.

## O que os testes provam

Testes com navegador (`ts/e2e/csrf.e2e.ts`, Playwright, Chromium + Firefox + WebKit). Uma única função de cenário roda contra todas as versões: fazer login pelo formulário do app, visitar `other-origin`, deixar a página forjadora mandar o navegador de volta. Os apps registram o que receberam em cada tentativa (método, se o cookie de sessão estava presente, resultado), e os testes conferem isso.

| Teste | Resultado |
| --- | --- |
| `app-vulnerable`, forja por GET | Cookie recebido, e-mail trocado, em todos os navegadores. A página de perfil passa a mostrar o e-mail forjado |
| `app-vulnerable`, forja por POST | Cookie recebido e e-mail trocado no Chromium e no Firefox. Sem cookie no WebKit |
| `app-token-only`, forja por POST | O cookie chega (Chromium, Firefox) e a requisição ainda é recusada com `403`: o token sozinho basta |
| `app-token-only`, forja por GET | O cookie chega, `405`, nada muda |
| `app-samesite-only`, forja por GET e POST | O servidor **não** recebe cookie de sessão: o `SameSite=Strict` sozinho impede que ele seja anexado |
| `app-fixed`, forja por GET e POST | Nenhum cookie recebido, e-mail inalterado |
| Formulário legítimo, nas quatro versões | O usuário troca o e-mail pelo formulário do próprio app |

Testes unitários (`ts/tests/`, `bun test`), sem navegador, com o cookie anexado à mão:

- Token: único, 43 caracteres seguros para URL, verificado apenas contra o token exato da sessão, recusa tipos errados e valores grandes demais.
- Atributos do cookie: sem `SameSite` no app vulnerável, `SameSite=Strict` no corrigido.
- Os mesmos POST e GET forjados contra os dois apps: o app vulnerável troca o e-mail, o app corrigido responde `403` e `405`. Um token válido de outra sessão é recusado.
- Um limite dito com honestidade: só com o `SameSite`, se o cookie chegar, a alteração é aceita.
- A página forjadora recusa qualquer alvo fora da lista do laboratório.
- O contêiner não alcança `http://example.com`: a rede é interna.

## Critérios de aceitação

| Item | Como é verificado |
| --- | --- |
| MP-SEC-3.1 a alteração forjada funciona no app vulnerável | `docker compose run --rm e2e`: os testes do `app-vulnerable` (forja por GET em três navegadores, forja por POST no Chromium e no Firefox) |
| MP-SEC-3.2 a requisição forjada é rejeitada e o formulário legítimo continua funcionando | Mesmo comando: os testes do `app-fixed`, `app-token-only` e `app-samesite-only`, e o teste do formulário legítimo em todas as versões |
| MP-SEC-3.3 definição de pronto | `./setup-unix-csrf-lab.sh` (ou `.ps1`) roda `ts-test` e `e2e` e termina com código 0 |

## Como rodar

```sh
cd projects/security/csrf-lab
./setup-unix-csrf-lab.sh           # testes unitários + testes com navegador
docker compose run --rm demo       # passo a passo narrado
docker compose down -v --remove-orphans
```
