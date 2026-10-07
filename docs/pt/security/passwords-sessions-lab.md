# Laboratório de senhas e sessões: armazenamento, limite de tentativas e cookies de sessão (MP-SEC-6)

> English version: [docs/en/security/passwords-sessions-lab.md](../../en/security/passwords-sessions-lab.md)

Mini-projeto: [`projects/security/passwords-sessions-lab`](../../../projects/security/passwords-sessions-lab/README.pt-BR.md). Tópicos do quiz: `authentication`, `sessions-cookies`.

Este é um laboratório defensivo. Ele roda só em Docker, em uma rede interna, em memória e com dados falsos. O código vulnerável existe apenas para tornar as falhas observáveis, e o benchmark mede funções de hash: ele não adivinha nada.

## O conceito

Um login tem três momentos, e cada um tem o seu jeito de dar errado:

| Momento | Pergunta | O que protege |
| --- | --- | --- |
| Em repouso | O que alguém descobre com uma tabela de usuários roubada? | Um hash de senha lento, com sal e que exige memória |
| Na porta | Quantas vezes alguém pode tentar? | Limite de tentativas, e respostas que não revelam nada |
| Depois da porta | O que prova que a próxima requisição vem da mesma pessoa? | Um id de sessão aleatório, trocado no login, em um cookie bem protegido |

### Guardando uma senha

O servidor nunca precisa saber a senha, só reconhecê-la. Então ele guarda a saída de uma função de mão única e repete o cálculo no login. Três propriedades importam:

| Propriedade | O que ela dá | Texto puro | MD5 | SHA-256 com sal | Argon2id |
| --- | --- | --- | --- | --- | --- |
| Mão única | A tabela não mostra as senhas | não | sim | sim | sim |
| Sal (aleatório, por senha) | Senhas iguais geram hashes diferentes; tabelas pré-calculadas não servem | não | não | sim | sim |
| Lento e exige memória | Cada palpite contra uma tabela roubada custa caro | não | não | não | sim |

O sal não é segredo e fica guardado ao lado do hash. O Argon2id escreve tudo em uma única string: `$argon2id$v=19$m=19456,t=2,p=1$<sal>$<hash>`, em que `m` é a memória em KiB, `t` o número de passadas e `p` o número de threads.

### O que o benchmark mostra

`docker compose run --rm bench` calcula o hash de uma senha falsa repetidas vezes e informa hashes por segundo: uma rodada de aquecimento descartada e cinco rodadas medidas por esquema, em uma thread, com a mediana e a faixa. A rodada versionada (AMD Ryzen 7 5700X3D, Bun 1.4.2 em Docker) está em [`results/results.md`](../../../projects/security/passwords-sessions-lab/results/results.md):

| Esquema | Hashes/s (mediana) | Tempo por hash |
| --- | --- | --- |
| MD5, sem sal | 843.636 | 1,19 µs |
| SHA-256, sal de 16 bytes | 548.724 | 1,82 µs |
| Argon2id, 19 MiB, t=2, p=1 | 22 | 45 ms |
| Argon2id, 64 MiB, t=3, p=1 | 3,5 | 285 ms |

A taxa é o custo do servidor por login e, lida pelo outro lado, o número de palpites por segundo que um núcleo de CPU consegue testar contra uma tabela roubada. Um hash rápido deixa cada palpite quase de graça. O Argon2id faz cada um custar dezenas de milissegundos e megabytes de memória, cerca de 38.000 vezes o custo do MD5 nesta máquina, enquanto um usuário paga isso uma vez por login. O sal não deixa nada mais lento (SHA-256 com sal é tão rápido quanto MD5): o trabalho dele é fazer de cada linha um problema separado. As duas linhas de Argon2id mostram que o custo é um parâmetro a aumentar com o tempo.

## A falha

```
outra pessoa                        servidor (vulnerável)                   alice-fake
GET /home  ---------------------->  sessão nova X, anônima
        (X vai parar no navegador da alice-fake)
                                    POST /login, cookie sid=X  <----------  senha certa
                                    a sessão X agora é alice-fake
GET /me, cookie sid=X  ---------->  200 {"user":"alice-fake"}
```

A API vulnerável tem cinco falhas, cada uma delas uma omissão:

| Falha | O que o código faz |
| --- | --- |
| Sem limite de tentativas | Avalia toda senha errada, sem contar |
| Fixação de sessão | Mantém o id de sessão que o navegador já tinha e o marca como logado |
| Logout só no navegador | Apaga o cookie e mantém a sessão válida no servidor, sem expiração |
| Cookie sem atributos | `sid=...; Path=/`, sem `HttpOnly`, `Secure` ou `SameSite` |
| Enumeração de usuários | Responde `unknown_user` ou `wrong_password` |

Ela também guarda as senhas como MD5 sem sal.

## A correção

