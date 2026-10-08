# Blockchain didática

> English version: [docs/en/blockchain/didactic-blockchain.md](../../en/blockchain/didactic-blockchain.md)

Mini-projeto: [`projects/blockchain/didactic-blockchain`](../../../projects/blockchain/didactic-blockchain/README.pt-BR.md) (MP-CHAIN-1). Linguagens: TypeScript e Rust. Quiz: área `blockchain`, tópicos `hash-functions`, `digital-signatures-and-keys`, `transactions-and-unspent-outputs`, `blocks-chain-and-merkle-trees`, `proof-of-work-and-difficulty`, `double-spending-and-confirmations`, `network-and-consensus` e `incentives-and-mining`. Fonte: Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System" (2008).

É um brinquedo didático. Roda só localmente, em uma rede interna do docker-compose, sem conexão com nenhuma rede real e sem chaves nem moedas reais.

## O problema

Dinheiro digital é informação, e informação pode ser copiada. Uma assinatura prova que o dono autorizou uma transferência, mas nada na assinatura impede o dono de assinar a mesma moeda para duas pessoas. A solução usual é uma parte central que vê todas as transações e decide qual veio primeiro. O artigo pergunta como uma rede de desconhecidos pode concordar sobre essa ordem sem essa parte.

A resposta tem quatro partes, e o mini-projeto constrói cada uma.

## 1. Hashes tornam a adulteração visível

Um hash criptográfico dá uma impressão digital de tamanho fixo para qualquer dado, e mudar um bit do dado muda a impressão digital inteira. Três usos dele, empilhados:

```
id da transação = hash(entradas e saídas da transação)
raiz de Merkle  = hash dos ids, aos pares, nível a nível
hash do bloco   = hash(altura | hash do bloco anterior | raiz de Merkle | tempo | dificuldade | nonce)
```

Como cada cabeçalho de bloco contém o hash do bloco anterior, os blocos formam uma cadeia. Mude um valor em uma transação antiga, e o id dela deixa de conferir. Recalcule o id, e a raiz de Merkle deixa de conferir. Recalcule a raiz, e o hash do bloco muda, de modo que o bloco seguinte aponta para um hash que não existe mais. `validateChain` (`validate` em Rust) reexecuta essas checagens a partir do bloco gênese, e os testes alteram cada transação de uma cadeia de exemplo para provar que toda alteração é detectada.

A árvore de Merkle também dá provas de inclusão curtas: um hash irmão por nível, cerca de `log2(n)` hashes para `n` transações, que é o que permite a um cliente leve conferir um pagamento guardando só os cabeçalhos dos blocos.

## 2. A prova de trabalho torna a adulteração cara

Hashes sozinhos só tornam a alteração visível. Um atacante poderia recalcular todos os hashes depois da alteração. A prova de trabalho faz cada bloco custar algo: o bloco só é válido se o hash dele começar com `d` dígitos hexadecimais zero. O hash não pode ser previsto, então o minerador testa nonces até um servir.

| Dígitos hex zero | Fração dos hashes aceita | Média de tentativas |
| ---: | ---: | ---: |
| 1 | 1 em 16 | 16 |
| 2 | 1 em 256 | 256 |
| 3 | 1 em 4.096 | 4.096 |
| 4 | 1 em 65.536 | 65.536 |

Achar o nonce custa `16^d` hashes em média, e conferi-lo custa um. Medido no benchmark versionado ([`results/mining.md`](../../../projects/blockchain/didactic-blockchain/results/mining.md) traz a máquina, as versões e os comandos; a máquina estava compartilhada, então os tempos têm ruído):

| Dígitos hex zero | Média de tentativas | TypeScript, ms por bloco | Razão de tempo | Rust, ms por bloco | Razão de tempo |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 15,9 | 0,0584 | - | 0,0229 | - |
| 2 | 259,6 | 0,7203 | 12,3 | 0,2578 | 11,2 |
| 3 | 3.963,8 | 11,57 | 16,1 | 3,683 | 14,3 |
| 4 | 60.242,1 | 195,9 | 16,9 | 57,36 | 15,6 |

As tentativas crescem 16,3, 15,3 e 15,2 vezes por dígito a mais. O tempo acompanha a partir da dificuldade 2. Na dificuldade 1 um bloco são só 16 hashes, então o custo fixo de preparar um cabeçalho aparece no tempo e a primeira razão é menor. Minerar é uma loteria, não uma tarefa com progresso: as tentativas de um bloco podem ficar longe da média, e por isso a tabela faz a média de muitos blocos.

