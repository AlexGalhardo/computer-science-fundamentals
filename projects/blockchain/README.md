# Blockchain

> Versão em português: [README.pt-BR.md](README.pt-BR.md) · Versión en español: [README.es.md](README.es.md)

A blockchain is a ledger that many parties who do not trust each other can agree on without a central authority. It combines ideas studied elsewhere in this repository: hash functions and Merkle trees make the history tamper-evident, digital signatures prove who may spend, and proof of work turns agreement into a question of computing effort. Studying it as a data structure and a protocol separates the engineering from the hype.

## Mini-projects

| Mini-project | What it teaches | Status |
| --- | --- | --- |
| Didactic blockchain (`didactic-blockchain`) | How hashing, proof of work and validation make a tamper-evident chain | planned |

## Quiz and documentation

- Quiz questions: planned (`quiz/content/blockchain/`).
- Documentation: planned (`docs/en/blockchain/`).
- References of every area: [REFERENCES.md](../../REFERENCES.md)

## References

Selected sources, not an exhaustive list. Every link was checked when the list was written.

### Start here

- [But how does bitcoin actually work?](https://www.youtube.com/watch?v=bBC-nXj3Ng4), Grant Sanderson, 3Blue1Brown. Free. Builds the idea step by step: a public ledger, signatures, hashes, blocks and proof of work.
- [Blockchain Demo](https://andersbrownworth.com/blockchain/), Anders Brownworth. Free. An interactive page where you change a block and watch the hashes of the chain break.
- [Learn Me A Bitcoin](https://learnmeabitcoin.com/), Greg Walker. Free. A plain technical guide with diagrams and tools for keys, transactions, blocks and mining.

### Books

- [Bitcoin and Cryptocurrency Technologies](https://bitcoinbook.cs.princeton.edu/), Narayanan, Bonneau, Felten, Miller and Goldfeder, Princeton. Free online, paid in print. A university textbook with a free draft online: cryptography, consensus, mining and alternatives.
- [Mastering Bitcoin, 3rd edition](https://github.com/bitcoinbook/bitcoinbook), Andreas Antonopoulos and David Harding. Free online, paid in print. The detailed technical book, with its full text open on GitHub: keys, transactions, the network and mining.
- [Mastering Ethereum, 2nd edition](https://github.com/ethereumbook/ethereumbook), Andreas Antonopoulos, Gavin Wood and others. Free online, paid in print. The equivalent open book for the account model and smart contracts.

### Courses and lectures

- [Bitcoin and Cryptocurrency Technologies](https://www.coursera.org/learn/cryptocurrency), Princeton University (Coursera). Free to audit, paid certificate. The video course of the Princeton textbook.
- [MIT 15.S12 Blockchain and Money](https://ocw.mit.edu/courses/15-s12-blockchain-and-money-fall-2018/), Gary Gensler, MIT OpenCourseWare. Free. Lectures that cover the technology and then judge soberly where it is and is not useful.
- [MIT MAS.S62 Cryptocurrency Engineering and Design](https://ocw.mit.edu/courses/mas-s62-cryptocurrency-engineering-and-design-spring-2018/), Neha Narula and Tadge Dryja, MIT OpenCourseWare. Free. An engineering course: signatures, unspent outputs, proof of work, forks and scalability.

### Papers and specifications

- [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf), Satoshi Nakamoto (2008). Free. The nine-page paper that the quiz follows: transactions, timestamp server, proof of work and incentives.
- [Bitcoin: Um Sistema de Dinheiro Eletrônico Peer-to-Peer](https://bitcoin.org/files/bitcoin-paper/bitcoin_pt_br.pdf), Satoshi Nakamoto, tradução para o português. In Portuguese. Free. The Brazilian Portuguese translation of the paper, hosted by bitcoin.org.
- [Hashcash: A Denial of Service Counter-Measure](http://www.hashcash.org/papers/hashcash.pdf), Adam Back (2002). Free. The proof-of-work scheme that Bitcoin adapted for mining.
- [The Byzantine Generals Problem](https://lamport.azurewebsites.net/pubs/byz.pdf), Lamport, Shostak and Pease (1982). Free. The classic statement of agreement among parties when some of them may lie.
- [Ethereum Whitepaper](https://ethereum.org/en/whitepaper/), Vitalik Buterin (2014). Free. Reviews Bitcoin as a state transition system and proposes a general-purpose chain.
- [FIPS 180-4: Secure Hash Standard](https://csrc.nist.gov/pubs/fips/180-4/upd1/final), NIST. Free. The official specification of SHA-256, the hash function used throughout Bitcoin.
- [Majority is not Enough: Bitcoin Mining is Vulnerable](https://arxiv.org/abs/1311.0243), Ittay Eyal and Emin Gün Sirer (2013). Free. The analysis of selfish mining, a good exercise in reasoning about incentives.

### Official documentation

- [Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/), Bitcoin.org developer documentation. Free. The block chain, transactions, contracts, wallets and the peer-to-peer network, with references.
- [Ethereum: Proof-of-stake](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/), ethereum.org. Free. The official explanation of validators, finality and how it compares with proof of work.

### Videos

- [MIT 15.S12 Blockchain and Money, Fall 2018 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63UUkfL0onkxF6MYgVa04Fn), Gary Gensler, MIT OpenCourseWare. Free. The recorded lectures of the course above.

### Practice and tools

- [Naivecoin: a tutorial for building a cryptocurrency](https://lhartikk.github.io/), Lauri Hartikka. Free. A TypeScript tutorial that grows a minimal chain into one with proof of work and transactions.
- [mempool.space](https://mempool.space/), The Mempool Open Source Project. Free. An open source explorer to look at real blocks, transactions and difficulty adjustments.

### Communities

- [Bitcoin Stack Exchange](https://bitcoin.stackexchange.com/), Stack Exchange. Free. Technical questions answered by protocol developers.
- [Bitcoin Optech](https://bitcoinops.org/), Bitcoin Optech. Free. A weekly technical newsletter and a topic index on how the protocol evolves.
