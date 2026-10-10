# xss-csp-lab

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)

Um laboratório defensivo sobre cross-site scripting (XSS). Três páginas pequenas (um livro de visitas, uma busca e uma página de boas-vindas) são servidas duas vezes pelo ElysiaJS: uma com os erros clássicos, outra corrigida. Um Chromium de verdade, conduzido pelo Playwright dentro do Docker, abre as duas e mostra que o mesmo texto roda como código na versão vulnerável e é exibido como texto puro na corrigida. A correção tem três partes: escape de HTML no servidor, `textContent` em vez de `innerHTML` no navegador, e um cabeçalho Content Security Policy (CSP) como segunda camada.

Código: MP-SEC-2. Explicação completa: [docs/pt/security/xss-csp-lab.md](../../../docs/pt/security/xss-csp-lab.md).

> **Vulnerável de propósito.** Os arquivos em `ts/src/vulnerable/` contêm falhas reais. Eles existem para serem lidos e testados dentro deste laboratório. Nunca os copie, importe ou sirva em outro lugar.

## Tópicos do quiz que ele demonstra

- `security` / `xss`: XSS armazenado, refletido e baseado em DOM, codificação de saída, APIs seguras do DOM
- `security` / `csp-security-headers`: `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, CSP como defesa em profundidade, `X-Content-Type-Options: nosniff`

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-xss-csp-lab.sh        # Linux e macOS
./setup-windows-xss-csp-lab.ps1    # Windows
```

O script constrói as imagens, roda os testes unitários (`ts-test`) e os testes de navegador (`e2e`), e remove os contêineres no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

A demo envia a mesma entrada para os dois apps e imprime, lado a lado, a linha de HTML que cada um responde e o seu cabeçalho `Content-Security-Policy`: marcação `<script>` crua no app vulnerável, `&lt;script&gt;` no corrigido. Ela também imprime a única linha de código de navegador que muda no caso baseado em DOM (`innerHTML` contra `textContent`). A demo não tem navegador, então mostra o que o servidor envia. O que um navegador faz com isso é mostrado pelos testes `e2e`.

## Testes

```sh
docker compose run --rm ts-test    # checagem de tipos + testes unitários (bun test)
docker compose run --rm e2e        # Playwright, apenas Chromium
docker compose down -v --remove-orphans
```

As mesmas funções de cenário rodam contra os dois apps (`ts/tests/e2e/scenarios.ts` no navegador, `ts/tests/apps.test.ts` no lado do servidor).

| O que é provado | Onde |
| --- | --- |
| XSS armazenado, refletido e baseado em DOM executam o código injetado no app vulnerável | `tests/e2e/xss.e2e.ts`, primeiro grupo |
| As mesmas três tentativas não executam no app corrigido, o texto é exibido como foi digitado e nenhuma marcação é injetada | `tests/e2e/xss.e2e.ts`, segundo grupo |
| O uso normal continua funcionando no app corrigido, inclusive texto com `&` e `<`, e o script da página carregado de um arquivo roda sob a política | `tests/e2e/xss.e2e.ts`, "normal use still works" |
| CSP como segunda camada: em uma página que mantém o bug de codificação, a marcação é injetada, mas o navegador se recusa a executá-la e reporta uma violação da política | `tests/e2e/xss.e2e.ts`, terceiro grupo |
| A função de escape, o valor exato do cabeçalho CSP, a validação com Zod | `tests/escape-html.test.ts`, `tests/security-headers.test.ts`, `tests/apps.test.ts` |
| Os contêineres não alcançam a internet | `tests/network-isolation.test.ts` |

"O código rodou" é observado sem causar dano algum: a entrada de demonstração só define `window.__labXssExecuted = true` na página, e o teste lê essa marca.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/vulnerable/vulnerable-app.ts` | **Vulnerável.** As três páginas com concatenação crua de strings, mais a rota `/csp-only/search` (bug de codificação mantido, cabeçalho CSP adicionado) |
| `ts/src/vulnerable/vulnerable-dom-client.js` | **Vulnerável.** Script de navegador que escreve `location.hash` com `innerHTML` |
| `ts/src/fixed/fixed-app.ts` | As páginas corrigidas: escape na saída, validação com Zod, cabeçalhos de segurança em toda resposta |
| `ts/src/fixed/fixed-escape-html.ts` | A função de escape de HTML |
| `ts/src/fixed/fixed-dom-client.js` | Script de navegador que escreve `location.hash` com `textContent` |
| `ts/src/security-headers.ts` | A Content Security Policy, diretiva por diretiva |
| `ts/src/lab-inputs.ts` | As únicas entradas que o laboratório usa |
| `ts/src/lab-targets.ts` | Recusa qualquer alvo que não seja um host do laboratório |
| `ts/src/demo-cli.ts` | A demo |
| `ts/tests/` | Testes unitários (`*.test.ts`) e testes de navegador (`e2e/`) |

Rotas dos dois apps: `GET /guestbook`, `POST /guestbook`, `GET /search?q=`, `GET /welcome#nome`. O app vulnerável também tem `GET /csp-only/search?q=`.