Reescrever um bloco antigo passa a exigir refazer a prova de trabalho dele e a de todos os blocos seguintes, enquanto a rede honesta continua acrescentando blocos.

## 3. Saídas não gastas barram o gasto duplo

Uma transação consome saídas de transações anteriores e cria saídas novas. O estado do sistema é o conjunto de saídas não gastas (UTXO). Uma transação é válida quando:

1. o id é o hash do conteúdo;
2. toda entrada aponta para uma saída que está no conjunto;
3. toda entrada é assinada pela chave à qual a saída gasta está presa;
4. as saídas somam no máximo o total das entradas. A diferença é a taxa.

A regra 2 é a checagem de gasto duplo. Depois que um pagamento é aceito, a saída que ele gastou some, então uma segunda transação que a gaste recebe "does not exist or was already spent". Um nó aplica a mesma ideia às transações que ainda esperam um bloco (vale a primeira vista), e um bloco que carrega duas transações conflitantes é inválido.

A primeira transação de um bloco cria moedas novas para o minerador: a recompensa do bloco mais as taxas. É o único lugar em que moedas são criadas, e o limite é uma regra de validade conferida por todo nó.

## 4. A cadeia válida mais longa é o histórico combinado

Os nós difundem mensagens: o que um nó aceita de novo, ele repassa aos pares. Dois mineradores podem achar um bloco na mesma altura quase ao mesmo tempo, e então a rede tem uma bifurcação. A regra do artigo:

- em um empate, o nó continua trabalhando no bloco que viu primeiro e guarda o outro ramo;
- quando um ramo fica mais longo, todos os nós mudam para ele;
- as transações que só estavam no ramo abandonado voltam para a fila de pendentes.

A demo cria uma bifurcação de propósito, cortando as ligações entre os nós:

```
            partição                       ligações restauradas
A, B:  ... - 3 - 4a - 5a          ->   A, B, C:  ... - 3 - 4a - 5a - 6
C:     ... - 3 - 4c (paga Carol)                 4c abandonado, o pagamento volta a ficar
                                                 pendente e é confirmado no bloco 6
```

Dois detalhes importam. Primeiro, a validade vem antes do comprimento: uma cadeia mais longa com um bloco que quebra uma regra é recusada, então o poder computacional consegue reordenar transações, mas não criar moedas nem gastar moedas alheias. Segundo, um pagamento com uma confirmação pode perdê-la, como aconteceu com o pagamento a Carol. Esperar mais blocos torna isso exponencialmente menos provável enquanto os nós honestos tiverem a maior parte do poder computacional.

## O que as duas linguagens mostram

O TypeScript é a referência e tem tudo, incluindo as assinaturas (Ed25519 do `node:crypto`) e os nós HTTP. O Rust repete a parte em que a linguagem muda a lição: o SHA-256 escrito à mão, porque a biblioteca padrão do Rust não tem um, mais a raiz de Merkle, a mineração e a validação da cadeia. As duas montam o mesmo texto de cabeçalho, então acham os mesmos nonces. Os testes em Rust conferem valores impressos pela referência em TypeScript, e o benchmark informa que as duas testaram exatamente o mesmo número de nonces.

## Limites do brinquedo

- Dificuldade fixa em passos de 16, sem reajuste, e "mais longa" conta blocos. Redes reais usam um alvo numérico, o ajustam e comparam o trabalho acumulado.
- Um nó que ficou para trás baixa a cadeia inteira de um par. Não há sincronização por cabeçalhos, descoberta de pares nem proteção contra um par que inunde um nó.
- Uma chave pública por saída, sem scripts, sem mercado de taxas, sem limite de tamanho de bloco.
- As chaves são derivadas de rótulos públicos, então não protegem nada.
- A prova de trabalho compra segurança com energia, e a garantia dela é probabilística e depende de os nós honestos terem a maior parte do poder computacional. O tópico `limits-and-alternatives` do quiz trata disso e da prova de participação.

## Como rodar

```sh
cd projects/blockchain/didactic-blockchain
./setup-unix-didactic-blockchain.sh          # testes e demo
./setup-unix-didactic-blockchain.sh bench    # tabela de tempos
```
