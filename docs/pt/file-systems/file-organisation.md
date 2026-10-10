# Organização de arquivos e índices

> English version: [docs/en/file-systems/file-organisation.md](../../en/file-systems/file-organisation.md) · Versión en español: [docs/es/file-systems/file-organisation.md](../../es/file-systems/file-organisation.md)

Mini-projeto: [projects/file-systems/file-organisation](../../../projects/file-systems/file-organisation). Linguagens: C++, Rust. Tópicos do quiz: `file-systems` / `record-organisation`, `indexes`, `compression-and-space-reclamation`.

## O problema

Para o sistema operacional, um arquivo é uma sequência de bytes. Campos, registros, chaves e espaço livre são uma interpretação que o programa precisa gravar no arquivo, de um jeito que permita lê-la de volta. E como um acesso a disco custa cerca de cem mil vezes mais que um acesso à memória, a organização é julgada por quantas leituras uma busca precisa, e não por quantas comparações.

Este mini-projeto monta as respostas clássicas uma sobre a outra: registros de tamanho fixo, cabeçalho, lista de livres, índice primário, índices secundários e compressão.

## O arquivo de dados

```text
byte 0                     32             96             160
     +----------------------+--------------+--------------+-----
     | cabeçalho (32 bytes) | slot, RRN 0  | slot, RRN 1  | ...
     +----------------------+--------------+--------------+-----
```

| Campo do cabeçalho | Bytes | Significado |
| --- | --- | --- |
| magic | 0 a 3 | `FORG` |
| versão | 4 a 7 | 1 |
| tamanho do registro | 8 a 11 | 64 |
| número de slots | 12 a 15 | slots do arquivo, em uso ou livres |
| registros em uso | 16 a 19 | |
| cabeça da lista de livres | 20 a 23 | RRN do topo da lista de livres, ou -1 |

| Campo do slot | Bytes | Significado |
| --- | --- | --- |
| marca | 0 | 0x01 para um registro em uso, `*` para um slot livre |
| id | 1 a 4 | chave primária (em um slot livre: RRN do próximo slot livre) |
| ano | 5 a 6 | |
| cidade | 7 a 26 | texto completado com espaços |
| nome | 27 a 63 | texto completado com espaços |

Os inteiros são little-endian em posições fixas, então o arquivo não depende da máquina nem da linguagem que o gravou.

Como todo slot tem 64 bytes, o slot de número relativo (RRN) n começa no **byte 32 + n x 64**. Os RRNs começam em zero. Ler o registro 25 é um seek para o byte 1.632, sem ler nenhum outro registro. O preço é o preenchimento: uma cidade de 6 letras ocupa 20 bytes do mesmo jeito.

## A lista de livres

Remover um registro não move nada. O slot é marcado com `*`, a cabeça antiga da lista de livres é gravada dentro dele, e o cabeçalho passa a apontar para esse slot. A lista é uma pilha que mora no próprio espaço que ela administra:

```text
remove RRN 3, depois 7, depois 2:  cabeçalho.free_head = 2
                                   slot 2: * próximo 7
                                   slot 7: * próximo 3
                                   slot 3: * próximo -1
insere X:                          X vai para o slot 2, cabeçalho.free_head = 7
```

Uma inserção desempilha o topo, e o arquivo só cresce quando a pilha está vazia. Qualquer slot livre serve para qualquer registro, e é por isso que uma pilha basta aqui. Com registros de tamanho variável, seria preciso procurar na lista um espaço que servisse (first-fit, best-fit, worst-fit).

## O índice primário

O índice é uma lista de entradas de tamanho fixo (id, RRN) ordenada por id. O arquivo de dados fica em ordem de chegada. Buscar um id é uma busca binária na memória, no máximo 14 sondagens para 10.500 entradas, seguida da leitura de um slot.

O índice fica na memória enquanto os arquivos estão abertos e é gravado em `primary.idx` por `close()`. O arquivo tem no cabeçalho um **indicador de desatualizado**. Antes da primeira alteração de uma sessão, o indicador é ligado em disco, e `close()` o desliga. Se a abertura seguinte encontra o indicador ligado, a última sessão não terminou, e o índice é reconstruído com a leitura do arquivo de dados. Os dados são a verdade, e o índice é derivado deles.

## Índices secundários e listas invertidas

Um índice secundário responde buscas por um campo que se repete, aqui a cidade e o ano. Ele tem duas partes:

```text
tabela de chaves (city.sec)      arquivo de listas (city.lst)
NATAL   -> 1                     0: id 30, próximo -1
RECIFE  -> 2                     1: id 20, próximo -1
                                 2: id 10, próximo 3
                                 3: id 20, próximo 0
```

A tabela de chaves tem uma entrada por cidade, com a posição do primeiro nó de uma lista encadeada. Cada nó guarda uma **chave primária** e a posição do próximo nó. Incluir um registro acrescenta um nó e altera um elo, qualquer que seja o tamanho da lista.

Duas decisões importam:

- **Ligação tardia.** As listas guardam chaves primárias, e não RRNs. Uma busca por cidade passa pelo índice primário para achar cada registro. Isso custa uma consulta a mais na memória e, em troca, uma remoção mexe só no índice primário: a chave do registro removido continua na lista e é descartada quando o índice primário não a conhece.
- **Listas ordenadas.** Cada lista é mantida em ordem crescente de chave primária, então a consulta "cidade = RECIFE e ano = 2010" é um matching cossequencial: as duas listas são percorridas uma vez, avançando a que tem a menor chave.

## Compressão

- **Codificação run-length**: uma sequência de 4 ou mais bytes iguais vira 3 bytes (marcador 0xFF, valor, contagem até 255). Um byte de dado igual ao marcador é sempre gravado como sequência. Ela elimina o preenchimento dos registros.
- **Codificação de Huffman**: os dois nós menos frequentes são unidos até sobrar uma árvore, e o código de um byte é o seu caminho a partir da raiz. Bytes frequentes recebem códigos curtos, e nenhum código é o começo de outro. O arquivo comprimido guarda o tamanho original e as 256 frequências, com as quais o decodificador refaz a mesma árvore.

## O que os testes provam

| Item do plano | Teste |
| --- | --- |
| MP-FS-1.1 slots removidos são reaproveitados | o arquivo tem o mesmo tamanho depois de 334 remoções e depois das 334 inserções seguintes, todo slot reaproveitado fica abaixo do fim antigo do arquivo, e mais uma inserção acrescenta exatamente 64 bytes |
| MP-FS-1.2 busca por índice igual à varredura | depois de 6.000 inserções e remoções aleatórias, as buscas por cidade, por ano e pelos dois devolvem exatamente os registros de uma varredura completa, com os índices da sessão, carregados do disco e reconstruídos depois de um fim sem fechamento |
| MP-FS-1.3 ida e volta sem perda e taxa | nove entradas sobrevivem à codificação e à decodificação com os dois métodos e com o encadeamento, tamanhos calculados à mão são verificados, e a demonstração informa as taxas |

## A demonstração

A demonstração imprime contagens, nunca tempos, então a saída é a mesma em qualquer máquina e nas duas linguagens. Ela está versionada em [results/demo.md](../../../projects/file-systems/file-organisation/results/demo.md), e um teste em cada linguagem compara a saída com esse arquivo.

| Passo | Slots no arquivo | Registros em uso | Slots livres | Tamanho do arquivo (bytes) |
| --- | ---: | ---: | ---: | ---: |
| insere 10000 registros | 10000 | 10000 | 0 | 640032 |
| remove 3000 registros | 10000 | 7000 | 3000 | 640032 |
| insere 3000 registros | 10000 | 10000 | 0 | 640032 |
| insere 500 registros | 10500 | 10500 | 0 | 672032 |

Uma busca por cidade lê cerca de 880 slots pelo índice, os que atendem, contra 10.500 da varredura. O arquivo de dados de 672.096 bytes encolhe para 67,3% com run-length, para 57,1% com Huffman e para 53,1% com um depois do outro.

## Limites desta implementação

- Só registros de tamanho fixo, sem registros de tamanho variável e sem estratégias de alocação.
- Os índices cabem na memória. Um índice grande demais para a memória é o assunto de [Árvore B em disco](../data-structures/b-tree-on-disk.md).
- As listas secundárias só são limpas por uma reconstrução.
- Não há proteção contra uma queda no meio de uma gravação no arquivo de dados: é para isso que serve um journal.

## Como rodar

```sh
cd projects/file-systems/file-organisation
./setup-unix-file-organisation.sh            # ou ./setup-windows-file-organisation.ps1
docker compose run --rm cpp-test forg_demo   # ou rust-test
```