## Por que a falha acontece

Uma página web é um texto que o navegador interpreta e transforma em elementos. Quando um programa monta esse texto colando o seu próprio HTML ao texto digitado por um visitante, o navegador não consegue distinguir um do outro: `<script>` digitado em um formulário é exatamente igual ao `<script>` escrito pelo desenvolvedor. O **dado** do visitante atravessa para o lado do **código**.

| Tipo | De onde vem o texto | Onde está o erro |
| --- | --- | --- |
| Armazenado | Uma mensagem do livro de visitas salva no servidor e mostrada a todo visitante seguinte | O servidor a concatena no HTML |
| Refletido | O parâmetro `q` da URL, devolvido na mesma resposta. Ele viaja dentro de um link | O servidor o concatena no HTML |
| Baseado em DOM | O fragmento da URL (depois do `#`), que nunca é enviado ao servidor | O script do navegador o atribui a `innerHTML`, que o interpreta como HTML |

Em uma aplicação real, o código que roda na página age com a identidade da vítima autenticada. Neste laboratório ele só liga uma marca.

## Como prevenir

1. **Codifique na saída, para o lugar onde o texto vai.** `escapeHtml` troca `&`, `<`, `>`, `"` e `'` por entidades no momento em que o texto é escrito no HTML. O navegador exibe a entidade como o caractere original e nunca a trata como marcação, então a fronteira entre dado e código se mantém. O texto armazenado continua como foi digitado: `Tom & Jerry <3` ainda aparece exatamente assim. Por que funciona: o parser nunca vê um `<` que veio do visitante. Em projetos reais, um motor de templates que escapa por padrão (JSX, por exemplo) faz isso por você.
2. **Use APIs do DOM que recebem texto.** `element.textContent = valor` cria um nó de texto e nunca aciona o parser de HTML, então não há onde injetar. Essa é a única correção para o caso baseado em DOM, porque o servidor nunca vê o fragmento.
3. **Acrescente uma Content Security Policy como segunda camada.** O app corrigido envia `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`. Com `script-src 'self'` e sem `'unsafe-inline'`, o navegador só executa arquivos de script do mesmo servidor: blocos `<script>` inline e manipuladores inline como `onerror="..."` são recusados. Para isso ser possível, as páginas corrigidas não têm nenhum script inline: o script delas é um arquivo. `object-src 'none'` desativa plugins e `base-uri 'none'` proíbe um elemento `<base>` que redirecionaria endereços relativos de script.
4. **Valide a entrada** (Zod aqui) quanto a formato e tamanho. Isso limita o que é aceito, e não é o que impede o XSS: o app corrigido aceita o texto `<script>` como uma mensagem legítima e o exibe de forma inofensiva.

## O que não funciona como correção

- **Só a CSP.** A rota `/csp-only/search` prova as duas metades: o script não roda, e a marcação continua sendo injetada. Marcação injetada sem script ainda pode exibir conteúdo ou formulários falsos, um navegador ou um proxy pode descartar o cabeçalho, e uma única diretiva frouxa (`'unsafe-inline'`, um curinga) traz a falha de volta. A CSP é defesa em profundidade, nunca um substituto para a codificação.
- **Remover ou bloquear palavras "perigosas"** como `<script>`. A entrada baseada em DOM deste laboratório não contém nenhum `<script>`, o que mostra que uma lista dessas está sempre incompleta, e ela também quebra textos honestos.
- **Escapar quando o texto é salvo** em vez de quando é escrito. A codificação correta depende de onde o texto vai parar (HTML, um atributo, JSON, um e-mail), o que só se sabe na hora da saída. Entidades armazenadas também acabam escapadas duas vezes depois.
- **Validação no navegador** (`maxlength`, `required`, checagens em JavaScript). Requisições podem ser enviadas sem o formulário.
- **Escape no servidor para uma falha baseada em DOM.** O fragmento nunca chega ao servidor.
- **Confiar em cookies `HttpOnly`.** Eles escondem o cookie dos scripts, mas o código injetado ainda consegue agir como o usuário dentro da página.

## Escopo de segurança do laboratório

- Tudo roda no Docker, em uma rede do compose com `internal: true`. Nenhum contêiner alcança a internet, e um teste prova isso (uma requisição ao domínio de documentação `example.com` precisa falhar).
- Nenhuma porta é publicada no host. O app vulnerável só é alcançável pelos outros contêineres deste arquivo compose.
- O laboratório usa duas entradas fixas de demonstração, e elas só ligam uma marca na página. O endereço da imagem em uma delas é um caminho do próprio servidor do laboratório. A demo e os testes de navegador recusam qualquer alvo que não seja um host do laboratório.
- Todos os nomes e dados são falsos (`alice-fake`, `bob-fake`). Não há credenciais.

## Versões

| Componente | Versão |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| Playwright | `mcr.microsoft.com/playwright:v1.63.0-noble`, `@playwright/test` 1.63.0 |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
