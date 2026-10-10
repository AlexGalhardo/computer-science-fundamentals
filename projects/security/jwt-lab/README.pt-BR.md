# jwt-lab

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)
>
> **Laboratório de segurança, vulnerável de propósito.** O código em `ts/src/vulnerable/` existe só para tornar uma falha observável dentro deste laboratório. Nunca copie, importe ou publique.

Um JSON Web Token (JWT) é um bilhete assinado que diz "este é o `bob-fake`, papel `user`, válido até 10:15". O servidor que o recebe não tem tabela de sessões para consultar: ele acredita no bilhete se, e somente se, a verificação estiver certa. Este laboratório mostra os jeitos comuns de essa verificação dar errado: aceitar tokens sem assinatura porque o próprio token disse `alg: none`, assinar com uma palavra que uma pessoa escolheu, e nunca conferir a expiração. Depois corrige cada um em um verificador escrito à mão com `node:crypto`, em que cada verificação é um passo visível e numerado.

> **Em produção, use uma biblioteca.** O verificador daqui é escrito à mão só para que cada verificação possa ser lida e testada isoladamente. Código real deve usar uma biblioteca mantida (por exemplo [`jose`](https://github.com/panva/jose)) configurada com uma lista explícita de algoritmos permitidos, o emissor esperado e a audiência esperada. Escrever a própria verificação de JWT é como as falhas deste laboratório foram parar em sistemas reais.

Código: MP-SEC-7. Explicação completa: [docs/pt/security/jwt-lab.md](../../../docs/pt/security/jwt-lab.md).

## Tópicos do quiz que ele demonstra

- `security` / `jwt-oauth-oidc`: as três partes de um JWT, HS256 contra RS256, fixação do algoritmo, as claims `exp`, `nbf`, `iss` e `aud`, tokens de acesso e de renovação (refresh)
- `security` / `authentication`: provar quem está chamando a cada requisição, tokens sem estado contra sessões no servidor, 401 contra 403

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-jwt-lab.sh        # Linux e macOS
./setup-windows-jwt-lab.ps1    # Windows
```

O script constrói a imagem, roda a checagem de tipos e os testes em uma rede interna, e remove tudo no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Ela primeiro imprime o payload de um token decodificado sem chave nenhuma, depois os mesmos seis passos duas vezes. Na API vulnerável, o token `admin` sem assinatura, o token assinado com a palavra adivinhada, o token usado duas horas depois de expirar e o token emitido para outro serviço são todos aceitos. Na API corrigida as mesmas tentativas recebem `401`, com o motivo que o servidor registrou no log (`malformed`, `bad_signature`, `expired`, `wrong_audience`), e o uso normal continua respondendo `200`.

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

O contêiner roda `tsc --noEmit` e depois `bun test`.

| Arquivo | O que prova |
| --- | --- |
| `ts/tests/forgery.test.ts` | As mesmas funções de cenário rodam contra as duas versões. Vulnerável: (a) um token com `alg: none`, assinatura vazia e `role: "admin"` é aceito, (b) o segredo é encontrado entre cinco palavras-palpite e um token assinado com ele é aceito, (c) um token cujo `exp` está duas horas no passado é aceito. Corrigida: cada um deles é recusado com `401`, assim como um token para outra audiência, de outro emissor, um token que ainda não vale e tokens malformados. O uso normal funciona nas duas |
| `ts/tests/verifier.test.ts` | O verificador corrigido sozinho, um teste por verificação, afirmando o motivo exato: algoritmo fixado (`none`, `RS256`, `HS512`, `hs256`), payload adulterado, outra chave, assinatura de tamanho errado, formatos malformados, limite de tamanho, `exp` com a tolerância de 30 segundos e relógio injetado, `nbf`, `iss`, `aud`, formato do payload |
| `ts/tests/key.test.ts` | A chave tem 32 bytes aleatórios por padrão, e uma chave curta (a palavra `secret`) faz o verificador e o app se recusarem a iniciar |
| `ts/tests/network.test.ts` | O contêiner não alcança o exterior: uma requisição para `http://example.com` falha |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/token.ts` | O formato de um JWT e os utilitários neutros: base64url, HMAC-SHA256, assinar, ler um payload sem verificar |
| `ts/src/data.ts` | Usuários falsos, os nomes do emissor e da audiência, o tempo de vida do token e o tipo do relógio |
| `ts/src/vulnerable/vulnerable-verifier.ts` | O verificador com as três falhas. Vulnerável de propósito |
| `ts/src/vulnerable/vulnerable-app.ts` | A API em ElysiaJS protegida por ele. Vulnerável de propósito |
| `ts/src/fixed/fixed-key.ts` | Regras da chave: 32 bytes aleatórios, recusa em iniciar com menos |
| `ts/src/fixed/fixed-verifier.ts` | O verificador, em sete passos numerados |
| `ts/src/fixed/fixed-app.ts` | A mesma API atrás do verificador corrigido, com o corpo do login validado com Zod |
| `ts/src/scenario.ts` | As tentativas, escritas uma vez e executadas contra as duas versões |
| `ts/src/demo.ts` | O passo a passo impresso pelo serviço `demo` |
| `ts/src/http.ts` | O tipo de erro que carrega o código de status |

## Um JWT em um minuto

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJzdWIiOiJib2ItZmFrZSIsInJvbGUiOiJ1c2VyIiwuLi59 . 3q2-7w...
       cabeçalho                                  payload                                  assinatura
 {"alg":"HS256","typ":"JWT"}        {"sub":"bob-fake","role":"user","exp":...}     HMAC-SHA256(chave, cabeçalho.payload)
```

- **O payload é codificado, não criptografado.** base64url é um jeito de escrever bytes como texto. Qualquer um que tenha o token (o usuário, um proxy, um arquivo de log, uma extensão do navegador) lê todas as claims sem chave nenhuma, e a demo imprime um para mostrar. Nunca coloque senha, chave de API ou dado pessoal privado em um JWT. A assinatura protege o conteúdo contra *alteração*, não contra *leitura*.
- **HS256** usa uma única chave compartilhada para assinar e para verificar. Quem consegue verificar também consegue assinar.
- **RS256** usa um par de chaves: a chave privada assina e a pública verifica. A chave pública pode ser entregue a todos os serviços.

## Por que a falha acontece

O verificador vulnerável é curto e parece razoável, e esse é o ponto:

```ts
// vulnerável
if (header.alg !== "none") { /* confere a assinatura HS256 com o segredo "secret" */ }
return payload; // exp, iss e aud nunca são lidos
```

- **(a) O token escolhe como é verificado.** O `alg` é um campo do cabeçalho, e o cabeçalho é escrito por quem envia o token. `none` é um valor real do padrão JWT ("JWT não protegido"). Um verificador que decide pelo `header.alg` deixa o remetente escolher "não me confira": troque o payload, escreva `alg: none`, deixe a assinatura vazia.
- **(b) A chave é uma palavra.** Uma assinatura HS256 pode ser testada por qualquer um que tenha um token: assine o mesmo cabeçalho e payload com um palpite e compare. Isso acontece na máquina de quem tenta, então nenhum limite de tentativas, bloqueio ou alerta fica sabendo. Uma palavra que uma pessoa escolheu (`secret`, o nome do produto, um padrão de teclado) está entre os primeiros palpites, e quando ela é encontrada quem adivinhou *é* o emissor e assina qualquer payload. O teste usa cinco palpites inventados contra o token do próprio laboratório, só para mostrar que a comparação não precisa de nada do servidor.
- **(c) Ninguém lê o `exp`.** O emissor escreve uma expiração de 15 minutos e o verificador nunca olha para ela, então um token copiado de um log ou de um notebook perdido funciona para sempre. A mesma ausência vale para `iss` e `aud`: um token genuíno emitido para outro serviço é aceito aqui.
- **Nada disso falha para um usuário honesto.** O login funciona, tokens válidos funcionam, até um payload adulterado sob uma assinatura HS256 é corretamente recusado. Os testes do caminho feliz passam. As falhas estão no que o verificador *não* recusa.

## Como prevenir

O verificador corrigido faz estes passos nesta ordem (`ts/src/fixed/fixed-verifier.ts`):

1. **Limite de tamanho** (2048 bytes) antes de qualquer análise: o token vem de um estranho.
2. **Formato**: exatamente três partes base64url não vazias.
3. **Algoritmo fixado**: o servidor decide `HS256`. O cabeçalho precisa dizer exatamente isso, ou o token é recusado antes de qualquer trabalho de assinatura. O cabeçalho é um objeto Zod estrito, então campos que apontam para uma chave (`kid`, `jku`, `jwk`) também são recusados.
4. **Assinatura comparada em tempo constante** com `timingSafeEqual`, então o tempo de resposta não diz nada sobre o quão perto um palpite chegou.
5. **Payload validado com Zod**, só depois de a assinatura ser confirmada. O `exp` é obrigatório.
6. **Tempo**: recusado quando `agora >= exp + 30 s`, e quando o `nbf` existe e ainda está no futuro. O relógio é injetado, então os testes avançam o tempo sem esperar.
7. **Emissor e audiência**: o `iss` precisa ser o emissor esperado e o `aud` precisa conter este serviço.

E em volta do verificador:

- **Uma chave forte**: pelo menos 32 bytes do gerador aleatório do sistema (`randomBytes(32)`), gerada na inicialização ou passada em base64 por `JWT_LAB_KEY_BASE64`. O app se recusa a iniciar com uma chave menor. Em um sistema real a chave vem de um gerenciador de segredos, nunca é versionada, e pode ser trocada (rotação).
- **Uma resposta só para toda recusa**: o cliente sempre recebe `401 {"error":"invalid_token"}`. O motivo exato vai para o log do servidor.

### Por que fixar também importa com RS256: confusão de chaves

Imagine um serviço que verifica tokens RS256 com a chave **pública** do emissor, e cujo verificador escolhe o algoritmo pelo cabeçalho. A chave pública é, por definição, conhecida por todos. Alguém escreve um token cujo cabeçalho diz `HS256` e calcula o HMAC usando os bytes da chave pública como segredo compartilhado. O verificador lê `HS256`, pega "a chave que tem" (a pública) e roda uma verificação de HMAC, que passa. Um valor que nunca foi secreto virou chave de assinatura. A causa raiz é a mesma do `none`: o token pôde escolher o algoritmo. Com o algoritmo fixado (e uma chave tipada para um único algoritmo) o ataque não tem por onde começar. Este laboratório só explica a ideia e não a implementa.

### Expiração curta, refresh tokens e revogação

Um JWT é verificado sem consultar nenhum banco de dados, e é por isso que ele escala e também por isso que é difícil voltar atrás: depois de um logout, de uma troca de senha ou de um notebook roubado, o token continua válido até o `exp`, porque nenhum servidor é consultado.

- **Tokens de acesso de vida curta** (minutos) limitam por quanto tempo um token vazado serve.
- **Um refresh token** mantém o usuário logado: tem vida longa, é enviado só ao emissor, fica guardado no servidor, é trocado a cada uso (rotação), e portanto *pode* ser revogado. A revogação passa a valer quando o token de acesso atual expira.
- **Revogação imediata exige estado**: uma lista de bloqueio de ids de token (`jti`) consultada a cada requisição, ou um valor por usuário do tipo "tokens emitidos antes deste instante são inválidos". Os dois trazem de volta a consulta que o JWT evitava. Quando revogar na hora é requisito, uma sessão no servidor costuma ser o desenho mais simples.

## O que não funciona como correção

- **Bloquear a string `none`.** Uma lista de proibidos convida variações e o próximo algoritmo inesperado. Permita exatamente um valor e recuse todo o resto.
- **Uma palavra ou frase mais longa como segredo.** Tamanho escolhido por uma pessoa não é aleatoriedade. A regra dos 32 bytes é um piso: a chave precisa vir de um gerador aleatório.
- **Codificar o payload de outro jeito, ou "esconder" claims em base64.** O payload é público para quem tiver o token. Dado que precisa ser secreto fica no servidor.
- **Uma expiração bem longa "por conveniência".** Ela transforma todo token vazado em uma credencial de longo prazo. Use um token de acesso curto com um refresh token.
- **Conferir a assinatura e mais nada.** Uma assinatura válida diz quem escreveu o token, não que ele ainda vale, nem que foi feito para este serviço.
- **Ler claims antes de verificar** (por exemplo escolher a chave ou o tenant a partir de um payload não verificado). Até a assinatura ser confirmada, o payload é texto escrito por um estranho.
- **Apagar o token no navegador como "logout".** Uma cópia feita antes disso continua funcionando até o `exp`.

## Escopo de segurança do laboratório

- Tudo roda localmente em Docker, em uma rede do compose com `internal: true`. Nenhuma porta é publicada e um teste prova que o contêiner não alcança o exterior.
- As duas APIs rodam em memória, dentro do processo de teste. Nenhuma requisição sai do contêiner, e nada aqui tem como alvo qualquer outro sistema.
- Todos os dados são falsos: `alice-admin-fake`, `bob-fake`, senhas como `lab-fake-password-bob`, o emissor `https://issuer.lab.invalid`.
- As demonstrações são um token montado à mão cada. O "palpite" é uma lista fixa de cinco palavras inventadas comparadas com um token que este laboratório emitiu para o próprio usuário falso. Não há ferramenta de quebra, arquivo de lista de palavras nem scanner.

## Versões

| Componente | Versão |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
