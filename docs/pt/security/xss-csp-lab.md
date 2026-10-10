# Laboratório de XSS e Content Security Policy (MP-SEC-2)

> English version: [docs/en/security/xss-csp-lab.md](../../en/security/xss-csp-lab.md) · Versión en español: [docs/es/security/xss-csp-lab.md](../../es/security/xss-csp-lab.md)

Mini-projeto: [`projects/security/xss-csp-lab`](../../../projects/security/xss-csp-lab/README.pt-BR.md). Tópicos do quiz: `xss`, `csp-security-headers`.

Este é um laboratório defensivo. Ele roda apenas no Docker, em uma rede interna sem porta publicada, com dados falsos, e a sua entrada de demonstração só liga uma marca na página.

## O conceito

Um navegador recebe texto e o interpreta, montando uma árvore de elementos. Alguns elementos são código: um bloco `<script>`, ou um atributo como `onerror="..."`. Cross-site scripting (XSS) acontece quando um texto fornecido por uma pessoa é interpretado como código na página de outra pessoa. O código injetado passa a rodar com tudo o que aquela página pode fazer, em nome de quem estiver com ela aberta.

A causa raiz é sempre a mesma: **um dado foi escrito em um lugar que é interpretado como código, sem ser codificado para aquele lugar**.

## A falha, três vezes

```text
visitante digita:      <script>window.__labXssExecuted = true</script>

servidor monta:        "<span>" + texto + "</span>"
navegador interpreta:  <span><script>...</script></span>     <- um elemento script, e ele roda
```

| Tipo | Rota no laboratório | Como o texto chega | Quem comete o erro |
| --- | --- | --- | --- |
| Armazenado | `POST /guestbook`, depois `GET /guestbook` | Salvo no servidor e servido a todo visitante seguinte | Servidor: concatenação de strings no HTML |
| Refletido | `GET /search?q=...` | Dentro da URL de um link, devolvido na resposta | Servidor: concatenação de strings no HTML |
| Baseado em DOM | `GET /welcome#...` | No fragmento da URL, que o navegador nunca envia ao servidor | Script do navegador: `element.innerHTML = texto` |

A entrada baseada em DOM é um `<img>` com um manipulador `onerror` inline, porque um elemento `<script>` inserido via `innerHTML` nunca é executado. É um detalhe útil: procurar a palavra `script` não encontra nada nela.

## A correção, três camadas

**1. Codificação de saída (servidor).** `escapeHtml` troca `&`, `<`, `>`, `"` e `'` por `&amp;`, `&lt;`, `&gt;`, `&quot;` e `&#39;` no momento em que o texto é escrito no HTML.

```text
servidor monta:        "<span>" + escapeHtml(texto) + "</span>"
navegador interpreta:  <span>&lt;script&gt;...&lt;/script&gt;</span>     <- um nó de texto
tela mostra:           <script>window.__labXssExecuted = true</script>
```

Funciona porque o parser nunca encontra um `<` que veio do visitante, então o visitante não consegue abrir uma tag nem fechar um atributo. Nada é apagado: o texto é exibido exatamente como foi digitado. A codificação é aplicada na saída, e não ao salvar, porque a codificação correta depende do destino (texto HTML, um atributo, JSON), e isso só se sabe na hora de escrever.

**2. API segura do DOM (navegador).** `element.textContent = texto` cria um nó de texto e não aciona o parser de HTML. Essa é a correção do caso baseado em DOM, em que o servidor não tem nada para escapar.

**3. Content Security Policy (cabeçalho).** O app corrigido envia, em toda resposta:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
```

| Diretiva | Efeito |
| --- | --- |
| `script-src 'self'` | Só rodam arquivos de script da mesma origem. Sem `'unsafe-inline'`, blocos `<script>` inline e manipuladores de evento inline são recusados |
| `object-src 'none'` | Nenhum plugin `<object>` ou `<embed>` |
| `base-uri 'none'` | Nenhum elemento `<base>`, que mudaria para onde apontam os endereços relativos de script |
| `default-src 'self'` | Tudo que não está listado (imagens, estilos, conexões) só da mesma origem |
| `form-action 'self'` | Formulários só enviam para a mesma origem |
| `frame-ancestors 'none'` | A página não pode ser colocada em um frame por outro site |

Uma política rígida tem um preço: a própria aplicação não pode ter script inline. É por isso que as páginas corrigidas carregam o seu script de um arquivo (`/static/fixed-dom-client.js`).

## A CSP é a segunda camada, não a correção

O app vulnerável tem uma rota a mais, `/csp-only/search`, que mantém o bug de codificação e acrescenta apenas o cabeçalho. O teste de navegador observa nela dois fatos ao mesmo tempo:

- o elemento injetado **está na página** (a marcação foi injetada);
- o código **não rodou**, e o navegador disparou um evento `securitypolicyviolation`.

Ou seja, a política reduziu o dano de um bug que continua lá. Marcação injetada sem script ainda pode exibir conteúdo falso, o cabeçalho pode faltar ou ser enfraquecido por uma única diretiva frouxa, e clientes antigos ou incomuns podem não aplicá-lo. Codifique primeiro, e guarde a CSP para o dia em que um bug de codificação escapar.

## O que os testes provam

| Item | Como é verificado |
| --- | --- |
| MP-SEC-2.1 XSS armazenado, refletido e baseado em DOM são demonstrados dentro do laboratório | `docker compose run --rm e2e`: o grupo "vulnerable app" de `tests/e2e/xss.e2e.ts` afirma que a marca foi ligada pelo código injetado em cada um dos três cenários |
| MP-SEC-2.2 os mesmos testes não conseguem executar script na versão corrigida | Mesmo comando: o grupo "fixed app" roda as mesmas funções de cenário e afirma que a marca não é ligada, que nenhum elemento foi injetado, que o texto é exibido como foi digitado e que o uso normal funciona |
| MP-SEC-2.2 CSP como segunda camada | Mesmo comando: o grupo "vulnerable page with CSP only" afirma marcação injetada, nenhuma execução e uma violação de política reportada |
| MP-SEC-2.3 causa e prevenção documentadas | Esta página e os três READMEs do mini-projeto |
| Sem acesso ao exterior | `docker compose run --rm ts-test`: `tests/network-isolation.test.ts` afirma que uma requisição a `example.com` falha. A rede do compose é `internal: true` e não publica nenhuma porta |

Os testes do lado do servidor (`tests/apps.test.ts`) conferem a mesma coisa um passo antes: o que o servidor escreve (marcação crua ou entidades) e quais cabeçalhos ele envia. O valor exato da política é fixado por `tests/security-headers.test.ts`.

## Como rodar

```sh
cd projects/security/xss-csp-lab
./setup-unix-xss-csp-lab.sh          # testes unitários e testes de navegador
docker compose run --rm demo         # comparação narrada
docker compose down -v --remove-orphans
```
