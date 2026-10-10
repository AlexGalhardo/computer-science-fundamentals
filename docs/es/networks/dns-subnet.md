# Resolvedor DNS y calculadora de subredes

> English version: [docs/en/networks/dns-subnet.md](../../en/networks/dns-subnet.md) · Versão em português: [docs/pt/networks/dns-subnet.md](../../pt/networks/dns-subnet.md)

Mini-proyecto: [`projects/networks/dns-subnet`](../../../projects/networks/dns-subnet/README.es.md). Lenguajes: Go y TypeScript. Temas del quiz: `networks` / `application-layer` y `networks` / `network-layer`.

## Parte 1: cómo se resuelve un nombre

### El árbol y quién sabe qué

DNS es un árbol de nombres dividido en **zonas**, y cada zona la sirven servidores que solo conocen su propio pedazo:

| Servidor en el laboratorio | Zona | Qué sabe |
| --- | --- | --- |
| raíz, 10.253.53.2 | `.` | quién sirve `test.` |
| TLD, 10.253.53.3 | `test.` | quién sirve `example.test.`, `elsewhere.test.` y `other.test.` |
| autoritativo, 10.253.53.4 | esos tres dominios | los registros reales |

Ningún servidor tiene la respuesta completa, y ninguno le pregunta a otro. Un servidor que no es dueño del nombre devuelve una **referencia**: registros NS que dicen a quién preguntar después y, cuando los tiene, las direcciones de esos servidores (**glue**).

### Resolución iterativa

El resolvedor empieza sabiendo una sola cosa: la dirección del servidor raíz. Hace la misma pregunta en cada nivel y sigue las referencias. Este es el rastro confirmado en el repositorio ([results/resolution.txt](../../../projects/networks/dns-subnet/results/resolution.txt)):

```text
1. www.example.test. A
  ask 10.253.53.2     (zone .)  www.example.test. A -> referral: test. is served by ns.test.
  ask 10.253.53.3     (zone test.)  www.example.test. A -> referral: example.test. is served by ns1.example.test.
  ask 10.253.53.4     (zone example.test.)  www.example.test. A -> answer: www.example.test. 3 A 192.0.2.10
  queries sent: 3
```

### La caché y el tiempo de vida

Cada registro lleva un TTL elegido por su dueño: durante cuántos segundos se puede reutilizar la respuesta. La caché de `go/resolver/cache.go` guarda cada conjunto de registros hasta que se agota su TTL más corto y entrega los registros con el tiempo que les queda.

```text
2. www.example.test. A
  cache                        www.example.test. A -> answer: www.example.test. 3 A 192.0.2.10
  queries sent: 0

-- waiting 4s --

3. www.example.test. A
  ask 10.253.53.4     (zone example.test.)  www.example.test. A -> answer: www.example.test. 3 A 192.0.2.10
  queries sent: 1
```

La segunda pregunta no cuesta ningún paquete. Pasados 4 segundos la dirección (TTL 3) ya expiró, pero los registros NS (TTL 300) no, así que la tercera pregunta va directo al servidor autoritativo: una consulta en lugar de tres. La caché mantiene los niveles superiores del árbol fuera de casi todas las búsquedas.

Las pruebas verifican el tiempo con un reloj falso en lugar de dormir: a los 2.999 s la entrada todavía se sirve, a los 3.000 s ya no está.

### Alias y referencias sin glue

- `api.example.test.` es un CNAME. El resolvedor guarda el alias y resuelve el nombre canónico, que aquí sale de la caché.
- `other.test.` está delegado a `ns.elsewhere.test.` y el TLD no envía ninguna dirección para él, porque esa dirección vive en otra zona. El resolvedor tiene que detenerse, resolver el nombre del servidor de nombres (con sangría en el rastro) y luego continuar.
- `shop.other.test.` es un alias hacia una zona distinta. El resolvedor inicia una nueva resolución para el destino.
- `missing.example.test.` recibe NXDOMAIN del servidor que es dueño de la zona: solo una autoridad puede decir que un nombre no existe.

### Lo que el resolvedor se niega a creer

