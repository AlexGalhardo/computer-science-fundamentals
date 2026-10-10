# Laboratorio de contraseñas y sesiones: almacenamiento, límite de intentos y cookies de sesión (MP-SEC-6)

> English version: [docs/en/security/passwords-sessions-lab.md](../../en/security/passwords-sessions-lab.md) · Versão em português: [docs/pt/security/passwords-sessions-lab.md](../../pt/security/passwords-sessions-lab.md)

Miniproyecto: [`projects/security/passwords-sessions-lab`](../../../projects/security/passwords-sessions-lab/README.es.md). Temas del quiz: `authentication`, `sessions-cookies`.

Este es un laboratorio defensivo. Se ejecuta solo en Docker, en una red interna, en memoria y con datos falsos. El código vulnerable existe únicamente para hacer observables las fallas, y el benchmark mide funciones de hash: no adivina nada.

## El concepto

Un inicio de sesión tiene tres momentos, y cada uno tiene su manera de salir mal:

| Momento | Pregunta | Qué protege |
| --- | --- | --- |
| En reposo | ¿Qué descubre alguien con una tabla de usuarios robada? | Un hash de contraseña lento, con sal y que exige memoria |
| En la puerta | ¿Cuántas veces puede alguien intentarlo? | Límite de intentos, y respuestas que no revelan nada |
| Después de la puerta | ¿Qué prueba que la siguiente solicitud viene de la misma persona? | Un id de sesión aleatorio, cambiado en el inicio de sesión, en una cookie bien protegida |

### Guardar una contraseña

El servidor nunca necesita saber la contraseña, solo reconocerla. Entonces guarda la salida de una función de un solo sentido y repite el cálculo en el inicio de sesión. Tres propiedades importan:

| Propiedad | Qué da | Texto plano | MD5 | SHA-256 con sal | Argon2id |
| --- | --- | --- | --- | --- | --- |
| Un solo sentido | La tabla no muestra las contraseñas | no | sí | sí | sí |
| Sal (aleatoria, por contraseña) | Contraseñas iguales generan hashes distintos; las tablas precalculadas no sirven | no | no | sí | sí |
| Lento y exige memoria | Cada intento contra una tabla robada cuesta caro | no | no | no | sí |

La sal no es secreta y se guarda junto al hash. Argon2id escribe todo en una única cadena: `$argon2id$v=19$m=19456,t=2,p=1$<sal>$<hash>`, donde `m` es la memoria en KiB, `t` el número de pasadas y `p` el número de hilos.

### Qué muestra el benchmark

`docker compose run --rm bench` calcula el hash de una contraseña falsa repetidas veces e informa hashes por segundo: una ronda de calentamiento descartada y cinco rondas medidas por esquema, en un hilo, con la mediana y el rango. La ronda versionada (AMD Ryzen 7 5700X3D, Bun 1.4.2 en Docker) está en [`results/results.md`](../../../projects/security/passwords-sessions-lab/results/results.md):

| Esquema | Hashes/s (mediana) | Tiempo por hash |
| --- | --- | --- |
| MD5, sin sal | 843.636 | 1,19 µs |
| SHA-256, sal de 16 bytes | 548.724 | 1,82 µs |
| Argon2id, 19 MiB, t=2, p=1 | 22 | 45 ms |
| Argon2id, 64 MiB, t=3, p=1 | 3,5 | 285 ms |

La tasa es el costo del servidor por inicio de sesión y, leída al revés, el número de intentos por segundo que un núcleo de CPU puede probar contra una tabla robada. Un hash rápido deja cada intento casi gratis. Argon2id hace que cada uno cueste decenas de milisegundos y megabytes de memoria, unas 38.000 veces el costo de MD5 en esta máquina, mientras que un usuario lo paga una vez por inicio de sesión. La sal no vuelve nada más lento (SHA-256 con sal es tan rápido como MD5): su trabajo es hacer de cada fila un problema separado. Las dos filas de Argon2id muestran que el costo es un parámetro que se debe aumentar con el tiempo.

## La falla

```text
otra persona                        servidor (vulnerable)                   alice-fake
GET /home  ---------------------->  sesión nueva X, anónima
        (X termina en el navegador de alice-fake)
                                    POST /login, cookie sid=X  <----------  contraseña correcta
                                    la sesión X ahora es alice-fake
GET /me, cookie sid=X  ---------->  200 {"user":"alice-fake"}
```

La API vulnerable tiene cinco fallas, cada una de ellas una omisión:

| Falla | Qué hace el código |
| --- | --- |
| Sin límite de intentos | Evalúa toda contraseña incorrecta, sin contar |
| Fijación de sesión | Mantiene el id de sesión que el navegador ya tenía y lo marca como con sesión iniciada |
| Cierre de sesión solo en el navegador | Borra la cookie y mantiene la sesión válida en el servidor, sin expiración |
| Cookie sin atributos | `sid=...; Path=/`, sin `HttpOnly`, `Secure` ni `SameSite` |
| Enumeración de usuarios | Responde `unknown_user` o `wrong_password` |

También guarda las contraseñas como MD5 sin sal.

## La corrección

