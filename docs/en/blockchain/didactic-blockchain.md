# Didactic blockchain

> Versão em português: [docs/pt/blockchain/didactic-blockchain.md](../../pt/blockchain/didactic-blockchain.md)

Mini-project: [`projects/blockchain/didactic-blockchain`](../../../projects/blockchain/didactic-blockchain/README.md) (MP-CHAIN-1). Languages: TypeScript and Rust. Quiz: area `blockchain`, topics `hash-functions`, `digital-signatures-and-keys`, `transactions-and-unspent-outputs`, `blocks-chain-and-merkle-trees`, `proof-of-work-and-difficulty`, `double-spending-and-confirmations`, `network-and-consensus` and `incentives-and-mining`. Source: Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System" (2008).

It is a teaching toy. It runs only locally, on an internal docker-compose network, with no connection to any real network and no real keys or coins.

## The problem

Digital money is information, and information can be copied. A signature proves that the owner authorised a transfer, but nothing in the signature stops the owner from signing the same coin over to two people. The usual fix is a central party that sees every transaction and decides which one came first. The paper asks how a network of strangers can agree on that order with no such party.

The answer has four parts, and the mini-project builds each one.

## 1. Hashes make tampering visible

A cryptographic hash gives a fixed-size fingerprint of any data, and changing one bit of the data changes the whole fingerprint. Three uses of it, stacked:

```
transaction id = hash(inputs and outputs of the transaction)
Merkle root    = hash of the ids, in pairs, level by level
block hash     = hash(height | previous block hash | Merkle root | time | difficulty | nonce)
```

Because each block header contains the hash of the previous block, the blocks form a chain. Change an amount in an old transaction and its id no longer matches. Recompute the id and the Merkle root no longer matches. Recompute the root and the block hash changes, so the next block points to a hash that no longer exists. `validateChain` (`validate` in Rust) replays these checks from the genesis block, and the tests change every transaction of a sample chain to prove that each change is caught.

The Merkle tree also gives short inclusion proofs: one sibling hash per level, about `log2(n)` hashes for `n` transactions, which is what lets a light client verify a payment while keeping only block headers.

## 2. Proof of work makes tampering expensive

Hashes alone only make a change visible. An attacker could recompute every hash after the change. Proof of work makes each block cost something: the block is valid only if its hash starts with `d` zero hexadecimal digits. The hash cannot be predicted, so the miner tries nonces until one works.

| Zero hex digits | Fraction of hashes accepted | Average attempts |
| ---: | ---: | ---: |
| 1 | 1 in 16 | 16 |
| 2 | 1 in 256 | 256 |
| 3 | 1 in 4,096 | 4,096 |
| 4 | 1 in 65,536 | 65,536 |

Finding the nonce takes `16^d` hashes on average, and checking it takes one. Measured in the committed benchmark ([`results/mining.md`](../../../projects/blockchain/didactic-blockchain/results/mining.md) has the machine, the versions and the commands; the machine was shared, so the timings are noisy):

| Zero hex digits | Mean attempts | TypeScript, ms per block | Time ratio | Rust, ms per block | Time ratio |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 15.9 | 0.0584 | - | 0.0229 | - |
| 2 | 259.6 | 0.7203 | 12.3 | 0.2578 | 11.2 |
| 3 | 3,963.8 | 11.57 | 16.1 | 3.683 | 14.3 |
| 4 | 60,242.1 | 195.9 | 16.9 | 57.36 | 15.6 |

The attempts grow 16.3, 15.3 and 15.2 times per extra digit. The time follows from difficulty 2 on. At difficulty 1 a block is only 16 hashes, so the fixed cost of preparing a header shows in the time and the first ratio is lower. Mining is a lottery, not a task with progress: the attempts of one block can be far from the average, which is why the table averages many blocks.

Rewriting an old block now means redoing its proof of work and that of every block after it, while the honest network keeps adding blocks.

## 3. Unspent outputs stop double spending

A transaction consumes outputs of earlier transactions and creates new ones. The state of the system is the set of unspent outputs (UTXO). A transaction is valid when:

1. its id is the hash of its content;
2. every input points to an output that is in the set;
3. every input is signed by the key that the spent output is locked to;
4. the outputs add up to at most the inputs. The difference is the fee.

Rule 2 is the double-spend check. Once a payment is accepted, the output it spent is gone, so a second transaction spending it "does not exist or was already spent". A node applies the same idea to transactions that are still waiting for a block (first seen wins), and a block that carries two conflicting transactions is invalid.

The first transaction of a block creates new coins for the miner: the block reward plus the fees. It is the only place where coins are created, and the limit is a validity rule checked by every node.

## 4. The longest valid chain is the agreed history

Nodes gossip: what a node newly accepts, it forwards to its peers. Two miners can find a block at the same height at almost the same time, and then the network has a fork. The rule from the paper:

- in a tie, a node keeps working on the block it saw first and remembers the other branch;
- when one branch becomes longer, every node switches to it;
- transactions that were only in the abandoned branch go back to the pending pool.

The demo creates a fork on purpose by cutting the links between the nodes:

```
            partition                      links restored
A, B:  ... - 3 - 4a - 5a          ->   A, B, C:  ... - 3 - 4a - 5a - 6
C:     ... - 3 - 4c (pays Carol)                 4c abandoned, its payment is pending again
                                                 and is confirmed in block 6
```

Two details matter. First, validity comes before length: a longer chain with a block that breaks a rule is refused, so computing power can reorder transactions but cannot create coins or spend the coins of others. Second, a payment with one confirmation can lose it, as the payment to Carol did. Waiting for more blocks makes that exponentially less likely as long as honest nodes have most of the computing power.

## What the two languages show

TypeScript is the reference and has everything, including signatures (Ed25519 from `node:crypto`) and the HTTP nodes. Rust repeats the part where the language changes the lesson: SHA-256 written by hand, because the Rust standard library has none, plus the Merkle root, mining and chain validation. Both build the same header text, so they find the same nonces. The Rust tests assert values printed by the TypeScript reference, and the benchmark reports that both tried exactly the same number of nonces.

## Limits of the toy

- Fixed difficulty in steps of 16, no retargeting, and "longest" counts blocks. Real networks use a numeric target, adjust it, and compare accumulated work.
- A node that is behind downloads the whole chain of a peer. There is no header-first sync, no peer discovery and no protection against a peer that floods a node.
- One public key per output, no scripts, no fee market, no block size limit.
- Keys are derived from public labels, so they protect nothing.
- Proof of work buys security with energy, and its guarantee is probabilistic and depends on honest nodes holding most of the computing power. The quiz topic `limits-and-alternatives` covers this and proof of stake.

## Run it

```sh
cd projects/blockchain/didactic-blockchain
./setup-unix-didactic-blockchain.sh          # tests and demo
./setup-unix-didactic-blockchain.sh bench    # timing table
```
