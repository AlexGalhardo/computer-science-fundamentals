# Detección y corrección de errores (MP-INFO-2)

> English version: [docs/en/information-theory/error-detection-correction.md](../../en/information-theory/error-detection-correction.md) · Versão em português: [docs/pt/information-theory/error-detection-correction.md](../../pt/information-theory/error-detection-correction.md)

Código: [projects/information-theory/error-detection-correction](../../../projects/information-theory/error-detection-correction). Lenguaje: C++.

## Qué enseña

Un canal con ruido invierte bits. El emisor no puede evitarlo, pero puede añadir **redundancia**: bits extra calculados a partir de los datos. Con un poco de redundancia el receptor nota que algo cambió (**detección**, seguida de una retransmisión). Con más, descubre qué bit cambió y lo invierte de vuelta (**corrección**).

La idea detrás de ambas es la **distancia**. Solo algunos patrones de bits son palabras válidas. Si dos palabras válidas cualesquiera difieren en al menos d posiciones (la distancia mínima de Hamming), entonces:

| Distancia mínima | Garantía |
| ---: | --- |
| 2 | detecta 1 error (bit de paridad) |
| 3 | detecta 2 errores, **o** corrige 1 (Hamming(7,4), repetición) |
| 4 | corrige 1 **y** detecta 2 (Hamming(8,4) extendido) |

En general, detectar d errores exige distancia d + 1 y corregir d errores exige distancia 2d + 1.

## Detectar

**Bit de paridad.** Un bit que hace par el número de bits 1. Es el XOR de todos los bits de datos. Se detecta cualquier número impar de inversiones, y cualquier número par pasa.

**Checksum de Internet.** Los datos se leen como palabras de 16 bits, las palabras se suman devolviendo los acarreos, y se envía el complemento de la suma. Es barato, y es ciego a cualquier cosa que conserve la suma: dos palabras intercambiadas, o un bit que sube en una palabra mientras el mismo bit baja en otra.

**CRC-32.** El mensaje es un polinomio con coeficientes 0 y 1, y el CRC es el residuo de dividirlo por un generador fijo de grado 32. La resta es XOR, así que la división son desplazamientos y XOR:

```text
1101000 | 1011        message 1101, generator 1011 (degree 3), three zeros appended
1011
----
 1100
 1011
 ----
  1110
  1011
  ----
   1010
   1011
   ----
    001               remainder: the frame sent is 1101 001
```

Una trama dañada se escapa solo si el patrón de error es en sí mismo un múltiplo del generador. Eso nunca ocurre con ráfagas de hasta 32 bits, y con daños aleatorios más largos ocurre aproximadamente una vez en 2^32. La implementación de aquí es el CRC-32 reflejado de Ethernet y zip, primero bit a bit y luego con una tabla de 256 entradas construida en tiempo de compilación. Ambas dan `0xCBF43926` para `123456789`, el valor de verificación estándar.

Un CRC protege solo contra accidentes. Cualquiera puede recalcularlo, así que no da protección contra un cambio deliberado.

## Corregir

**Repetición (3,1).** Cada bit se envía tres veces y gana la mayoría. Corrige un error por bloque y cuesta 3 bits por bit de datos.

**Hamming(7,4).** Cuatro bits de datos y tres bits de paridad, colocados de modo que las verificaciones de paridad señalen el bit equivocado:

```text
position   1   2   3   4   5   6   7
content    p1  p2  d1  p4  d2  d3  d4

p1 covers 1, 3, 5, 7      p2 covers 2, 3, 6, 7      p4 covers 4, 5, 6, 7

data 1011      ->  word      0 1 1 0 0 1 1
position 6 flips -> received 0 1 1 0 0 0 1
checks: p1 ok (0), p2 fails (1), p4 fails (1)  ->  syndrome 110 = 6  ->  flip position 6
```

