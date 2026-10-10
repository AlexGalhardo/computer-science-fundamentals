# Laboratorio de CSRF (MP-SEC-3)

> English version: [docs/en/security/csrf-lab.md](../../en/security/csrf-lab.md) · Versão em português: [docs/pt/security/csrf-lab.md](../../pt/security/csrf-lab.md)

Miniproyecto: [`projects/security/csrf-lab`](../../../projects/security/csrf-lab/README.es.md). Temas del quiz: `csrf-samesite`, `sessions-cookies`.

Laboratorio defensivo y educativo. Se ejecuta solo en Docker, en una red interna sin puertos publicados, con datos falsos. La aplicación vulnerable y la página falsificadora existen únicamente para hacer observable la falla allí.

## El concepto

Una cookie de sesión responde a una pregunta: "¿qué navegador con sesión iniciada es este?". El navegador la adjunta a toda solicitud al host que la definió, sea cual sea la página que inició la solicitud.

```text
1. usuario -> app           POST /login                 la app define la cookie de sesión
2. usuario -> otro sitio    GET  /alguna-pagina         (mismo navegador, otra pestaña o un enlace)
3. la página del otro sitio hace que el navegador envíe:
   navegador -> app         POST /email/change          Cookie: session=...   <- adjuntada por el navegador
4. app: "sesión válida"     -> cambia el correo
```

El otro sitio nunca ve la cookie y no puede leer la respuesta de la app (política del mismo origen). Ni siquiera lo necesita. La solicitud llega con una sesión válida, y la app no tiene cómo distinguirla de una solicitud que el usuario hizo a propósito. Eso es la falsificación de solicitudes entre sitios (CSRF).

**Sitio y origen.** Un origen es esquema + host + puerto. Un sitio es más amplio: esquema + dominio registrable (`app.example.com` y `blog.example.com` son orígenes distintos del mismo sitio). Las cookies `SameSite` usan el sitio. En el laboratorio cada nombre de contenedor (`app-vulnerable`, `other-origin`) es un host de una sola etiqueta sin padre en común, así que cada uno es un sitio distinto.

## La falla

`app-vulnerable` (`ts/src/vulnerable/vulnerable-app.ts`) tiene tres fallas, cada una marcada en el código:

1. La cookie de sesión es lo único que pide el cambio de correo.
2. La cookie no tiene el atributo `SameSite`, así que cada navegador aplica su valor por defecto.
3. `GET /email/change?email=...` modifica el estado.

`other-origin` (`ts/src/other-origin/forging-page.ts`) es la página falsificadora del laboratorio. Tiene dos páginas, y las dos solo pueden alcanzar los hosts de app del propio laboratorio (una lista cerrada validada con Zod):

- `/forge/get`: un enlace a la app que la página pulsa sola. Una navegación GET entre sitios de nivel superior.
- `/forge/post`: un formulario oculto cuyo `action` es la app, enviado por script. Un POST entre sitios de nivel superior.

### Valores por defecto de los navegadores para una cookie sin `SameSite`

Medido con los navegadores de la imagen fijada de Playwright (`v1.63.0-noble`):

| Navegador | GET entre sitios (enlace) | POST entre sitios (formulario) |
| --- | --- | --- |
| Chromium 153 | enviado | enviado mientras la cookie tiene menos de 2 minutos ("Lax + POST"), no enviado después |
| Firefox 155 | enviado | enviado |
| WebKit 26.6 | enviado | no enviado |

Entonces la falsificación por GET funciona en los tres, y la falsificación por POST funciona en Chromium y Firefox. En WebKit la app vulnerable sobrevive al POST solo por el valor por defecto de ese navegador, y cae con el GET en el mismo navegador. Los valores por defecto difieren y cambian entre versiones, y por eso una app no puede depender de ellos.

`SameSite=None` haría que la cookie viajara a todas partes, pero los navegadores solo la aceptan junto con `Secure`, y un origen en HTTP plano no puede definir una cookie `Secure`. El laboratorio usa HTTP plano dentro de Docker, así que la demostración honesta es el atributo ausente. Por el mismo motivo (HTTP plano) los navegadores no envían `Sec-Fetch-Site` a las apps del laboratorio.

## La corrección

`app-fixed` (`ts/src/fixed/fixed-app.ts`) aplica tres cambios:

