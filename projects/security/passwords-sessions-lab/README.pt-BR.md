# passwords-sessions-lab

> English version: [README.md](README.md)

> **Laboratório de segurança, vulnerável de propósito.** O código em `ts/src/vulnerable/` existe só para tornar falhas observáveis dentro deste laboratório. Nunca copie, importe ou publique.

Como senhas devem ser guardadas e como um login deve ser protegido. O laboratório tem duas partes. A primeira guarda a mesma senha falsa com quatro esquemas (texto puro, MD5, SHA-256 com sal e Argon2id), mostra o que cada um grava na tabela e mede quantos hashes por segundo cada um calcula. A segunda é uma pequena API de login em duas versões: a vulnerável não limita tentativas, mantém o mesmo id de sessão depois do login (fixação de sessão), envia um cookie sem nenhum atributo de proteção e diferencia usuário desconhecido de senha errada; a corrigida fecha cada uma dessas falhas.

Código: MP-SEC-6. Explicação completa: [docs/pt/security/passwords-sessions-lab.md](../../../docs/pt/security/passwords-sessions-lab.md).

## Tópicos do quiz que ele demonstra

- `security` / `authentication`: armazenamento de senhas (sal, hash rápido contra função lenta e que exige memória, parâmetros do Argon2id, atualização de hashes antigos no login), limite de tentativas e bloqueio, mensagens de erro genéricas
- `security` / `sessions-cookies`: sessões no servidor, fixação de sessão e rotação do id, logout e expiração, os atributos `HttpOnly`, `Secure` e `SameSite` e o prefixo `__Host-`

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-passwords-sessions-lab.sh        # Linux e macOS
./setup-windows-passwords-sessions-lab.ps1    # Windows
```

O script constrói a imagem, roda a checagem de tipos e os testes em uma rede interna, e remove tudo no fim.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

A parte 1 imprime o que cada esquema guarda para `alice-fake` e `bob-fake`, que escolheram a mesma senha falsa: linhas idênticas para texto puro e MD5, linhas diferentes para SHA-256 com sal e Argon2id. A parte 2 imprime os mesmos sete passos de login duas vezes. Na API vulnerável o cookie só tem `Path`, o id de sessão de antes do login responde como `alice-fake` depois dele e continua funcionando depois do logout, as duas mensagens de erro são diferentes, e a sexta senha errada é avaliada como a primeira. Na API corrigida as mesmas requisições recebem um cookie `__Host-` com todos os atributos, um id novo no login, `401` para o antigo, um único erro genérico e `429` depois de cinco falhas, enquanto um login normal continua respondendo `200`.

## Benchmark

```sh
docker compose run --rm bench
docker compose down -v --remove-orphans
```

No Linux, inicie-o como o seu próprio usuário, porque o contêiner grava em `results/`: `HOST_UID=$(id -u) HOST_GID=$(id -g) docker compose run --rm bench`. Sem as variáveis ele roda como uid 1000.

Ele imprime a tabela e grava [`results/results.md`](results/results.md) e `results/results.json`, com a máquina, a versão do runtime, os parâmetros do Argon2 e o comando. Cada esquema roda uma rodada de aquecimento (descartada) e cinco rodadas medidas em uma thread; a tabela informa a mediana, a rodada mais lenta e a mais rápida. Leva alguns segundos e não faz parte dos testes.

Rodada versionada (AMD Ryzen 7 5700X3D, Bun 1.4.2 em Docker, uma thread):

| Esquema | Hashes/s (mediana) | Mínimo a máximo | Tempo por hash | Custo de um hash em relação ao MD5 |
| --- | --- | --- | --- | --- |
| texto puro | não é hash | | perto de 0 | nenhum |
| MD5, sem sal | 843.636 | 797.901 a 890.710 | 1,19 µs | 1x |
| SHA-256, sal de 16 bytes | 548.724 | 500.384 a 624.058 | 1,82 µs | 1,5x |
| Argon2id, 19 MiB, t=2, p=1 (a política do laboratório) | 22 | 19,5 a 23,1 | 45 ms | cerca de 38.000x |
| Argon2id, 64 MiB, t=3, p=1 | 3,5 | 3,2 a 3,8 | 285 ms | cerca de 241.000x |

O que os números significam para a defesa:

- **Leia a taxa do ponto de vista de quem roubou a tabela.** O número de hashes por segundo que um servidor calcula também é o número de palpites por segundo que um núcleo de CPU consegue testar contra uma tabela vazada. Hardware feito para isso é muitas ordens de grandeza mais rápido que este único núcleo para MD5 e SHA-256.
- **Um hash rápido deixa cada palpite quase de graça.** MD5 e SHA-256 foram projetados para digerir arquivos grandes depressa. Isso é qualidade para somas de verificação e a propriedade errada para senhas, que são curtas e muitas vezes previsíveis.
- **Uma função lenta e que exige memória torna cada palpite caro.** Um hash Argon2id aqui custa cerca de 45 ms e 19 MiB. Um usuário paga isso uma vez por login e nem percebe. Quem testa palpites paga isso a cada palpite, e a exigência de memória é o que impede hardware paralelo barato de obter o ganho de velocidade de sempre.
- **O sal faz outro trabalho.** Ele não deixa nada mais lento: SHA-256 com sal é tão rápido quanto MD5. Ele faz senhas iguais gerarem hashes diferentes e inutiliza tabelas calculadas de antemão, então cada linha roubada precisa ser trabalhada separadamente.
- **O custo é um botão.** As duas linhas de Argon2id só diferem nos parâmetros. Aumente-os conforme o hardware melhora; `needsRehash` então atualiza os hashes guardados à medida que os usuários fazem login.

Isto é uma medição das funções de hash. Ele calcula o hash de uma senha falsa repetidas vezes; nunca compara com um hash guardado e não testa senhas candidatas.

## Testes

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

O contêiner roda `tsc --noEmit` e depois `bun test`.

| Arquivo | O que prova |
| --- | --- |
| `ts/tests/password-storage.test.ts` | MP-SEC-6.1. Dois usuários falsos com a mesma senha: mesmo texto puro, mesmo MD5, SHA-256 com sal diferente, Argon2id diferente. A verificação aceita a senha certa e recusa uma errada em todos os esquemas. `needsRehash` é verdadeiro para esquemas antigos e para Argon2id abaixo da política. `verifyAndUpgrade` transforma um hash MD5 em Argon2id em uma conferência bem-sucedida e não muda nada em uma que falha |
| `ts/tests/login.test.ts` | MP-SEC-6.2. As mesmas funções de cenário rodam contra as duas versões: flags do cookie, rotação de sessão no login, logout, mensagens de erro, bloqueio e o limite por cliente. Vulnerável: cada falha é observável. Corrigida: cada tentativa é bloqueada e o login normal funciona. Também: o bloqueio expira, acompanha a conta entre clientes e não revela quais nomes existem; expiração por inatividade e absoluta; validação com Zod; a linha MD5 da `carol-legacy-fake` vira Argon2id no login |
| `ts/tests/limiter.test.ts` | O limitador de tentativas sozinho, com relógio injetado: bloqueio, contagem regressiva, janela, reinício e memória limitada. Nenhum teste dorme |
| `ts/tests/bench.test.ts` | A aritmética do benchmark (mediana, aquecimento descartado) com um sujeito inventado |
| `ts/tests/network.test.ts` | O contêiner não alcança o exterior: uma requisição para `http://example.com` falha |

