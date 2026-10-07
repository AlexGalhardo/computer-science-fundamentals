# Simulador de paginação e TLB

> English version: [docs/en/operating-systems/paging-tlb.md](../../en/operating-systems/paging-tlb.md)

Mini-projeto: [`projects/operating-systems/paging-tlb`](../../../projects/operating-systems/paging-tlb/). Item do plano: MP-OS-2. Tópico do quiz: `operating-systems` / `memory-management`.

## O que ele ensina

Com memória virtual, o programa usa endereços virtuais, e o hardware traduz cada um para um endereço físico. O simulador mostra as três coisas que podem acontecer em um acesso (acerto na TLB, falta de TLB, falta de página), quanto cada uma custa, e como o algoritmo que escolhe a página a retirar muda o número de faltas de página.

## Tradução de endereços

O endereço virtual se divide em dois: os bits altos são o número da página, e os bits baixos são o deslocamento. O número da página é trocado pelo número da moldura, e o deslocamento é copiado.

```
página de 4096 bytes:  20500 = 5 × 4096 + 20   ->  página 5, deslocamento 20
a página 5 está na moldura 3                   ->  3 × 4096 + 20 = 12308
```

A tradução é procurada nesta ordem:

1. **TLB**, uma pequena cache de traduções recentes. Um acerto não custa nenhum acesso extra à memória.
2. **Tabela de páginas**, em uma falta de TLB. Um acesso à memória por nível da tabela.
3. **Falta de página**, quando a página não está na memória. Uma moldura é obtida, retirando outra página se preciso, e a página é carregada do disco. A página retirada sai da tabela de páginas e da TLB.

## Traço de referência da MMU

Configuração: 3 molduras, TLB de 2 entradas, LRU nas duas. Os testes conferem exatamente esta tabela.

| Acesso | Página | TLB | Falta de página | Moldura | Observação |
| ---: | ---: | --- | --- | ---: | --- |
| 1 | 0 | falta | sim | 0 | |
| 2 | 1 | falta | sim | 1 | |
| 3 | 0 | acerto | não | 0 | |
| 4 | 2 | falta | sim | 2 | a TLB descarta a página 1 |
| 5 | 0 | acerto | não | 0 | |
| 6 | 3 | falta | sim | 1 | a memória retira a página 1, a TLB descarta a página 2 |
| 7 | 1 | falta | sim | 2 | a memória retira a página 2, a TLB descarta a página 0 |
| 8 | 0 | falta | não | 0 | a página ainda está na memória: falta de TLB sem falta de página |

Totais: 2 acertos de TLB, 6 faltas de TLB, 5 faltas de página.

## Tempo efetivo de acesso

A TLB é sempre consultada. No acerto, segue-se um acesso à memória, e na falta a tabela de páginas é lida antes:

```
EAT = h × (tlb + mem) + (1 − h) × (tlb + níveis × mem + mem)
h = 0,8, tlb = 10 ns, mem = 100 ns, 1 nível:  0,8 × 110 + 0,2 × 210 = 130 ns
```

## Substituição de páginas

| Algoritmo | Vítima | Comentário |
| --- | --- | --- |
| FIFO | a página há mais tempo na memória | ignora o uso, sujeito à anomalia de Belady |
| Relógio | percorre um círculo: R = 1 ganha uma segunda chance (R é zerado), a primeira com R = 0 sai | aproximação barata do LRU |
| LRU | a página cujo último uso é o mais antigo | bom, caro de implementar com exatidão |
| Ótimo | a página cujo próximo uso está mais distante | precisa do futuro: um limite inferior, não um algoritmo real |

Contagens conferidas pelos testes, todas com 3 molduras:

| Sequência de referências | FIFO | Relógio | LRU | Ótimo |
| --- | ---: | ---: | ---: | ---: |
| 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1 | 15 | 14 | 12 | 9 |
| 1 2 3 1 4 2 5 1 2 3 | 8 | | | 6 |
| 4 1 4 2 3 4 1 2 | 7 | | 6 | 5 |
| 1 2 3 4 2 5 2 | 6 | 5 | | |

A última linha é a segunda chance em ação. Depois que a página 4 é carregada, todos os bits R foram zerados pelo ponteiro. A página 2 é então usada de novo, e fica com R = 1. Quando a página 5 falta, o ponteiro encontra a página 2 com R = 1, zera o bit e retira a página 3. A referência seguinte à página 2 é um acerto, onde o FIFO teria uma falta.

## Anomalia de Belady

Sequência de referências `1 2 3 4 1 2 5 1 2 3 4 5`:

| Molduras | 1 | 2 | 3 | 4 | 5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| FIFO | 12 | 12 | 9 | 10 | 5 |
| LRU | 12 | 12 | 10 | 8 | 5 |
| Ótimo | 12 | 9 | 7 | 6 | 5 |

O FIFO tem 9 faltas com 3 molduras e 10 com 4. O LRU e o ótimo são algoritmos de pilha: as páginas mantidas com n molduras são sempre um subconjunto das mantidas com n + 1, então mais memória nunca atrapalha.

## Tamanho da TLB

20.000 acessos com localidade de referência (95% deles dentro de uma janela de 16 páginas que se move de vez em quando), 64 molduras, substituição pelo relógio. Tempo efetivo de acesso com acesso à memória de 100 ns, consulta à TLB de 1 ns e tabela de páginas de 4 níveis:

| Entradas na TLB | Taxa de acerto | Faltas de página | EAT (ns) |
| ---: | ---: | ---: | ---: |
| 4 | 22,43% | 1786 | 411,3 |
| 8 | 44,40% | 1786 | 323,4 |
| 16 | 81,10% | 1786 | 176,6 |
| 32 | 89,70% | 1786 | 142,2 |
| 64 | 91,07% | 1786 | 136,7 |

O salto acontece quando a TLB fica do tamanho da janela quente (16 páginas): é a localidade em ação. O número de faltas de página não depende da TLB. Tabelas completas: [`results/results.md`](../../../projects/operating-systems/paging-tlb/results/results.md).

## Como rodar

```sh
cd projects/operating-systems/paging-tlb
./setup-unix-paging-tlb.sh           # ou setup-windows-paging-tlb.ps1
docker compose run --rm demo         # tabelas e results/
docker compose run --rm rust-demo    # as tabelas de faltas de página em Rust
```

## Duas linguagens

TypeScript é a implementação de referência, com uma classe por algoritmo. Em Rust, o algoritmo é um `enum` e a escolha da vítima é um `match` que o compilador confere para casos faltando, um valor ausente é um `Option`, e o traço é emprestado. As duas imprimem tabelas de faltas de página idênticas.

## Fonte

Tanenbaum, Sistemas Operacionais Modernos (4ª edição), capítulo 3, seções 3.3 e 3.4.
