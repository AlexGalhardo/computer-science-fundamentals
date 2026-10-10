# csrf-lab

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

O navegador anexa cookies a uma requisição por causa de para onde ela **vai**, não por causa de qual página a pediu. Então uma página de outro site consegue fazer um navegador logado enviar uma requisição ao seu app, e o app enxerga uma sessão válida. Isso é a falsificação de requisição entre sites (CSRF). Este laboratório mostra o problema com navegadores de verdade: um app falso de "perfil" cujo e-mail é trocado por uma segunda origem local, e depois a mesma tentativa recusada por um token anti-CSRF, um cookie com `SameSite` explícito e "alteração de estado só por POST".

Código: MP-SEC-3. Explicação completa: [docs/pt/security/csrf-lab.md](../../../docs/pt/security/csrf-lab.md).

> **Laboratório defensivo e educacional.** `ts/src/vulnerable/` é vulnerável de propósito e `ts/src/other-origin/` é a página forjadora do laboratório. Os dois existem apenas para tornar a falha observável aqui. Nunca os copie nem os aponte para algo fora deste compose.

## Tópicos do quiz que ele demonstra

- `security` / `csrf-samesite`: por que o cookie viaja em uma requisição forjada, o token sincronizador, `SameSite=Strict` e `Lax`, por que GET não pode alterar estado
- `security` / `sessions-cookies`: o cookie de sessão como única prova de identidade, atributos de cookie (`HttpOnly`, `SameSite`, `Secure`), padrões do navegador quando um atributo falta

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-csrf-lab.sh        # Linux e macOS
./setup-windows-csrf-lab.ps1    # Windows
```

O script constrói duas imagens, roda os testes unitários e os testes com navegador, e remove os contêineres no fim. A primeira construção baixa a imagem do Playwright (com os navegadores), que é grande.

## Estrutura

| Serviço | Host dentro do laboratório | O que é |
| --- | --- | --- |
| `app-vulnerable` | `http://app-vulnerable:3000` | Cookie sem `SameSite`, sem token, troca de e-mail por GET e POST |
| `app-fixed` | `http://app-fixed:3000` | A correção: token + `SameSite=Strict` + apenas POST |
| `app-token-only` | `http://app-token-only:3000` | O código corrigido com o `SameSite` desligado |
| `app-samesite-only` | `http://app-samesite-only:3000` | O código corrigido com o token desligado |
| `other-origin` | `http://other-origin:3000` | A página forjadora do laboratório. Só consegue atingir os quatro hosts acima |
| `ts-test` | | Checagem de tipos e testes unitários (Bun) |
| `e2e` | | Playwright com Chromium, Firefox e WebKit |
| `demo` | | O passo a passo em linha de comando |

Cada nome de serviço é um host diferente, e para o navegador um host diferente sem domínio pai em comum é um **site** diferente. É isso que torna cross-site as requisições vindas de `other-origin`.

| Caminho | O que é |
| --- | --- |
| `ts/src/vulnerable/vulnerable-app.ts` | O app vulnerável, com as três falhas marcadas em comentários |
| `ts/src/fixed/fixed-app.ts` | O app corrigido, com as três correções marcadas em comentários |
| `ts/src/fixed/fixed-csrf-token.ts` | Geração do token e verificação em tempo constante |
| `ts/src/other-origin/forging-page.ts` | A página forjadora: um link clicado sozinho (GET) e um formulário enviado sozinho (POST) |
| `ts/src/shared/` | Dados falsos, funções de cookie, a página HTML, o estado em memória e as rotas de instrumentação do laboratório |
| `ts/src/demo.ts` | A demo |
| `ts/tests/` | Testes unitários (`bun test`) |
| `ts/e2e/` | Testes com navegador (Playwright) |

Os apps expõem `GET /lab/observations` e `POST /lab/reset`. São instrumentação do laboratório, para que os testes vejam o que o servidor recebeu (o cookie estava lá?) e repitam o experimento. Uma aplicação real não tem essas rotas.

