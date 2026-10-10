# Laboratorio de XSS y Content Security Policy (MP-SEC-2)

> English version: [docs/en/security/xss-csp-lab.md](../../en/security/xss-csp-lab.md) · Versão em português: [docs/pt/security/xss-csp-lab.md](../../pt/security/xss-csp-lab.md)

Miniproyecto: [`projects/security/xss-csp-lab`](../../../projects/security/xss-csp-lab/README.es.md). Temas del quiz: `xss`, `csp-security-headers`.

Este es un laboratorio defensivo. Se ejecuta solo en Docker, en una red interna sin puertos publicados, con datos falsos, y su entrada de demostración solo activa una marca en la página.

## El concepto

Un navegador recibe texto y lo interpreta, armando un árbol de elementos. Algunos elementos son código: un bloque `<script>`, o un atributo como `onerror="..."`. El cross-site scripting (XSS) ocurre cuando un texto proporcionado por una persona se interpreta como código en la página de otra persona. El código inyectado pasa a ejecutarse con todo lo que esa página puede hacer, en nombre de quien la tenga abierta.

La causa raíz es siempre la misma: **un dato se escribió en un lugar que se interpreta como código, sin codificarlo para ese lugar**.

## La falla, tres veces

```text
el visitante escribe:  <script>window.__labXssExecuted = true</script>

el servidor arma:      "<span>" + texto + "</span>"
el navegador interpreta: <span><script>...</script></span>   <- un elemento script, y se ejecuta
```

| Tipo | Ruta en el laboratorio | Cómo llega el texto | Quién comete el error |
| --- | --- | --- | --- |
| Almacenado | `POST /guestbook`, luego `GET /guestbook` | Guardado en el servidor y servido a todo visitante siguiente | Servidor: concatenación de cadenas en el HTML |
| Reflejado | `GET /search?q=...` | Dentro de la URL de un enlace, devuelto en la respuesta | Servidor: concatenación de cadenas en el HTML |
| Basado en DOM | `GET /welcome#...` | En el fragmento de la URL, que el navegador nunca envía al servidor | Script del navegador: `element.innerHTML = texto` |

La entrada basada en DOM es un `<img>` con un manejador `onerror` en línea, porque un elemento `<script>` insertado vía `innerHTML` nunca se ejecuta. Es un detalle útil: buscar la palabra `script` no encuentra nada en ella.

## La corrección, tres capas

**1. Codificación de salida (servidor).** `escapeHtml` cambia `&`, `<`, `>`, `"` y `'` por `&amp;`, `&lt;`, `&gt;`, `&quot;` y `&#39;` en el momento en que el texto se escribe en el HTML.

```text
el servidor arma:      "<span>" + escapeHtml(texto) + "</span>"
el navegador interpreta: <span>&lt;script&gt;...&lt;/script&gt;</span>   <- un nodo de texto
la pantalla muestra:   <script>window.__labXssExecuted = true</script>
```

Funciona porque el parser nunca encuentra un `<` que vino del visitante, así que el visitante no puede abrir una etiqueta ni cerrar un atributo. No se borra nada: el texto se muestra exactamente como se escribió. La codificación se aplica en la salida, y no al guardar, porque la codificación correcta depende del destino (texto HTML, un atributo, JSON), y eso solo se sabe al momento de escribir.

**2. API segura del DOM (navegador).** `element.textContent = texto` crea un nodo de texto y no activa el parser de HTML. Esa es la corrección del caso basado en DOM, donde el servidor no tiene nada que escapar.

**3. Content Security Policy (cabecera).** La app corregida envía, en toda respuesta:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
```

| Directiva | Efecto |
| --- | --- |
| `script-src 'self'` | Solo se ejecutan archivos de script del mismo origen. Sin `'unsafe-inline'`, los bloques `<script>` en línea y los manejadores de evento en línea se rechazan |
| `object-src 'none'` | Ningún plugin `<object>` o `<embed>` |
| `base-uri 'none'` | Ningún elemento `<base>`, que cambiaría adónde apuntan las direcciones relativas de los scripts |
| `default-src 'self'` | Todo lo que no está listado (imágenes, estilos, conexiones) solo del mismo origen |
| `form-action 'self'` | Los formularios solo envían al mismo origen |
| `frame-ancestors 'none'` | La página no puede ponerse en un frame de otro sitio |

Una política estricta tiene un precio: la propia aplicación no puede tener script en línea. Por eso las páginas corregidas cargan su script desde un archivo (`/static/fixed-dom-client.js`).

## La CSP es la segunda capa, no la corrección

La app vulnerable tiene una ruta más, `/csp-only/search`, que mantiene el error de codificación y añade solo la cabecera. La prueba de navegador observa en ella dos hechos a la vez:

- el elemento inyectado **está en la página** (el marcado fue inyectado);
- el código **no se ejecutó**, y el navegador disparó un evento `securitypolicyviolation`.

Es decir, la política redujo el daño de un error que sigue ahí. El marcado inyectado sin script aún puede mostrar contenido falso, la cabecera puede faltar o debilitarse por una sola directiva laxa, y los clientes antiguos o poco comunes pueden no aplicarla. Codifica primero, y guarda la CSP para el día en que se escape un error de codificación.

## Qué demuestran las pruebas

| Elemento | Cómo se verifica |
| --- | --- |
| MP-SEC-2.1 el XSS almacenado, reflejado y basado en DOM se demuestran dentro del laboratorio | `docker compose run --rm e2e`: el grupo "vulnerable app" de `tests/e2e/xss.e2e.ts` afirma que la marca fue activada por el código inyectado en cada uno de los tres escenarios |
| MP-SEC-2.2 las mismas pruebas no logran ejecutar script en la versión corregida | El mismo comando: el grupo "fixed app" ejecuta las mismas funciones de escenario y afirma que la marca no se activa, que no se inyectó ningún elemento, que el texto se muestra como se escribió y que el uso normal funciona |
| MP-SEC-2.2 CSP como segunda capa | El mismo comando: el grupo "vulnerable page with CSP only" afirma marcado inyectado, ninguna ejecución y una violación de política reportada |
| MP-SEC-2.3 causa y prevención documentadas | Esta página y los tres README del miniproyecto |
| Sin acceso al exterior | `docker compose run --rm ts-test`: `tests/network-isolation.test.ts` afirma que una solicitud a `example.com` falla. La red de compose es `internal: true` y no publica ningún puerto |

Las pruebas del lado del servidor (`tests/apps.test.ts`) comprueban lo mismo un paso antes: lo que el servidor escribe (marcado crudo o entidades) y qué cabeceras envía. El valor exacto de la política lo fija `tests/security-headers.test.ts`.

## Cómo ejecutarlo

```sh
cd projects/security/xss-csp-lab
./setup-unix-xss-csp-lab.sh          # pruebas unitarias y pruebas de navegador
docker compose run --rm demo         # comparación narrada
docker compose down -v --remove-orphans
```
