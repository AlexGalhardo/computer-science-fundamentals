# didactic-blockchain

> English version: [README.md](README.md)

Uma blockchain de brinquedo, pequena o bastante para ser lida de uma vez: blocos ligados por hashes, uma raiz de Merkle por bloco, prova de trabalho com dificuldade ajustável, transações assinadas sobre saídas não gastas e três nós locais que difundem mensagens e seguem a cadeia mais longa. Ela mostra por que a alteração de uma transação antiga é detectada, por que uma moeda não pode ser gasta duas vezes e como uma bifurcação se resolve sozinha.

Item do plano: MP-CHAIN-1. Linguagens: TypeScript (referência, tudo) e Rust (hash, raiz de Merkle, prova de trabalho e validação da cadeia). Texto completo: [docs/pt/blockchain/didactic-blockchain.md](../../../docs/pt/blockchain/didactic-blockchain.md).

**Este é um brinquedo didático que roda só na sua máquina.** Os nós são contêineres em uma rede interna do docker-compose, sem rota para a Internet e sem porta publicada. Ele não se conecta a nenhuma rede real e não guarda chaves nem moedas reais: toda "carteira" é derivada de um rótulo público como `alice`, então qualquer pessoa consegue recriá-la. Não reutilize nada deste código onde houver valor real envolvido.

## O que ensina

- Um hash é uma impressão digital: o cabeçalho do bloco guarda o hash do bloco anterior e a raiz de Merkle das transações, então um valor alterado quebra o id da transação, depois a raiz de Merkle, depois o hash do bloco, depois a ligação a partir do bloco seguinte.
- A prova de trabalho é cara de produzir e barata de conferir: cerca de `16^d` tentativas para `d` dígitos hexadecimais zero, um hash para verificar. Cada dígito a mais multiplica o tempo de mineração por cerca de 16.
- Uma assinatura prova quem autorizou uma transferência, não que ela seja a única. O gasto duplo é barrado pelo conjunto de saídas não gastas: uma saída que foi gasta deixa de existir.
- Os nós não votam e não confiam uns nos outros. Cada um valida tudo e segue a cadeia válida mais longa, então uma bifurcação dura até um ramo ficar à frente. O comprimento nunca torna aceitável uma cadeia inválida.
- Reescrever um bloco antigo exige refazer o trabalho de todos os blocos depois dele, mais rápido que todos os outros. Esse é o custo que a cadeia impõe à adulteração, e é também o seu limite: quem tem a maior parte do poder computacional consegue reverter os próprios pagamentos.

## Tópicos do quiz que demonstra

Área `blockchain`:

- `hash-functions` (digest de tamanho fixo, determinismo, efeito avalanche)
- `digital-signatures-and-keys` (assinar com a chave privada, conferir com a pública, a chave da saída gasta)
- `transactions-and-unspent-outputs` (entradas, saídas, troco, taxa, o conjunto UTXO)
- `blocks-chain-and-merkle-trees` (cabeçalho, hash anterior, raiz de Merkle, prova de inclusão, evidência de adulteração)
- `proof-of-work-and-difficulty` (nonce, dígitos zero, tentativas esperadas, verificação com um hash)
- `double-spending-and-confirmations` (vale o primeiro visto, saídas gastas)
- `network-and-consensus` (difusão, bifurcações, empates, cadeia mais longa, reorganização)
- `incentives-and-mining` (transação de criação de moeda, recompensa mais taxas)

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-didactic-blockchain.sh        # Linux e macOS
./setup-windows-didactic-blockchain.ps1    # Windows
```

O script constrói as duas imagens, roda os testes em TypeScript e em Rust, roda a demo em Rust, sobe três nós e roda a demo de rede contra eles, e no fim remove os contêineres e a rede.

## Demo

```sh
docker compose run --rm demo       # três nós: pagamento, gasto duplo, adulteração, bifurcação
docker compose run --rm rust-demo  # uma cadeia: montar, validar, adulterar, validar de novo
docker compose down -v
```

A demo de rede imprime cada afirmação e a confere, e termina com erro se alguma não valer (a saída do programa é em inglês):

```
4. Double spend, attempt 2: two conflicting payments sent to two different nodes
   ok   node A accepted the payment to Bob (first seen)
   ok   node C, which already heard of it, rejected the payment to Carol: output 07de...:1 does not exist or was already spent
6. Fork: the network is partitioned into {A, B} and {C}, and both sides mine
   ok   same height, different blocks: A and B at 4:0009c1e83915, C at 4:000f6d3f8ad2
7. The partition heals and the fork resolves to the longest chain
   ok   all nodes at 5:000478e0f6ab: C abandoned its own block
   ok   the payment to Carol lost its confirmation
   ok   but it is still valid, so it went back to the pending pool of C
