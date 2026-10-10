# Laboratorio de JWT: los errores comunes en la validación de tokens (MP-SEC-7)

> English version: [docs/en/security/jwt-lab.md](../../en/security/jwt-lab.md) · Versão em português: [docs/pt/security/jwt-lab.md](../../pt/security/jwt-lab.md)

Miniproyecto: [`projects/security/jwt-lab`](../../../projects/security/jwt-lab/README.es.md). Temas del quiz: `jwt-oauth-oidc`, `authentication`.

Este es un laboratorio defensivo. Se ejecuta solo en Docker, en una red interna, en memoria y con datos falsos. El código vulnerable existe únicamente para hacer observables las fallas. El verificador está escrito a mano con `node:crypto` para que cada comprobación sea visible; el código de producción debe usar una biblioteca mantenida (por ejemplo `jose`) configurada con una lista explícita de algoritmos permitidos.

## El concepto

Un JSON Web Token son tres textos en base64url unidos por puntos:

```text
base64url(encabezado) . base64url(payload) . base64url(firma)
```

| Parte | Contenido | Ejemplo |
| --- | --- | --- |
| Encabezado | Cómo se firmó el token | `{"alg":"HS256","typ":"JWT"}` |
| Payload | Los claims | `{"sub":"bob-fake","role":"user","iss":"...","aud":"...","exp":1800000900}` |
| Firma | Prueba de que el emisor escribió las dos primeras partes | `HMAC-SHA256(clave, encabezado + "." + payload)` |

El servidor no guarda sesión: confía en lo que dice el payload, siempre que la verificación pase. Eso pone toda la seguridad del inicio de sesión en una función, el verificador.

Dos hechos moldean todo lo demás:

- **El payload está codificado, no cifrado.** Quien tiene el token lee todos los claims sin clave. La firma impide las modificaciones, no la lectura. Los secretos nunca van en un JWT.
- **El encabezado lo escribe quien envía.** Cualquier cosa que el verificador lea de él antes de comprobar la firma es una sugerencia de un extraño.

Los claims usados aquí (RFC 7519): `sub` (quién), `iss` (quién lo emitió), `aud` (para qué servicio), `iat` (emitido en), `exp` (expira en), `nbf` (no válido antes de). Los tiempos son segundos Unix.

## La falla

El verificador vulnerable comete tres errores, cada uno demostrado con un token armado a mano:

| | Error | Qué hace la prueba | Resultado en la API vulnerable |
| --- | --- | --- | --- |
| (a) | Confía en el `alg` del encabezado, incluido `none` | `bob-fake` cambia el payload a `role: "admin"`, escribe `alg: none`, deja la firma vacía | `200` en la ruta de admin |
| (b) | El secreto de HS256 es la palabra `secret` | `bob-fake` firma su propio token con cinco intentos inventados, sin conexión, encuentra el que coincide, y firma un token de admin | `200` en la ruta de admin |
| (c) | Nunca lee `exp` (ni `iss`, `aud`) | Un token de 15 minutos se usa dos horas después; un token emitido para otro servicio se reutiliza | `200` en ambos casos |

Por qué (b) funciona sin tocar el servidor: una firma HS256 es una función determinista de la clave y de un texto que quien tiene el token ya posee. Comparar un intento solo necesita un token. No se aplica ningún límite de intentos ni bloqueo, porque no se envía nada. Por eso una clave tiene que ser imposible de adivinar por sí sola, lo que una palabra elegida por una persona nunca es.

Ninguno de los tres produce error para un usuario honesto, y un payload alterado bajo una firma HS256 es rechazado correctamente por las dos versiones. Las fallas son los caminos *alrededor* de la verificación de la firma.

## La corrección

El verificador corregido es una secuencia fija. Nada del payload se cree antes de que el paso 4 pase.

| Paso | Verificación | Motivo del rechazo (registro del servidor) |
| --- | --- | --- |
| 1 | Tamaño del token de como máximo 2048 bytes, antes de analizarlo | `token_too_large` |
| 2 | Exactamente tres partes base64url no vacías | `malformed` |
| 3 | El encabezado es un objeto estricto y el `alg` es igual al `HS256` fijado. Rechazado antes de cualquier trabajo de firma | `malformed`, `algorithm_not_allowed` |
| 4 | HMAC-SHA256 recalculado y comparado con `timingSafeEqual` | `bad_signature` |
| 5 | Payload validado con Zod; `exp` es obligatorio | `invalid_claims` |
| 6 | `ahora < exp + 30 s`; cuando hay `nbf`, `ahora + 30 s >= nbf`. Reloj inyectado | `expired`, `not_yet_valid` |
| 7 | `iss` es el emisor esperado, `aud` contiene este servicio | `wrong_issuer`, `wrong_audience` |

