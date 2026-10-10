# aloha-csma

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Cómo comparten las estaciones un canal sin un coordinador. Tres simuladores en Python, solo con la biblioteca estándar: ALOHA puro, slotted ALOHA y CSMA/CD con retroceso binario exponencial. El mini-proyecto reproduce los dos famosos picos (18.4% y 36.8%) y muestra por qué escuchar el canal y abortar las colisiones lo cambia todo.

![Rendimiento frente a la carga ofrecida](results/throughput.svg)

Explicación completa: [docs/es/networks/aloha-csma.md](../../../docs/es/networks/aloha-csma.md).

## Temas del quiz que demuestra

- `networks` / `medium-access-control`: ALOHA puro, slotted ALOHA y el período vulnerable, rendimiento bajo sobrecarga, CSMA/CD, retroceso binario exponencial

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-aloha-csma.sh        # Linux y macOS
./setup-windows-aloha-csma.ps1    # Windows
```

El script construye la imagen y ejecuta el linter, la verificación del formateador y las pruebas.

## Demo

```sh
docker compose run --rm python-demo     # simula y escribe results/results.json y results/results.md
docker compose run --rm python-chart    # dibuja results/throughput.svg a partir de results/results.json
```

La simulación tarda unos segundos y usa una semilla fija y tiempo simulado, así que reescribe exactamente la tabla confirmada en el repositorio. El gráfico se genera solo a partir del archivo JSON: se puede volver a dibujar sin simular de nuevo. Opciones de la simulación: `--seed`, `--frames`, `--stations`, `--frame-slots`, por ejemplo `docker compose run --rm python-demo python run.py --out /results --stations 10`.

Resultados confirmados: [results/results.md](results/results.md), [results/results.json](results/results.json), [results/throughput.svg](results/throughput.svg).

## Estructura

| Archivo | Qué es |
| --- | --- |
| `python/aloha.py` | fórmulas y simuladores del ALOHA puro y del slotted ALOHA |
| `python/csma_cd.py` | CSMA/CD, 1-persistente, con retroceso binario exponencial |
| `python/run.py` | barrido sobre la carga ofrecida, escribe los resultados |
| `python/chart.py` | gráfico SVG a partir del archivo de resultados |
| `python/test_aloha_csma.py` | pruebas |

## Pruebas

```sh
docker compose run --rm python-test
```

Ejecuta `ruff check`, `ruff format --check` y `pytest`. Las pruebas verifican que los picos simulados estén a menos del 5% de 1/(2e) y 1/e, que las simulaciones sigan las fórmulas con varias cargas, el rango del retroceso, el comportamiento del CSMA/CD con carga baja y bajo sobrecarga, la reproducibilidad con una semilla, y que el gráfico sea un SVG válido con las tres curvas.

## Qué muestran los números

| protocolo | pico simulado | con carga G | teoría |
| --- | --- | --- | --- |
| ALOHA puro | 0.1833 | 0.5 | 0.1839 |
| slotted ALOHA | 0.3684 | 1.0 | 0.3679 |
| CSMA/CD (50 estaciones, trama = 32 slots) | 0.9358 | 3.0 | aquí no hay forma cerrada |

Las dos curvas de ALOHA suben, alcanzan un pico y colapsan: pasado el pico, más intentos solo producen más colisiones. CSMA/CD entrega lo que se le ofrece hasta cerca de 0.8 y luego se mantiene cerca de 0.94, porque una colisión cuesta un slot corto en lugar de una trama entera.
