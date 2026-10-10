# Alocador de memória

> English version: [docs/en/operating-systems/memory-allocator.md](../../en/operating-systems/memory-allocator.md) · Versión en español: [docs/es/operating-systems/memory-allocator.md](../../es/operating-systems/memory-allocator.md)

Mini-projeto: [`projects/operating-systems/memory-allocator`](../../../projects/operating-systems/memory-allocator/). Item do plano: MP-OS-3. Tópico do quiz: `operating-systems` / `memory-management`.

## O que ele ensina

Um alocador entrega pedaços de uma região fixa de memória (a arena) e os recebe de volta. Depois de muitas alocações e liberações de tamanhos diferentes, a memória livre deixa de ser um bloco só: ela fica espalhada em lacunas. Um pedido pode então falhar embora o total livre fosse suficiente. O mini-projeto mostra como quatro estratégias lidam com isso, e mede o efeito.

A arena é simulada: uma alocação é um deslocamento e um tamanho, e nenhum byte real é tocado. A lição é a contabilidade.

## Dois tipos de fragmentação

| Tipo | O que é desperdiçado | Quem sofre |
| --- | --- | --- |
| Externa | memória livre dividida em lacunas pequenas demais para servir | alocadores de lista livre, partições variáveis, segmentação |
| Interna | espaço dentro de um bloco que não foi pedido | unidades de tamanho fixo: o sistema buddy, a paginação |

Medidas usadas na tabela:

- **Fragmentação externa** = 1 − maior bloco livre / total de memória livre. 0 significa um bloco livre só.
- **Fragmentação interna** = (bytes reservados − bytes pedidos) / bytes reservados.

## As estratégias

| Estratégia | Escolhe | Tendência |
| --- | --- | --- |
| First fit | a primeira lacuna grande o bastante | rápido, bom na prática |
| Best fit | a menor lacuna grande o bastante | preserva lacunas grandes, deixa sobras minúsculas |
| Worst fit | a maior lacuna | as sobras continuam grandes, mas as lacunas grandes somem |
| Buddy | um bloco da próxima potência de dois, dividindo blocos maiores em metades | fusão rápida, paga com fragmentação interna |

Exemplo conferido pelos testes. Lacunas de 12, 5, 30, 8 e 20 unidades, em ordem de endereço, e um pedido de 7:

| Estratégia | Lacuna escolhida |
| --- | --- |
| First fit | 12 (a primeira em que cabe) |
| Best fit | 8 (a mais justa) |
| Worst fit | 30 (a maior) |

## Coalescência

Quando um bloco é liberado, ele é fundido com um vizinho livre de cada lado. Sem esse passo, a arena acabaria como muitas lacunas pequenas e vizinhas. Os testes liberam tudo em ordem aleatória e exigem, no fim, um único bloco livre do tamanho da arena.

No sistema buddy, o vizinho com quem fundir é o companheiro (buddy): para um bloco de tamanho `s` no deslocamento `o`, ele fica em `o XOR s`. Um pedido de 70 em uma arena de 1024 recebe um bloco de 128 no deslocamento 0 e deixa livres blocos de 128, 256 e 512. A fragmentação interna é 128 − 70 = 58. Ao liberar, fundem-se 128 + 128, depois 256 + 256, depois 512 + 512, de volta a 1024.

## O benchmark

A cada passo, o programa aloca um bloco de tamanho aleatório (55% das vezes) ou libera um bloco vivo aleatório. A arena enche, e daí em diante um pedido falha quando nenhuma lacuna é grande o bastante. A fragmentação é medida a cada passo. A carga `mixed` tem 70% dos blocos de 16 a 512 bytes, 25% de 513 a 8192 e 5% de 8193 a 65536. A carga `small` tem blocos de 8 a 256 bytes.

Carga `mixed`, arena de 1 MiB, 20.000 passos:

| Estratégia | Tentativas | Falhas | Falhas % | Fragmentação externa % | Fragmentação interna % | Pico de uso (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| first-fit | 11054 | 905 | 8,19 | 80,54 | 0,00 | 969266 |
| best-fit | 11054 | 868 | 7,85 | 78,65 | 0,00 | 1013220 |
| worst-fit | 11054 | 1258 | 11,38 | 95,72 | 0,00 | 653051 |
| buddy | 11054 | 1098 | 9,93 | 68,07 | 25,48 | 1047424 |

Como ler:

- O worst fit é o pior: ao cortar sempre a maior lacuna, ele não deixa lacuna para os pedidos grandes. É o que mais recusa e nunca usa mais que 63% da arena.
- O best fit e o first fit ficam próximos, com o best fit um pouco à frente aqui. O first fit trabalha menos por alocação, porque para na primeira lacuna.
- O sistema buddy tem a menor fragmentação externa, porque os companheiros sempre se fundem de volta em blocos alinhados, mas cerca de um quarto do que ele reserva é fragmentação interna, e por isso ele ainda recusa mais pedidos que o first fit.

Os números vêm de uma simulação determinística, com gerador com semente: eles contam eventos e descrevem a disposição da arena, e não medem tempo. As duas cargas estão em [`results/results.md`](../../../projects/operating-systems/memory-allocator/results/results.md).

## Como rodar

```sh
cd projects/operating-systems/memory-allocator
./setup-unix-memory-allocator.sh     # ou setup-windows-memory-allocator.ps1
docker compose run --rm demo         # o benchmark em C++, grava results/
docker compose run --rm rust-demo    # a mesma tabela em Rust
```

## Duas linguagens

As duas implementações gerenciam a arena simulada com os mesmos algoritmos e imprimem tabelas idênticas. Em C++, os alocadores compartilham uma classe abstrata com métodos virtuais, um resultado ausente é `std::optional`, e os truques de bits do sistema buddy vêm de `<bit>`. Em Rust, a classe abstrata é um trait, o resultado ausente é `Option`, e `#[must_use]` faz o compilador reclamar quando o resultado de `release` é ignorado.

## Fonte

Tanenbaum, Sistemas Operacionais Modernos (4ª edição), capítulo 3, seção 3.2 (gerenciamento de memória com listas livres) e seção 3.7 (segmentação). O sistema buddy é descrito no estudo de caso do Linux, capítulo 10.
