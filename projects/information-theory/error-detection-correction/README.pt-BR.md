# error-detection-correction

> English version: [README.md](README.md)

Como a redundância detecta e conserta bits invertidos? Este mini-projeto implementa, em C++, três códigos **detectores** (bit de paridade, checksum da Internet, CRC-32) e três códigos **corretores** (repetição tripla, Hamming(7,4) e Hamming estendido (8,4)), e um **simulador de ruído** que envia blocos por um canal binário simétrico e conta quantos blocos danificados cada esquema detectou, corrigiu ou deixou passar.

Explicação completa: [docs/pt/information-theory/error-detection-correction.md](../../../docs/pt/information-theory/error-detection-correction.md).

## Tópicos do quiz que ele demonstra

- `information-theory` / `error-detection`: paridade e o que ela deixa passar, checksum aditivo e sua cegueira para a ordem, CRC como resto de divisão polinomial, garantia para rajadas, detecção seguida de retransmissão.
- `information-theory` / `error-correction`: distância de Hamming, repetição com voto de maioria, codificação e síndrome do Hamming(7,4), correção errada de erros duplos, SECDED.
- `information-theory` / `channel-capacity-noise`: o canal binário simétrico, taxa de erro de bit contra taxa de erro de bloco.
- `information-theory` / `encoding-hashing-encryption`: um CRC protege contra acidentes, e não contra um atacante.

## Como rodar

O único requisito é o Docker.

```sh
./setup-unix-error-detection-correction.sh        # Linux e macOS
./setup-windows-error-detection-correction.ps1    # Windows
```

O script constrói a imagem fixada, roda a checagem do formatador e os testes, e depois roda o simulador.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `cpp/detection.hpp` | paridade par, checksum da Internet (RFC 1071), CRC-32 bit a bit e com tabela |
| `cpp/hamming.hpp` | Hamming(7,4), Hamming estendido (8,4), repetição (3,1) |
| `cpp/simulator.hpp` | gerador pseudoaleatório, canal binário simétrico, contagens e a tabela |
| `cpp/demo.cpp` | o simulador de ruído |
| `cpp/test_codes.cpp` | os testes |
| `results/results.md` | a tabela versionada |

C++23 apenas com cabeçalhos e a biblioteca padrão. O código é compilado com `-Wall -Wextra -Werror` e conferido com clang-format.

## Testes

```sh
docker compose run --rm cpp-test
```

- O CRC-32 dá o valor de conferência padrão `0xCBF43926` para a string `123456789`, bit a bit e com a tabela, e as duas versões concordam em dados aleatórios.
- Hamming(7,4), de forma exaustiva: todo erro de um bit em cada uma das 16 palavras de código é corrigido (16 × 7 casos), e todo erro duplo é corrigido para o valor errado (16 × 21 casos).
- Hamming(8,4), de forma exaustiva: todo erro simples corrigido (16 × 8) e todo erro duplo detectado (16 × 28).
- As distâncias mínimas 3 e 4 são medidas sobre todos os pares de palavras de código.
- A paridade pega toda inversão simples e deixa passar toda inversão dupla. O checksum reproduz o exemplo da RFC 1071 e deixa passar duas palavras trocadas, que o CRC-32 pega.
- O CRC-32 detecta toda rajada de até 12 bits em cada posição de um quadro, e 100.000 rajadas aleatórias de até 32 bits.
- O simulador é determinístico, suas contagens fecham, e a fração de blocos danificados bate com 1 − (1 − p)^n.

## Demonstração

```sh
docker compose run --rm demo
```

Imprime a tabela e regrava [results/results.md](results/results.md). A execução tem semente fixa, então os números são os mesmos em qualquer máquina. 200.000 blocos por linha. Trecho (tabela completa no arquivo de resultados):

| Esquema | Bloco (bits) | BER | Com erros | Detectados | Corrigidos | Perdidos |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Parity bit | 9 | 0.01 | 17220 | 16582 | 0 | 638 |
| Internet checksum | 272 | 0.01 | 186952 | 185317 | 0 | 1635 |
| CRC-32 | 288 | 0.01 | 188736 | 188736 | 0 | 0 |
| Repetition (3,1) | 3 | 0.01 | 6123 | 0 | 6068 | 55 |
| Hamming (7,4) | 7 | 0.01 | 13613 | 0 | 13225 | 388 |
| Hamming (8,4) SECDED | 8 | 0.01 | 15359 | 518 | 14825 | 16 |

O que ler nela:

- **Detectado** significa "retransmita", **corrigido** significa "consertado na hora", **perdido** significa "dados errados entregues como bons". Perdido é a coluna que importa.
- A paridade deixa passar todo bloco com um número par de inversões. O CRC-32 não deixa passar nada em mais de 600.000 quadros danificados.
- O checksum deixa passar quadros em que duas inversões se cancelam na soma (a mesma posição de bit em duas palavras, uma subindo e outra descendo).
- O Hamming(7,4) conserta erros simples, mas transforma todo erro duplo em dados errados. Um bit a mais, no Hamming(8,4), transforma quase todos esses casos em erros detectados.
- Com taxa de erro de bit de 0,01, 94% dos quadros de 288 bits chegam danificados. Uma taxa pequena por bit é uma taxa grande por quadro.

## Limites

O canal inverte bits de forma independente. Enlaces reais também produzem rajadas, que são o caso para o qual os CRCs são projetados e os códigos de Hamming não. Os códigos trabalham com um bloco de cada vez: não há enquadramento, protocolo de retransmissão nem entrelaçamento.