| Falha | Correção em `ts/src/fixed/` |
| --- | --- |
| Armazenamento fraco | Argon2id pelo `Bun.password` (19 MiB, 2 passadas). `needsRehash` e `verifyAndUpgrade` trocam um hash antigo no próximo login bem-sucedido |
| Sem limite de tentativas | `AttemptLimiter`, duas vezes: por conta (5 falhas em 15 minutos, bloqueio de 15 minutos) e por cliente (10 falhas). `429` com `Retry-After`. O relógio é injetado, então os testes não dormem |
| Fixação de sessão | A cada login o id antigo é destruído e um novo é criado a partir de 32 bytes aleatórios |
| Logout | A sessão é apagada no servidor. Expiração por inatividade de 15 minutos e absoluta de 8 horas |
| Cookie sem atributos | `__Host-sid=...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`, sem `Domain` |
| Enumeração de usuários | Uma resposta só, `401 invalid_credentials`. Um usuário desconhecido é conferido contra um hash Argon2id de mentira, então o tempo é parecido. O bloqueio conta pelo nome digitado, exista ou não |
| Entrada sem validação | Zod: objeto estrito, padrão para o nome de usuário, senha de no máximo 128 caracteres |

A ordem dentro do login corrigido importa: validar o corpo, conferir os dois limites, verificar a senha (sempre, mesmo para um nome desconhecido), registrar a falha ou zerar a contagem, e só então trocar a sessão.

### O que cada atributo do cookie faz

| Atributo | Fecha |
| --- | --- |
| `HttpOnly` | Scripts da página lendo o cookie (`document.cookie`) |
| `Secure` | O cookie viajando por HTTP puro |
| `SameSite=Lax` | O cookie sendo anexado a requisições que outros sites iniciam em segundo plano |
| Prefixo `__Host-` | Outro subdomínio ou uma página HTTP sobrescrevendo o cookie: o navegador exige `Secure`, `Path=/` e nenhum `Domain` |
| `Max-Age` | O navegador mantendo o cookie além da expiração absoluta (o servidor também a aplica) |

### O custo de um bloqueio

Um bloqueio por conta barra os palpites e deixa qualquer pessoa bloquear outra por um tempo. É por isso que ele é temporário, que o limite por cliente existe ao lado dele, e que sistemas reais acrescentam um segundo fator ou atrasos progressivos.

### O que não é correção

- Um hash genérico mais rápido ou "mais forte", ou aplicar o hash duas vezes: o problema é o custo por palpite.
- Um sal único para a tabela inteira: senhas iguais voltam a gerar hashes iguais.
- Criptografia no lugar de hash: quem pega a chave pega todas as senhas.
- Um limite guardado no navegador, um limite só por endereço IP, ou um bloqueio permanente.
- Apagar o cookie no logout enquanto o servidor mantém a sessão.
- Uma mensagem vaga com status, corpo ou tempo diferentes.

## O que os testes provam

| Item | Como é verificado |
| --- | --- |
| MP-SEC-6.1 um benchmark mostra hashes por segundo de cada esquema, só com dados falsos | `docker compose run --rm bench` imprime a tabela e grava `results/results.md` e `results/results.json` com a máquina, o runtime, os parâmetros do Argon2, o comando e a dispersão de cinco rodadas. `tests/bench.test.ts` confere a aritmética |
| MP-SEC-6.1 mesma senha, hashes diferentes | `tests/password-storage.test.ts`: texto puro igual e MD5 igual para dois usuários falsos, SHA-256 com sal e Argon2id diferentes; verificação; `needsRehash`; atualização de MD5 para Argon2id |
| MP-SEC-6.2 bloqueio | `tests/login.test.ts`: vulnerável, seis senhas erradas são todas avaliadas e a certa funciona em seguida. Corrigida, o mesmo cenário recebe `401` cinco vezes e depois `429`, mesmo com a senha certa; o bloqueio expira depois de 15 minutos com o relógio injetado. `tests/limiter.test.ts` cobre o limitador sozinho |
| MP-SEC-6.2 flags do cookie | `tests/login.test.ts`: vulnerável, o cookie só tem `Path`. Corrigida, nome `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age`, sem `Domain` |
| MP-SEC-6.2 rotação de sessão no login | `tests/login.test.ts`: vulnerável, o id de antes do login responde como `alice-fake`. Corrigida, o login emite um id diferente e o antigo recebe `401` |
| MP-SEC-6.2 o login normal continua funcionando | `tests/login.test.ts`, "normal use works", para as duas versões |
| Erro genérico, logout, expirações, validação, atualização no login | `tests/login.test.ts`, os blocos restantes |
| Isolamento do laboratório | `tests/network.test.ts`: uma requisição para `http://example.com` falha de dentro do contêiner |

## Como rodar

```sh
cd projects/security/passwords-sessions-lab
./setup-unix-passwords-sessions-lab.sh   # build, checagem de tipos e testes
docker compose run --rm demo             # o passo a passo
docker compose run --rm bench            # o benchmark
docker compose down -v --remove-orphans
```
