# didactic-blockchain

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A toy blockchain small enough to read in one sitting: blocks linked by hashes, a Merkle root per block, proof of work with adjustable difficulty, signed transactions over unspent outputs, and three local nodes that gossip and follow the longest chain. It shows why changing one old transaction is detected, why a coin cannot be spent twice and how a fork resolves itself.

Plan item: MP-CHAIN-1. Languages: TypeScript (reference, everything) and Rust (hashing, Merkle root, proof of work and chain validation). Full write-up: [docs/en/blockchain/didactic-blockchain.md](../../../docs/en/blockchain/didactic-blockchain.md).

**This is a teaching toy that runs only on your machine.** The nodes are containers on an internal docker-compose network with no route to the Internet and no published port. It connects to no real network and holds no real keys or coins: every "wallet" is derived from a public label such as `alice`, so anyone can recreate it. Do not reuse any of this code where real value is involved.

## What it teaches

- A hash is a fingerprint: the block header holds the hash of the previous block and the Merkle root of its transactions, so one changed amount breaks the transaction id, then the Merkle root, then the block hash, then the link from the next block.
- Proof of work is expensive to produce and cheap to check: about `16^d` attempts for `d` zero hexadecimal digits, one hash to verify. Each extra digit multiplies the mining time by about 16.
- A signature proves who authorised a transfer, not that it is the only one. Double spending is stopped by the set of unspent outputs: an output that was spent no longer exists.
- Nodes do not vote and do not trust each other. Each one validates everything and follows the longest valid chain, so a fork lasts until one branch gets ahead. Length never makes an invalid chain acceptable.
- Rewriting an old block means redoing the work of every block after it, faster than everyone else. That is the cost the chain puts on tampering, and it is also its limit: whoever has most of the computing power can reverse their own payments.

## Quiz topics it demonstrates

Area `blockchain`:

- `hash-functions` (fixed-size digest, determinism, avalanche effect)
- `digital-signatures-and-keys` (sign with the private key, verify with the public key, the key of the spent output)
- `transactions-and-unspent-outputs` (inputs, outputs, change, fee, the UTXO set)
- `blocks-chain-and-merkle-trees` (header, previous hash, Merkle root, inclusion proof, tamper evidence)
- `proof-of-work-and-difficulty` (nonce, zero digits, expected attempts, verification with one hash)
- `double-spending-and-confirmations` (first seen wins, spent outputs)
- `network-and-consensus` (gossip, forks, ties, longest chain, reorganisation)
- `incentives-and-mining` (coin-creation transaction, reward plus fees)

## Run

The only requirement is Docker.

```sh
./setup-unix-didactic-blockchain.sh        # Linux and macOS
./setup-windows-didactic-blockchain.ps1    # Windows
```

The script builds the two images, runs the TypeScript and the Rust tests, runs the Rust demo, starts three nodes and runs the network demo against them, then removes the containers and the network.

## Demo

```sh
docker compose run --rm demo       # three nodes: payment, double spend, tampering, fork
docker compose run --rm rust-demo  # one chain: build, validate, tamper, validate again
docker compose down -v
```

The network demo prints each claim and checks it, and exits with an error if one does not hold:

```text
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
./setup-unix-didactic-blockchain.sh bench        # or: ./setup-windows-didactic-blockchain.ps1 bench
```

It mines fixed block headers at 1 to 4 zero hexadecimal digits in both languages and writes [`results/mining.md`](results/mining.md), with the machine, the runtime versions and the exact commands. Summary of the committed run (median of 3 passes, one thread, a machine shared with other workloads, so the timings are noisy):

| Zero hex digits | Expected attempts | Mean attempts | TypeScript, ms per block | Time ratio | Rust, ms per block | Time ratio |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 16 | 15.9 | 0.0584 | - | 0.0229 | - |
| 2 | 256 | 259.6 | 0.7203 | 12.3 | 0.2578 | 11.2 |
| 3 | 4,096 | 3,963.8 | 11.57 | 16.1 | 3.683 | 14.3 |
| 4 | 65,536 | 60,242.1 | 195.9 | 16.9 | 57.36 | 15.6 |

