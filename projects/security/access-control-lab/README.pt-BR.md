# access-control-lab

> English version: [README.md](README.md) · Versión en español: [README.es.md](README.es.md)
>
> **Laboratório de segurança, vulnerável de propósito.** O código em `ts/src/vulnerable/` existe só para tornar uma falha observável dentro deste laboratório. Nunca copie, importe ou publique.

Uma pequena API de faturas sabe exatamente quem está logado e mesmo assim deixa qualquer usuário ler, alterar e apagar qualquer fatura trocando o número na URL, e deixa um usuário comum chamar uma rota de admin cuja única proteção é um botão escondido. Este laboratório reproduz essa falha (controle de acesso quebrado: IDOR, também chamado de quebra de autorização em nível de objeto, mais uma verificação de papel ausente) e a corrige colocando toda decisão de autorização em uma única função, `can(user, action, resource)`, que nega por padrão.

Código: MP-SEC-4. Explicação completa: [docs/pt/security/access-control-lab.md](../../../docs/pt/security/access-control-lab.md).

## Tópicos do quiz que ele demonstra

- `security` / `access-control`: autenticação contra autorização, verificação de dono, verificação de papel, negar por padrão, 401 contra 403 contra 404
- `security` / `owasp-threat-modelling`: controle de acesso quebrado no OWASP Top 10, e perguntar "quem pode chamar isto, e sobre os dados de quem?" para cada rota

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-access-control-lab.sh        # Linux e macOS
./setup-windows-access-control-lab.ps1    # Windows
```

O script constrói a imagem, roda a checagem de tipos e os testes em uma rede interna, e remove tudo no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Ela imprime os mesmos seis passos duas vezes. Na API vulnerável, `bob-fake` lê, altera e apaga a fatura da `alice-fake`, vê todas as faturas na lista e chama a rota de admin. Na API corrigida, as mesmas requisições com o mesmo token recebem `403`, a lista mostra só as faturas dele, e o uso legítimo (a dona e a admin) continua respondendo `200`.

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

O contêiner roda `tsc --noEmit` e depois `bun test`.

| Arquivo | O que ele prova |
| --- | --- |
| `ts/tests/idor.test.ts` | As mesmas funções de cenário rodam contra as duas versões. Vulnerável: `bob-fake` lê, altera e apaga a fatura da `alice-fake` e chama a rota de admin. Corrigida: as mesmas tentativas recebem `403`, o registro fica intacto, e o uso normal continua funcionando. Também a validação com Zod e a opção `403` contra `404` |
| `ts/tests/matrix.test.ts` | A matriz de autorização, gerada a partir de uma tabela: 4 chamadores (anônimo, dono, outro usuário, admin) por 5 operações (ler, alterar, apagar, listar, rota de admin), cada célula afirmada, para as duas versões. Também o que a lista contém para cada chamador, e que toda rota registrada recusa um chamador anônimo |
| `ts/tests/policy.test.ts` | O `can()` sozinho, sem HTTP, incluindo as combinações para as quais ninguém escreveu regra |
| `ts/tests/network.test.ts` | O contêiner não alcança o exterior: uma requisição para `http://example.com` falha |

A matriz da API corrigida:

| | ler | alterar | apagar | listar | rota de admin |
| --- | --- | --- | --- | --- | --- |
| anônimo | 401 | 401 | 401 | 401 | 401 |
| dono | 200 | 200 | 200 | 200 (faturas próprias) | 403 |
| outro usuário | 403 | 403 | 403 | 200 (faturas próprias) | 403 |
| admin | 200 | 200 | 200 | 200 (todas as faturas) | 200 |

