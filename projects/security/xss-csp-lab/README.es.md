# xss-csp-lab

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Un laboratorio defensivo sobre cross-site scripting (XSS). Tres páginas pequeñas (un libro de visitas, una búsqueda y una página de bienvenida) se sirven dos veces con ElysiaJS: una con los errores clásicos, otra corregida. Un Chromium real, controlado por Playwright dentro de Docker, abre ambas y muestra que el mismo texto se ejecuta como código en la versión vulnerable y se muestra como texto plano en la corregida. La corrección tiene tres partes: escape de HTML en el servidor, `textContent` en lugar de `innerHTML` en el navegador, y una cabecera Content Security Policy (CSP) como segunda capa.

Código: MP-SEC-2. Explicación completa: [docs/es/security/xss-csp-lab.md](../../../docs/es/security/xss-csp-lab.md).

> **Vulnerable a propósito.** Los archivos de `ts/src/vulnerable/` contienen fallas reales. Existen para leerse y probarse dentro de este laboratorio. Nunca los copies, los importes ni los sirvas en ningún otro lugar.

## Temas del quiz que demuestra

- `security` / `xss`: XSS almacenado, reflejado y basado en DOM, codificación de salida, APIs seguras del DOM
- `security` / `csp-security-headers`: `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, CSP como defensa en profundidad, `X-Content-Type-Options: nosniff`

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-xss-csp-lab.sh        # Linux y macOS
./setup-windows-xss-csp-lab.ps1    # Windows
```

El script construye las imágenes, ejecuta las pruebas unitarias (`ts-test`) y las pruebas de navegador (`e2e`), y elimina los contenedores al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

La demo envía la misma entrada a ambas apps e imprime, lado a lado, la línea de HTML que responde cada una y su cabecera `Content-Security-Policy`: marcado `<script>` crudo en la app vulnerable, `&lt;script&gt;` en la corregida. También imprime la línea de código de navegador que difiere en el caso basado en DOM (`innerHTML` frente a `textContent`). La demo no tiene navegador, así que muestra lo que envía el servidor. Lo que hace un navegador con ello lo muestran las pruebas `e2e`.

## Pruebas

```sh
docker compose run --rm ts-test    # verificación de tipos + pruebas unitarias (bun test)
docker compose run --rm e2e        # Playwright, solo Chromium
docker compose down -v --remove-orphans
```

Las mismas funciones de escenario corren contra ambas apps (`ts/tests/e2e/scenarios.ts` en el navegador, `ts/tests/apps.test.ts` del lado del servidor).

| Qué se demuestra | Dónde |
| --- | --- |
| El XSS almacenado, reflejado y basado en DOM ejecutan cada uno el código inyectado en la app vulnerable | `tests/e2e/xss.e2e.ts`, primer grupo |
| Los mismos tres intentos no se ejecutan en la app corregida, el texto se muestra como se escribió y no se inyecta ningún marcado | `tests/e2e/xss.e2e.ts`, segundo grupo |
| El uso normal sigue funcionando en la app corregida, incluido el texto con `&` y `<`, y el script de la página cargado desde un archivo se ejecuta bajo la política | `tests/e2e/xss.e2e.ts`, "normal use still works" |
| CSP como segunda capa: en una página que conserva el error de codificación, el marcado se inyecta pero el navegador se niega a ejecutarlo y reporta una violación de política | `tests/e2e/xss.e2e.ts`, tercer grupo |
| La función de escape, el valor exacto de la cabecera CSP, la validación Zod | `tests/escape-html.test.ts`, `tests/security-headers.test.ts`, `tests/apps.test.ts` |
| Los contenedores no pueden alcanzar internet | `tests/network-isolation.test.ts` |

"El código se ejecutó" se observa sin dañar nada: la entrada de demostración solo establece `window.__labXssExecuted = true` en la página, y la prueba lee esa marca.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/vulnerable/vulnerable-app.ts` | **Vulnerable.** Las tres páginas con concatenación de cadenas cruda, más la ruta `/csp-only/search` (error de codificación conservado, cabecera CSP añadida) |
| `ts/src/vulnerable/vulnerable-dom-client.js` | **Vulnerable.** Script de navegador que escribe `location.hash` con `innerHTML` |
| `ts/src/fixed/fixed-app.ts` | Las páginas corregidas: escape en la salida, validación Zod, cabeceras de seguridad en cada respuesta |
| `ts/src/fixed/fixed-escape-html.ts` | La función de escape de HTML |
| `ts/src/fixed/fixed-dom-client.js` | Script de navegador que escribe `location.hash` con `textContent` |
| `ts/src/security-headers.ts` | La Content Security Policy, directiva por directiva |
| `ts/src/lab-inputs.ts` | Las únicas entradas que usa el laboratorio |
| `ts/src/lab-targets.ts` | Rechaza cualquier objetivo que no sea un host del laboratorio |
| `ts/src/demo-cli.ts` | La demo |
| `ts/tests/` | Pruebas unitarias (`*.test.ts`) y pruebas de navegador (`e2e/`) |

Rutas de ambas apps: `GET /guestbook`, `POST /guestbook`, `GET /search?q=`, `GET /welcome#name`. La app vulnerable también tiene `GET /csp-only/search?q=`.