## Estrutura

| Caminho | O que é |
| --- | --- |
| `ts/src/data.ts` | Contas falsas, a lista fixa de seis senhas erradas e o tipo do relógio |
| `ts/src/vulnerable/vulnerable-password-storage.ts` | Texto puro, MD5 sem sal e SHA-256 com sal. Vulnerável de propósito |
| `ts/src/vulnerable/vulnerable-app.ts` | A API de login em ElysiaJS com as cinco falhas, cada uma marcada com `FLAW`. Vulnerável de propósito |
| `ts/src/fixed/fixed-password-storage.ts` | Argon2id pelo `Bun.password`, `needsRehash`, comparação em tempo constante e atualização no login |
| `ts/src/fixed/fixed-attempt-limiter.ts` | Contador de falhas com bloqueio temporário e relógio injetável |
| `ts/src/fixed/fixed-sessions.ts` | Armazenamento de sessões no servidor, com ids aleatórios e expiração por inatividade e absoluta |
| `ts/src/fixed/fixed-app.ts` | A mesma API de login com todas as falhas fechadas e o corpo validado com Zod |
| `ts/src/scenario.ts` | As tentativas, escritas uma vez e executadas contra as duas versões |
| `ts/src/demo.ts` | O passo a passo impresso pelo serviço `demo` |
| `ts/src/bench.ts` | O benchmark executado pelo serviço `bench` |
| `ts/src/http.ts` | Leitura dos cabeçalhos `Cookie` e `Set-Cookie` |
| `results/` | Os resultados versionados do benchmark |