The number of attempts grows 16.3, 15.3 and 15.2 times per extra digit, and it is identical in both languages because the headers are fixed. The time follows it from difficulty 2 on. Between difficulty 1 and 2 the time ratio is lower, because with only 16 hashes per block the fixed cost of preparing a header is a visible part of the time.

## Structure

| Path | Content |
| --- | --- |
| `ts/src/hash.ts`, `merkle.ts` | SHA-256 from `node:crypto`, Merkle root, inclusion proof and its verification |
| `ts/src/keys.ts` | Toy Ed25519 wallets from `node:crypto`, sign and verify |
| `ts/src/transaction.ts` | Inputs, outputs, the UTXO set, the rules of a transaction, change and fee |
| `ts/src/block.ts` | Block header, block hash, difficulty check and mining |
| `ts/src/chain.ts` | Genesis block, the rules of a block, validation of a whole chain |
| `ts/src/node.ts` | A node: chain, pending pool, first-seen rule, longest chain rule, reorganisation |
| `ts/src/server.ts` | HTTP around a node, gossip between peers, input validated with Zod |
| `ts/src/demo.ts` | The scripted scenario against three node containers |
| `ts/src/bench.ts`, `report.ts` | Mining time by difficulty and the Markdown table |
| `rust/src/sha256.rs` | SHA-256 written by hand (FIPS 180-4), checked against the published vectors |
| `rust/src/chain.rs`, `bench.rs`, `main.rs` | Merkle root, mining, chain validation, benchmark and demo in Rust |
| `results/` | Committed benchmark output |

## Tests

```sh
docker compose run --rm ts-test
docker compose run --rm rust-test
```

- Tamper evidence: changing the amount of any output of any transaction invalidates the chain, and each "repair" the attacker tries (new id, new Merkle root, new proof of work) fails at the next check. Both languages test it.
- Proof of work: a mined hash has the required zeros and verifies with one hash, and the average number of attempts grows about 16 times per extra digit (deterministic, 300 blocks per difficulty).
- Double spending: rejected in the pending pool (first seen), against confirmed outputs, and inside a block.
- Forks: a tie keeps the first block seen, the longer branch wins, an invalid longer chain is refused, and transactions of the abandoned branch return to the pool.
- Network: three HTTP nodes on loopback gossip transactions and blocks, reject malformed input and non-local peers, and resolve a partition.
- The Rust tests assert hashes, a Merkle root, a mined nonce and attempt counts printed by the TypeScript reference, which proves that both languages compute the same thing.

Formatters and linters:

```sh
bunx biome check projects/blockchain/didactic-blockchain   # TypeScript, from the repository root
docker compose run --rm ts-test                            # typecheck (tsc) and tests
docker compose run --rm rust-test                          # cargo fmt --check, clippy -D warnings, tests
```

## Dependencies

- TypeScript: `zod` 4.6.5 validates everything that arrives over HTTP, from environment variables and from the benchmark JSON files. Hashing and signatures come from the standard `node:crypto` module of Bun.
- Rust: no crates at all. Rust has no SHA-256 in its standard library, so `rust/src/sha256.rs` implements it by hand as part of the lesson. The Rust side has no signatures for the same reason: implementing Ed25519 by hand would not be didactic, and adding a crate was not needed for what Rust shows here.

## Simplifications and limits

- Difficulty is a number of zero hexadecimal digits and is fixed by the rules, so it only moves in steps of 16 and never readjusts. Real networks compare the hash with a numeric target and retarget it from the time the last blocks took.
- "Longest chain" counts blocks, which equals the most accumulated work only because every block has the same difficulty.
- A node that is behind asks a peer for its whole chain and validates it from the genesis block. Real nodes exchange headers first and download only what they miss.
- The block hash is a single SHA-256 over a text line, and the Merkle tree hashes hexadecimal text. Bitcoin hashes binary data twice. The Merkle tree duplicates the last node of an odd level, as Bitcoin does, which makes `[A, B, C]` and `[A, B, C, C]` share a root; blocks with a repeated transaction are rejected for that reason.
- An output is locked to one public key. There is no script language, no fee market, no block size limit and no peer discovery.
- Keys are derived from public labels. The security of the keys is deliberately zero.