Los bits de paridad están en las potencias de dos, y cada posición está cubierta por los bits de paridad cuyos números suman esa posición. Así, las verificaciones que fallan, leídas como un número binario (el **síndrome**), son la posición del error. En el código el síndrome se calcula como el XOR de los números de todas las posiciones que contienen un 1.

Dos errores son demasiados: el síndrome pasa a ser el XOR de dos posiciones, que nombra un tercer bit. El decodificador lo invierte y entrega datos incorrectos, creyendo que corrigió un error.

**Hamming(8,4) extendido, SECDED.** Un bit más con la paridad de toda la palabra distingue un número impar de errores de uno par:

| Síndrome | Paridad global | Conclusión |
| --- | --- | --- |
| 0 | ok | ningún error |
| distinto de 0 | incorrecta | un error: corregirlo |
| distinto de 0 | ok | dos errores: solo detectar |
| 0 | incorrecta | el propio bit de paridad global fue afectado |

Este es el esquema de la memoria ECC.

## El simulador de ruido

Un canal binario simétrico invierte cada bit de forma independiente con probabilidad BER (tasa de error de bit). Para cada esquema y cada BER se envían 200,000 bloques y se clasifica cada bloque dañado:

- **detectado**: el receptor sabe que el bloque es malo (pediría una retransmisión);
- **corregido**: el receptor lo reparó y los datos son correctos;
- **no detectado**: el receptor entregó datos incorrectos como si fueran correctos.

El simulador puede distinguir un error no detectado porque sabe qué se envió. Un receptor real no puede, y por eso mismo esta columna importa.

| Esquema | Bloque (bits) | BER | Bloques | Con errores | Detectados | Corregidos | No detectados | No detectados / con errores |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Parity bit | 9 | 0.0001 | 200000 | 179 | 179 | 0 | 0 | 0.000% |
| Parity bit | 9 | 0.001 | 200000 | 1748 | 1741 | 0 | 7 | 0.400% |
| Parity bit | 9 | 0.01 | 200000 | 17220 | 16582 | 0 | 638 | 3.705% |
| Parity bit | 9 | 0.05 | 200000 | 73783 | 60989 | 0 | 12794 | 17.340% |
| Parity bit | 9 | 0.1 | 200000 | 122342 | 86441 | 0 | 35901 | 29.345% |
| Internet checksum | 272 | 0.0001 | 200000 | 5284 | 5282 | 0 | 2 | 0.038% |
| Internet checksum | 272 | 0.001 | 200000 | 47332 | 47154 | 0 | 178 | 0.376% |
| Internet checksum | 272 | 0.01 | 200000 | 186952 | 185317 | 0 | 1635 | 0.875% |
| Internet checksum | 272 | 0.05 | 200000 | 200000 | 199986 | 0 | 14 | 0.007% |
| Internet checksum | 272 | 0.1 | 200000 | 200000 | 199997 | 0 | 3 | 0.002% |
| CRC-32 | 288 | 0.0001 | 200000 | 5634 | 5634 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.001 | 200000 | 49730 | 49730 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.01 | 200000 | 188736 | 188736 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.05 | 200000 | 199999 | 199999 | 0 | 0 | 0.000% |
| CRC-32 | 288 | 0.1 | 200000 | 200000 | 200000 | 0 | 0 | 0.000% |
| Repetition (3,1) | 3 | 0.0001 | 200000 | 62 | 0 | 62 | 0 | 0.000% |
| Repetition (3,1) | 3 | 0.001 | 200000 | 658 | 0 | 658 | 0 | 0.000% |
| Repetition (3,1) | 3 | 0.01 | 200000 | 6123 | 0 | 6068 | 55 | 0.898% |
| Repetition (3,1) | 3 | 0.05 | 200000 | 28625 | 0 | 27107 | 1518 | 5.303% |
| Repetition (3,1) | 3 | 0.1 | 200000 | 54003 | 0 | 48351 | 5652 | 10.466% |
| Hamming (7,4) | 7 | 0.0001 | 200000 | 148 | 0 | 148 | 0 | 0.000% |
| Hamming (7,4) | 7 | 0.001 | 200000 | 1387 | 0 | 1380 | 7 | 0.505% |
| Hamming (7,4) | 7 | 0.01 | 200000 | 13613 | 0 | 13225 | 388 | 2.850% |
| Hamming (7,4) | 7 | 0.05 | 200000 | 60198 | 0 | 51186 | 9012 | 14.971% |
| Hamming (7,4) | 7 | 0.1 | 200000 | 104208 | 0 | 74134 | 30074 | 28.860% |
| Hamming (8,4) SECDED | 8 | 0.0001 | 200000 | 161 | 0 | 161 | 0 | 0.000% |
| Hamming (8,4) SECDED | 8 | 0.001 | 200000 | 1566 | 5 | 1561 | 0 | 0.000% |
| Hamming (8,4) SECDED | 8 | 0.01 | 200000 | 15359 | 518 | 14825 | 16 | 0.104% |
| Hamming (8,4) SECDED | 8 | 0.05 | 200000 | 67275 | 10395 | 55782 | 1098 | 1.632% |
| Hamming (8,4) SECDED | 8 | 0.1 | 200000 | 113827 | 30736 | 76245 | 6846 | 6.014% |

