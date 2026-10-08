# Blockchain

> English version: [README.md](README.md)

Uma blockchain é um livro-razão sobre o qual muitas partes que não confiam umas nas outras conseguem concordar sem uma autoridade central. Ela combina ideias estudadas em outras partes deste repositório: funções hash e árvores de Merkle tornam o histórico evidente contra adulteração, assinaturas digitais provam quem pode gastar, e a prova de trabalho transforma o acordo em uma questão de esforço computacional. Estudá-la como estrutura de dados e protocolo separa a engenharia do exagero.

## Miniprojetos

| Miniprojeto | O que ensina | Situação |
| --- | --- | --- |
| Blockchain didática (`didactic-blockchain`) | Como hashing, prova de trabalho e validação formam uma cadeia evidente contra adulteração | planejado |

## Quiz e documentação

- Perguntas do quiz: planejadas (`quiz/content/blockchain/`).
- Documentação: planejada (`docs/pt/blockchain/`).
- Referências de todas as áreas: [REFERENCES.pt-BR.md](../../REFERENCES.pt-BR.md)

## Referências

Fontes selecionadas, não uma lista exaustiva. Todos os links foram verificados quando a lista foi escrita.

### Comece por aqui

- [But how does bitcoin actually work?](https://www.youtube.com/watch?v=bBC-nXj3Ng4), Grant Sanderson, 3Blue1Brown. Gratuito. Constrói a ideia passo a passo: um livro-razão público, assinaturas, hashes, blocos e prova de trabalho.
- [Blockchain Demo](https://andersbrownworth.com/blockchain/), Anders Brownworth. Gratuito. Página interativa em que você altera um bloco e vê os hashes da cadeia se quebrarem.
- [Learn Me A Bitcoin](https://learnmeabitcoin.com/), Greg Walker. Gratuito. Guia técnico direto com diagramas e ferramentas para chaves, transações, blocos e mineração.

### Livros

- [Bitcoin and Cryptocurrency Technologies](https://bitcoinbook.cs.princeton.edu/), Narayanan, Bonneau, Felten, Miller and Goldfeder, Princeton. Gratuito online, pago impresso. Livro-texto universitário com rascunho gratuito online: criptografia, consenso, mineração e alternativas.
- [Mastering Bitcoin, 3rd edition](https://github.com/bitcoinbook/bitcoinbook), Andreas Antonopoulos and David Harding. Gratuito online, pago impresso. O livro técnico detalhado, com o texto completo aberto no GitHub: chaves, transações, a rede e mineração.
- [Mastering Ethereum, 2nd edition](https://github.com/ethereumbook/ethereumbook), Andreas Antonopoulos, Gavin Wood and others. Gratuito online, pago impresso. O livro aberto equivalente para o modelo de contas e os contratos inteligentes.

### Cursos e aulas

- [Bitcoin and Cryptocurrency Technologies](https://www.coursera.org/learn/cryptocurrency), Princeton University (Coursera). Gratuito como ouvinte, certificado pago. O curso em vídeo do livro-texto de Princeton.
- [MIT 15.S12 Blockchain and Money](https://ocw.mit.edu/courses/15-s12-blockchain-and-money-fall-2018/), Gary Gensler, MIT OpenCourseWare. Gratuito. Aulas que cobrem a tecnologia e depois avaliam com sobriedade onde ela é e onde não é útil.
- [MIT MAS.S62 Cryptocurrency Engineering and Design](https://ocw.mit.edu/courses/mas-s62-cryptocurrency-engineering-and-design-spring-2018/), Neha Narula and Tadge Dryja, MIT OpenCourseWare. Gratuito. Um curso de engenharia: assinaturas, saídas não gastas, prova de trabalho, forks e escalabilidade.

### Artigos e especificações

- [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf), Satoshi Nakamoto (2008). Gratuito. O artigo de nove páginas que o quiz segue: transações, servidor de carimbo de tempo, prova de trabalho e incentivos.
- [Bitcoin: Um Sistema de Dinheiro Eletrônico Peer-to-Peer](https://bitcoin.org/files/bitcoin-paper/bitcoin_pt_br.pdf), Satoshi Nakamoto, tradução para o português. Em português. Gratuito. A tradução do artigo para o português do Brasil, hospedada em bitcoin.org.
- [Hashcash: A Denial of Service Counter-Measure](http://www.hashcash.org/papers/hashcash.pdf), Adam Back (2002). Gratuito. O esquema de prova de trabalho que o Bitcoin adaptou para a mineração.
- [The Byzantine Generals Problem](https://lamport.azurewebsites.net/pubs/byz.pdf), Lamport, Shostak and Pease (1982). Gratuito. O enunciado clássico do acordo entre partes quando algumas delas podem mentir.
- [Ethereum Whitepaper](https://ethereum.org/en/whitepaper/), Vitalik Buterin (2014). Gratuito. Revisa o Bitcoin como um sistema de transição de estados e propõe uma cadeia de propósito geral.
- [FIPS 180-4: Secure Hash Standard](https://csrc.nist.gov/pubs/fips/180-4/upd1/final), NIST. Gratuito. A especificação oficial do SHA-256, a função hash usada em todo o Bitcoin.
- [Majority is not Enough: Bitcoin Mining is Vulnerable](https://arxiv.org/abs/1311.0243), Ittay Eyal and Emin Gün Sirer (2013). Gratuito. A análise da mineração egoísta, um bom exercício de raciocínio sobre incentivos.

### Documentação oficial

- [Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/), Bitcoin.org developer documentation. Gratuito. A cadeia de blocos, transações, contratos, carteiras e a rede ponto a ponto, com referências.
- [Ethereum: Proof-of-stake](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/), ethereum.org. Gratuito. A explicação oficial de validadores, finalidade e a comparação com a prova de trabalho.

### Vídeos

- [MIT 15.S12 Blockchain and Money, Fall 2018 (lecture videos)](https://www.youtube.com/playlist?list=PLUl4u3cNGP63UUkfL0onkxF6MYgVa04Fn), Gary Gensler, MIT OpenCourseWare. Gratuito. As aulas gravadas do curso acima.

### Prática e ferramentas

- [Naivecoin: a tutorial for building a cryptocurrency](https://lhartikk.github.io/), Lauri Hartikka. Gratuito. Tutorial em TypeScript que faz uma cadeia mínima crescer até ter prova de trabalho e transações.
- [mempool.space](https://mempool.space/), The Mempool Open Source Project. Gratuito. Explorador de código aberto para ver blocos reais, transações e ajustes de dificuldade.

### Comunidades

- [Bitcoin Stack Exchange](https://bitcoin.stackexchange.com/), Stack Exchange. Gratuito. Dúvidas técnicas respondidas por desenvolvedores do protocolo.
- [Bitcoin Optech](https://bitcoinops.org/), Bitcoin Optech. Gratuito. Boletim técnico semanal e índice de temas sobre como o protocolo evolui.
