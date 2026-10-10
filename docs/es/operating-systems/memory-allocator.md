# Asignador de memoria

> English version: [docs/en/operating-systems/memory-allocator.md](../../en/operating-systems/memory-allocator.md) · Versão em português: [docs/pt/operating-systems/memory-allocator.md](../../pt/operating-systems/memory-allocator.md)

Mini-proyecto: [`projects/operating-systems/memory-allocator`](../../../projects/operating-systems/memory-allocator/). Elemento del plan: MP-OS-3. Tema del quiz: `operating-systems` / `memory-management`.

## Qué enseña

Un asignador reparte trozos de una región fija de memoria (la arena) y los recupera. Tras muchas asignaciones y liberaciones de distintos tamaños, la memoria libre ya no es un solo bloque: está dispersa en huecos. Entonces una solicitud puede fallar aunque el espacio libre total sería suficiente. El mini-proyecto muestra cómo cuatro estrategias lidian con eso, y lo mide.

La arena es simulada: una asignación es un desplazamiento (offset) y un tamaño, y no se toca ningún byte real. La lección es la contabilidad.

## Dos tipos de fragmentación

| Tipo | Qué se desperdicia | Quién sufre |
| --- | --- | --- |
| Externa | memoria libre dividida en huecos demasiado pequeños para ser útiles | asignadores con lista libre, particiones variables, segmentación |
| Interna | espacio dentro de un bloque que quien llamó no pidió | unidades de tamaño fijo: el sistema buddy, la paginación |

Medidas usadas en la tabla:

- **Fragmentación externa** = 1 − bloque libre más grande / memoria libre total. 0 significa un solo bloque libre.
- **Fragmentación interna** = (bytes reservados − bytes solicitados) / bytes reservados.

## Las estrategias

| Estrategia | Elige | Tendencia |
| --- | --- | --- |
| First fit | el primer hueco que sea lo bastante grande | rápida, buena en la práctica |
| Best fit | el hueco más pequeño que sea lo bastante grande | conserva los huecos grandes, deja sobrantes diminutos |
| Worst fit | el hueco más grande | los sobrantes siguen siendo grandes, pero los huecos grandes desaparecen |
| Buddy | un bloque de la siguiente potencia de dos, dividiendo los bloques más grandes por la mitad | fusión rápida, se paga con fragmentación interna |

Ejemplo verificado por las pruebas. Huecos de 12, 5, 30, 8 y 20 unidades, en orden de dirección, y una solicitud de 7:

| Estrategia | Hueco elegido |
| --- | --- |
| First fit | 12 (el primero que cabe) |
| Best fit | 8 (el más ajustado) |
| Worst fit | 30 (el más grande) |

## Fusión (coalescing)

Cuando se libera un bloque, se fusiona con un vecino libre a cualquiera de los dos lados. Sin este paso, la arena acabaría como muchos huecos pequeños adyacentes. Las pruebas liberan todo en orden aleatorio y exigen un único bloque libre del tamaño de la arena al final.

En el sistema buddy el vecino con el que se fusiona es el buddy: para un bloque de tamaño `s` en el desplazamiento `o`, está en `o XOR s`. Una solicitud de 70 en una arena de 1024 toma un bloque de 128 en el desplazamiento 0 y deja libres bloques de 128, 256 y 512. La fragmentación interna es 128 − 70 = 58. Al liberarlo se fusiona 128 + 128, luego 256 + 256, luego 512 + 512, de vuelta a 1024.

## El benchmark

En cada paso el programa asigna un bloque de tamaño aleatorio (el 55% de las veces) o libera un bloque vivo al azar. La arena se llena, y a partir de entonces una solicitud falla cuando ningún hueco es lo bastante grande. La fragmentación se mide en cada paso. `mixed` tiene 70% de bloques de 16 a 512 bytes, 25% de 513 a 8192 y 5% de 8193 a 65536. `small` tiene bloques de 8 a 256 bytes.

Carga `mixed`, arena de 1 MiB, 20 000 pasos:

| Estrategia | Intentos | Fallidos | Fallidos % | Fragmentación externa % | Fragmentación interna % | Pico en uso (bytes) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| first-fit | 11054 | 905 | 8.19 | 80.54 | 0.00 | 969266 |
| best-fit | 11054 | 868 | 7.85 | 78.65 | 0.00 | 1013220 |
| worst-fit | 11054 | 1258 | 11.38 | 95.72 | 0.00 | 653051 |
| buddy | 11054 | 1098 | 9.93 | 68.07 | 25.48 | 1047424 |

Cómo leerla:

- Worst fit es el peor: al cortar siempre el hueco más grande, no deja ningún hueco para las solicitudes grandes. Es el que más rechaza y nunca usa más del 63% de la arena.
- Best fit y first fit están cerca, con best fit ligeramente por delante aquí. First fit hace menos trabajo por asignación, porque se detiene en el primer hueco.
- El sistema buddy tiene la menor fragmentación externa, porque los buddies siempre se vuelven a fusionar en bloques alineados, pero cerca de una cuarta parte de lo que reserva es fragmentación interna, así que aun así rechaza más solicitudes que first fit.

Los números son una simulación determinista con un generador con semilla: cuentan eventos y describen la disposición de la arena, y no miden tiempo. Ambas cargas están en [`results/results.md`](../../../projects/operating-systems/memory-allocator/results/results.md).

## Ejecútalo

```sh
cd projects/operating-systems/memory-allocator
./setup-unix-memory-allocator.sh     # o setup-windows-memory-allocator.ps1
docker compose run --rm demo         # el benchmark desde C++, escribe results/
docker compose run --rm rust-demo    # la misma tabla desde Rust
```

## Dos lenguajes

Ambas implementaciones gestionan la arena simulada con los mismos algoritmos e imprimen tablas idénticas. En C++ los asignadores comparten una clase abstracta con métodos virtuales, un resultado ausente es `std::optional`, y los trucos de bits del sistema buddy vienen de `<bit>`. En Rust la clase abstracta es un trait, el resultado ausente es `Option`, y `#[must_use]` hace que el compilador se queje cuando se ignora el resultado de `release`.

## Fuente

Tanenbaum, Modern Operating Systems (4.ª edición), capítulo 3, sección 3.2 (gestión de memoria con listas libres) y sección 3.7 (segmentación). El sistema buddy se describe en el caso de estudio de Linux, capítulo 10.
