# Simulador de planificación de CPU

> English version: [docs/en/operating-systems/cpu-scheduling.md](../../en/operating-systems/cpu-scheduling.md) · Versão em português: [docs/pt/operating-systems/cpu-scheduling.md](../../pt/operating-systems/cpu-scheduling.md)

Mini-proyecto: [`projects/operating-systems/cpu-scheduling`](../../../projects/operating-systems/cpu-scheduling/). Elemento del plan: MP-OS-1. Tema del quiz: `operating-systems` / `scheduling`.

## Qué enseña

Cuando varios procesos están listos y hay una sola CPU, el planificador decide quién se ejecuta. La decisión es un compromiso: una política que minimiza el tiempo medio de espera puede dejar a un proceso esperando muchísimo, y una política que responde rápido a todos los procesos hace que todos terminen más tarde. El simulador hace visible ese compromiso ejecutando los mismos procesos bajo cinco políticas.

## Los tres tiempos

| Métrica | Definición | A quién le importa |
| --- | --- | --- |
| Retorno (turnaround) | finalización menos llegada | trabajos por lotes (batch) |
| Espera | retorno menos la ráfaga de CPU, el tiempo pasado en la cola de listos | a todos |
| Respuesta | primera vez en la CPU menos llegada | usuarios interactivos |

Las tablas también muestran la **mayor espera** de cualquier proceso, un indicador sencillo de equidad y de inanición (starvation).

## Las políticas

| Política | Regla | Fortaleza | Debilidad |
| --- | --- | --- | --- |
| FCFS | orden de llegada, se ejecuta hasta terminar | simple, sin inanición | un trabajo largo retrasa a todos los cortos que están detrás (efecto convoy) |
| SJF | primero la ráfaga más corta, se ejecuta hasta terminar | menor espera media cuando los trabajos están disponibles a la vez | necesita conocer las ráfagas de antemano, los trabajos largos pueden sufrir inanición |
| Round-robin | cada uno se ejecuta como máximo un quantum y pasa al final de la cola | buen tiempo de respuesta | más cambios de contexto, mayor tiempo de retorno |
| Prioridad | primero el número de prioridad más bajo, se ejecuta hasta terminar | el trabajo importante va primero | la prioridad baja puede sufrir inanición (se corrige con envejecimiento, aging) |
| Retroalimentación multinivel | empieza en el nivel superior con un quantum corto, baja de nivel cuando usa todo el quantum, cada nivel duplica el quantum | el trabajo corto e interactivo termina primero sin conocer las ráfagas | el trabajo limitado por CPU espera más |

Convenciones de este simulador: el tiempo es una unidad entera, un cambio de contexto no cuesta nada, los empates se resuelven por el tiempo en la cola, y un proceso que llega mientras otro se ejecuta entra en la cola antes de que el que se ejecuta vuelva al final. En la cola multinivel con retroalimentación, un proceso en ejecución no es interrumpido por una llegada a mitad de su quantum.

## Ejemplos resueltos verificados por las pruebas

Todos los procesos llegan en el tiempo 0 salvo que se indique lo contrario.

| Política | Ráfagas | Planificación | Resultado |
| --- | --- | --- | --- |
| FCFS | 24, 3, 3 | P1 0-24, P2 24-27, P3 27-30 | esperas 0, 24, 27: promedio 17 |
| FCFS | 6, 3, 3 | P1 0-6, P2 6-9, P3 9-12 | espera media 5, retorno 9 |
| SJF | 8, 4, 2, 6 | P3 0-2, P2 2-6, P4 6-12, P1 12-20 | espera media 5, retorno 10 |
| Round-robin, q = 4 | 24, 3, 3 | P1 0-4, P2 4-7, P3 7-10, P1 10-30 | esperas 6, 4, 7 |
| Round-robin, q = 2 | 3, 5, 2 | P1 0-2, P2 2-4, P3 4-6, P1 6-7, P2 7-10 | finalizaciones 7, 10, 6 |
| Prioridad | 10, 1, 2, 1, 5 con prioridades 3, 1, 4, 5, 2 | P2 0-1, P5 1-6, P1 6-16, P3 16-18, P4 18-19 | esperas 6, 0, 16, 18, 1: promedio 8,2 |
| Retroalimentación multinivel, quantums 1, 2, 4, ... | un trabajo de 40 | 1 + 2 + 4 + 8 + 16 + 9 | despachado 6 veces |
| Retroalimentación multinivel, quantums 2, 4, 8 | A(llegada 0, ráfaga 8), B(llegada 1, ráfaga 2) | A 0-2, B 2-4, A 4-10 | retorno de B 3, retorno de A 10 |

## Diagrama de Gantt

Un diagrama de Gantt dibuja la planificación sobre una línea de tiempo. La CLI lo imprime como texto, y la página estática `dashboard/index.html` lo dibuja como barras de colores, un color por proceso, para poder seguir al mismo proceso a través de las políticas.

```text
SJF
|           A           |  E  |     B     |      D       |            C             |
0                       8     10          14             19                         28
```

## Comparación con cargas de trabajo generadas

Tres cargas de trabajo de 200 procesos salen de un generador congruencial lineal con semilla fija: `interactive` (ráfagas de 1 a 8), `cpu-bound` (20 a 60) y `mixed` (80% de ráfagas de 1 a 6, 20% de 30 a 80). Los intervalos entre llegadas mantienen la CPU ocupada cerca del 90% del tiempo. La tabla completa está en [`results/results.md`](../../../projects/operating-systems/cpu-scheduling/results/results.md). La carga mixta:

| Política | Espera media | Retorno medio | Respuesta media | Espera máx. |
| --- | ---: | ---: | ---: | ---: |
| FCFS | 120.56 | 134.04 | 120.56 | 338 |
| SJF | 40.93 | 54.41 | 40.93 | 942 |
| RR(q=4) | 67.38 | 80.86 | 15.47 | 658 |
| Prioridad | 102.35 | 115.83 | 102.35 | 892 |
| MLFQ(q=2,levels=3) | 56.34 | 69.81 | 2.56 | 718 |

Cómo leerla:

- SJF tiene el menor tiempo medio de espera y la peor espera máxima: los trabajos largos pagan por el promedio.
- FCFS tiene el peor promedio y la mejor espera máxima: nadie es adelantado.
- Round-robin y la cola multinivel con retroalimentación reducen el tiempo de respuesta en un orden de magnitud, sin conocer las ráfagas.
- La cola multinivel con retroalimentación supera aquí a round-robin porque deja que los trabajos cortos terminen en el nivel superior.

## Ejecútalo

```sh
cd projects/operating-systems/cpu-scheduling
./setup-unix-cpu-scheduling.sh          # o setup-windows-cpu-scheduling.ps1
docker compose run --rm demo            # diagramas, tablas y results/
docker compose run --rm python-demo     # la misma salida desde Python
```

## Dos lenguajes

TypeScript es la implementación de referencia. La versión en Python es el mismo algoritmo con dataclasses y pequeñas clases de política. Ambas usan el mismo generador y la misma semilla, y sus salidas son idénticas, lo cual es una verificación cruzada barata y sólida de las dos implementaciones.

## Fuente

Tanenbaum, Modern Operating Systems (4.ª edición), capítulo 2, sección 2.4.