## Por que a falha acontece

**Armazenamento.** A tabela de senhas é tratada como qualquer outra coluna, ou protegida com a primeira função de hash que vem à cabeça.

- Texto puro: quem lê a tabela (um backup vazado, uma injeção de SQL, alguém de dentro) lê todas as senhas, e as pessoas reutilizam senhas em outros sites.
- MD5 sem sal: senhas iguais dão hashes iguais, então a tabela mostra quem compartilha senha e tabelas pré-calculadas servem. E o MD5 é rápido.
- SHA-256 com sal: o sal resolve o primeiro problema e deixa o segundo. "É um hash forte" é verdade para arquivos e irrelevante aqui: o problema é a velocidade.

**Login.** Cada falha é algo que o código deixa de fazer, então nada falha para um usuário honesto.

```ts
// vulnerável: o navegador já tinha um id de sessão, então o servidor o mantém
current.session.username = username;
```

- **Sem limite de tentativas.** A milésima senha errada é avaliada como a primeira.
- **Fixação de sessão.** O site entrega um id de sessão a todo visitante, e o login marca esse mesmo id como logado. Quem conhecia o id antes do login (plantou-o no navegador da vítima, ou o leu em um computador compartilhado) está dentro da conta depois, sem saber a senha.
- **Logout só no navegador.** O cookie é apagado e a sessão continua válida no servidor, sem expiração.
- **Cookie sem atributos.** Sem `HttpOnly`, um script da página o lê. Sem `Secure`, ele viaja por HTTP puro. Sem `SameSite`, outros sites conseguem fazer o navegador enviá-lo.
- **Duas mensagens de erro.** `unknown_user` contra `wrong_password` conta a qualquer um quais nomes de usuário estão cadastrados.

## Como prevenir

