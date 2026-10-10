# ssrf-lab

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un laboratorio defensivo y local sobre la falsificación de solicitudes del lado del servidor (SSRF): cómo se puede engañar a un servidor para que llame a servicios internos. La misma funcionalidad pequeña de ElysiaJS (una "vista previa de enlace" que busca una URL dada por el usuario y devuelve parte de la página) existe dos veces: una versión que busca cualquier cosa, etiquetada como `vulnerable`, y una versión corregida con lista de permitidos de hosts, validación del esquema, validación de la dirección resuelta, redirecciones revalidadas salto a salto, un límite de tamaño y un tiempo límite. Un escenario corre contra ambas, con un servicio interno falso y un sitio público falso en redes internas de Docker.

Código: MP-SEC-5. Explicación completa: [docs/es/security/ssrf-lab.md](../../../docs/es/security/ssrf-lab.md).

> El código de `ts/src/vulnerable/` es vulnerable a propósito. Existe solo para estudiarse dentro de este laboratorio. Nunca lo copies ni lo importes desde otro proyecto.

## Temas del quiz que demuestra

- `security` / `ssrf-path-traversal-upload`: qué es el SSRF, por qué el problema es la posición del servidor en la red, listas de permitidos, validación de la dirección resuelta, redirecciones
- `security` / `owasp-threat-modelling`: el SSRF en el OWASP Top 10, fronteras de confianza ("interno" no es lo mismo que "confiable"), defensa en profundidad

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-ssrf-lab.sh        # Linux y macOS
./setup-windows-ssrf-lab.ps1    # Windows
```

El script construye la imagen, inicia los dos servicios falsos, ejecuta la verificación de tipos y las pruebas, y elimina los contenedores y las redes al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Imprime un recorrido narrado, en inglés, portugués y español (cada paso tiene una línea `EN:`, una `PT:` y una `ES:`): las cuatro URLs del escenario, las direcciones a las que resuelven los dos nombres de host y cómo las clasifica la corrección, el escenario contra la app vulnerable (el token falso se filtra, directamente y a través de una redirección), el mismo escenario contra la app corregida (los dos intentos se rechazan, las vistas previas normales funcionan) y la comprobación de la dirección que sigue rechazando cuando la lista de permitidos está mal configurada.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

| Archivo | Qué demuestra |
| --- | --- |
| `ts/tests/scenario.test.ts` | App vulnerable: el servicio interno se alcanza a través de la funcionalidad y su token falso aparece en la vista previa, directamente y a través de una URL pública que responde 302. App corregida: las mismas dos solicitudes responden 403, el servicio interno **no recibe ninguna solicitud** (las cuenta), y una vista previa normal y una redirección entre páginas públicas siguen funcionando. Un tercer bloque añade el nombre interno a la lista de permitidos por error y muestra que la comprobación de la dirección lo rechaza de todos modos |
| `ts/tests/fixed-safe-fetch.test.ts` | Una prueba por capa de la corrección: esquema, credenciales en la URL, lista de permitidos de host y puerto, literales de loopback, un nombre que resuelve a una dirección interna (resolvedor falso), varias direcciones con una interna, conexión a la dirección validada, límite de redirecciones, límite de tamaño, tiempo límite, y la validación Zod de la ruta |
| `ts/tests/address-classifier.test.ts` | Una tabla de direcciones IPv4 e IPv6 y la clase que recibe cada una: loopback, privada, link-local, no especificada, reservada, pública, incluidas las direcciones IPv4 envueltas en IPv6 |
| `ts/tests/network-isolation.test.ts` | Una solicitud desde dentro del contenedor a un host externo falla |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `docker-compose.yml` | Dos redes, ambas `internal: true`, y cuatro servicios: `internal-admin`, `public-site`, `ts-test`, `demo` |
| `ts/src/vulnerable/vulnerable-app.ts` | **Vulnerable a propósito**: `POST /preview` que llama a `fetch(url)` sin ninguna comprobación |
| `ts/src/fixed/fixed-app.ts` | La misma ruta con validación Zod y la política de fetch |
| `ts/src/fixed/fixed-safe-fetch.ts` | El fetch seguro: esquema, lista de permitidos, dirección resuelta, conexión fijada, redirecciones manuales, límites |
| `ts/src/fixed/fixed-address-classifier.ts` | Clasifica una dirección IPv4 o IPv6 (loopback, privada, link-local, etc.) |
| `ts/src/lab-services/internal-admin.ts` | Servicio interno falso con un token falso y sin inicio de sesión |
| `ts/src/lab-services/public-site.ts` | Sitio público falso: un artículo, redirecciones, un cuerpo enorme, una respuesta lenta |
| `ts/src/scenario.ts` | El único escenario que corre contra ambas apps, en proceso |
| `ts/src/demo.ts` | La demo narrada |
| `ts/src/config.ts`, `ts/src/preview.ts` | Entorno validado, tipos compartidos, cómo se recorta una vista previa de una página |

Ruta de ambas apps: `POST /preview` con `{ "url": "<URL>" }`. La respuesta trae el título y los primeros 200 caracteres de la página.

### La red del laboratorio

| Red | Subred | Quién está allí | Rol |
| --- | --- | --- | --- |
| `lab` | privada, elegida por Docker (RFC 1918) | `internal-admin`, `ts-test`, `demo` | La red de la empresa |
| `lab-public` | `203.0.113.0/24` (TEST-NET-3) | `public-site`, `ts-test`, `demo` | Sustituto de internet |

Toda dirección de contenedor es privada por defecto, así que "rechazar direcciones privadas" rechazaría también el sitio público falso. En lugar de debilitar la regla para el laboratorio, la red "pública" usa un rango de documentación (RFC 5737) que no es privado y nunca se enruta en la internet real. La regla de direcciones del código es la real, sin cambios. Ambas redes son `internal: true`: el rango es solo una etiqueta, y nada sale de la máquina.

## Por qué ocurre la falla

El código vulnerable es una línea:

```ts
const response = await fetch(url); // `url` vino del usuario
```

La solicitud no sale del navegador del usuario. Sale del **servidor**, y lleva el lugar del servidor en la red. Un servidor suele alcanzar cosas que el usuario no puede: otros servicios de la empresa sin inicio de sesión "porque son internos", un panel de administración enlazado a `localhost`, el servicio de metadatos de un proveedor de nube en una dirección link-local. Esos servicios confían en la red: se asume que quien puede conectarse es un colega. El SSRF convierte al servidor en el mensajero del usuario dentro de esa red, así que la confianza se le presta a un extraño.

En el laboratorio, `internal-admin` responde un token falso a cualquiera que pueda conectarse, y solo la app puede conectarse. El escenario de `ts/src/scenario.ts` usa dos entradas de demostración:

| Entrada | Qué ocurre en la app vulnerable |
| --- | --- |
| `http://internal-admin:8080/secret` | El servidor busca el servicio interno y devuelve los primeros caracteres de la respuesta, que contienen el token falso |
| `http://public-site:8080/redirect-to-internal` | La URL nombra solo el sitio público. Ese sitio responde `302` con `Location: http://internal-admin:8080/secret`, `fetch` lo sigue por defecto, y el token se filtra de la misma manera |

