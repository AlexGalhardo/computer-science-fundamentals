# didactic-blockchain

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Una blockchain de juguete lo bastante pequeña para leerla de una sentada: bloques enlazados por hashes, una raíz de Merkle por bloque, prueba de trabajo con dificultad ajustable, transacciones firmadas sobre salidas no gastadas, y tres nodos locales que se comunican por gossip y siguen la cadena más larga. Muestra por qué se detecta el cambio de una transacción antigua, por qué una moneda no puede gastarse dos veces y cómo se resuelve un fork por sí solo.

Elemento del plan: MP-CHAIN-1. Lenguajes: TypeScript (referencia, todo) y Rust (hashing, raíz de Merkle, prueba de trabajo y validación de la cadena). Documentación completa: [docs/es/blockchain/didactic-blockchain.md](../../../docs/es/blockchain/didactic-blockchain.md).

**Este es un juguete didáctico que corre solo en tu máquina.** Los nodos son contenedores en una red interna de docker-compose sin ruta a Internet y sin ningún puerto publicado. No se conecta a ninguna red real y no guarda claves ni monedas reales: cada "billetera" se deriva de una etiqueta pública como `alice`, así que cualquiera puede recrearla. No reutilices nada de este código donde haya valor real en juego.

## Qué enseña

- Un hash es una huella digital: el encabezado del bloque contiene el hash del bloque anterior y la raíz de Merkle de sus transacciones, así que un solo monto cambiado rompe el id de la transacción, luego la raíz de Merkle, luego el hash del bloque y luego el enlace del bloque siguiente.
- La prueba de trabajo es costosa de producir y barata de verificar: unos `16^d` intentos para `d` dígitos hexadecimales cero, un solo hash para verificar. Cada dígito extra multiplica el tiempo de minería por unos 16.
- Una firma prueba quién autorizó una transferencia, no que sea la única. El doble gasto se frena con el conjunto de salidas no gastadas: una salida que se gastó ya no existe.
- Los nodos no votan y no confían entre sí. Cada uno valida todo y sigue la cadena válida más larga, así que un fork dura hasta que una rama se adelanta. La longitud nunca hace aceptable una cadena inválida.
- Reescribir un bloque antiguo significa rehacer el trabajo de todos los bloques posteriores, más rápido que todos los demás. Ese es el costo que la cadena impone a la manipulación, y también su límite: quien tiene la mayor parte del poder de cómputo puede revertir sus propios pagos.

## Temas del quiz que demuestra

Área `blockchain`:

- `hash-functions` (resumen de tamaño fijo, determinismo, efecto avalancha)
- `digital-signatures-and-keys` (firmar con la clave privada, verificar con la clave pública, la clave de la salida gastada)
- `transactions-and-unspent-outputs` (entradas, salidas, cambio, comisión, el conjunto UTXO)
- `blocks-chain-and-merkle-trees` (encabezado, hash anterior, raíz de Merkle, prueba de inclusión, evidencia de manipulación)
- `proof-of-work-and-difficulty` (nonce, dígitos cero, intentos esperados, verificación con un hash)
- `double-spending-and-confirmations` (gana el primero visto, salidas gastadas)
- `network-and-consensus` (gossip, forks, empates, cadena más larga, reorganización)
- `incentives-and-mining` (transacción de creación de monedas, recompensa más comisiones)

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-didactic-blockchain.sh        # Linux and macOS
./setup-windows-didactic-blockchain.ps1    # Windows
```

El script construye las dos imágenes, ejecuta las pruebas de TypeScript y de Rust, ejecuta la demo de Rust, inicia tres nodos y ejecuta contra ellos la demo de red, y luego elimina los contenedores y la red.

## Demo

```sh
docker compose run --rm demo       # three nodes: payment, double spend, tampering, fork
docker compose run --rm rust-demo  # one chain: build, validate, tamper, validate again
docker compose down -v
```

La demo de red imprime cada afirmación y la comprueba, y termina con error si alguna no se cumple:

```text
4. Double spend, attempt 2: two conflicting payments sent to two different nodes
   ok   node A accepted the payment to Bob (first seen)
   ok   node C, which already heard of it, rejected the payment to Carol: output 07de...:1 does not exist or was already spent
6. Fork: the network is partitioned into {A, B} and {C}, and both sides mine
   ok   same height, different blocks: A and B at 4:0009c1e83915, C at 4:000f6d3f8ad2
7. The partition heals and the fork resolves to the longest chain
   ok   all nodes at 5:000478e0f6ab: C abandoned its own block
   ok   the payment to Carol lost its confirmation
   ok   but it is still valid, so it went back to the pending pool of C
