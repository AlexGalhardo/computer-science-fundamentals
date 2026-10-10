# csrf-lab

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un navegador adjunta cookies a una solicitud por adónde **va**, no por la página que la pidió. Así que una página de otro sitio puede hacer que un navegador con sesión iniciada envíe una solicitud a tu app, y la app ve una sesión válida. Esto es la falsificación de solicitudes entre sitios (CSRF). Este laboratorio lo muestra con navegadores reales: una app falsa de "perfil" cuyo correo cambia un segundo origen local, y luego el mismo intento rechazado por un token anti-CSRF, una cookie `SameSite` explícita y "los cambios de estado solo mediante POST".

Código: MP-SEC-3. Explicación completa: [docs/es/security/csrf-lab.md](../../../docs/es/security/csrf-lab.md).

> **Laboratorio defensivo y educativo.** `ts/src/vulnerable/` es vulnerable a propósito y `ts/src/other-origin/` es la página falsificadora del laboratorio. Ambos existen solo para hacer observable la falla aquí. Nunca los copies ni los apuntes a nada fuera de este archivo compose.

## Temas del quiz que demuestra

- `security` / `csrf-samesite`: por qué la cookie viaja en una solicitud falsificada, el token sincronizador, `SameSite=Strict` y `Lax`, por qué GET no debe cambiar el estado
- `security` / `sessions-cookies`: la cookie de sesión como única prueba de identidad, atributos de la cookie (`HttpOnly`, `SameSite`, `Secure`), valores por defecto de los navegadores cuando falta un atributo

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-csrf-lab.sh        # Linux y macOS
./setup-windows-csrf-lab.ps1    # Windows
```

El script construye dos imágenes, ejecuta las pruebas unitarias y las pruebas con navegador, y elimina los contenedores al final. La primera construcción descarga la imagen de Playwright (con los navegadores incluidos), que es grande.

## Estructura

| Servicio | Host dentro del laboratorio | Qué es |
| --- | --- | --- |
| `app-vulnerable` | `http://app-vulnerable:3000` | Cookie sin `SameSite`, sin token, cambio de correo por GET y POST |
| `app-fixed` | `http://app-fixed:3000` | La corrección: token + `SameSite=Strict` + solo POST |
| `app-token-only` | `http://app-token-only:3000` | El código corregido con `SameSite` desactivado |
| `app-samesite-only` | `http://app-samesite-only:3000` | El código corregido con el token desactivado |
| `other-origin` | `http://other-origin:3000` | La página falsificadora del laboratorio. Solo puede apuntar a los cuatro hosts de arriba |
| `ts-test` | | Verificación de tipos y pruebas unitarias (Bun) |
| `e2e` | | Playwright con Chromium, Firefox y WebKit |
| `demo` | | El recorrido por línea de comandos |

Cada nombre de servicio es un host distinto, y para un navegador un host distinto sin dominio padre en común es un **sitio** distinto. Eso es lo que hace que las solicitudes desde `other-origin` sean cross-site.

| Ruta | Qué es |
| --- | --- |
| `ts/src/vulnerable/vulnerable-app.ts` | La app vulnerable, con las tres fallas marcadas en comentarios |
| `ts/src/fixed/fixed-app.ts` | La app corregida, con las tres correcciones marcadas en comentarios |
| `ts/src/fixed/fixed-csrf-token.ts` | Generación del token y verificación en tiempo constante |
| `ts/src/other-origin/forging-page.ts` | La página falsificadora: un enlace al que se hace clic solo (GET) y un formulario enviado solo (POST) |
| `ts/src/shared/` | Datos falsos, utilidades de cookies, la página HTML, el estado en memoria y las rutas de instrumentación del laboratorio |
| `ts/src/demo.ts` | La demo |
| `ts/tests/` | Pruebas unitarias (`bun test`) |
| `ts/e2e/` | Pruebas con navegador (Playwright) |

Las apps exponen `GET /lab/observations` y `POST /lab/reset`. Son instrumentación del laboratorio, para que las pruebas puedan ver lo que recibió el servidor (¿estaba la cookie?) y repetir el experimento. Una aplicación real no tiene esas rutas.