| Corrección | Qué hace | Quién la aplica |
| --- | --- | --- |
| Token sincronizador | Un secreto aleatorio (32 bytes) creado junto con la sesión, guardado en el servidor, escrito como campo oculto en el formulario de la propia app. El POST debe traerlo de vuelta. Validado con Zod y comparado en tiempo constante (`timingSafeEqual` sobre resúmenes SHA-256) | El servidor |
| `SameSite=Strict` | El navegador no adjunta la cookie a solicitudes iniciadas por otro sitio | El navegador |
| Solo POST | `GET /email/change` responde `405` y no modifica nada | El servidor |

El token funciona gracias a la política del mismo origen: el otro sitio puede *enviar* un formulario a la app, pero no puede *leer* la página de la app, así que no descubre el valor. Debe estar atado a la sesión, de lo contrario el atacante usaría el token de su propia cuenta.

¿`Strict` o `Lax`? `Lax` aún envía la cookie cuando el usuario sigue un enlace desde otro sitio, para que los enlaces de correos y buscadores lleguen a una página con sesión iniciada, y solo es seguro cuando ningún GET modifica el estado. `Strict` retiene la cookie también en ese caso. El laboratorio usa `Strict` para dejar el efecto visible en las dos falsificaciones.

Por qué las dos defensas: el token lo aplica el servidor en cada solicitud. `SameSite` depende del navegador, y trata a los subdominios hermanos como el mismo sitio. Cada una cubre una falla de la otra.

## Qué demuestran las pruebas

Pruebas con navegador (`ts/e2e/csrf.e2e.ts`, Playwright, Chromium + Firefox + WebKit). Una única función de escenario corre contra todas las versiones: iniciar sesión por el formulario de la app, visitar `other-origin`, dejar que la página falsificadora haga volver al navegador. Las apps registran lo que recibieron en cada intento (método, si la cookie de sesión estaba presente, resultado), y las pruebas lo comprueban.

| Prueba | Resultado |
| --- | --- |
| `app-vulnerable`, falsificación por GET | Cookie recibida, correo cambiado, en todos los navegadores. La página de perfil pasa a mostrar el correo falsificado |
| `app-vulnerable`, falsificación por POST | Cookie recibida y correo cambiado en Chromium y Firefox. Sin cookie en WebKit |
| `app-token-only`, falsificación por POST | La cookie llega (Chromium, Firefox) y la solicitud aun así se rechaza con `403`: el token solo basta |
| `app-token-only`, falsificación por GET | La cookie llega, `405`, nada cambia |
| `app-samesite-only`, falsificación por GET y POST | El servidor **no** recibe cookie de sesión: `SameSite=Strict` por sí solo impide que se adjunte |
| `app-fixed`, falsificación por GET y POST | Ninguna cookie recibida, correo sin cambios |
| Formulario legítimo, en las cuatro versiones | El usuario cambia el correo por el formulario de la propia app |

Pruebas unitarias (`ts/tests/`, `bun test`), sin navegador, con la cookie adjuntada a mano:

- Token: único, 43 caracteres seguros para URL, verificado solo contra el token exacto de la sesión, rechaza tipos incorrectos y valores demasiado grandes.
- Atributos de la cookie: sin `SameSite` en la app vulnerable, `SameSite=Strict` en la corregida.
- Los mismos POST y GET falsificados contra las dos apps: la app vulnerable cambia el correo, la app corregida responde `403` y `405`. Un token válido de otra sesión se rechaza.
- Un límite dicho con honestidad: solo con `SameSite`, si la cookie llega, el cambio se acepta.
- La página falsificadora rechaza cualquier destino fuera de la lista del laboratorio.
- El contenedor no alcanza `http://example.com`: la red es interna.

## Criterios de aceptación

| Elemento | Cómo se verifica |
| --- | --- |
| MP-SEC-3.1 el cambio falsificado funciona en la app vulnerable | `docker compose run --rm e2e`: las pruebas de `app-vulnerable` (falsificación por GET en tres navegadores, falsificación por POST en Chromium y Firefox) |
| MP-SEC-3.2 la solicitud falsificada se rechaza y el formulario legítimo sigue funcionando | El mismo comando: las pruebas de `app-fixed`, `app-token-only` y `app-samesite-only`, y la prueba del formulario legítimo en todas las versiones |
| MP-SEC-3.3 definición de terminado | `./setup-unix-csrf-lab.sh` (o `.ps1`) ejecuta `ts-test` y `e2e` y termina con código 0 |

## Cómo ejecutarlo

```sh
cd projects/security/csrf-lab
./setup-unix-csrf-lab.sh           # pruebas unitarias + pruebas con navegador
docker compose run --rm demo       # paso a paso narrado
docker compose down -v --remove-orphans
```