Mostrar la respuesta ni siquiera es necesario para causar daño. Una solicitud que llega a una ruta interna puede cambiar el estado solo por hacerse (SSRF ciego), y puede usarse para averiguar qué hosts y puertos internos existen. Por eso las pruebas comprueban que la app corregida **no hace ninguna solicitud**, no solo que no muestra ningún token.

Otros dos errores lo empeoran: no hay límite para el tamaño de la respuesta ni tiempo límite, así que una sola solicitud puede retener una conexión y memoria del servidor durante el tiempo que el lado remoto quiera.

## Cómo prevenirla

La versión corregida (`ts/src/fixed/fixed-safe-fetch.ts`) pasa cada salto de la solicitud por la misma compuerta.

1. **Pregunta si la funcionalidad necesita URLs arbitrarias.** El control más fuerte es una **lista de permitidos de nombres de host**: la funcionalidad busca solo los sitios para los que fue construida. En el laboratorio esa lista tiene una entrada, el sitio público falso. La comparación es exacta y se hace sobre el nombre de host que devuelve el parser de URL, nunca con `includes` ni `endsWith` sobre el texto crudo.
2. **Acepta solo `http` y `https`.** Un `fetch` del lado del servidor entiende más que la web. En Bun, por ejemplo, una URL `file:` lee el disco del servidor.
3. **Valida la dirección resuelta, no el nombre.** El nombre de host se resuelve con `node:dns` y **todas** las direcciones devueltas deben ser públicas. Se rechazan los rangos loopback (`127.0.0.0/8`, `::1`), privados (`10/8`, `172.16/12`, `192.168/16`, `fc00::/7`), link-local (`169.254/16`, `fe80::/10`), no especificados (`0.0.0.0`, `::`) y reservados, en IPv4 e IPv6, incluidas las direcciones IPv4 envueltas en IPv6 (`::ffff:a.b.c.d`). La regla es "solo pasa lo público", no una lista de lo que está prohibido.
4. **Conéctate a la dirección que se validó.** Mira la sección sobre DNS más abajo.
5. **Sigue las redirecciones a mano.** Con `redirect: "manual"`, una respuesta `3xx` vuelve al código en lugar de seguirse. Cada `Location` es una URL nueva elegida por el servidor remoto, así que pasa de nuevo por los pasos 1 a 4, hasta un número pequeño de saltos.
6. **Limita tamaño y tiempo.** Un único plazo cubre toda la operación (todos los saltos y el cuerpo), y el cuerpo se cuenta mientras se lee y se descarta cuando cruza el límite. `Content-Length` es solo una pista del otro lado.
7. **Valida la entrada con Zod** (una URL de como máximo 2048 caracteres). Esto responde "¿es una URL?", no "¿es seguro buscarla?".
8. **Responde con poco.** Un rechazo dice qué regla rechazó, nunca lo que respondió la red interna. Los errores detallados ("conexión rechazada", "tiempo agotado") le dirían al usuario qué hosts internos existen.

