# ALOHA y CSMA/CD

> English version: [docs/en/networks/aloha-csma.md](../../en/networks/aloha-csma.md) · Versão em português: [docs/pt/networks/aloha-csma.md](../../pt/networks/aloha-csma.md)

Mini-proyecto: [`projects/networks/aloha-csma`](../../../projects/networks/aloha-csma/README.es.md). Lenguaje: Python. Tema del quiz: `networks` / `medium-access-control`.

## El problema

Muchas estaciones comparten un canal: una frecuencia de radio, un cable. Si dos transmiten al mismo tiempo, ambas tramas se destruyen. No hay un coordinador que reparta turnos, así que cada estación tiene que decidir por sí misma cuándo transmitir. Los tres protocolos de aquí son tres respuestas, y cada una añade una sola idea a la anterior.

| Protocolo | Regla | Idea añadida |
| --- | --- | --- |
| ALOHA puro | transmite cuando tengas una trama | ninguna |
| slotted ALOHA | transmite solo al inicio de un slot | un reloj común |
| CSMA/CD | escucha primero, detente en cuanto notes una colisión, espera un tiempo aleatorio | detección de portadora, detección de colisión, retroceso |

## Unidades

El tiempo se mide en **tiempos de trama**: una trama tarda 1 unidad. La **carga ofrecida G** es el número medio de intentos de transmisión por tiempo de trama. El **rendimiento S** es el número medio de tramas que pasan por tiempo de trama, es decir, la fracción del canal que hace trabajo útil. S nunca puede superar 1.

## ALOHA puro

Una trama que empieza en el instante t ocupa el canal hasta t + 1. La destruye cualquier trama que empezó después de t - 1 (todavía en el aire) o que empieza antes de t + 1. Por eso el **período vulnerable** es de 2 tiempos de trama. Con intentos de Poisson, la probabilidad de que no haya otro inicio en 2 tiempos de trama es e^(-2G), lo que da:

```text
S = G * e^(-2G)        máximo en G = 0.5:  S = 1/(2e) = 0.184
```

`simulate_pure_aloha` sortea intervalos exponenciales entre inicios consecutivos y cuenta una trama como exitosa cuando el intervalo anterior y el posterior son ambos de al menos 1.

## Slotted ALOHA

Si las tramas solo pueden empezar en los límites de un slot, dos tramas se superponen por completo o no se superponen en absoluto. El período vulnerable se reduce a la mitad, a 1 tiempo de trama:

```text
S = G * e^(-G)         máximo en G = 1:  S = 1/e = 0.368
```

`simulate_slotted_aloha` sortea el número de intentos en cada slot y cuenta los slots con exactamente uno.

## CSMA/CD con retroceso binario exponencial

El simulador de `csma_cd.py` modela un cable con 50 estaciones. Su reloj avanza en **slots de contención**: un slot es un viaje de ida y vuelta por el cable (2τ), el tiempo que una estación necesita para estar segura de que es dueña del canal. Una trama dura 32 slots.

- **Detección de portadora, 1-persistente**: una estación con una trama transmite apenas el canal queda libre.
- **Detección de colisión**: si dos o más empiezan en el mismo slot, lo notan dentro de ese slot y paran. La colisión desperdicia 1 slot, no una trama.
- **Retroceso**: tras la n-ésima colisión de la misma trama, la estación espera un número aleatorio de slots entre 0 y 2^min(n, 10) - 1. Tras 16 colisiones la trama se descarta.

El número clave es la razón entre la trama y el slot. Un éxito usa 32 slots de canal, una colisión desperdicia 1. Es la misma razón por la que Ethernet tiene un tamaño mínimo de trama y una longitud máxima de cable: la detección de colisiones solo funciona si la trama dura más que el viaje de ida y vuelta.

## Resultados

De [results/results.md](../../../projects/networks/aloha-csma/results/results.md), semilla 2026:

![Rendimiento frente a la carga ofrecida](../../../projects/networks/aloha-csma/results/throughput.svg)

| G | ALOHA puro | teoría | slotted ALOHA | teoría | CSMA/CD |
| --- | --- | --- | --- | --- | --- |
| 0.2 | 0.1339 | 0.1341 | 0.1644 | 0.1638 | 0.2042 |
| 0.5 | 0.1833 | 0.1839 | 0.3029 | 0.3033 | 0.4998 |
| 1.0 | 0.1356 | 0.1353 | 0.3684 | 0.3679 | 0.8987 |
| 2.0 | 0.0365 | 0.0366 | 0.2708 | 0.2707 | 0.9355 |
| 5.0 | 0.0002 | 0.0002 | 0.0330 | 0.0337 | 0.9353 |

- Los picos simulados son 0.1833 en G = 0.5 y 0.3684 en G = 1.0, que están un 0.34% por debajo y un 0.15% por encima de la teoría.
- Pasado su pico, ALOHA empeora a medida que crece la carga. En G = 5 el ALOHA puro entrega casi nada: el canal está lleno de tramas y todas están dañadas.
- CSMA/CD entrega lo que se le ofrece mientras la carga es baja y luego se aplana cerca de 0.94. Bajo sobrecarga también descarta tramas (la última columna de la tabla completa): el retroceso mantiene útil el canal, no crea capacidad.

## Reproducibilidad

Los simuladores usan tiempo simulado y un único generador aleatorio inicializado desde la línea de comandos. La misma semilla escribe el mismo `results.json` en cualquier máquina, por eso el archivo confirmado en el repositorio se puede comparar con una ejecución nueva. El gráfico se dibuja solo a partir de ese archivo.

## Límites del modelo

- ALOHA usa el modelo clásico de población infinita, donde los intentos (nuevos y repetidos) forman un proceso de Poisson. Reproduce las fórmulas, no modela estaciones individuales que reintentan.
- CSMA/CD ignora el retardo de propagación dentro de un slot y la señal de jam, y todas las tramas tienen la misma longitud.
- No hay terminales ocultas: cada estación oye a todas las demás, como en un cable. Las redes inalámbricas necesitan CSMA/CA, que es material del quiz y no se simula aquí.

## Verificar

```sh
cd projects/networks/aloha-csma
docker compose run --rm python-test
docker compose run --rm python-demo
docker compose run --rm python-chart
```