```

## Benchmark

```sh
./setup-unix-didactic-blockchain.sh bench        # ou: ./setup-windows-didactic-blockchain.ps1 bench
```

Ele minera cabeçalhos de bloco fixos com 1 a 4 dígitos hexadecimais zero nas duas linguagens e grava [`results/mining.md`](results/mining.md), com a máquina, as versões dos runtimes e os comandos exatos. Resumo da execução versionada (mediana de 3 passadas, uma thread, máquina compartilhada com outras cargas, portanto os tempos têm ruído):

| Dígitos hex zero | Tentativas esperadas | Média de tentativas | TypeScript, ms por bloco | Razão de tempo | Rust, ms por bloco | Razão de tempo |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 16 | 15,9 | 0,0584 | - | 0,0229 | - |
| 2 | 256 | 259,6 | 0,7203 | 12,3 | 0,2578 | 11,2 |
| 3 | 4.096 | 3.963,8 | 11,57 | 16,1 | 3,683 | 14,3 |
| 4 | 65.536 | 60.242,1 | 195,9 | 16,9 | 57,36 | 15,6 |

O número de tentativas cresce 16,3, 15,3 e 15,2 vezes por dígito a mais, e é idêntico nas duas linguagens porque os cabeçalhos são fixos. O tempo o acompanha a partir da dificuldade 2. Entre as dificuldades 1 e 2 a razão de tempo é menor, porque com apenas 16 hashes por bloco o custo fixo de preparar um cabeçalho é uma parte visível do tempo.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `ts/src/hash.ts`, `merkle.ts` | SHA-256 do `node:crypto`, raiz de Merkle, prova de inclusão e sua verificação |
| `ts/src/keys.ts` | Carteiras Ed25519 de brinquedo com `node:crypto`, assinar e conferir |
| `ts/src/transaction.ts` | Entradas, saídas, o conjunto UTXO, as regras de uma transação, troco e taxa |
| `ts/src/block.ts` | Cabeçalho do bloco, hash do bloco, checagem de dificuldade e mineração |
| `ts/src/chain.ts` | Bloco gênese, as regras de um bloco, validação de uma cadeia inteira |
| `ts/src/node.ts` | Um nó: cadeia, fila de pendentes, regra do primeiro visto, regra da cadeia mais longa, reorganização |
| `ts/src/server.ts` | HTTP em volta de um nó, difusão entre pares, entrada validada com Zod |
| `ts/src/demo.ts` | O cenário roteirizado contra três contêineres de nós |
| `ts/src/bench.ts`, `report.ts` | Tempo de mineração por dificuldade e a tabela em Markdown |
| `rust/src/sha256.rs` | SHA-256 escrito à mão (FIPS 180-4), conferido com os vetores publicados |
| `rust/src/chain.rs`, `bench.rs`, `main.rs` | Raiz de Merkle, mineração, validação da cadeia, benchmark e demo em Rust |
| `results/` | Saída versionada do benchmark |

## Testes

```sh
docker compose run --rm ts-test
docker compose run --rm rust-test
```

- Evidência de adulteração: mudar o valor de qualquer saída de qualquer transação invalida a cadeia, e cada "conserto" que o atacante tenta (novo id, nova raiz de Merkle, nova prova de trabalho) falha na checagem seguinte. As duas linguagens testam isso.
- Prova de trabalho: um hash minerado tem os zeros exigidos e é conferido com um hash, e a média de tentativas cresce cerca de 16 vezes por dígito a mais (determinístico, 300 blocos por dificuldade).
- Gasto duplo: rejeitado na fila de pendentes (primeiro visto), contra saídas já confirmadas como gastas e dentro de um bloco.
- Bifurcações: um empate mantém o primeiro bloco visto, o ramo mais longo vence, uma cadeia mais longa inválida é recusada e as transações do ramo abandonado voltam para a fila.
- Rede: três nós HTTP em loopback difundem transações e blocos, rejeitam entrada malformada e pares que não são locais, e resolvem uma partição.
- Os testes em Rust conferem hashes, uma raiz de Merkle, um nonce minerado e contagens de tentativas impressos pela referência em TypeScript, o que prova que as duas linguagens calculam a mesma coisa.

Formatadores e linters:

```sh
bunx biome check projects/blockchain/didactic-blockchain   # TypeScript, a partir da raiz do repositório
docker compose run --rm ts-test                            # checagem de tipos (tsc) e testes
docker compose run --rm rust-test                          # cargo fmt --check, clippy -D warnings, testes
```

## Dependências

- TypeScript: `zod` 4.6.5 valida tudo o que chega por HTTP, por variáveis de ambiente e pelos arquivos JSON do benchmark. Hash e assinaturas vêm do módulo padrão `node:crypto` do Bun.
- Rust: nenhum crate. O Rust não tem SHA-256 na biblioteca padrão, então `rust/src/sha256.rs` o implementa à mão como parte da lição. O lado em Rust não tem assinaturas pelo mesmo motivo: implementar o Ed25519 à mão não seria didático, e acrescentar um crate não era necessário para o que o Rust mostra aqui.

## Simplificações e limites

- A dificuldade é um número de dígitos hexadecimais zero e é fixada pelas regras, então só se move em passos de 16 e nunca é reajustada. Redes reais comparam o hash com um alvo numérico e o reajustam a partir do tempo que os últimos blocos levaram.
- "Cadeia mais longa" conta blocos, o que equivale a mais trabalho acumulado só porque todo bloco tem a mesma dificuldade.
- Um nó que ficou para trás pede a um par a cadeia inteira e a valida desde o bloco gênese. Nós reais trocam cabeçalhos primeiro e baixam só o que falta.
- O hash do bloco é um único SHA-256 sobre uma linha de texto, e a árvore de Merkle faz hash de texto hexadecimal. O Bitcoin faz hash de dados binários duas vezes. A árvore de Merkle duplica o último nó de um nível ímpar, como o Bitcoin, o que faz `[A, B, C]` e `[A, B, C, C]` terem a mesma raiz; blocos com transação repetida são rejeitados por isso.
- Uma saída fica presa a uma única chave pública. Não há linguagem de script, mercado de taxas, limite de tamanho de bloco nem descoberta de pares.
- As chaves são derivadas de rótulos públicos. A segurança das chaves é zero, de propósito.