La clave tiene al menos 32 bytes del generador aleatorio del sistema, generada al iniciar o informada en base64 en `JWT_LAB_KEY_BASE64`; el verificador se niega a crearse con una clave menor. El cliente siempre recibe el mismo `401 {"error":"invalid_token"}`, así que el rechazo no revela qué verificación falló.

### Fijación del algoritmo y confusión de claves

El problema de `none` es un caso de una regla general: el token no puede elegir su propio algoritmo. El otro caso clásico es la confusión de claves RS256/HS256. Un servicio verifica tokens RS256 con la clave pública del emisor y deja que el encabezado seleccione el algoritmo. Un remitente escribe `HS256` en el encabezado y calcula el HMAC con los bytes de la clave pública como secreto. El verificador, informado de que es `HS256`, usa la clave que tiene (la pública) en una verificación de HMAC, y esta pasa: un valor público se convirtió en clave de firma. Fijar el algoritmo en el servidor elimina el punto de partida de los dos. El laboratorio explica este caso y no lo implementa.

### Expiración, refresh y revocación

Un token sin estado no se puede deshacer: tras un cierre de sesión o un robo sigue siendo válido hasta `exp`, porque la verificación no consulta nada. El diseño habitual es un token de acceso de vida corta (minutos) más un refresh token que se guarda en el servidor, se envía solo al emisor, se cambia en cada uso y se puede revocar. Revocar de inmediato un token de acceso vuelve a exigir estado en el servidor (una lista de bloqueo de `jti`, o un instante "no emitido antes de" por usuario), que es la consulta que el JWT pretendía evitar. Cuando la revocación inmediata es un requisito, una sesión en el servidor suele ser más simple.

### Qué no es una corrección

- **Una lista de prohibidos para `none`**: permite un algoritmo en lugar de prohibir algunos.
- **Un secreto más largo elegido por una persona**: la longitud no es aleatoriedad.
- **Una expiración larga por comodidad**: todo token filtrado se convierte en una credencial de largo plazo.
- **Solo la firma**: una firma válida no dice que el token siga vigente ni que se hizo para este servicio.
- **Leer claims antes de verificar**: hasta que la firma pase, el payload es texto de un extraño.

## Qué demuestran las pruebas

| Elemento | Cómo se verifica |
| --- | --- |
| MP-SEC-7.1 (a) token sin firma aceptado | `tests/forgery.test.ts`, "vulnerable API": el token termina con la firma vacía, el payload dice `role: "admin"`, y la ruta de admin responde `200` |
| MP-SEC-7.1 (b) secreto débil | El mismo archivo: el secreto se recupera de una lista fija de cinco palabras inventadas comparadas con el token del propio laboratorio, y un token firmado con él recibe `200` |
| MP-SEC-7.1 (c) sin verificación de expiración | El mismo archivo: el reloj avanza dos horas más allá de un token de 15 minutos y `/me` sigue respondiendo `200` |
| MP-SEC-7.2 tokens falsificados rechazados | `tests/forgery.test.ts`, "fixed API": las mismas funciones de escenario reciben `401`, con los motivos registrados `malformed`, `bad_signature`, `expired`, `wrong_audience`; ninguna palabra adivinada coincide con la clave aleatoria |
| MP-SEC-7.2 token válido aceptado | `tests/forgery.test.ts`, "what must work on both": el inicio de sesión, `/me` y la ruta de admin para la admin responden `200`; el usuario común recibe `403` en la ruta de admin |
| MP-SEC-7.2 audiencia incorrecta, emisor incorrecto, payload alterado, mal formado, otra audiencia | `tests/verifier.test.ts` (cada motivo afirmado en el verificador por separado) y `tests/forgery.test.ts` (vía HTTP) |
| MP-SEC-7.2 algoritmo fijado | `tests/verifier.test.ts`: `none`, `RS256`, `HS512` y `hs256` se rechazan con `algorithm_not_allowed` incluso cuando la firma HS256 es correcta |
| MP-SEC-7.2 tolerancia de `exp` y reloj inyectado, `nbf` | `tests/verifier.test.ts`: aceptado en `exp + 29 s`, rechazado en `exp + 30 s`; `nbf` en el futuro rechazado |
| MP-SEC-7.2 clave fuerte | `tests/key.test.ts`: 32 bytes aleatorios por defecto, y una clave corta hace que el verificador y la app lancen un error al crearse |
| MP-SEC-7.2 Zod y límite de tamaño | `tests/verifier.test.ts` (rol desconocido, `exp` ausente, `aud` ausente, token demasiado grande) y `tests/forgery.test.ts` (cuerpo del inicio de sesión) |
| Aislamiento del laboratorio | `tests/network.test.ts`: una solicitud a `http://example.com` falla desde dentro del contenedor |

## Cómo ejecutarlo

```sh
cd projects/security/jwt-lab
./setup-unix-jwt-lab.sh                # build, verificación de tipos y pruebas
docker compose run --rm demo           # el paso a paso
docker compose down -v --remove-orphans
```
