# Simulador de paginación y TLB

> English version: [docs/en/operating-systems/paging-tlb.md](../../en/operating-systems/paging-tlb.md) · Versão em português: [docs/pt/operating-systems/paging-tlb.md](../../pt/operating-systems/paging-tlb.md)

Mini-proyecto: [`projects/operating-systems/paging-tlb`](../../../projects/operating-systems/paging-tlb/). Elemento del plan: MP-OS-2. Tema del quiz: `operating-systems` / `memory-management`.

## Qué enseña

Con memoria virtual, un programa usa direcciones virtuales y el hardware traduce cada una a una dirección física. El simulador muestra las tres cosas que pueden pasar en un acceso (acierto de TLB, fallo de TLB, fallo de página), cuánto cuesta cada una, y cómo el algoritmo que elige la página a expulsar cambia el número de fallos de página.

## Traducción de direcciones

Una dirección virtual se divide en dos: los bits altos son el número de página y los bits bajos son el desplazamiento (offset). El número de página se reemplaza por un número de marco y el desplazamiento se copia.

```text
page size 4096:  20500 = 5 × 4096 + 20   ->  page 5, offset 20
page 5 is in frame 3                     ->  3 × 4096 + 20 = 12308
```

La traducción se busca en este orden:

1. **TLB**, una pequeña caché de traducciones recientes. Un acierto no cuesta ningún acceso extra a memoria.
2. **Tabla de páginas**, en un fallo de TLB. Un acceso a memoria por cada nivel de la tabla.
3. **Fallo de página**, cuando la página no está en memoria. Se busca un marco, expulsando otra página si es necesario, y la página se carga desde el disco. La página expulsada sale de la tabla de páginas y de la TLB.

## Traza de referencia de la MMU

Configuración: 3 marcos, una TLB de 2 entradas, LRU para ambos. Las pruebas verifican exactamente esta tabla.

| Acceso | Página | TLB | Fallo de página | Marco | Nota |
| ---: | ---: | --- | --- | ---: | --- |
| 1 | 0 | fallo | sí | 0 | |
| 2 | 1 | fallo | sí | 1 | |
| 3 | 0 | acierto | no | 0 | |
| 4 | 2 | fallo | sí | 2 | la TLB descarta la página 1 |
| 5 | 0 | acierto | no | 0 | |
| 6 | 3 | fallo | sí | 1 | la memoria expulsa la página 1, la TLB descarta la página 2 |
| 7 | 1 | fallo | sí | 2 | la memoria expulsa la página 2, la TLB descarta la página 0 |
| 8 | 0 | fallo | no | 0 | la página sigue en memoria: un fallo de TLB sin fallo de página |

Totales: 2 aciertos de TLB, 6 fallos de TLB, 5 fallos de página.

## Tiempo efectivo de acceso

La TLB siempre se consulta. En un acierto sigue un acceso a memoria, y en un fallo primero se lee la tabla de páginas:

```text
EAT = h × (tlb + mem) + (1 − h) × (tlb + levels × mem + mem)
h = 0.8, tlb = 10 ns, mem = 100 ns, 1 level:  0.8 × 110 + 0.2 × 210 = 130 ns
```

## Reemplazo de páginas

| Algoritmo | Víctima | Comentario |
| --- | --- | --- |
| FIFO | la página que lleva más tiempo en memoria | ignora el uso, sujeto a la anomalía de Belady |
| Clock | recorre un círculo: R = 1 recibe una segunda oportunidad (se borra R), la primera con R = 0 sale | aproximación barata de LRU |
| LRU | la página cuyo último uso es el más antiguo | buena, cara de implementar exactamente |
| Óptimo | la página cuyo próximo uso está más lejos | necesita el futuro: una cota inferior, no un algoritmo real |

Conteos verificados por las pruebas, todos con 3 marcos:

| Cadena de referencias | FIFO | Clock | LRU | Óptimo |
| --- | ---: | ---: | ---: | ---: |
| 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1 | 15 | 14 | 12 | 9 |
| 1 2 3 1 4 2 5 1 2 3 | 8 | | | 6 |
| 4 1 4 2 3 4 1 2 | 7 | | 6 | 5 |
| 1 2 3 4 2 5 2 | 6 | 5 | | |

La última línea es la segunda oportunidad en acción. Después de cargar la página 4, el puntero borró todos los bits R. Luego la página 2 se usa de nuevo, por lo que R = 1. Cuando la página 5 provoca un fallo, el puntero encuentra la página 2 con R = 1, la borra y expulsa la página 3. La siguiente referencia a la página 2 es un acierto, donde FIFO tendría un fallo.

## Anomalía de Belady

Cadena de referencias `1 2 3 4 1 2 5 1 2 3 4 5`:

| Marcos | 1 | 2 | 3 | 4 | 5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| FIFO | 12 | 12 | 9 | 10 | 5 |
| LRU | 12 | 12 | 10 | 8 | 5 |
| Óptimo | 12 | 9 | 7 | 6 | 5 |

FIFO tiene 9 fallos con 3 marcos y 10 con 4. LRU y óptimo son algoritmos de pila (stack algorithms): las páginas que se conservan con n marcos son siempre un subconjunto de las que se conservan con n + 1, así que más memoria nunca perjudica.

## Tamaño de la TLB

20 000 accesos con localidad de referencia (el 95% dentro de una ventana de 16 páginas que se mueve de vez en cuando), 64 marcos, reemplazo clock. Tiempo efectivo de acceso con un acceso a memoria de 100 ns, una consulta de TLB de 1 ns y una tabla de páginas de 4 niveles:

| Entradas de TLB | Tasa de aciertos | Fallos de página | EAT (ns) |
| ---: | ---: | ---: | ---: |
| 4 | 22.43% | 1786 | 411.3 |
| 8 | 44.40% | 1786 | 323.4 |
| 16 | 81.10% | 1786 | 176.6 |
| 32 | 89.70% | 1786 | 142.2 |
| 64 | 91.07% | 1786 | 136.7 |

El salto ocurre cuando la TLB se vuelve tan grande como la ventana activa (16 páginas): eso es la localidad en acción. El número de fallos de página no depende de la TLB. Tablas completas: [`results/results.md`](../../../projects/operating-systems/paging-tlb/results/results.md).

## Ejecútalo

```sh
cd projects/operating-systems/paging-tlb
./setup-unix-paging-tlb.sh           # o setup-windows-paging-tlb.ps1
docker compose run --rm demo         # tablas y results/
docker compose run --rm rust-demo    # las tablas de fallos de página desde Rust
```

## Dos lenguajes

TypeScript es la implementación de referencia, con una clase por algoritmo. En Rust el algoritmo es un `enum` y la elección de la víctima es un `match` que el compilador revisa para detectar casos faltantes, un valor ausente es un `Option` y la traza se toma prestada (borrowed). Ambas imprimen tablas de fallos de página idénticas.

## Fuente

Tanenbaum, Modern Operating Systems (4.ª edición), capítulo 3, secciones 3.3 y 3.4.
