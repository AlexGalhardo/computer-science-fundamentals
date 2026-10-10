# Laboratorio de SSRF (MP-SEC-5)

> English version: [docs/en/security/ssrf-lab.md](../../en/security/ssrf-lab.md) · Versão em português: [docs/pt/security/ssrf-lab.md](../../pt/security/ssrf-lab.md)

Miniproyecto: [`projects/security/ssrf-lab`](../../../projects/security/ssrf-lab/README.es.md). Temas del quiz: `ssrf-path-traversal-upload`, `owasp-threat-modelling`.

Este laboratorio es defensivo y educativo. Se ejecuta solo de forma local, en Docker, en redes internas sin puertos publicados, y todos los datos son falsos. El código vulnerable existe para compararse con la corrección, nunca para reutilizarse.

## El concepto

La falsificación de solicitudes del lado del servidor (SSRF, server-side request forgery) ocurre cuando un servidor hace una solicitud de red a un destino elegido por un usuario. Las funcionalidades que hacen esto son comunes y legítimas: vistas previas de enlaces, webhooks, "importar desde una URL", buscadores de imágenes, generadores de PDF.

El problema no es la solicitud, es **desde dónde sale**. La solicitud sale del servidor, así que tiene la posición de red del servidor: alcanza `localhost`, la red privada de la empresa y el servicio de metadatos link-local de un proveedor de nube. Muchos de esos destinos no tienen autenticación porque "solo las máquinas internas pueden conectarse". El SSRF presta esa confianza a quien logre escribir una URL. Tiene categoría propia en el OWASP Top 10 desde 2021.

La cura sale de la causa: la aplicación debe decidir adónde acepta conectarse, y tomar esa decisión sobre lo que la conexión realmente usa, la dirección numérica, en cada salto.

## La falla

```ts
const response = await fetch(url); // `url` vino del usuario
```

El laboratorio tiene un servicio interno falso, `internal-admin`, en una red privada de Docker. Responde un token falso (`FAKE-INTERNAL-TOKEN-not-real`) a cualquiera que logre conectarse, y solo la app lo logra. Dos entradas de demostración, armadas en `ts/src/scenario.ts`:

| Entrada | Resultado en la app vulnerable |
| --- | --- |
| `http://internal-admin:8080/secret` | La vista previa contiene el token falso |
| `http://public-site:8080/redirect-to-internal` | La URL cita solo el sitio público falso. Este responde `302` hacia el servicio interno, `fetch` sigue la redirección por defecto, y la vista previa contiene el token falso |

La segunda entrada es la razón por la que una comprobación solo sobre la primera URL no es una corrección.

## La red del laboratorio

Toda dirección de contenedor es privada, así que la regla real "rechazar direcciones privadas" rechazaría también el sitio público falso. El laboratorio mantiene la regla honesta dándole al lado "público" un rango de documentación:

| Red | Subred | Servicios |
| --- | --- | --- |
| `lab` (`internal: true`) | privada, elegida por Docker | `internal-admin`, la app |
| `lab-public` (`internal: true`) | `203.0.113.0/24`, TEST-NET-3 (RFC 5737) | `public-site`, la app |

`203.0.113.0/24` no es privada y nunca se enruta en la internet real, y la red es interna de todos modos, así que nada sale de la máquina. Dentro del laboratorio, `public-site` resuelve a una dirección pública e `internal-admin` a una privada, exactamente como espera el clasificador, y una prueba lo afirma.

## La corrección

Cada salto de la solicitud pasa por la misma compuerta (`ts/src/fixed/fixed-safe-fetch.ts`):

