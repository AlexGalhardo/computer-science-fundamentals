# error-detection-correction

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

¿Cómo detecta y repara la redundancia los bits invertidos? Este miniproyecto implementa, en C++, tres códigos **detectores** (bit de paridad, checksum de Internet, CRC-32) y tres códigos **correctores** (repetición triple, Hamming(7,4) y Hamming(8,4) extendido), y un **simulador de ruido** que envía bloques por un canal binario simétrico y cuenta cuántos bloques dañados detectó, corrigió o dejó pasar cada esquema.

Explicación completa: [docs/es/information-theory/error-detection-correction.md](../../../docs/es/information-theory/error-detection-correction.md).

## Temas del quiz que demuestra

- `information-theory` / `error-detection`: la paridad y lo que no detecta, el checksum aditivo y su ceguera al orden, el CRC como residuo polinómico, la garantía contra ráfagas, detección seguida de retransmisión.
- `information-theory` / `error-correction`: distancia de Hamming, repetición con voto mayoritario, codificación y síndrome de Hamming(7,4), corrección errónea de errores dobles, SECDED.
- `information-theory` / `channel-capacity-noise`: el canal binario simétrico, tasa de error de bit frente a tasa de error de bloque.
- `information-theory` / `encoding-hashing-encryption`: un CRC protege contra accidentes, no contra un atacante.

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-error-detection-correction.sh        # Linux and macOS
./setup-windows-error-detection-correction.ps1    # Windows
```

El script construye la imagen fijada, ejecuta la verificación del formateador y las pruebas, y luego ejecuta el simulador.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `cpp/detection.hpp` | paridad par, checksum de Internet (RFC 1071), CRC-32 bit a bit y con tabla |
| `cpp/hamming.hpp` | Hamming(7,4), Hamming(8,4) extendido, repetición (3,1) |
| `cpp/simulator.hpp` | generador pseudoaleatorio, canal binario simétrico, conteos y la tabla |
| `cpp/demo.cpp` | el simulador de ruido |
| `cpp/test_codes.cpp` | las pruebas |
| `results/results.md` | la tabla confirmada en el repositorio |

C++23 solo con cabeceras y solo con la biblioteca estándar. El código se compila con `-Wall -Wextra -Werror` y se verifica con clang-format.

## Pruebas

```sh
docker compose run --rm cpp-test
```

- CRC-32 da el valor de verificación estándar `0xCBF43926` para la cadena `123456789`, bit a bit y con la tabla, y las dos versiones coinciden con datos aleatorios.
- Hamming(7,4), de forma exhaustiva: cada error de un solo bit en cada una de las 16 palabras de código se corrige (16 × 7 casos), y cada error doble se corrige mal (16 × 21 casos).
- Hamming(8,4), de forma exhaustiva: cada error simple se corrige (16 × 8) y cada error doble se detecta (16 × 28).
- Las distancias mínimas 3 y 4 se miden sobre todos los pares de palabras de código.
- La paridad detecta cada inversión simple y no detecta ninguna inversión doble. El checksum reproduce el ejemplo del RFC 1071 y no detecta dos palabras intercambiadas, lo que CRC-32 sí detecta.
- CRC-32 detecta cada ráfaga de hasta 12 bits en cada posición de una trama, y 100,000 ráfagas aleatorias de hasta 32 bits.
- El simulador es determinista, sus conteos suman, y la proporción de bloques dañados coincide con 1 − (1 − p)^n.

## Demo

```sh
docker compose run --rm demo
```

Imprime la tabla y reescribe [results/results.md](results/results.md). La ejecución usa una semilla, así que los números son los mismos en cada máquina. 200,000 bloques por fila. Extracto (la tabla completa está en el archivo de resultados):

| Esquema | Bloque (bits) | BER | Con errores | Detectados | Corregidos | No detectados |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Parity bit | 9 | 0.01 | 17220 | 16582 | 0 | 638 |
| Internet checksum | 272 | 0.01 | 186952 | 185317 | 0 | 1635 |
| CRC-32 | 288 | 0.01 | 188736 | 188736 | 0 | 0 |
| Repetition (3,1) | 3 | 0.01 | 6123 | 0 | 6068 | 55 |
| Hamming (7,4) | 7 | 0.01 | 13613 | 0 | 13225 | 388 |
| Hamming (8,4) SECDED | 8 | 0.01 | 15359 | 518 | 14825 | 16 |

Qué leer en ella:

- **Detectados** significa "retransmitir", **corregidos** significa "reparado en el acto", **no detectados** significa "datos incorrectos entregados como buenos". No detectados es la columna que importa.
- La paridad no detecta ningún bloque con un número par de inversiones. CRC-32 no deja pasar nada en más de 600,000 tramas dañadas.
- El checksum no detecta las tramas en las que dos inversiones se cancelan en la suma (la misma posición de bit de dos palabras, una subiendo y la otra bajando).
- Hamming(7,4) repara errores simples pero convierte cada error doble en datos incorrectos. Un bit más, Hamming(8,4), convierte casi todos esos casos en errores detectados.
- Con una tasa de error de bit de 0.01, el 94% de las tramas de 288 bits llegan dañadas. Una tasa pequeña por bit es una tasa grande por trama.

## Límites

El canal invierte bits de forma independiente. Los enlaces reales también producen ráfagas, que es el caso para el que están diseñados los CRC y no los códigos de Hamming. Los códigos trabajan con un bloque a la vez: no hay entramado, protocolo de retransmisión ni entrelazado.
