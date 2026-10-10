# Laboratório de JWT: os erros comuns da validação de tokens (MP-SEC-7)

> English version: [docs/en/security/jwt-lab.md](../../en/security/jwt-lab.md) · Versión en español: [docs/es/security/jwt-lab.md](../../es/security/jwt-lab.md)

Mini-projeto: [`projects/security/jwt-lab`](../../../projects/security/jwt-lab/README.pt-BR.md). Tópicos do quiz: `jwt-oauth-oidc`, `authentication`.

Este é um laboratório defensivo. Ele roda só em Docker, em uma rede interna, em memória e com dados falsos. O código vulnerável existe apenas para tornar as falhas observáveis. O verificador é escrito à mão com `node:crypto` para que cada verificação fique visível; código de produção deve usar uma biblioteca mantida (por exemplo `jose`) configurada com uma lista explícita de algoritmos permitidos.

## O conceito

Um JSON Web Token são três textos em base64url unidos por pontos:

```text
base64url(cabeçalho) . base64url(payload) . base64url(assinatura)
```

| Parte | Conteúdo | Exemplo |
| --- | --- | --- |
| Cabeçalho | Como o token foi assinado | `{"alg":"HS256","typ":"JWT"}` |
| Payload | As claims | `{"sub":"bob-fake","role":"user","iss":"...","aud":"...","exp":1800000900}` |
| Assinatura | Prova de que o emissor escreveu as duas primeiras partes | `HMAC-SHA256(chave, cabeçalho + "." + payload)` |

O servidor não guarda sessão: ele confia no que o payload diz, desde que a verificação passe. Isso coloca toda a segurança do login em uma função, o verificador.

Dois fatos moldam todo o resto:

- **O payload é codificado, não criptografado.** Quem tem o token lê todas as claims sem chave. A assinatura impede alterações, não a leitura. Segredos nunca vão em um JWT.
- **O cabeçalho é escrito por quem envia.** Qualquer coisa que o verificador leia dele antes de conferir a assinatura é uma sugestão de um estranho.

As claims usadas aqui (RFC 7519): `sub` (quem), `iss` (quem emitiu), `aud` (para qual serviço), `iat` (emitido em), `exp` (expira em), `nbf` (não vale antes de). Os tempos são segundos Unix.

## A falha

O verificador vulnerável comete três erros, cada um demonstrado por um token montado à mão:

| | Erro | O que o teste faz | Resultado na API vulnerável |
| --- | --- | --- | --- |
| (a) | Confia no `alg` do cabeçalho, inclusive `none` | `bob-fake` troca o payload para `role: "admin"`, escreve `alg: none`, deixa a assinatura vazia | `200` na rota de admin |
| (b) | O segredo do HS256 é a palavra `secret` | `bob-fake` assina o próprio token com cinco palpites inventados, offline, acha o que bate, e assina um token de admin | `200` na rota de admin |
| (c) | Nunca lê o `exp` (nem `iss`, `aud`) | Um token de 15 minutos é usado duas horas depois; um token emitido para outro serviço é reaproveitado | `200` nos dois casos |

Por que (b) funciona sem tocar no servidor: uma assinatura HS256 é uma função determinística da chave e de um texto que quem tem o token já possui. Comparar um palpite só precisa de um token. Nenhum limite de tentativas ou bloqueio se aplica, porque nada é enviado. Por isso uma chave precisa ser impossível de adivinhar por si só, o que uma palavra escolhida por uma pessoa nunca é.

Nenhum dos três produz erro para um usuário honesto, e um payload adulterado sob uma assinatura HS256 é corretamente recusado pelas duas versões. As falhas são os caminhos *em volta* da verificação da assinatura.

## A correção

O verificador corrigido é uma sequência fixa. Nada do payload é acreditado antes de o passo 4 passar.

| Passo | Verificação | Motivo da recusa (log do servidor) |
| --- | --- | --- |
| 1 | Tamanho do token de no máximo 2048 bytes, antes de analisar | `token_too_large` |
| 2 | Exatamente três partes base64url não vazias | `malformed` |
| 3 | O cabeçalho é um objeto estrito e o `alg` é igual ao `HS256` fixado. Recusado antes de qualquer trabalho de assinatura | `malformed`, `algorithm_not_allowed` |
| 4 | HMAC-SHA256 recalculado e comparado com `timingSafeEqual` | `bad_signature` |
| 5 | Payload validado com Zod; o `exp` é obrigatório | `invalid_claims` |
| 6 | `agora < exp + 30 s`; quando há `nbf`, `agora + 30 s >= nbf`. Relógio injetado | `expired`, `not_yet_valid` |
| 7 | O `iss` é o emissor esperado, o `aud` contém este serviço | `wrong_issuer`, `wrong_audience` |