- **Guarde senhas com Argon2id**, com um sal aleatório por senha (a função o gera) e parâmetros tão altos quanto o login aguentar. O laboratório usa o mínimo da OWASP: 19 MiB, 2 passadas, 1 thread.
- **Mantenha o esquema e os parâmetros dentro do valor guardado** e atualize no login: o único momento em que o servidor tem a senha de verdade é um login bem-sucedido, então é aí que um hash antigo é trocado (`verifyAndUpgrade`, `needsRehash`).
- **Limite as tentativas duas vezes.** Por conta (5 falhas em 15 minutos bloqueiam por 15 minutos) e por cliente (10 falhas em 15 minutos). Conte pelo nome digitado, exista ele ou não, para o próprio bloqueio não revelar quais contas são reais. Identifique o cliente pelo endereço da conexão ou por um cabeçalho escrito pelo seu próprio proxy.
- **Troque o id de sessão a cada login**: destrua o id com que o navegador chegou e emita um novo, aleatório (32 bytes do `node:crypto`). **Destrua a sessão no servidor no logout**, e faça-a expirar por inatividade (15 minutos) e por idade (8 horas).
- **Defina todos os atributos do cookie**: `__Host-sid=...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`, sem `Domain`. O prefixo `__Host-` faz o navegador recusar o cookie se ele não for `Secure`, não tiver `Path=/` ou tiver `Domain`, então outro subdomínio não consegue sobrescrevê-lo.
- **Uma resposta genérica** para usuário desconhecido e para senha errada, com o mesmo status e corpo, e mais ou menos o mesmo tempo: um usuário desconhecido é conferido contra um hash Argon2id de mentira.
- **Compare em tempo constante** (`timingSafeEqual`, e `Bun.password.verify` para Argon2id).
- **Valide o corpo com Zod**: um objeto estrito, um padrão para o nome de usuário e um tamanho máximo de senha, para ninguém fazer o servidor calcular o hash de megabytes.

O bloqueio tem um custo: qualquer pessoa consegue bloquear a conta de outra por 15 minutos digitando senhas erradas. É por isso que ele é temporário, e que sistemas reais acrescentam um segundo fator, atrasos progressivos ou um desafio antes do bloqueio.

## O que não funciona como correção

- **Um hash genérico mais rápido ou "mais forte"** (SHA-512, SHA-3), ou aplicar o hash duas vezes. Todos são rápidos; o problema é o custo por palpite.
- **Um sal único para a tabela inteira**, ou um sal derivado do nome de usuário. Senhas iguais voltam a gerar hashes iguais, e uma única tabela pré-calculada serve para todas as linhas.
- **Um "pepper" secreto ou criptografia no lugar de um hash lento.** Um pepper é uma camada extra razoável por cima do Argon2id, e só ajuda enquanto a chave dele ficar fora do vazamento. Criptografia é reversível: quem pega a chave pega todas as senhas.
- **Só regras de composição de senha.** Elas mudam quais senhas as pessoas escolhem e não fazem nada contra um hash rápido ou um login sem limite.
- **Um limite só por endereço IP**, ou só por conta. O primeiro não vê muitos endereços tentando uma conta, o segundo não vê um endereço tentando muitas contas. Um limite guardado no navegador (um cookie, um campo escondido, JavaScript) não é limite: quem chama o controla.
- **Um bloqueio permanente.** Ele transforma a proteção em um jeito de desativar a conta dos outros.
- **Apagar o cookie no logout**, ou manter o id e só "marcá-lo como logado". O servidor precisa esquecer o id antigo.
- **`HttpOnly` como cura para XSS.** Ele impede um script de copiar o cookie, e um script na página ainda consegue enviar requisições como o usuário. Cada atributo fecha uma porta.
- **Uma mensagem vaga com status, corpo ou tempo diferentes.** Se as duas respostas puderem ser distinguidas de qualquer jeito, os nomes continuam enumeráveis. As páginas de cadastro e de recuperação de senha precisam do mesmo cuidado.

## Escopo de segurança do laboratório

- Tudo roda localmente em Docker, em uma rede do compose com `internal: true`. Nenhuma porta é publicada e um teste prova que o contêiner não alcança o exterior.
- As duas APIs rodam em memória, dentro do processo de teste. Nenhuma requisição sai do contêiner, e nada aqui tem outro sistema como alvo.
- Todos os dados são falsos: `alice-fake`, `bob-fake`, `carol-legacy-fake`, senhas como `lab-fake-password-alice`.
- Não há ferramenta de quebra de senhas. O benchmark calcula o hash de uma senha falsa e não compara nada. O cenário do limite de tentativas envia uma lista fixa de seis valores obviamente errados (`wrong-fake-1` a `wrong-fake-6`) só para contar tentativas.

## Versões

| Componente | Versão |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