| Capa | Qué hace | Qué no hace |
| --- | --- | --- |
| Zod en la ruta | Acepta solo una URL de como máximo 2048 caracteres | No dice nada sobre adónde apunta la URL |
| Comprobación del esquema | Solo `http` y `https` | |
| Lista de permitidos de host y puerto | Comparación exacta sobre el host interpretado por `new URL()`. **El control más fuerte** cuando la funcionalidad tiene un conjunto conocido de destinos | Un nombre de la lista aún puede resolver a una dirección interna |
| Comprobación de la dirección resuelta | Resuelve con `node:dns`; todas las direcciones deben ser públicas. Rechaza loopback, privadas, link-local, no especificadas y rangos reservados, en IPv4 e IPv6, incluido IPv4 envuelto en IPv6 | Por sí sola, deja un intervalo entre la comprobación y la conexión |
| Conexión fijada | Se conecta a la dirección validada y envía el nombre en la cabecera `Host`, así que el DNS no se consulta una segunda vez | |
| Redirecciones manuales | `redirect: "manual"`; cada `Location` reinicia desde la comprobación del esquema, hasta 3 saltos | |
| Límites | Un plazo único de 2 s para todos los saltos y el cuerpo; cuerpo contado durante la lectura, como máximo 64 KiB | |

El intervalo entre el momento de la comprobación y el momento del uso merece una nota. Si el código valida la dirección de un nombre y luego entrega el nombre al cliente HTTP, el cliente resuelve de nuevo, y un servidor DNS controlado por otra persona puede dar una respuesta distinta la segunda vez (DNS rebinding). La respuesta habitual es conectarse a la dirección que se validó, que es lo que hace la conexión fijada.

Lo que no funciona: las listas de bloqueo de textos como `localhost` (la misma dirección tiene muchas grafías, y cualquier nombre DNS puede apuntar hacia dentro), validar solo la primera URL (redirecciones), `startsWith` o expresiones regulares sobre la URL cruda, ocultar la respuesta al usuario (la solicitud se hace igual: SSRF ciego), y confiar en `Content-Length`.

Las comprobaciones de la aplicación son una capa. La red debe imponer la misma regla: un segmento aislado o un proxy de salida para el componente que busca URLs de usuarios, autenticación entre servicios internos, y el servicio de metadatos endurecido en la nube.

## Qué demuestran las pruebas

Una función de escenario pide a las dos apps las mismas cuatro vistas previas: un artículo público, una página pública que redirige a otra página pública, la URL interna, y la URL pública que redirige al servicio interno. El servicio interno falso cuenta las solicitudes que recibe.

| Elemento | Cómo se verifica |
| --- | --- |
| MP-SEC-5.1 funcionalidad vulnerable y servicio interno falso en redes internas; una prueba alcanza el servicio interno a través de la funcionalidad | `tests/scenario.test.ts`, bloque vulnerable: la URL directa y la redirección responden `200` con el token falso en la vista previa, y el contador interno subió 2. `tests/network-isolation.test.ts`: una solicitud a `http://example.com` falla desde dentro del contenedor. `docker-compose.yml` no publica puertos y las dos redes son `internal: true` |
| MP-SEC-5.2 la corrección detiene la misma prueba, incluso por redirección, y el uso normal funciona | `tests/scenario.test.ts`, bloque corregido: los dos intentos responden `403` (`host-not-allowed`), el contador interno no se movió, el artículo público y la redirección pública siguen respondiendo `200`. Tercer bloque: con el nombre interno puesto por error en la lista de permitidos, los dos intentos responden `403` (`address-not-allowed`) y el contador sigue detenido. `tests/address-classifier.test.ts`: tabla de direcciones IPv4 e IPv6. `tests/fixed-safe-fetch.test.ts`: esquema, credenciales, lista de permitidos, literales de loopback, resolvedor falso que responde direcciones internas, conexión fijada, límite de redirecciones, límite de tamaño, tiempo límite, validación Zod |
| MP-SEC-5.3 definición de terminado | Scripts de setup, demo, los tres README con "Por qué ocurre la falla", "Cómo prevenirla" y "Qué no funciona como corrección", y esta página en los tres idiomas |

## Cómo ejecutarlo

```sh
cd projects/security/ssrf-lab
./setup-unix-ssrf-lab.sh              # verificación de tipos y pruebas, luego limpieza
docker compose run --rm demo          # paso a paso narrado
docker compose down -v --remove-orphans
```