La ejecución usa un generador escrito a mano con una semilla fija, así que la tabla es la misma en cada máquina: `docker compose run --rm demo`.

Cómo leer la tabla:

- **Tasa de error de bit frente a tasa de error de bloque.** Con BER 0.01 solo 1 bit de cada 100 es incorrecto, y aun así el 94% de las tramas de 288 bits están dañadas: 1 − 0.99^288. Las tramas largas necesitan una detección fuerte.
- **La paridad** no detecta los bloques con un número par de inversiones, que se vuelven comunes a medida que crece el BER.
- **El checksum** no detecta las tramas en las que dos inversiones se cancelan en la suma. Con un BER muy alto deja pasar menos, solo porque las tramas muy dañadas rara vez conservan la suma por casualidad.
- **CRC-32** no deja pasar ninguna de las más de 600,000 tramas dañadas. Un escape aleatorio tiene probabilidad 2^−32.
- **La repetición** con BER 0.1 entrega 5,652 bits incorrectos de 200,000, el 2.8%, el valor de 3p²(1 − p) + p³.
- **Hamming(7,4)** nunca dice "detectado": todo bloque con dos o más inversiones se entrega mal. **Hamming(8,4)** pasa la mayoría a la columna de detectados, y lo que aún deja pasar son bloques con tres o más inversiones.
- **Corregir no está libre de riesgo.** Un código que corrige debe adivinar, y con más errores de los que se diseñó para manejar adivina mal. Por eso los enlaces muy ruidosos combinan la corrección con un CRC encima.

## Cómo se verifican las respuestas

- CRC-32: el valor de verificación estándar, la coincidencia de las dos implementaciones, todas las ráfagas de hasta 12 bits en cada posición de una trama y 100,000 ráfagas aleatorias de hasta 32 bits.
- Hamming(7,4): los 16 × 7 errores simples corregidos, los 16 × 21 errores dobles mal corregidos, distancia mínima 3.
- Hamming(8,4): los 16 × 8 errores simples corregidos, los 16 × 28 errores dobles detectados, distancia mínima 4.
- Paridad: cada inversión simple detectada, cada inversión doble no detectada. Checksum: el ejemplo del RFC 1071, y las palabras intercambiadas que no puede ver.
- Simulador: sin ruido no hay daño, la misma semilla da la misma tabla, los conteos suman, y la proporción de bloques dañados coincide con 1 − (1 − p)^n.

## Temas del quiz relacionados

`information-theory`: `error-detection`, `error-correction`, `channel-capacity-noise`, `encoding-hashing-encryption`.
