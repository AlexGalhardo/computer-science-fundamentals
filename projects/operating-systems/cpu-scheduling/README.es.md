# cpu-scheduling

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un simulador de planificación de CPU. Ejecuta el mismo conjunto de procesos bajo cinco políticas (FCFS, shortest job first, round-robin, prioridad y cola multinivel con retroalimentación), dibuja el diagrama de Gantt de cada una y compara el tiempo medio de espera, de retorno (turnaround) y de respuesta. Enseña que ninguna política gana en todas las métricas: lo que es mejor para el promedio es injusto con alguien, y lo que responde rápido termina tarde.

Explicación completa: [docs/es/operating-systems/cpu-scheduling.md](../../../docs/es/operating-systems/cpu-scheduling.md).

## Temas del quiz que demuestra

- `operating-systems` / `scheduling`: FCFS, SJF, round-robin y el quantum, prioridad e inanición (starvation), colas multinivel con retroalimentación, tiempo de espera, de retorno y de respuesta.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-cpu-scheduling.sh        # Linux y macOS
./setup-windows-cpu-scheduling.ps1    # Windows
```

El script construye las imágenes, ejecuta las pruebas de ambos lenguajes y ejecuta la demo.

## Demo

```sh
docker compose run --rm demo
```

Imprime el diagrama de Gantt de un ejemplo de cinco procesos bajo cada política y la tabla comparativa sobre tres cargas de trabajo generadas, y escribe `results/results.md`, `results/results.json` y `results/results.js`. Luego abre `dashboard/index.html` directamente desde el disco: la página dibuja los mismos diagramas de Gantt y las tablas, sin servidor y sin red.

```text
RR(q=4)
|     A     |     B     |     C     |     D     |     A     |  E  |     C     |D |C |
0           4           8           12          16          20    22          26 27 28
average waiting 13.00, turnaround 18.60, response 6.40
```

`docker compose run --rm python-demo` imprime el mismo texto desde la implementación en Python.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `ts/src/scheduler.ts` | el motor y las cinco políticas (implementación de referencia) |
| `ts/src/gantt.ts` | el diagrama de Gantt en texto |
| `ts/src/workload.ts` | generador de cargas de trabajo reproducibles |
| `ts/src/report.ts`, `ts/src/cli.ts` | demo, tablas y archivos de resultados |
| `python/scheduler.py`, `python/cli.py` | el mismo simulador en Python |
| `dashboard/` | página estática (HTML, Tailwind CSS v4 compilado, sin CDN) |
| `results/` | tablas versionadas |

Cada carpeta de lenguaje tiene su propio Dockerfile con una imagen fijada (`oven/bun:1.4.2`, `python:3.14.8-slim-trixie`) y ninguna dependencia más allá de las herramientas de prueba y lint.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

Las pruebas verifican los ejemplos de libro de texto documentados en la página de docs, la salida del diagrama de Gantt, y que cada política dé a cada proceso exactamente su ráfaga (burst) sin superposición.

## Resultados

La tabla versionada es [results/results.md](results/results.md). La simulación usa unidades de tiempo abstractas y un generador con semilla, por lo que los números son los mismos en cualquier máquina.
