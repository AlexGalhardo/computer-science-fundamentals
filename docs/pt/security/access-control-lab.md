# Laboratório de controle de acesso: IDOR e verificação de papel (MP-SEC-4)

> English version: [docs/en/security/access-control-lab.md](../../en/security/access-control-lab.md) · Versión en español: [docs/es/security/access-control-lab.md](../../es/security/access-control-lab.md)

Mini-projeto: [`projects/security/access-control-lab`](../../../projects/security/access-control-lab/README.pt-BR.md). Tópicos do quiz: `access-control`, `owasp-threat-modelling`.

Este é um laboratório defensivo. Ele roda só em Docker, em uma rede interna, em memória e com dados falsos. O código vulnerável existe apenas para tornar a falha observável.

## O conceito

Duas perguntas diferentes são feitas sobre cada requisição:

| Pergunta | Nome | Resposta quando falha |
| --- | --- | --- |
| Quem é você? | Autenticação | `401 Unauthorized` |
| Você pode fazer isto com aquele registro? | Autorização (controle de acesso) | `403 Forbidden`, ou `404` quando a existência é escondida |

Controle de acesso quebrado é o primeiro item do OWASP Top 10 porque a segunda pergunta é fácil de esquecer: uma aplicação com um login perfeito ainda falha quando trata "logado" como "autorizado". Duas formas do mesmo erro aparecem neste laboratório:

- **IDOR** (referência direta insegura a objeto), também chamado de **BOLA** (quebra de autorização em nível de objeto): a requisição nomeia um registro pelo id e o servidor o devolve sem conferir de quem ele é.
- **Verificação em nível de função ausente**: uma rota feita para um papel (admin) só confere se há alguém logado.

## A falha

```text
bob-fake (logado como ele mesmo)       servidor (vulnerável)
GET /invoices/1002  ------------------> carrega a fatura 1002 -> 200, fatura dele
GET /invoices/1001  ------------------> carrega a fatura 1001 -> 200, fatura da alice-fake
GET /admin/users    ------------------> "tem alguém logado?" sim -> 200
```

O id na URL é escolhido por quem chama. A API vulnerável carrega qualquer id que receber e nunca compara `invoice.ownerId` com o usuário da sessão. A mesma ausência em `PATCH` e `DELETE` deixa um estranho alterar e destruir o registro, e a lista devolve todas as faturas. A rota de admin é "protegida" pelo menu: o `/me` não mostra o link de admin a usuários comuns, e a rota em si nunca olha o papel.

Nada falha para um usuário honesto, e é por isso que esta falha sobrevive a revisões e a testes de caminho feliz: a verificação ausente não gera erro nenhum.

## A correção

Uma única função pura decide, e ela nega por padrão:

```ts
can(user, action, resource): boolean
```

| Regra | Permitido quando |
| --- | --- |
| `list` na coleção de faturas | quem chama está logado (o conteúdo é filtrado com a regra de `read`) |
| `read`, `update`, `delete` em uma fatura | quem chama é o dono, ou é admin |
| `use-admin-route` na área de admin | quem chama é admin |
| qualquer outra coisa | nunca |

Como as rotas a usam:

1. Autenticar (`401`).
2. Validar o id com Zod (`400`): só dígitos, `^[1-9][0-9]{0,8}$`.
3. Carregar o registro (`404`).
4. Perguntar ao `can()` usando o dono **guardado no servidor** (`403`).
5. Só então entregar o registro ao handler. O corpo da alteração é um objeto Zod estrito, então campos desconhecidos como `ownerId` são recusados.

O dono e o papel nunca vêm da requisição. O menu devolvido pelo `/me` é derivado da mesma política, como conveniência: a proteção é a verificação dentro da rota.

### 403 ou 404

`403` é honesto e fácil de monitorar, e confirma que o id existe. `404` esconde a existência, ao custo de uma depuração mais difícil, e só funciona quando as duas respostas são realmente idênticas. O laboratório usa `403` por padrão e oferece `hideExistence: true`, que responde o mesmo `404` para uma fatura alheia e para uma inexistente. Escolha `404` quando a própria existência é sensível.

### O que não é controle de acesso

- **Esconder um botão**: a interface roda na máquina do usuário, e é o usuário quem decide quais requisições são enviadas.
- **Ids impossíveis de adivinhar (UUIDs)**: tornam a adivinhação impraticável, e os ids ainda vazam por URLs, logs, histórico, e-mails e outras respostas da API. Um id conhecido mais uma verificação ausente é a mesma falha.
- **Ids codificados ou com hash**, e **um dono ou papel enviado pelo cliente**: os dois são controlados por quem chama.
- **Só validar a entrada**: um id bem formado continua sendo o id de outra pessoa.

## O que os testes provam

| Item | Como é verificado |
| --- | --- |
| MP-SEC-4.1 um teste lê o registro de outro usuário falso na API vulnerável | `tests/idor.test.ts`, "vulnerable API: the flaw is observable": `bob-fake` recebe `200` e a fatura da `alice-fake`, altera, apaga, lista todas as faturas e chama a rota de admin enquanto o menu dele esconde o link |
| MP-SEC-4.2 o mesmo teste recebe `403` na API corrigida | `tests/idor.test.ts`, "fixed API: the same attempts are blocked": as mesmas funções de cenário recebem `403`, o registro guardado não muda, e o uso normal continua respondendo `200` |
| MP-SEC-4.2 matriz de autorização | `tests/matrix.test.ts`: 4 linhas (anônimo, dono, outro usuário, admin) por 5 colunas (ler, alterar, apagar, listar, rota de admin), geradas de uma tabela, cada célula afirmada, para as duas versões. Também o conteúdo da lista para cada chamador |
| MP-SEC-4.2 uma política, negar por padrão | `tests/policy.test.ts` testa o `can()` sozinho, incluindo ações e tipos de recurso desconhecidos. `tests/matrix.test.ts` percorre todas as rotas registradas e exige `401` sem sessão |
| MP-SEC-4.2 ids validados com Zod | `tests/idor.test.ts`: ids malformados recebem `400`, um corpo com `ownerId` a mais é recusado e o dono não muda |
| Isolamento do laboratório | `tests/network.test.ts`: uma requisição para `http://example.com` falha de dentro do contêiner |

A matriz da API corrigida:

| | ler | alterar | apagar | listar | rota de admin |
| --- | --- | --- | --- | --- | --- |
| anônimo | 401 | 401 | 401 | 401 | 401 |
| dono | 200 | 200 | 200 | 200 (próprias) | 403 |
| outro usuário | 403 | 403 | 403 | 200 (próprias) | 403 |
| admin | 200 | 200 | 200 | 200 (todas) | 200 |

## Como rodar

```sh
cd projects/security/access-control-lab
./setup-unix-access-control-lab.sh     # build, checagem de tipos e testes
docker compose run --rm demo           # o passo a passo
docker compose down -v --remove-orphans
```
