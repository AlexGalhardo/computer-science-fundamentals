# Blockchain didáctica

> English version: [docs/en/blockchain/didactic-blockchain.md](../../en/blockchain/didactic-blockchain.md) · Versão em português: [docs/pt/blockchain/didactic-blockchain.md](../../pt/blockchain/didactic-blockchain.md)

Miniproyecto: [`projects/blockchain/didactic-blockchain`](../../../projects/blockchain/didactic-blockchain/README.es.md) (MP-CHAIN-1). Lenguajes: TypeScript y Rust. Quiz: área `blockchain`, temas `hash-functions`, `digital-signatures-and-keys`, `transactions-and-unspent-outputs`, `blocks-chain-and-merkle-trees`, `proof-of-work-and-difficulty`, `double-spending-and-confirmations`, `network-and-consensus` e `incentives-and-mining`. Fuente: Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System" (2008).

Es un juguete didáctico. Corre solo de forma local, en una red interna de docker-compose, sin conexión a ninguna red real y sin claves ni monedas reales.

## El problema

El dinero digital es información, y la información se puede copiar. Una firma prueba que el dueño autorizó una transferencia, pero nada en la firma impide que el dueño firme la misma moneda a dos personas. La solución habitual es una parte central que ve todas las transacciones y decide cuál llegó primero. El artículo pregunta cómo una red de desconocidos puede ponerse de acuerdo sobre ese orden sin esa parte.

La respuesta tiene cuatro partes, y el miniproyecto construye cada una.

## 1. Los hashes hacen visible la manipulación

Un hash criptográfico da una huella digital de tamaño fijo de cualquier dato, y cambiar un bit del dato cambia la huella entera. Tres usos de él, apilados:

```text
transaction id = hash(inputs and outputs of the transaction)
Merkle root    = hash of the ids, in pairs, level by level
block hash     = hash(height | previous block hash | Merkle root | time | difficulty | nonce)
```

Como el encabezado de cada bloque contiene el hash del bloque anterior, los bloques forman una cadena. Si cambias un monto en una transacción antigua, su id ya no coincide. Si recalculas el id, la raíz de Merkle ya no coincide. Si recalculas la raíz, el hash del bloque cambia, así que el bloque siguiente apunta a un hash que ya no existe. `validateChain` (`validate` en Rust) repite estas verificaciones desde el bloque génesis, y las pruebas cambian cada transacción de una cadena de ejemplo para demostrar que cada cambio es detectado.

El árbol de Merkle también da pruebas de inclusión cortas: un hash hermano por nivel, unos `log2(n)` hashes para `n` transacciones, lo que permite a un cliente ligero verificar un pago guardando solo los encabezados de los bloques.

## 2. La prueba de trabajo hace costosa la manipulación

Los hashes por sí solos solo hacen visible un cambio. Un atacante podría recalcular todos los hashes posteriores al cambio. La prueba de trabajo hace que cada bloque cueste algo: el bloque es válido solo si su hash empieza con `d` dígitos hexadecimales cero. El hash no se puede predecir, así que el minero prueba nonces hasta que uno funciona.

| Dígitos hex cero | Fracción de hashes aceptada | Promedio de intentos |
| ---: | ---: | ---: |
| 1 | 1 de cada 16 | 16 |
| 2 | 1 de cada 256 | 256 |
| 3 | 1 de cada 4,096 | 4,096 |
| 4 | 1 de cada 65,536 | 65,536 |

Encontrar el nonce toma `16^d` hashes en promedio, y comprobarlo toma uno. Medido en el benchmark confirmado en el repositorio ([`results/mining.md`](../../../projects/blockchain/didactic-blockchain/results/mining.md) tiene la máquina, las versiones y los comandos; la máquina era compartida, así que los tiempos son ruidosos):

| Dígitos hex cero | Promedio de intentos | TypeScript, ms por bloque | Razón de tiempo | Rust, ms por bloque | Razón de tiempo |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 15.9 | 0.0584 | - | 0.0229 | - |
| 2 | 259.6 | 0.7203 | 12.3 | 0.2578 | 11.2 |
| 3 | 3,963.8 | 11.57 | 16.1 | 3.683 | 14.3 |
| 4 | 60,242.1 | 195.9 | 16.9 | 57.36 | 15.6 |