## Pruebas

```sh
docker compose run --rm ts-test    # verificación de tipos + pruebas unitarias
docker compose run --rm e2e        # pruebas con navegador
docker compose down -v --remove-orphans
```

Las pruebas con navegador corren un escenario contra cada versión de la app: el usuario inicia sesión por el formulario de la app, la misma pestaña visita `other-origin`, y la página falsificadora hace volver al navegador a la app.

| Versión | Falsificación por GET (enlace) | Falsificación por POST (formulario) | Formulario legítimo |
| --- | --- | --- | --- |
| `app-vulnerable` | **correo cambiado** en los tres navegadores | **correo cambiado** en Chromium y Firefox. WebKit no envía la cookie | funciona |
| `app-token-only` | la cookie llega, `405` | la cookie llega en Chromium y Firefox, `403` (sin token) | funciona |
| `app-samesite-only` | no llega ninguna cookie, `405` | no llega ninguna cookie, `401` | funciona |
| `app-fixed` | no llega ninguna cookie, `405` | no llega ninguna cookie, `401` | funciona |

Las pruebas unitarias cubren el lado del servidor sin navegador: generación y verificación del token, los atributos de la cookie de cada versión, las mismas solicitudes falsificadas con la cookie adjuntada a mano, la lista de permitidos de la página falsificadora, y una comprobación de que el contenedor no puede alcanzar `http://example.com` (la red es interna).

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Un recorrido narrado con `fetch`: la cabecera `Set-Cookie` de cada versión, un POST falsificado y un GET falsificado contra la app vulnerable (ambos cambian el correo), y las mismas solicitudes contra la app corregida (`403` y `405`), seguidos del formulario legítimo con su token. `fetch` no es un navegador, así que la demo adjunta la cookie a mano y muestra solo el lado del servidor. El lado del navegador es lo que muestran las pruebas `e2e`.

## Por qué ocurre la falla

1. **Las cookies se envían automáticamente.** Tras el inicio de sesión el navegador guarda la cookie de sesión y la adjunta a cada solicitud a ese host. No importa la página que inició la solicitud.
2. **Otros sitios pueden iniciar solicitudes a tu host.** Un enlace, una redirección y un formulario HTML pueden apuntar a otro sitio. Así ha funcionado siempre la web. El otro sitio no puede leer la respuesta (la política del mismo origen lo prohíbe), pero no lo necesita: el daño es la propia solicitud.
3. **La app trata la cookie como prueba de intención.** La cookie prueba "este navegador tiene la sesión iniciada". La app vulnerable la lee como "el usuario quiere este cambio".
4. **Un GET cambia el estado.** Seguir un enlace es un GET, y los navegadores tratan GET como seguro. Incluso el valor por defecto `SameSite=Lax` envía cookies en un enlace seguido desde otro sitio.

### Qué hacen los navegadores cuando falta `SameSite`

Medido en este laboratorio con los navegadores de `mcr.microsoft.com/playwright:v1.63.0-noble`:

| Navegador | GET de nivel superior entre sitios (enlace) | POST de nivel superior entre sitios (formulario) |
| --- | --- | --- |
| Chromium 153 | cookie enviada | cookie enviada mientras la cookie tiene menos de 2 minutos ("Lax + POST"), no enviada después |
| Firefox 155 | cookie enviada | cookie enviada |
| WebKit 26.6 | cookie enviada | cookie **no** enviada |

La celda de Chromium "no enviada después" se midió una vez a mano, con una cookie de 130 segundos. Las pruebas automatizadas siempre usan una cookie recién creada, así que siguen siendo rápidas y deterministas.

Tres navegadores, tres comportamientos, y cambian entre versiones. La lección es: **no dependas del valor por defecto del navegador. Define `SameSite` explícitamente y usa un token.**

Dos hechos más sobre la configuración de este laboratorio:

- `SameSite=None` (enviar siempre) requiere `Secure`, y un navegador rechaza una cookie `Secure` que venga de HTTP plano. El laboratorio es HTTP plano dentro de Docker, así que la app vulnerable simplemente omite el atributo, que además es el error real más común.
- Los navegadores envían la cabecera `Sec-Fetch-Site` solo a orígenes HTTPS (o `localhost`), así que siempre está vacía en las observaciones del laboratorio. En un sitio real con HTTPS es una señal más que un servidor puede comprobar.

## Cómo prevenirla

1. **Token anti-CSRF (token sincronizador).** El servidor crea un secreto aleatorio con la sesión, lo guarda en el servidor y lo escribe en sus propios formularios como un campo oculto. Toda solicitud que cambie el estado debe traerlo de vuelta. Otro sitio puede enviar un formulario pero no puede leer tu página, así que no puede conocer el valor. Aquí: 32 bytes aleatorios, validados con Zod, comparados en tiempo constante, y válidos solo para la sesión con la que se creó.
2. **`SameSite` definido explícitamente en la cookie de sesión.** `Strict` nunca envía la cookie en una solicitud iniciada por otro sitio. `Lax` la envía solo en navegaciones GET de nivel superior, lo cual es un buen valor por defecto cuando los enlaces de otros sitios deben aterrizar en una página con sesión iniciada.
3. **Los cambios de estado solo mediante POST** (o PUT, PATCH, DELETE). GET sigue siendo de solo lectura. La app corregida responde `405` a `GET /email/change`.

La app corregida usa las tres. El token es la defensa principal, porque el propio servidor lo impone. `SameSite` es defensa en profundidad, porque lo impone el navegador. En producción, sirve además por HTTPS y marca la cookie como `Secure` (un prefijo de nombre `__Host-` hace que el navegador lo exija).

## Qué no funciona como corrección

- **Depender del valor por defecto del navegador para `SameSite`.** Mira la tabla de arriba.
- **Solo `SameSite`.** Lo impone el navegador, no tu servidor, y "sitio" es más amplio que "origen": `evil.example.com` y `app.example.com` son el mismo sitio, así que un subdominio comprometido o controlado por un usuario lo esquiva. Una prueba unitaria aquí muestra que la app `samesite-only` acepta el cambio cuando la cookie sí llega.
- **`SameSite=Lax` con un GET que cambia el estado.** `Lax` envía la cookie en los enlaces seguidos por diseño.
- **Aceptar solo POST, sin token.** Un formulario oculto enviado solo envía un POST. La falsificación por POST del laboratorio es exactamente esto.
- **Una cookie secreta.** `HttpOnly` o un id de sesión largo y aleatorio no ayudan: el atacante nunca lee la cookie, el navegador la envía por él.
- **Comprobar solo el `Referer`.** Puede estar ausente por motivos de privacidad, así que la comprobación termina bloqueando a usuarios reales o permitiendo valores vacíos.
- **Un token que no está atado a la sesión**, o que es el mismo para todos los usuarios. El atacante obtiene uno válido desde su propia cuenta.
- **Un token en la URL de un GET.** Las URL se filtran por el historial, los registros y la cabecera `Referer`.
- **CORS.** CORS controla quién puede *leer* una respuesta de otro origen. Un POST de formulario simple se envía sin preguntar.

## Versiones

| Componente | Versión |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| Playwright | `mcr.microsoft.com/playwright:v1.63.0-noble`, `@playwright/test` 1.63.0 |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |

## Alcance de seguridad del laboratorio

- Corre solo de forma local, en Docker, en una red `internal: true`: ningún contenedor alcanza internet (una prueba lo demuestra) y no se publica ningún puerto en el host.
- La página falsificadora toma su objetivo de una lista cerrada de los nombres de servicio de este mismo archivo compose, y envía un único correo falso fijo. No se puede apuntar a ningún otro lugar.
- Todos los datos son falsos: usuario `alice-fake`, contraseña `lab-fake-password`, direcciones bajo el dominio reservado `.example`.
- El código vulnerable está etiquetado como tal en el nombre de su archivo y en su comentario de cabecera, el paquete es `private`, y nada de aquí está pensado para importarse desde otros proyectos.