| Falla | Corrección en `ts/src/fixed/` |
| --- | --- |
| Almacenamiento débil | Argon2id mediante `Bun.password` (19 MiB, 2 pasadas). `needsRehash` y `verifyAndUpgrade` cambian un hash antiguo en el siguiente inicio de sesión exitoso |
| Sin límite de intentos | `AttemptLimiter`, dos veces: por cuenta (5 fallos en 15 minutos, bloqueo de 15 minutos) y por cliente (10 fallos). `429` con `Retry-After`. El reloj se inyecta, así que las pruebas no duermen |
| Fijación de sesión | En cada inicio de sesión se destruye el id antiguo y se crea uno nuevo a partir de 32 bytes aleatorios |
| Cierre de sesión | La sesión se borra en el servidor. Expiración por inactividad de 15 minutos y absoluta de 8 horas |
| Cookie sin atributos | `__Host-sid=...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`, sin `Domain` |
| Enumeración de usuarios | Una sola respuesta, `401 invalid_credentials`. Un usuario desconocido se compara con un hash Argon2id falso, así que el tiempo es parecido. El bloqueo cuenta por el nombre escrito, exista o no |
| Entrada sin validar | Zod: objeto estricto, patrón para el nombre de usuario, contraseña de como máximo 128 caracteres |

El orden dentro del inicio de sesión corregido importa: validar el cuerpo, comprobar los dos límites, verificar la contraseña (siempre, incluso para un nombre desconocido), registrar el fallo o poner a cero el conteo, y solo entonces cambiar la sesión.

### Qué hace cada atributo de la cookie

| Atributo | Cierra |
| --- | --- |
| `HttpOnly` | Que los scripts de la página lean la cookie (`document.cookie`) |
| `Secure` | Que la cookie viaje por HTTP plano |
| `SameSite=Lax` | Que la cookie se adjunte a solicitudes que otros sitios inician en segundo plano |
| Prefijo `__Host-` | Que otro subdominio o una página HTTP sobrescriba la cookie: el navegador exige `Secure`, `Path=/` y ningún `Domain` |
| `Max-Age` | Que el navegador mantenga la cookie más allá de la expiración absoluta (el servidor también la aplica) |

### El costo de un bloqueo

Un bloqueo por cuenta frena los intentos y deja que cualquiera bloquee a otra persona por un tiempo. Por eso es temporal, por eso existe el límite por cliente a su lado, y por eso los sistemas reales añaden un segundo factor o retrasos progresivos.

### Qué no es una corrección

- Un hash genérico más rápido o "más fuerte", o aplicar el hash dos veces: el problema es el costo por intento.
- Una sal única para toda la tabla: las contraseñas iguales vuelven a generar hashes iguales.
- Cifrado en lugar de hash: quien se lleva la clave se lleva todas las contraseñas.
- Un límite guardado en el navegador, un límite solo por dirección IP, o un bloqueo permanente.
- Borrar la cookie al cerrar sesión mientras el servidor mantiene la sesión.
- Un mensaje vago con estado, cuerpo o tiempo distintos.

## Qué demuestran las pruebas

| Elemento | Cómo se verifica |
| --- | --- |
| MP-SEC-6.1 un benchmark muestra hashes por segundo de cada esquema, solo con datos falsos | `docker compose run --rm bench` imprime la tabla y escribe `results/results.md` y `results/results.json` con la máquina, el runtime, los parámetros de Argon2, el comando y la dispersión de cinco rondas. `tests/bench.test.ts` comprueba la aritmética |
| MP-SEC-6.1 misma contraseña, hashes distintos | `tests/password-storage.test.ts`: texto plano igual y MD5 igual para dos usuarios falsos, SHA-256 con sal y Argon2id distintos; verificación; `needsRehash`; actualización de MD5 a Argon2id |
| MP-SEC-6.2 bloqueo | `tests/login.test.ts`: vulnerable, seis contraseñas incorrectas se evalúan todas y la correcta funciona a continuación. Corregida, el mismo escenario recibe `401` cinco veces y luego `429`, incluso con la contraseña correcta; el bloqueo expira tras 15 minutos con el reloj inyectado. `tests/limiter.test.ts` cubre el limitador por separado |
| MP-SEC-6.2 flags de la cookie | `tests/login.test.ts`: vulnerable, la cookie solo tiene `Path`. Corregida, nombre `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age`, sin `Domain` |
| MP-SEC-6.2 rotación de sesión en el inicio de sesión | `tests/login.test.ts`: vulnerable, el id de antes del inicio de sesión responde como `alice-fake`. Corregida, el inicio de sesión emite un id distinto y el antiguo recibe `401` |
| MP-SEC-6.2 el inicio de sesión normal sigue funcionando | `tests/login.test.ts`, "normal use works", para las dos versiones |
| Error genérico, cierre de sesión, expiraciones, validación, actualización en el inicio de sesión | `tests/login.test.ts`, los bloques restantes |
| Aislamiento del laboratorio | `tests/network.test.ts`: una solicitud a `http://example.com` falla desde dentro del contenedor |

## Cómo ejecutarlo

```sh
cd projects/security/passwords-sessions-lab
./setup-unix-passwords-sessions-lab.sh   # build, verificación de tipos y pruebas
docker compose run --rm demo             # el paso a paso
docker compose run --rm bench            # el benchmark
docker compose down -v --remove-orphans
```