```

## Benchmark

```sh
./setup-unix-didactic-blockchain.sh bench        # or: ./setup-windows-didactic-blockchain.ps1 bench
```

Mina encabezados de bloque fijos con 1 a 4 dígitos hexadecimales cero en ambos lenguajes y escribe [`results/mining.md`](results/mining.md), con la máquina, las versiones de los runtimes y los comandos exactos. Resumen de la ejecución confirmada en el repositorio (mediana de 3 pasadas, un hilo, una máquina compartida con otras cargas, por lo que los tiempos son ruidosos):

| Dígitos hex cero | Intentos esperados | Promedio de intentos | TypeScript, ms por bloque | Razón de tiempo | Rust, ms por bloque | Razón de tiempo |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 16 | 15.9 | 0.0584 | - | 0.0229 | - |
| 2 | 256 | 259.6 | 0.7203 | 12.3 | 0.2578 | 11.2 |
| 3 | 4,096 | 3,963.8 | 11.57 | 16.1 | 3.683 | 14.3 |
| 4 | 65,536 | 60,242.1 | 195.9 | 16.9 | 57.36 | 15.6 |

El número de intentos crece 16.3, 15.3 y 15.2 veces por dígito extra, y es idéntico en ambos lenguajes porque los encabezados son fijos. El tiempo lo sigue desde la dificultad 2. Entre la dificultad 1 y la 2 la razón de tiempo es menor, porque con solo 16 hashes por bloque el costo fijo de preparar un encabezado es una parte visible del tiempo.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `ts/src/hash.ts`, `merkle.ts` | SHA-256 de `node:crypto`, raíz de Merkle, prueba de inclusión y su verificación |
| `ts/src/keys.ts` | Billeteras Ed25519 de juguete con `node:crypto`, firmar y verificar |
| `ts/src/transaction.ts` | Entradas, salidas, el conjunto UTXO, las reglas de una transacción, cambio y comisión |
| `ts/src/block.ts` | Encabezado del bloque, hash del bloque, verificación de dificultad y minería |
| `ts/src/chain.ts` | Bloque génesis, las reglas de un bloque, validación de una cadena completa |
| `ts/src/node.ts` | Un nodo: cadena, pool pendiente, regla del primero visto, regla de la cadena más larga, reorganización |
| `ts/src/server.ts` | HTTP alrededor de un nodo, gossip entre pares, entrada validada con Zod |
| `ts/src/demo.ts` | El escenario guionado contra tres contenedores de nodo |
| `ts/src/bench.ts`, `report.ts` | Tiempo de minería por dificultad y la tabla en Markdown |
| `rust/src/sha256.rs` | SHA-256 escrito a mano (FIPS 180-4), comprobado con los vectores publicados |
| `rust/src/chain.rs`, `bench.rs`, `main.rs` | Raíz de Merkle, minería, validación de la cadena, benchmark y demo en Rust |
| `results/` | Salida del benchmark confirmada en el repositorio |

## Pruebas

```sh
docker compose run --rm ts-test
docker compose run --rm rust-test
```

- Evidencia de manipulación: cambiar el monto de cualquier salida de cualquier transacción invalida la cadena, y cada "reparación" que intenta el atacante (nuevo id, nueva raíz de Merkle, nueva prueba de trabajo) falla en la siguiente verificación. Ambos lenguajes la prueban.
- Prueba de trabajo: un hash minado tiene los ceros requeridos y se verifica con un solo hash, y el promedio de intentos crece unas 16 veces por dígito extra (determinista, 300 bloques por dificultad).
- Doble gasto: rechazado en el pool pendiente (primero visto), contra salidas confirmadas y dentro de un bloque.
- Forks: un empate conserva el primer bloque visto, gana la rama más larga, se rechaza una cadena más larga inválida y las transacciones de la rama abandonada vuelven al pool.
- Red: tres nodos HTTP en loopback comunican por gossip transacciones y bloques, rechazan entradas malformadas y pares no locales, y resuelven una partición.
- Las pruebas de Rust verifican hashes, una raíz de Merkle, un nonce minado y cantidades de intentos impresos por la referencia en TypeScript, lo que demuestra que ambos lenguajes calculan lo mismo.

Formateadores y linters:

```sh
bunx biome check projects/blockchain/didactic-blockchain   # TypeScript, from the repository root
docker compose run --rm ts-test                            # typecheck (tsc) and tests
docker compose run --rm rust-test                          # cargo fmt --check, clippy -D warnings, tests
```

## Dependencias

- TypeScript: `zod` 4.6.5 valida todo lo que llega por HTTP, desde variables de entorno y desde los archivos JSON del benchmark. El hashing y las firmas vienen del módulo estándar `node:crypto` de Bun.
- Rust: ningún crate. Rust no tiene SHA-256 en su biblioteca estándar, así que `rust/src/sha256.rs` lo implementa a mano como parte de la lección. El lado de Rust no tiene firmas por la misma razón: implementar Ed25519 a mano no sería didáctico, y añadir un crate no era necesario para lo que Rust muestra aquí.

## Simplificaciones y límites

- La dificultad es un número de dígitos hexadecimales cero y la fijan las reglas, así que solo se mueve en pasos de 16 y nunca se reajusta. Las redes reales comparan el hash con un objetivo numérico y lo reajustan según el tiempo que tardaron los últimos bloques.
- "Cadena más larga" cuenta bloques, lo que equivale al mayor trabajo acumulado solo porque todos los bloques tienen la misma dificultad.
- Un nodo que va atrasado pide a un par su cadena completa y la valida desde el bloque génesis. Los nodos reales intercambian primero los encabezados y descargan solo lo que les falta.
- El hash del bloque es un único SHA-256 sobre una línea de texto, y el árbol de Merkle aplica hash a texto hexadecimal. Bitcoin aplica hash doble a datos binarios. El árbol de Merkle duplica el último nodo de un nivel impar, como hace Bitcoin, lo que hace que `[A, B, C]` y `[A, B, C, C]` compartan raíz; por eso se rechazan los bloques con una transacción repetida.
- Una salida está bloqueada a una sola clave pública. No hay lenguaje de scripts, ni mercado de comisiones, ni límite de tamaño de bloque, ni descubrimiento de pares.
- Las claves se derivan de etiquetas públicas. La seguridad de las claves es deliberadamente nula.
