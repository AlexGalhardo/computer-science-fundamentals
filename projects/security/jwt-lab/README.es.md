# jwt-lab

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)
>
> **Laboratorio de seguridad, vulnerable a propósito.** El código de `ts/src/vulnerable/` existe solo para hacer observable una falla dentro de este laboratorio. Nunca lo copies, lo importes ni lo despliegues.

Un JSON Web Token (JWT) es una nota firmada que dice "este es `bob-fake`, rol `user`, válido hasta las 10:15". El servidor que lo recibe no tiene ninguna tabla de sesiones que consultar: cree la nota si, y solo si, la verificación es correcta. Este laboratorio muestra las formas comunes en que esa verificación sale mal: aceptar tokens sin firma porque el propio token dijo `alg: none`, firmar con una palabra que eligió una persona, y nunca comprobar la expiración. Luego corrige cada una en un verificador escrito a mano con `node:crypto`, donde cada comprobación es un paso visible y numerado.

> **Usa una biblioteca en producción.** El verificador de aquí está escrito a mano solo para que cada comprobación pueda leerse y probarse de forma aislada. El código real debe usar una biblioteca mantenida (por ejemplo [`jose`](https://github.com/panva/jose)) configurada con una lista explícita de algoritmos permitidos, el emisor esperado y la audiencia esperada. Escribir tu propia verificación de JWT es la manera en que las fallas de este laboratorio llegaron a sistemas reales.

Código: MP-SEC-7. Explicación completa: [docs/es/security/jwt-lab.md](../../../docs/es/security/jwt-lab.md).

## Temas del quiz que demuestra

- `security` / `jwt-oauth-oidc`: las tres partes de un JWT, HS256 frente a RS256, fijación del algoritmo, los claims `exp`, `nbf`, `iss` y `aud`, tokens de acceso y de refresh
- `security` / `authentication`: probar quién es quien llama en cada solicitud, tokens sin estado frente a sesiones en el servidor, 401 frente a 403

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-jwt-lab.sh        # Linux y macOS
./setup-windows-jwt-lab.ps1    # Windows
```

El script construye la imagen, ejecuta la verificación de tipos y las pruebas en una red interna, y elimina todo al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Primero imprime el payload de un token decodificado sin clave, luego los mismos seis pasos dos veces. En la API vulnerable se aceptan el token `admin` sin firma, el token firmado con la palabra adivinada, el token usado dos horas después de su expiración y el token emitido para otro servicio. En la API corregida los mismos intentos reciben `401`, con el motivo que registró el servidor (`malformed`, `bad_signature`, `expired`, `wrong_audience`), y el uso normal sigue respondiendo `200`.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

El contenedor ejecuta `tsc --noEmit` y luego `bun test`.

| Archivo | Qué demuestra |
| --- | --- |
| `ts/tests/forgery.test.ts` | Las mismas funciones de escenario corren contra ambas versiones. Vulnerable: (a) se acepta un token con `alg: none`, una firma vacía y `role: "admin"`, (b) el secreto se encuentra entre cinco palabras adivinadas y se acepta un token firmado con él, (c) se acepta un token cuyo `exp` está dos horas en el pasado. Corregida: todos esos se rechazan con `401`, y también un token para otra audiencia, otro emisor, un token que aún no es válido y tokens mal formados. El uso normal funciona en ambas |
| `ts/tests/verifier.test.ts` | El verificador corregido por separado, una prueba por comprobación, afirmando el motivo exacto: algoritmo fijado (`none`, `RS256`, `HS512`, `hs256`), payload alterado, otra clave, longitud de firma incorrecta, formas mal formadas, límite de tamaño, `exp` con la tolerancia de 30 segundos y un reloj inyectado, `nbf`, `iss`, `aud`, forma del payload |
| `ts/tests/key.test.ts` | La clave son 32 bytes aleatorios por defecto, y una clave corta (la palabra `secret`) hace que el verificador y la app se nieguen a iniciar |
| `ts/tests/network.test.ts` | El contenedor no puede alcanzar el exterior: una solicitud a `http://example.com` falla |

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/token.ts` | La forma de un JWT y las utilidades neutrales: base64url, HMAC-SHA256, firmar, leer un payload sin verificar |
| `ts/src/data.ts` | Usuarios falsos, los nombres del emisor y la audiencia, la vida del token y el tipo del reloj |
| `ts/src/vulnerable/vulnerable-verifier.ts` | El verificador con las tres fallas. Vulnerable a propósito |
| `ts/src/vulnerable/vulnerable-app.ts` | La API de ElysiaJS protegida por él. Vulnerable a propósito |
| `ts/src/fixed/fixed-key.ts` | Reglas de la clave: 32 bytes aleatorios, negarse a iniciar con menos |
| `ts/src/fixed/fixed-verifier.ts` | El verificador, como siete pasos numerados |
| `ts/src/fixed/fixed-app.ts` | La misma API detrás del verificador corregido, con el cuerpo del inicio de sesión validado con Zod |
| `ts/src/scenario.ts` | Los intentos, escritos una vez y ejecutados contra ambas versiones |
| `ts/src/demo.ts` | El recorrido que imprime el servicio `demo` |
| `ts/src/http.ts` | El tipo de error que lleva el código de estado |

## Un JWT en un minuto

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJzdWIiOiJib2ItZmFrZSIsInJvbGUiOiJ1c2VyIiwuLi59 . 3q2-7w...
        encabezado                                payload                                  firma
 {"alg":"HS256","typ":"JWT"}        {"sub":"bob-fake","role":"user","exp":...}     HMAC-SHA256(clave, encabezado.payload)
```

- **El payload está codificado, no cifrado.** base64url es una manera de escribir bytes como texto. Cualquiera que tenga el token (el usuario, un proxy, un archivo de registro, una extensión del navegador) lee todos los claims sin ninguna clave, y la demo imprime uno para mostrarlo. Nunca pongas una contraseña, una clave de API ni datos personales privados en un JWT. La firma protege el contenido contra el *cambio*, no contra la *lectura*.
- **HS256** usa una clave compartida para firmar y para verificar. Quien puede verificar también puede firmar.
- **RS256** usa un par de claves: la clave privada firma y la clave pública verifica. La clave pública puede entregarse a todos los servicios.

## Por qué ocurre la falla

El verificador vulnerable es corto y parece razonable, que es justamente el punto:

```ts
// vulnerable
if (header.alg !== "none") { /* check the HS256 signature with the secret "secret" */ }
return payload; // exp, iss and aud are never read
```

- **(a) El token elige cómo se verifica.** `alg` es un campo del encabezado, y el encabezado lo escribe quien envía el token. `none` es un valor real del estándar JWT ("JWT sin protección"). Un verificador que despacha según `header.alg` deja que el remitente elija "no me compruebes": cambia el payload, escribe `alg: none`, deja la firma vacía.
- **(b) La clave es una palabra.** Una firma HS256 puede probarla cualquiera que tenga un token: firma el mismo encabezado y payload con un intento y compara. Eso ocurre en la máquina de quien adivina, así que ningún límite de intentos, bloqueo ni alerta lo ve nunca. Una palabra que eligió una persona (`secret`, el nombre del producto, un patrón de teclado) está entre los primeros intentos, y una vez que se encuentra, quien adivinó *es* el emisor y firma cualquier payload. La prueba usa cinco intentos inventados contra el token del propio laboratorio, solo para mostrar que la comparación no necesita nada del servidor.
- **(c) Nadie lee `exp`.** El emisor escribe una expiración de 15 minutos y el verificador nunca la mira, así que un token copiado de un registro o de un portátil perdido funciona para siempre. La misma ausencia se aplica a `iss` y `aud`: un token genuino emitido para otro servicio se acepta aquí.
- **Nada de esto falla para un usuario honesto.** El inicio de sesión funciona, los tokens válidos funcionan, incluso un payload alterado bajo una firma HS256 se rechaza correctamente. Las pruebas del camino feliz pasan. Las fallas están en lo que el verificador *no* rechaza.

## Cómo prevenirla

El verificador corregido hace estos pasos en este orden (`ts/src/fixed/fixed-verifier.ts`):

1. **Límite de tamaño** (2048 bytes) antes de cualquier análisis: el token viene de un extraño.
2. **Forma**: exactamente tres partes base64url no vacías.
3. **Algoritmo fijado**: el servidor decide `HS256`. El encabezado debe decir exactamente eso, o el token se rechaza antes de cualquier trabajo de firma. El encabezado es un objeto Zod estricto, así que también se rechazan los campos que apuntan a una clave (`kid`, `jku`, `jwk`).
4. **Firma comparada en tiempo constante** con `timingSafeEqual`, para que el tiempo de respuesta no diga nada sobre qué tan cerca estuvo un intento.
5. **Payload validado con Zod**, solo después de confirmar la firma. `exp` es obligatorio.
6. **Tiempo**: se rechaza cuando `ahora >= exp + 30 s`, y cuando `nbf` está presente y aún está en el futuro. El reloj se inyecta, así que las pruebas mueven el tiempo sin esperar.
7. **Emisor y audiencia**: `iss` debe ser el emisor esperado y `aud` debe contener este servicio.

Y alrededor del verificador:

- **Una clave fuerte**: al menos 32 bytes del generador aleatorio del sistema (`randomBytes(32)`), generada al iniciar o pasada como base64 mediante `JWT_LAB_KEY_BASE64`. La app se niega a iniciar con una clave más corta. En un sistema real la clave viene de un gestor de secretos, nunca se sube al repositorio y se puede rotar.
- **Una respuesta para todo rechazo**: el cliente siempre recibe `401 {"error":"invalid_token"}`. El motivo preciso va al registro del servidor.

### Por qué fijar el algoritmo importa también con RS256: confusión de claves

Supón que un servicio verifica tokens RS256 con la clave **pública** del emisor, y su verificador elige el algoritmo a partir del encabezado. La clave pública es, por diseño, conocida por todos. Alguien escribe un token cuyo encabezado dice `HS256` y calcula el HMAC usando los bytes de la clave pública como secreto compartido. El verificador lee `HS256`, toma "la clave que tiene" (la pública) y ejecuta una verificación de HMAC, que tiene éxito. Un valor que nunca fue secreto se convirtió en una clave de firma. La causa raíz es la misma que con `none`: se le permitió al token elegir el algoritmo. Con un algoritmo fijado (y una clave tipada para un solo algoritmo) el ataque no tiene dónde empezar. Este laboratorio solo lo explica y no lo implementa.

### Expiración corta, refresh tokens y revocación

Un JWT se verifica sin consultar ninguna base de datos, por eso escala y también por eso es difícil retirarlo: tras un cierre de sesión, un cambio de contraseña o un portátil robado, el token sigue siendo válido hasta `exp`, porque no se pregunta a ningún servidor.

- **Tokens de acceso de vida corta** (minutos) limitan cuánto tiempo es útil un token filtrado.
- **Un refresh token** mantiene al usuario con la sesión iniciada: es de larga vida, se envía solo al emisor, se guarda en el servidor, se cambia en cada uso y, por lo tanto, *puede* revocarse. La revocación surte efecto cuando expira el token de acceso actual.
- **La revocación inmediata necesita estado**: una lista de bloqueo de ids de token (`jti`) comprobada en cada solicitud, o un valor por usuario de "los tokens emitidos antes de este instante no son válidos". Ambos traen de vuelta la consulta que el JWT evitaba. Cuando la revocación instantánea es un requisito firme, una sesión en el servidor suele ser el diseño más simple.

## Qué no funciona como corrección

- **Bloquear la cadena `none`.** Una lista de prohibidos invita a variaciones y al siguiente algoritmo inesperado. Permite exactamente un valor y rechaza todo lo demás.
- **Una palabra o frase más larga como secreto.** La longitud elegida por una persona no es aleatoriedad. La regla de 32 bytes es un piso: la clave debe venir de un generador aleatorio.
- **Codificar el payload de otra manera, o "esconder" claims en base64.** El payload es público para quien tenga el token. Los datos que deben ser secretos se quedan en el servidor.
- **Una expiración muy larga "por comodidad".** Convierte cada token filtrado en una credencial de largo plazo. Usa un token de acceso corto con un refresh token.
- **Comprobar la firma y nada más.** Una firma válida dice quién escribió el token, no que siga vigente, ni que estaba pensado para este servicio.
- **Leer claims antes de verificar** (por ejemplo elegir la clave o el tenant a partir de un payload sin verificar). Hasta que la firma se confirme, el payload es texto escrito por un extraño.
- **Borrar el token en el navegador como "cerrar sesión".** Una copia hecha antes sigue funcionando hasta `exp`.

## Alcance de seguridad del laboratorio

- Todo se ejecuta de forma local en Docker, en una red de compose con `internal: true`. No se publica ningún puerto y una prueba demuestra que el contenedor no puede alcanzar el exterior.
- Ambas APIs corren en memoria, dentro del proceso de pruebas. Ninguna solicitud sale del contenedor, y nada aquí apunta a ningún otro sistema.
- Todos los datos son falsos: `alice-admin-fake`, `bob-fake`, contraseñas como `lab-fake-password-bob`, el emisor `https://issuer.lab.invalid`.
- Las demostraciones son un token armado a mano cada una. El "adivinar" es una lista fija de cinco palabras inventadas comparadas con un token que este laboratorio emitió para su propio usuario falso. No hay herramienta de descifrado, ni archivo de lista de palabras, ni escáner.

## Versiones

| Componente | Versión |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