## Testes

```sh
docker compose run --rm ts-test    # checagem de tipos + testes unitários
docker compose run --rm e2e        # testes com navegador
docker compose down -v --remove-orphans
```

Os testes com navegador rodam um único cenário contra todas as versões do app: o usuário faz login pelo formulário do app, a mesma aba visita `other-origin`, e a página forjadora manda o navegador de volta ao app.

| Versão | Forja por GET (link) | Forja por POST (formulário) | Formulário legítimo |
| --- | --- | --- | --- |
| `app-vulnerable` | **e-mail trocado** nos três navegadores | **e-mail trocado** no Chromium e no Firefox. O WebKit não envia o cookie | funciona |
| `app-token-only` | o cookie chega, `405` | o cookie chega no Chromium e no Firefox, `403` (sem token) | funciona |
| `app-samesite-only` | nenhum cookie chega, `405` | nenhum cookie chega, `401` | funciona |
| `app-fixed` | nenhum cookie chega, `405` | nenhum cookie chega, `401` | funciona |

Os testes unitários cobrem o lado do servidor sem navegador: geração e verificação do token, os atributos do cookie de cada versão, as mesmas requisições forjadas com o cookie anexado à mão, a lista fechada da página forjadora, e uma checagem de que o contêiner não alcança `http://example.com` (a rede é interna).

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Um passo a passo narrado com `fetch`: o cabeçalho `Set-Cookie` de cada versão, um POST forjado e um GET forjado contra o app vulnerável (os dois trocam o e-mail), e as mesmas requisições contra o app corrigido (`403` e `405`), seguidas do formulário legítimo com o seu token. `fetch` não é um navegador, então a demo anexa o cookie à mão e mostra apenas o lado do servidor. O lado do navegador é o que os testes `e2e` mostram.

## Por que a falha acontece

1. **Cookies são enviados automaticamente.** Depois do login o navegador guarda o cookie de sessão e o anexa a toda requisição para aquele host. A página que iniciou a requisição não importa.
2. **Outros sites podem iniciar requisições para o seu host.** Um link, um redirecionamento e um formulário HTML podem apontar para outro site. A web sempre funcionou assim. O outro site não consegue ler a resposta (a política de mesma origem proíbe), mas nem precisa: o dano é a própria requisição.
3. **O app trata o cookie como prova de intenção.** O cookie prova "este navegador está logado". O app vulnerável lê isso como "o usuário quer esta alteração".
4. **Um GET altera estado.** Seguir um link é um GET, e os navegadores tratam GET como seguro. Até o padrão `SameSite=Lax` envia cookies em um link seguido a partir de outro site.

### O que os navegadores fazem quando falta o `SameSite`

Medido neste laboratório com os navegadores de `mcr.microsoft.com/playwright:v1.63.0-noble`:

| Navegador | GET cross-site de nível superior (link) | POST cross-site de nível superior (formulário) |
| --- | --- | --- |
| Chromium 153 | cookie enviado | cookie enviado enquanto o cookie tem menos de 2 minutos ("Lax + POST"), não enviado depois |
| Firefox 155 | cookie enviado | cookie enviado |
| WebKit 26.6 | cookie enviado | cookie **não** enviado |

A célula "não enviado depois" do Chromium foi medida uma vez à mão, com um cookie de 130 segundos. Os testes automatizados sempre usam um cookie recém-criado, então continuam rápidos e determinísticos.

Três navegadores, três comportamentos, e eles mudam entre versões. A lição é: **não dependa do padrão do navegador. Defina o `SameSite` explicitamente e use um token.**

Mais dois fatos sobre a montagem deste laboratório:

- `SameSite=None` (enviar sempre) exige `Secure`, e o navegador recusa um cookie `Secure` vindo de HTTP puro. O laboratório usa HTTP puro dentro do Docker, então o app vulnerável simplesmente omite o atributo, que também é o erro real mais comum.
- Os navegadores enviam o cabeçalho `Sec-Fetch-Site` apenas para origens HTTPS (ou `localhost`), então ele está sempre vazio nas observações do laboratório. Em um site real com HTTPS ele é mais um sinal que o servidor pode conferir.

## Como prevenir

1. **Token anti-CSRF (token sincronizador).** O servidor cria um segredo aleatório junto com a sessão, guarda no servidor e o escreve nos seus próprios formulários como campo oculto. Toda requisição que altera estado precisa trazê-lo de volta. Outro site consegue enviar um formulário, mas não consegue ler a sua página, então não tem como saber o valor. Aqui: 32 bytes aleatórios, validado com Zod, comparado em tempo constante, e válido apenas para a sessão com a qual foi criado.
2. **`SameSite` definido explicitamente no cookie de sessão.** `Strict` nunca envia o cookie em uma requisição iniciada por outro site. `Lax` envia apenas em navegações GET de nível superior, um bom padrão quando links de outros sites precisam cair em uma página logada.
3. **Alteração de estado só por POST** (ou PUT, PATCH, DELETE). GET continua sendo só leitura. O app corrigido responde `405` a `GET /email/change`.

O app corrigido usa os três. O token é a defesa principal, porque é o próprio servidor que a aplica. O `SameSite` é defesa em profundidade, porque quem aplica é o navegador. Em produção, sirva também por HTTPS e marque o cookie como `Secure` (um prefixo `__Host-` no nome faz o navegador exigir isso).

## O que não funciona como correção

- **Depender do padrão do navegador para o `SameSite`.** Veja a tabela acima.
- **Só o `SameSite`.** Quem o aplica é o navegador, não o seu servidor, e "site" é mais amplo que "origem": `evil.example.com` e `app.example.com` são o mesmo site, então um subdomínio comprometido ou controlado por usuários passa por ele. Um teste unitário aqui mostra que o app `samesite-only` aceita a alteração quando o cookie chega.
- **`SameSite=Lax` com um GET que altera estado.** O `Lax` envia o cookie em links seguidos, por definição.
- **Aceitar apenas POST, sem token.** Um formulário oculto enviado sozinho faz um POST. A forja por POST do laboratório é exatamente isso.
- **Um cookie secreto.** `HttpOnly` ou um id de sessão longo e aleatório não ajudam: o atacante nunca lê o cookie, o navegador o envia por ele.
- **Conferir apenas o `Referer`.** Ele pode faltar por motivos de privacidade, então a checagem acaba bloqueando usuários reais ou aceitando valores vazios.
- **Um token que não é amarrado à sessão**, ou que é igual para todos os usuários. O atacante consegue um válido na própria conta.
- **Um token em uma URL de GET.** URLs vazam pelo histórico, pelos logs e pelo cabeçalho `Referer`.
- **CORS.** O CORS controla quem pode *ler* uma resposta de outra origem. Um POST simples de formulário é enviado sem pedir permissão.

## Versões

| Componente | Versão |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| Playwright | `mcr.microsoft.com/playwright:v1.63.0-noble`, `@playwright/test` 1.63.0 |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |

## Escopo de segurança do laboratório

- Roda apenas localmente, em Docker, em uma rede `internal: true`: nenhum contêiner alcança a internet (um teste prova isso) e nenhuma porta é publicada no host.
- A página forjadora tira o alvo de uma lista fechada com os nomes de serviço deste próprio compose, e envia um único e-mail falso fixo. Não há como apontá-la para outro lugar.
- Todos os dados são falsos: usuário `alice-fake`, senha `lab-fake-password`, endereços no domínio reservado `.example`.
- O código vulnerável é identificado como tal no nome do arquivo e no comentário de cabeçalho, o pacote é `private`, e nada aqui foi feito para ser importado por outros projetos.