## Por qué ocurre la falla

Una página web es texto que el navegador analiza en elementos. Cuando un programa arma ese texto pegando su propio HTML con texto escrito por un visitante, el navegador no puede distinguir los dos: `<script>` escrito en un formulario está hecho de los mismos caracteres que `<script>` escrito por el desarrollador. Los **datos** del visitante cruzan al **código**.

| Tipo | De dónde viene el texto | Dónde está el error |
| --- | --- | --- |
| Almacenado | Un mensaje del libro de visitas guardado en el servidor y mostrado a todo visitante posterior | El servidor lo concatena en el HTML |
| Reflejado | El parámetro `q` de la URL, devuelto en la misma respuesta. Viaja dentro de un enlace | El servidor lo concatena en el HTML |
| Basado en DOM | El fragmento de la URL (después de `#`), que nunca se envía al servidor | El script del navegador lo asigna a `innerHTML`, que lo analiza como HTML |

En una aplicación real, el código que se ejecuta en la página actúa con la identidad de la víctima con sesión iniciada. En este laboratorio solo activa una marca.

## Cómo prevenirla

1. **Codifica en la salida, para el lugar al que va el texto.** `escapeHtml` reemplaza `&`, `<`, `>`, `"` y `'` por entidades en el momento en que el texto se escribe en el HTML. El navegador muestra la entidad como el carácter original y nunca la trata como marcado, así que la frontera entre datos y código se mantiene. El texto almacenado se conserva como se escribió: `Tom & Jerry <3` se sigue mostrando exactamente así. Por qué funciona: el parser nunca ve un `<` que vino del visitante. En proyectos reales, un motor de plantillas que escapa por defecto (JSX, por ejemplo) lo hace por ti.
2. **Usa APIs del DOM que reciben texto.** `element.textContent = value` crea un nodo de texto y nunca invoca el parser de HTML, así que no hay nada en lo que inyectar. Esta es la única corrección para el caso basado en DOM, porque el servidor nunca ve el fragmento.
3. **Añade una Content Security Policy como segunda capa.** La app corregida envía `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`. Con `script-src 'self'` y sin `'unsafe-inline'`, el navegador ejecuta solo archivos de script del mismo servidor: los bloques `<script>` en línea y los manejadores en línea como `onerror="..."` se rechazan. Para que eso sea posible, las páginas corregidas no tienen ningún script en línea: su script es un archivo. `object-src 'none'` deshabilita los plugins y `base-uri 'none'` prohíbe un elemento `<base>` que redirigiría las direcciones relativas de los scripts.
4. **Valida la entrada** (Zod aquí) en forma y tamaño. Esto limita lo que se acepta, y no es lo que detiene el XSS: la app corregida acepta el texto `<script>` como un mensaje legítimo y lo renderiza de forma inofensiva.

## Qué no funciona como corrección

- **Solo CSP.** La ruta `/csp-only/search` prueba las dos mitades: el script no se ejecuta, y el marcado aun así se inyecta. El marcado inyectado sin script todavía puede mostrar contenido o formularios falsos, un navegador o un proxy pueden descartar la cabecera, y una sola directiva laxa (`'unsafe-inline'`, un comodín) trae la falla de vuelta. La CSP es defensa en profundidad, nunca un reemplazo de la codificación.
- **Quitar o bloquear palabras "peligrosas"** como `<script>`. La entrada basada en DOM de este laboratorio no contiene ningún `<script>`, lo que muestra que una lista así siempre es incompleta, y además rompe el texto honesto.
- **Escapar cuando el texto se guarda** en lugar de cuando se escribe. La codificación correcta depende de dónde termina el texto (HTML, un atributo, JSON, un correo), lo cual solo se sabe en el momento de la salida. Las entidades almacenadas además se escapan dos veces después.
- **Validación en el navegador** (`maxlength`, `required`, comprobaciones de JavaScript). Las solicitudes pueden enviarse sin el formulario.
- **Escape en el servidor para una falla basada en DOM.** El fragmento nunca llega al servidor.
- **Confiar en las cookies `HttpOnly`.** Ocultan la cookie a los scripts, pero el código inyectado aún puede actuar como el usuario dentro de la página.

## Alcance de seguridad del laboratorio

- Todo se ejecuta en Docker en una red de compose con `internal: true`. Ningún contenedor puede alcanzar internet, y una prueba lo demuestra (una solicitud al dominio de documentación `example.com` debe fallar).
- No se publica ningún puerto en el host. La app vulnerable solo es alcanzable por los otros contenedores de este archivo compose.
- El laboratorio usa dos entradas de demostración fijas, y solo activan una marca en la página. La dirección de la imagen en una de ellas es una ruta del propio servidor del laboratorio. La demo y las pruebas de navegador rechazan cualquier objetivo que no sea un host del laboratorio.
- Todos los nombres y datos son falsos (`alice-fake`, `bob-fake`). No hay credenciales.

## Versiones

| Componente | Versión |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| Playwright | `mcr.microsoft.com/playwright:v1.63.0-noble`, `@playwright/test` 1.63.0 |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