A chave tem pelo menos 32 bytes do gerador aleatório do sistema, gerada na inicialização ou informada em base64 em `JWT_LAB_KEY_BASE64`; o verificador se recusa a ser criado com uma chave menor. O cliente sempre recebe o mesmo `401 {"error":"invalid_token"}`, então a recusa não revela qual verificação falhou.

### Fixação do algoritmo e confusão de chaves

O problema do `none` é um caso de uma regra geral: o token não pode escolher o próprio algoritmo. O outro caso clássico é a confusão de chaves RS256/HS256. Um serviço verifica tokens RS256 com a chave pública do emissor e deixa o cabeçalho selecionar o algoritmo. Um remetente escreve `HS256` no cabeçalho e calcula o HMAC com os bytes da chave pública como segredo. O verificador, informado de que é `HS256`, usa a chave que tem (a pública) em uma verificação de HMAC, e ela passa: um valor público virou chave de assinatura. Fixar o algoritmo no servidor elimina o ponto de partida dos dois. O laboratório explica esse caso e não o implementa.

### Expiração, refresh e revogação

Um token sem estado não pode ser desfeito: depois de um logout ou de um roubo ele continua válido até o `exp`, porque a verificação não consulta nada. O desenho usual é um token de acesso de vida curta (minutos) mais um refresh token que fica guardado no servidor, é enviado só ao emissor, é trocado a cada uso e pode ser revogado. Revogar na hora um token de acesso exige estado no servidor de novo (uma lista de bloqueio de `jti`, ou um instante "não emitido antes de" por usuário), que é a consulta que o JWT pretendia evitar. Quando a revogação imediata é requisito, uma sessão no servidor costuma ser mais simples.

### O que não é correção

- **Uma lista de proibidos para o `none`**: permita um algoritmo em vez de proibir alguns.
- **Um segredo mais longo escolhido por uma pessoa**: tamanho não é aleatoriedade.
- **Uma expiração longa por conveniência**: todo token vazado vira uma credencial de longo prazo.
- **Só a assinatura**: uma assinatura válida não diz que o token ainda vale nem que foi feito para este serviço.
- **Ler claims antes de verificar**: até a assinatura passar, o payload é texto de um estranho.

## O que os testes provam

| Item | Como é verificado |
| --- | --- |
| MP-SEC-7.1 (a) token sem assinatura aceito | `tests/forgery.test.ts`, "vulnerable API": o token termina com a assinatura vazia, o payload diz `role: "admin"`, e a rota de admin responde `200` |
| MP-SEC-7.1 (b) segredo fraco | Mesmo arquivo: o segredo é recuperado de uma lista fixa de cinco palavras inventadas comparadas com o token do próprio laboratório, e um token assinado com ele recebe `200` |
| MP-SEC-7.1 (c) sem verificação de expiração | Mesmo arquivo: o relógio avança duas horas além de um token de 15 minutos e `/me` ainda responde `200` |
| MP-SEC-7.2 tokens forjados recusados | `tests/forgery.test.ts`, "fixed API": as mesmas funções de cenário recebem `401`, com os motivos registrados `malformed`, `bad_signature`, `expired`, `wrong_audience`; nenhuma palavra-palpite bate com a chave aleatória |
| MP-SEC-7.2 token válido aceito | `tests/forgery.test.ts`, "what must work on both": login, `/me` e a rota de admin para a admin respondem `200`; o usuário comum recebe `403` na rota de admin |
| MP-SEC-7.2 audiência errada, emissor errado, payload adulterado, malformado, outra audiência | `tests/verifier.test.ts` (cada motivo afirmado no verificador sozinho) e `tests/forgery.test.ts` (via HTTP) |
| MP-SEC-7.2 algoritmo fixado | `tests/verifier.test.ts`: `none`, `RS256`, `HS512` e `hs256` são recusados com `algorithm_not_allowed` mesmo quando a assinatura HS256 está correta |
| MP-SEC-7.2 tolerância do `exp` e relógio injetado, `nbf` | `tests/verifier.test.ts`: aceito em `exp + 29 s`, recusado em `exp + 30 s`; `nbf` no futuro recusado |
| MP-SEC-7.2 chave forte | `tests/key.test.ts`: 32 bytes aleatórios por padrão, e uma chave curta faz o verificador e o app lançarem erro na criação |
| MP-SEC-7.2 Zod e limite de tamanho | `tests/verifier.test.ts` (papel desconhecido, `exp` ausente, `aud` ausente, token grande demais) e `tests/forgery.test.ts` (corpo do login) |
| Isolamento do laboratório | `tests/network.test.ts`: uma requisição para `http://example.com` falha de dentro do contêiner |

## Como rodar

```sh
cd projects/security/jwt-lab
./setup-unix-jwt-lab.sh                # build, checagem de tipos e testes
docker compose run --rm demo           # o passo a passo
docker compose down -v --remove-orphans
```