### El intervalo entre la comprobación y el uso del DNS

El paso 3 resuelve el nombre y comprueba la dirección. Si el código entonces diera el **nombre** a `fetch`, el cliente HTTP lo resolvería una segunda vez. Nada garantiza que la segunda respuesta sea igual a la primera: un servidor DNS controlado por otra persona puede responder una dirección pública a la comprobación y una interna, un momento después, a la conexión. Esto se conoce como DNS rebinding, y es una falla clásica de tiempo de comprobación/tiempo de uso (TOCTOU): lo que se comprobó no es lo que se usó.

La respuesta habitual es **usar lo que se comprobó**: resolver una vez, validar y conectarse a esa dirección. La versión corregida hace esto: reemplaza el host de la URL por la dirección validada y envía el nombre original en la cabecera `Host` (y, para https, como nombre de servidor de TLS, de modo que el certificado se siga verificando contra el nombre). `ts/tests/fixed-safe-fetch.test.ts` lo demuestra con un nombre que existe solo en un resolvedor falso: el fetch funciona únicamente porque la conexión va a la dirección que devolvió el resolvedor, y al resolvedor se le pregunta exactamente una vez por salto. El laboratorio no tiene servicio HTTPS, así que la rama de https no está cubierta por pruebas aquí.

### Filtrado de salida a nivel de red (defensa en profundidad)

Todo lo anterior vive en el código de la aplicación, y el código tiene errores: otra funcionalidad puede buscar una URL y olvidar la función segura, una biblioteca puede buscar por su cuenta (procesamiento de imágenes, renderizado de PDF, webhooks, parsers de XML). La red debería imponer la misma regla de forma independiente:

- Ejecuta el componente que busca URLs proporcionadas por usuarios en su propio segmento de red, con reglas de firewall que le permitan salir a internet pero **no** a los rangos internos, o envía su tráfico a través de un proxy de salida que aplique la lista de permitidos.
- No dejes que los servicios internos confíen en la red. `internal-admin` no tiene inicio de sesión "porque es interno"; con autenticación entre servicios, alcanzarlo no sería suficiente.
- En la nube, usa la versión endurecida del servicio de metadatos (la que exige un token de sesión y una cabecera especial), y da a la instancia solo los permisos que necesita.

Este laboratorio muestra la idea en su propio archivo compose: `public-site` no está conectado a la red `lab`, así que no puede alcanzar `internal-admin` sin importar cómo esté programado. Solo la app puede, que es exactamente por qué la app es el objetivo.

## Qué no funciona como corrección

- **Una lista de bloqueo de cadenas como `localhost` o `127.0.0.1`.** La misma dirección tiene muchas grafías: un único número decimal, partes hexadecimales u octales, las formas cortas de IPv4, una dirección IPv4 envuelta en IPv6, todo el rango `127.0.0.0/8`, `0.0.0.0`. Y cualquier nombre DNS puede simplemente tener un registro que apunte a una dirección interna, así que el texto de la URL no contiene nada sospechoso. Comparar texto es intentar adivinar lo que hará la pila de red; clasifica en su lugar la dirección numérica resuelta.
- **Validar solo la primera URL.** Una URL perfectamente pública puede responder con una redirección a una interna, como hace `/redirect-to-internal` en el laboratorio. Si el cliente HTTP sigue las redirecciones por sí mismo, la comprobación se hizo sobre una URL que no es la que finalmente se busca.
- **Validar el nombre y luego dejar que el cliente lo resuelva de nuevo.** Ese es el intervalo TOCTOU descrito arriba.
- **Comprobar con una expresión regular o `startsWith` sobre la URL cruda.** Las URL tienen información de usuario, puertos, fragmentos y codificaciones; `http://allowed.test@other.test/` empieza con el nombre permitido y apunta a otro lugar. Analiza con `new URL()` y compara el host analizado de forma exacta.
- **Una lista de permitidos de nombres por sí sola, cuando la lista es amplia.** Un comodín como `*.example.test` confía en todo registro que cualquiera pueda crear bajo ese dominio. Por eso la comprobación de la dirección permanece incluso con una lista de permitidos: el tercer bloque de `scenario.test.ts` muestra cómo atrapa una entrada equivocada.
- **No mostrar la respuesta al usuario.** La solicitud se hizo de todos modos. El SSRF ciego puede cambiar el estado y mapear la red interna mediante diferencias de tiempo y de errores.
- **Confiar en `Content-Length` para el límite de tamaño.** La cabecera la escribe el lado remoto y puede faltar o ser falsa; cuenta los bytes.
- **Solo el filtrado de red.** Normalmente no puede distinguir `http://public-site/` de una cadena de redirecciones dentro de hosts permitidos, y no cubre los servicios en el mismo host (`localhost`). Las comprobaciones de la aplicación y las de la red cubren los huecos de la otra.

## Alcance de seguridad del laboratorio

- Todo se ejecuta de forma local en Docker. Ambas redes de compose son `internal: true`, así que ningún contenedor alcanza internet, y una prueba lo demuestra. `203.0.113.0/24` es un rango de documentación que nunca se enruta en la internet real.
- **No se publica ningún puerto en el host.** Las apps nunca se inician como servidores: las pruebas y la demo las llaman en proceso. Los únicos listeners son los dos servicios falsos, alcanzables solo desde dentro de las redes del laboratorio.
- Las URLs del escenario se arman a partir de la configuración del laboratorio y nombran solo `public-site` e `internal-admin`. Nada aquí apunta a un host fuera del laboratorio.
- Todos los datos son falsos: el "secreto" es `FAKE-INTERNAL-TOKEN-not-real`.
- Aquí no hay escáner, ni lista de payloads, ni técnica de evasión. La sección sobre listas de bloqueo explica por qué existen las grafías; no es una lista para probar.
- El paquete es `private` y el archivo vulnerable está etiquetado como tal en su nombre y en sus primeras líneas.

## Versiones

| Componente | Versión |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| `@types/bun` | 1.4.2 |