Las verificaciones forman parte de la lección a propósito, porque a un resolvedor que confía en todo se le puede envenenar la caché:

| Verificación | Dónde |
| --- | --- |
| La respuesta debe venir de la dirección consultada (socket conectado), repetir un identificador aleatorio de 16 bits y repetir la pregunta | `exchange` |
| A un servidor solo se le cree sobre nombres dentro de la zona por la que se le consultó como autoridad (bailiwick) | `resolve` |
| El glue solo se acepta para los servidores de nombres nombrados en la referencia | `resolve` |
| Los punteros de compresión no pueden formar ciclos, las longitudes no pueden pasar del final del paquete | `dnsmsg.Unpack` |

Una prueba ejecuta un servidor mentiroso que responde correctamente y además cuela un registro de un nombre de otra zona; el registro nunca llega a la caché.

### Formato en el cable

`go/dnsmsg` implementa el formato real de la RFC 1035 para lo que necesita el laboratorio: el encabezado de 12 bytes, una pregunta, y registros de tipo A, NS y CNAME en las secciones answer, authority y additional. Los nombres son secuencias de etiquetas con prefijo de longitud y pueden terminar en un puntero de compresión. Como el formato es el real, los servidores falsos y el resolvedor podrían en principio hablar con herramientas estándar, pero nada del laboratorio queda expuesto fuera de su red interna.

## Parte 2: cómo se dividen las direcciones

Una dirección IPv4 es un número de 32 bits. Un prefijo `/n` dice que los primeros n bits identifican la red. `ts/src/subnet.ts` deriva todo a partir de eso:

| Valor | Cómo |
| --- | --- |
| máscara | n unos seguidos de 32 - n ceros |
| red | dirección AND máscara |
| broadcast | red OR (NOT máscara) |
| hosts | 2^(32 - n) - 2, ya que la red y el broadcast están reservados |

Ejemplo resuelto, `192.168.10.77/26`:

```text
address    11000000.10101000.00001010.01 001101   192.168.10.77
mask       11111111.11111111.11111111.11 000000   255.255.255.192
network    11000000.10101000.00001010.01 000000   192.168.10.64
broadcast  11000000.10101000.00001010.01 111111   192.168.10.127
hosts      192.168.10.65 to 192.168.10.126        62 addresses
```

Casos límite cubiertos por la tabla de [results/subnets.md](../../../projects/networks/dns-subnet/results/subnets.md): un `/31` es un enlace punto a punto con dos direcciones utilizables y nada reservado (RFC 3021), un `/32` es una sola máquina, y `/0` es todo el espacio de direcciones.

### Por qué TypeScript

El lenguaje de referencia del repositorio convierte esta calculadora en una lección por sí misma. Los operadores de bits de JavaScript trabajan con enteros de 32 bits **con signo**, así que `192 << 24` es negativo y una máscara construida de forma ingenua se imprime como un número negativo. Los conteos de desplazamiento se toman módulo 32, así que `x << 32` no hace nada y `/0` necesita un caso especial. El código usa `>>> 0` para volver a números sin signo y una prueba verifica las 33 máscaras bit por bit.

`contains` responde la pregunta que un host se hace antes de enviar un paquete: ¿el destino está en mi subred (entregar directamente) o no (enviar al router)? `10.20.37.130/22` y `10.20.38.5` están en la misma subred aunque sus terceros octetos sean distintos.

## Límites

- Solo tipos de registro A, NS y CNAME. Sin registros IPv6, sin SOA, así que las respuestas negativas no se guardan en caché.
- Solo UDP, mensajes de hasta 1500 bytes, sin manejo de truncamiento y sin EDNS.
- Sin DNSSEC: las verificaciones de bailiwick y de identificador reducen el margen de falsificación, no prueban la autenticidad.
- La caché es para una sola goroutine y vive solo mientras se ejecuta el comando.

## Verificar

```sh
cd projects/networks/dns-subnet
docker compose run --rm -T go-test
docker compose run --rm -T ts-test
docker compose up -d root tld auth
docker compose run --rm -T resolver
docker network inspect dns-subnet_dnslab --format '{{.Internal}}'    # imprime true
docker compose down -v
```