Los intentos crecen 16.3, 15.3 y 15.2 veces por dígito extra. El tiempo los sigue desde la dificultad 2. En la dificultad 1 un bloque son solo 16 hashes, así que el costo fijo de preparar un encabezado se nota en el tiempo y la primera razón es menor. Minar es una lotería, no una tarea con progreso: los intentos de un bloque pueden estar muy lejos del promedio, por eso la tabla promedia muchos bloques.

Reescribir un bloque antiguo significa ahora rehacer su prueba de trabajo y la de todos los bloques posteriores, mientras la red honesta sigue añadiendo bloques.

## 3. Las salidas no gastadas frenan el doble gasto

Una transacción consume salidas de transacciones anteriores y crea otras nuevas. El estado del sistema es el conjunto de salidas no gastadas (UTXO). Una transacción es válida cuando:

1. su id es el hash de su contenido;
2. cada entrada apunta a una salida que está en el conjunto;
3. cada entrada está firmada por la clave a la que está bloqueada la salida gastada;
4. las salidas suman como máximo lo que suman las entradas. La diferencia es la comisión.

La regla 2 es la verificación del doble gasto. Una vez aceptado un pago, la salida que gastó desaparece, así que una segunda transacción que la gaste "does not exist or was already spent". Un nodo aplica la misma idea a las transacciones que aún esperan un bloque (gana la primera vista), y un bloque que lleva dos transacciones en conflicto es inválido.

La primera transacción de un bloque crea monedas nuevas para el minero: la recompensa del bloque más las comisiones. Es el único lugar donde se crean monedas, y el límite es una regla de validez que verifica cada nodo.

## 4. La cadena válida más larga es el historial acordado

Los nodos hacen gossip: lo que un nodo acepta de nuevo, se lo reenvía a sus pares. Dos mineros pueden encontrar un bloque a la misma altura casi al mismo tiempo, y entonces la red tiene un fork. La regla del artículo:

- en un empate, un nodo sigue trabajando sobre el bloque que vio primero y recuerda la otra rama;
- cuando una rama se vuelve más larga, todos los nodos cambian a ella;
- las transacciones que solo estaban en la rama abandonada vuelven al pool pendiente.

La demo crea un fork a propósito cortando los enlaces entre los nodos:

```text
            partition                      links restored
A, B:  ... - 3 - 4a - 5a          ->   A, B, C:  ... - 3 - 4a - 5a - 6
C:     ... - 3 - 4c (pays Carol)                 4c abandoned, its payment is pending again
                                                 and is confirmed in block 6
```

Dos detalles importan. Primero, la validez va antes que la longitud: una cadena más larga con un bloque que rompe una regla se rechaza, así que el poder de cómputo puede reordenar transacciones pero no puede crear monedas ni gastar las monedas de otros. Segundo, un pago con una confirmación puede perderla, como le pasó al pago a Carol. Esperar más bloques lo hace exponencialmente menos probable mientras los nodos honestos tengan la mayor parte del poder de cómputo.

## Lo que muestran los dos lenguajes

TypeScript es la referencia y lo tiene todo, incluidas las firmas (Ed25519 de `node:crypto`) y los nodos HTTP. Rust repite la parte donde el lenguaje cambia la lección: SHA-256 escrito a mano, porque la biblioteca estándar de Rust no tiene ninguno, además de la raíz de Merkle, la minería y la validación de la cadena. Ambos construyen el mismo texto de encabezado, así que encuentran los mismos nonces. Las pruebas de Rust verifican valores impresos por la referencia en TypeScript, y el benchmark informa que ambos probaron exactamente el mismo número de nonces.

## Límites del juguete

- Dificultad fija en pasos de 16, sin reajuste, y "más larga" cuenta bloques. Las redes reales usan un objetivo numérico, lo ajustan y comparan el trabajo acumulado.
- Un nodo que va atrasado descarga la cadena completa de un par. No hay sincronización que empiece por los encabezados, ni descubrimiento de pares, ni protección contra un par que inunde a un nodo.
- Una clave pública por salida, sin scripts, sin mercado de comisiones, sin límite de tamaño de bloque.
- Las claves se derivan de etiquetas públicas, así que no protegen nada.
- La prueba de trabajo compra seguridad con energía, y su garantía es probabilística y depende de que los nodos honestos tengan la mayor parte del poder de cómputo. El tema del quiz `limits-and-alternatives` cubre esto y la prueba de participación (proof of stake).

## Ejecútalo

```sh
cd projects/blockchain/didactic-blockchain
./setup-unix-didactic-blockchain.sh          # tests and demo
./setup-unix-didactic-blockchain.sh bench    # timing table
```
