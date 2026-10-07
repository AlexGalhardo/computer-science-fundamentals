# Simulador de escalonamento de CPU

> English version: [docs/en/operating-systems/cpu-scheduling.md](../../en/operating-systems/cpu-scheduling.md)

Mini-projeto: [`projects/operating-systems/cpu-scheduling`](../../../projects/operating-systems/cpu-scheduling/). Item do plano: MP-OS-1. Tópico do quiz: `operating-systems` / `scheduling`.

## O que ele ensina

Quando vários processos estão prontos e há uma única CPU, o escalonador decide quem executa. A decisão é uma troca: uma política que minimiza a espera média pode deixar um processo esperando por muito tempo, e uma política que responde rápido a todos faz todos terminarem mais tarde. O simulador torna essa troca visível ao executar os mesmos processos em cinco políticas.

## Os três tempos

| Métrica | Definição | A quem interessa |
| --- | --- | --- |
| Retorno (turnaround) | término menos chegada | jobs em lote |
| Espera | retorno menos tempo de CPU, isto é, o tempo na fila de prontos | todos |
| Resposta | primeira vez na CPU menos chegada | usuários interativos |

As tabelas mostram também a **maior espera** de um processo, um indicador simples de justiça e de inanição.

## As políticas

| Política | Regra | Ponto forte | Ponto fraco |
| --- | --- | --- | --- |
| FCFS | ordem de chegada, executa até o fim | simples, sem inanição | um job longo atrasa todos os curtos atrás dele (efeito comboio) |
| SJF | menor tempo de CPU primeiro, executa até o fim | menor espera média quando os jobs estão disponíveis juntos | exige conhecer os tempos, jobs longos podem ficar em inanição |
| Round-robin | cada um executa no máximo um quantum e vai para o fim da fila | bom tempo de resposta | mais trocas de contexto, retorno maior |
| Prioridade | menor número de prioridade primeiro, executa até o fim | trabalho importante primeiro | baixa prioridade pode ficar em inanição (corrigido com envelhecimento) |
| Múltiplas filas com realimentação | começa no nível mais alto com quantum curto, desce quando usa o quantum inteiro, cada nível dobra o quantum | trabalho curto e interativo termina primeiro sem conhecer os tempos | trabalho orientado a CPU é o que mais espera |

Convenções deste simulador: o tempo é uma unidade inteira, a troca de contexto não custa nada, empates são decididos pelo tempo na fila, e um processo que chega enquanto outro executa entra na fila antes de o processo em execução voltar para o fim. Nas múltiplas filas, o processo em execução não é interrompido no meio do quantum por uma chegada.

## Exemplos resolvidos e conferidos pelos testes

Todos os processos chegam no instante 0, salvo indicação.

| Política | Tempos de CPU | Escala | Resultado |
| --- | --- | --- | --- |
| FCFS | 24, 3, 3 | P1 0-24, P2 24-27, P3 27-30 | esperas 0, 24, 27: média 17 |
| FCFS | 6, 3, 3 | P1 0-6, P2 6-9, P3 9-12 | espera média 5, retorno médio 9 |
| SJF | 8, 4, 2, 6 | P3 0-2, P2 2-6, P4 6-12, P1 12-20 | espera média 5, retorno médio 10 |
| Round-robin, q = 4 | 24, 3, 3 | P1 0-4, P2 4-7, P3 7-10, P1 10-30 | esperas 6, 4, 7 |
| Round-robin, q = 2 | 3, 5, 2 | P1 0-2, P2 2-4, P3 4-6, P1 6-7, P2 7-10 | términos em 7, 10, 6 |
| Prioridade | 10, 1, 2, 1, 5 com prioridades 3, 1, 4, 5, 2 | P2 0-1, P5 1-6, P1 6-16, P3 16-18, P4 18-19 | esperas 6, 0, 16, 18, 1: média 8,2 |
| Múltiplas filas, quanta 1, 2, 4, ... | um job de 40 | 1 + 2 + 4 + 8 + 16 + 9 | recebe a CPU 6 vezes |
| Múltiplas filas, quanta 2, 4, 8 | A(chegada 0, CPU 8), B(chegada 1, CPU 2) | A 0-2, B 2-4, A 4-10 | retorno de B 3, retorno de A 10 |

## Gráfico de Gantt

O gráfico de Gantt desenha a escala em uma linha do tempo. A CLI o imprime em texto, e a página estática `dashboard/index.html` o desenha com barras coloridas, uma cor por processo, para que o mesmo processo possa ser acompanhado entre as políticas.

```
SJF
|           A           |  E  |     B     |      D       |            C             |
0                       8     10          14             19                         28
```

## Comparação em cargas geradas

Três cargas de 200 processos vêm de um gerador congruente linear com semente fixa: `interactive` (tempos de 1 a 8), `cpu-bound` (20 a 60) e `mixed` (80% dos tempos de 1 a 6, 20% de 30 a 80). Os intervalos entre chegadas mantêm a CPU ocupada cerca de 90% do tempo. A tabela completa está em [`results/results.md`](../../../projects/operating-systems/cpu-scheduling/results/results.md). A carga mista:

| Política | Espera média | Retorno médio | Resposta média | Maior espera |
| --- | ---: | ---: | ---: | ---: |
| FCFS | 120,56 | 134,04 | 120,56 | 338 |
| SJF | 40,93 | 54,41 | 40,93 | 942 |
| RR(q=4) | 67,38 | 80,86 | 15,47 | 658 |
| Priority | 102,35 | 115,83 | 102,35 | 892 |
| MLFQ(q=2,levels=3) | 56,34 | 69,81 | 2,56 | 718 |

Como ler:

- O SJF tem a menor espera média e a pior maior espera: os jobs longos pagam pela média.
- O FCFS tem a pior média e a melhor maior espera: ninguém é ultrapassado.
- O round-robin e as múltiplas filas reduzem o tempo de resposta em uma ordem de grandeza, sem conhecer os tempos de CPU.
- As múltiplas filas ganham do round-robin aqui porque deixam os jobs curtos terminarem no nível mais alto.

## Como rodar

```sh
cd projects/operating-systems/cpu-scheduling
./setup-unix-cpu-scheduling.sh          # ou setup-windows-cpu-scheduling.ps1
docker compose run --rm demo            # gráficos, tabelas e results/
docker compose run --rm python-demo     # a mesma saída em Python
```

## Duas linguagens

TypeScript é a implementação de referência. A versão em Python é o mesmo algoritmo, com dataclasses e pequenas classes de política. As duas usam o mesmo gerador e a mesma semente, e as saídas são idênticas, o que é uma verificação cruzada barata e forte das duas implementações.

## Fonte

Tanenbaum, Sistemas Operacionais Modernos (4ª edição), capítulo 2, seção 2.4.