Na API vulnerável a linha do anônimo é a mesma e todas as outras células são `200`.

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/data.ts` | Usuários falsos, tokens de sessão falsos e as faturas em memória |
| `ts/src/vulnerable/vulnerable-app.ts` | A API em ElysiaJS que confia no id da URL. Vulnerável de propósito |
| `ts/src/fixed/fixed-policy.ts` | `can(user, action, resource)`: o único lugar onde o acesso é decidido |
| `ts/src/fixed/fixed-app.ts` | A mesma API, com toda rota atrás da política e com ids e corpos validados com Zod |
| `ts/src/scenario.ts` | As tentativas, escritas uma vez e executadas contra as duas versões |
| `ts/src/demo.ts` | O passo a passo impresso pelo serviço `demo` |
| `ts/src/http.ts` | O tipo de erro que carrega o código de status |

## Por que a falha acontece

A API vulnerável responde a uma pergunta, "quem é você?" (autenticação), e pula a seguinte, "você pode fazer isto com aquele registro?" (autorização).

```ts
// vulnerável: o id vem de quem chama, e o registro vai para quem pediu
const invoice = store.invoices.get(Number(params.id));
return invoice;
```

- **O id na URL é entrada, como qualquer campo de formulário.** Quem chama é quem escolhe. Receber `1001` só significa que alguém digitou `1001`.
- **Nada compara o dono do registro com o usuário logado.** A verificação não está errada, ela não existe, e uma verificação ausente não gera erro, linha de log nem teste falhando. A funcionalidade funciona perfeitamente para todo usuário honesto.
- **A verificação de papel mora só na interface.** O `/me` devolve um menu sem o link de admin para usuários comuns, e o `/admin/users` só confere se há alguém logado. Quem digita o endereço recebe a resposta.
- **Cada rota decide sozinha.** Com as verificações espalhadas pelos handlers, basta um handler esquecido, e não existe um lugar único para revisar.

## Como prevenir

- **Verifique no servidor, em toda requisição, contra dados que o servidor possui.** O dono vem do registro guardado e o papel vem da sessão, nunca da requisição.
- **Uma única função de política.** Toda rota pergunta `can(user, action, resource)` em `fixed-policy.ts`. As rotas não têm nenhum `if (user.role === ...)` próprio. A lista é filtrada com a mesma regra de `read` usada para uma fatura só, então as duas nunca discordam.
- **Negar por padrão.** O `can()` só devolve `true` para as combinações que estão escritas. Um chamador anônimo, uma ação desconhecida ou um tipo novo de recurso cai em `false`.
- **Torne a verificação difícil de esquecer.** Um handler só recebe a fatura por meio de `authorizeInvoice()`, que autentica, valida o id, carrega o registro e pergunta à política, nessa ordem. Um teste percorre todas as rotas registradas e exige `401` sem sessão.
- **Valide a entrada com Zod.** O id precisa casar com `^[1-9][0-9]{0,8}$`, e o corpo da alteração é um objeto estrito, então um campo `ownerId` a mais é recusado em vez de trocar o dono em silêncio. Validação não substitui a verificação de dono: `1001` é um id perfeitamente válido de outra pessoa.
- **Teste a matriz, incluindo as recusas.** Testes que só cobrem o caminho feliz passam também na versão vulnerável. A matriz afirma cada `403` e `401` e que o registro ficou intacto.

### 403 ou 404?

Quando a fatura existe e quem chama não pode mexer nela, há duas respostas defensáveis:

| Resposta | Vantagem | Custo |
| --- | --- | --- |
| `403 Forbidden` (padrão aqui) | Honesta e fácil de depurar e monitorar: uma rajada de `403` é um sinal claro | Confirma que o id existe. `404` para 9999 e `403` para 1001 contam a um estranho quais faturas são reais |
| `404 Not Found` | Não revela nada: um registro alheio e um inexistente ficam indistinguíveis | Mais difícil de depurar, e as duas respostas precisam ser realmente idênticas (mesmo corpo, mesmos cabeçalhos), senão a diferença vaza do mesmo jeito |

Use `404` quando a própria existência do registro é sensível (um repositório privado, um prontuário médico, uma conta de usuário). Use `403` quando a existência não é segredo. Este laboratório usa `403` por padrão e implementa as duas: `createFixedApp(store, { hideExistence: true })` devolve o mesmo `404` nos dois casos, e um teste afirma que as duas respostas são iguais. Em qualquer dos casos, a decisão é tomada em um só lugar, depois da mesma verificação de política. E `401` é outra coisa: significa "não sabemos quem você é", não "você não pode".

## O que não funciona como correção

- **Esconder o botão.** A interface roda na máquina do usuário, e é o usuário quem decide quais requisições enviar. Esconder um link é boa usabilidade (o `/me` corrigido deriva o menu da mesma política) e proteção nenhuma: quem precisa recusar a requisição é o servidor.
- **Ids impossíveis de adivinhar (UUIDs).** Um id aleatório torna a adivinhação impraticável, o que não é o mesmo que verificar. Ids não são segredos: aparecem em URLs, no histórico do navegador, em logs, e-mails, capturas de tela e links compartilhados, e a própria API costuma entregá-los em outras respostas. Uma vez conhecido o id, uma API sem a verificação de dono entrega o registro. UUIDs são uma camada extra razoável e não substituem a verificação.
- **Codificar ou fazer hash do id** (base64, um hash do número). É obscuridade: quem vê um valor descobre o esquema.
- **Confiar em um dono ou papel enviado pelo cliente** (um `userId` no corpo, um cabeçalho `X-Role`, um cookie `role` que o servidor não verifica). Quem chama também escreve esses valores.
- **Verificar só as rotas de leitura**, ou verificar na maioria das rotas. O controle de acesso falha na única rota esquecida, e é por isso que a correção é uma política única mais um teste sobre todas as rotas.
- **Só validar a entrada.** Um id bem formado continua sendo o id de outra pessoa.

## Escopo de segurança do laboratório

- Tudo roda localmente em Docker, em uma rede do compose com `internal: true`. Nenhuma porta é publicada e um teste prova que o contêiner não alcança o exterior.
- As duas APIs rodam em memória, dentro do processo de teste. Nenhuma requisição sai do contêiner, e nada aqui mira qualquer outro sistema.
- Todos os dados são falsos: `alice-fake`, `bob-fake`, `carol-admin-fake`, tokens como `FAKE-TOKEN-alice-not-real`.
- O "ataque" é um usuário falso logado trocando um número em uma URL. Não há scanner, ferramenta de enumeração nem lista de payloads.

## Versões

| Componente | Versão |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
