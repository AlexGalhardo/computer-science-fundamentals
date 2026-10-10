# Caché LRU, filtro de Bloom y trie

> English version: [docs/en/data-structures/lru-bloom-trie.md](../../en/data-structures/lru-bloom-trie.md) · Versão em português: [docs/pt/data-structures/lru-bloom-trie.md](../../pt/data-structures/lru-bloom-trie.md)

Mini-proyecto: [projects/data-structures/lru-bloom-trie](../../../projects/data-structures/lru-bloom-trie). Lenguajes: TypeScript, Go. Temas del quiz: `data-structures` / `arrays-and-lists`, `hash-tables`, `binary-trees-and-traversals`.

Tres estructuras, cada una la respuesta estándar a una pregunta que los sistemas reales hacen todo el tiempo.

| Pregunta | Estructura | Costo |
| --- | --- | --- |
| La caché se llenó. ¿Qué descarto? | Caché LRU | O(1) por `get` y `put` |
| ¿Esta clave seguro no existe, para poder saltarme la consulta cara? | Filtro de Bloom | O(k) por operación, pocos bits por clave |
| ¿Qué palabras empiezan con estas letras? | Trie | O(tamaño del prefijo + tamaño de la respuesta) |

## Caché LRU

LRU significa least recently used (menos recientemente usada): cuando la caché está llena, se descarta la entrada que lleva más tiempo sin ser leída ni escrita. Se combinan dos estructuras:

```text
mapa:       clave -> nodo                   (encuentra un nodo en O(1))

lista:      más nueva <-> ... <-> ... <-> más antigua
            todo get o put mueve su nodo al frente
            el descarte quita el nodo del final
```

La lista debe ser **doblemente** enlazada. Un `get` llega a un nodo en medio de la lista por el mapa y necesita desenlazarlo. Desenlazar exige el anterior del nodo, y solo un puntero `previous` entrega eso sin recorrer la lista. Con una lista simplemente enlazada, el `get` sería O(n).

La versión en TypeScript mantiene las puntas `newest` y `oldest` explícitas. La versión en Go cierra la lista en un anillo con un nodo centinela, lo que elimina los casos especiales del primer y del último nodo. Las dos pasan la misma prueba de propiedad contra un modelo de referencia.

## Filtro de Bloom

Un filtro de Bloom es un conjunto que no guarda claves, solo un arreglo de m bits.

- `add(clave)`: k funciones de dispersión eligen k posiciones, y esos bits pasan a valer 1.
- `mightContain(clave)`: se leen las mismas k posiciones. Cualquier 0 significa **seguro no fue agregada**. Todos 1 significa **probablemente fue agregada**.

Los bits nunca se apagan, así que una clave agregada siempre se reconoce: **no hay falsos negativos**. Una clave que nunca fue agregada puede encontrar sus k bits encendidos por otras claves: eso es un **falso positivo**, y su probabilidad después de n claves es

```text
p = (1 - e^(-k n / m))^k
```

Para una tasa p deseada, el mejor tamaño es m = -n ln p / (ln 2)^2 bits y el mejor número de funciones es k = (m / n) ln 2. Cerca de 10 bits por clave y 7 funciones dan 1%.

Las k posiciones salen de dos hashes combinados como h1 + i * h2 (hash doble), lo que se comporta como k funciones independientes.

Uso típico: delante de algo caro, como una lectura de disco o una llamada de red. Si el filtro dice "no", el paso caro se salta con certeza. Si dice "sí", la consulta de verdad corre y resuelve la duda.

Medido en la ejecución versionada (200,000 sondeos que nunca fueron agregados):

| Bits | Funciones | Claves | Teoría | Medido (Go) | Medido (TypeScript) | Falsos negativos |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 200,000 | 7 | 20,000 | 0.82% | 0.81% | 0.83% | 0 |
| 100,000 | 3 | 10,000 | 1.74% | 1.75% | 1.71% | 0 |
| 64,000 | 2 | 16,000 | 15.48% | 15.52% | 15.60% | 0 |
| 150,000 | 5 | 30,000 | 10.09% | 10.11% | 10.27% | 0 |

## Trie

Un trie es un árbol en que cada arista es un carácter, así que cada camino desde la raíz deletrea un prefijo.

```text
(raíz)
  c
  └─ a
     ├─ r *          car
     │  ├─ d *       card
     │  └─ e *       care
     └─ t *          cat

* marca el final de una palabra
```

Las palabras con el mismo comienzo comparten los primeros nodos. Para listar todas las palabras con un prefijo, la búsqueda baja por los caracteres del prefijo y luego recoge el subárbol de abajo, en profundidad. El costo es el tamaño del prefijo más el tamaño de la respuesta, sea cual sea el número de palabras guardadas. Un filtro lineal necesita mirar todas las palabras.

Un nodo puede ser el final de una palabra y el medio de otras más largas ("car" dentro de "card"), así que el fin de palabra es una marca explícita.

## Qué demuestran las pruebas

- **LRU**: el orden de descarte coincide con un modelo de referencia después de cada una de 40,000 operaciones aleatorias (capacidades de 1 a 8).
- **Filtro de Bloom**: ningún falso negativo, y la tasa de falsos positivos medida queda a menos de 20% de la fórmula en cuatro configuraciones.
- **Trie**: sobre 100,000 palabras, la búsqueda por prefijo devuelve el mismo conjunto que un filtro lineal para 305 prefijos.

## Cómo ejecutar

```sh
cd projects/data-structures/lru-bloom-trie
./setup-unix-lru-bloom-trie.sh          # o ./setup-windows-lru-bloom-trie.ps1
docker compose run --rm go-test lbt_demo
```
