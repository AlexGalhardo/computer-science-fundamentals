# access-control-lab

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)
>
> **Laboratorio de seguridad, vulnerable a propósito.** El código de `ts/src/vulnerable/` existe solo para hacer observable una falla dentro de este laboratorio. Nunca lo copies, lo importes ni lo despliegues.

Una API de facturas pequeña sabe exactamente quién tiene la sesión iniciada y aun así deja que cualquier usuario lea, modifique y borre cualquier factura cambiando el número de la URL, y deja que un usuario común llame a una ruta de administración cuya única protección es un botón oculto. Este laboratorio reproduce esa falla (control de acceso roto: IDOR, también llamado autorización rota a nivel de objeto, más una verificación de rol ausente) y la corrige poniendo toda decisión de autorización en una sola función, `can(user, action, resource)`, que niega por defecto.

Código: MP-SEC-4. Explicación completa: [docs/es/security/access-control-lab.md](../../../docs/es/security/access-control-lab.md).

## Temas del quiz que demuestra

- `security` / `access-control`: autenticación frente a autorización, verificaciones de propiedad, verificaciones de rol, negar por defecto, 401 frente a 403 frente a 404
- `security` / `owasp-threat-modelling`: el control de acceso roto en el OWASP Top 10, y preguntarse "¿quién puede llamar a esto, y sobre los datos de quién?" en cada ruta

## Ejecución

El único requisito es Docker.

```sh
./setup-unix-access-control-lab.sh        # Linux y macOS
./setup-windows-access-control-lab.ps1    # Windows
```

El script construye la imagen, ejecuta la verificación de tipos y las pruebas en una red interna, y elimina todo al final.

## Demo

```sh
docker compose run --rm demo
docker compose down -v --remove-orphans
```

Imprime los mismos seis pasos dos veces. En la API vulnerable, `bob-fake` lee, modifica y borra la factura de `alice-fake`, ve todas las facturas en el listado y llama a la ruta de administración. En la API corregida las mismas solicitudes con el mismo token reciben `403`, el listado muestra solo sus facturas, y el uso legítimo (el dueño y el admin) sigue respondiendo `200`.

## Pruebas

```sh
docker compose run --rm ts-test
docker compose down -v --remove-orphans
```

El contenedor ejecuta `tsc --noEmit` y luego `bun test`.

| Archivo | Qué demuestra |
| --- | --- |
| `ts/tests/idor.test.ts` | Las mismas funciones de escenario corren contra ambas versiones. Vulnerable: `bob-fake` lee, modifica y borra la factura de `alice-fake` y llama a la ruta de administración. Corregida: los mismos intentos reciben `403`, el registro queda intacto y el uso normal sigue funcionando. También la validación Zod y la opción `403` frente a `404` |
| `ts/tests/matrix.test.ts` | La matriz de autorización, generada desde una tabla: 4 llamadores (anónimo, dueño, otro usuario, admin) por 5 operaciones (leer, modificar, borrar, listar, ruta de administración), cada celda afirmada, para ambas versiones. También lo que contiene el listado por llamador, y que toda ruta registrada rechaza a un llamador anónimo |
| `ts/tests/policy.test.ts` | `can()` por separado, sin HTTP, incluidas las combinaciones para las que nadie escribió una regla |
| `ts/tests/network.test.ts` | El contenedor no puede alcanzar el exterior: una solicitud a `http://example.com` falla |

La matriz de la API corregida:

| | leer | modificar | borrar | listar | ruta de administración |
| --- | --- | --- | --- | --- | --- |
| anónimo | 401 | 401 | 401 | 401 | 401 |
| dueño | 200 | 200 | 200 | 200 (facturas propias) | 403 |
| otro usuario | 403 | 403 | 403 | 200 (facturas propias) | 403 |
| admin | 200 | 200 | 200 | 200 (todas las facturas) | 200 |

En la API vulnerable la fila anónima es la misma y todas las demás celdas son `200`.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `ts/src/data.ts` | Usuarios falsos, tokens de sesión falsos y las facturas en memoria |
| `ts/src/vulnerable/vulnerable-app.ts` | La API de ElysiaJS que confía en el id de la URL. Vulnerable a propósito |
| `ts/src/fixed/fixed-policy.ts` | `can(user, action, resource)`: el único lugar donde se decide el acceso |
| `ts/src/fixed/fixed-app.ts` | La misma API, con cada ruta detrás de la política y los ids y cuerpos validados con Zod |
| `ts/src/scenario.ts` | Los intentos, escritos una vez y ejecutados contra ambas versiones |
| `ts/src/demo.ts` | El recorrido que imprime el servicio `demo` |
| `ts/src/http.ts` | El tipo de error que lleva el código de estado |

## Por qué ocurre la falla

La API vulnerable responde una pregunta, "¿quién eres?" (autenticación), y se salta la siguiente, "¿puedes hacer esto con ese registro?" (autorización).

```ts
// vulnerable: el id viene de quien llama, y el registro va a quien lo pidió
const invoice = store.invoices.get(Number(params.id));
return invoice;
```

- **El id de la URL es entrada, como cualquier campo de formulario.** Quien llama lo elige. Recibir `1001` solo significa que alguien escribió `1001`.
- **Nada compara el dueño del registro con el usuario con sesión iniciada.** La verificación no está mal, está ausente, y una verificación ausente no produce ningún error, ninguna línea de registro ni ninguna prueba que falle. La funcionalidad anda perfecto para cualquier usuario honesto.
- **La verificación de rol vive solo en la interfaz.** `/me` devuelve un menú sin el enlace de administración para los usuarios comunes, y `/admin/users` solo comprueba que alguien tenga sesión iniciada. Quien escriba la dirección obtiene la respuesta.
- **Cada ruta decide por sí sola.** Con las verificaciones repartidas entre handlers, basta un handler olvidado, y no hay un único lugar para revisar.

## Cómo prevenirla

- **Verifica en el servidor, en cada solicitud, contra datos que el servidor posee.** El dueño viene del registro guardado y el rol de la sesión, nunca de la solicitud.
- **Una función de política.** Cada ruta pregunta `can(user, action, resource)` en `fixed-policy.ts`. Las rutas no contienen ningún `if (user.role === ...)` propio. El listado se filtra con la misma regla `read` usada para una sola factura, así que las dos nunca pueden discrepar.
- **Niega por defecto.** `can()` devuelve `true` solo para las combinaciones que están escritas. Un llamador anónimo, una acción desconocida o un tipo nuevo de recurso cae en `false`.
- **Haz que la verificación sea difícil de olvidar.** Un handler recibe la factura solo de `authorizeInvoice()`, que autentica, valida el id, carga el registro y pregunta a la política, en ese orden. Una prueba recorre todas las rutas registradas y exige `401` sin sesión.
- **Valida la entrada con Zod.** El id debe cumplir `^[1-9][0-9]{0,8}$`, y el cuerpo de la modificación es un objeto estricto, así que un campo `ownerId` de más se rechaza en lugar de cambiar el dueño en silencio. La validación no reemplaza la verificación de propiedad: `1001` es un id perfectamente válido de otra persona.
- **Prueba la matriz, incluidos los rechazos.** Las pruebas que solo cubren el camino feliz también pasan en la versión vulnerable. La matriz afirma cada `403` y `401` y que el registro quedó intacto.

### ¿403 o 404?

Cuando la factura existe y quien llama no puede tocarla, hay dos respuestas defendibles:

| Respuesta | Ventaja | Costo |
| --- | --- | --- |
| `403 Forbidden` (por defecto aquí) | Honesta y fácil de depurar y monitorear: una ráfaga de `403` es una señal clara | Confirma que el id existe. `404` para 9999 y `403` para 1001 le dicen a un extraño qué facturas son reales |
| `404 Not Found` | No revela nada: un registro ajeno y uno inexistente son indistinguibles | Más difícil de depurar, y las dos respuestas deben ser realmente idénticas (mismo cuerpo, mismas cabeceras) o la diferencia se filtra de todos modos |

Usa `404` cuando la existencia del registro es en sí sensible (un repositorio privado, un historial médico, una cuenta de usuario). Usa `403` cuando la existencia no es un secreto. Este laboratorio usa `403` por defecto e implementa ambos: `createFixedApp(store, { hideExistence: true })` devuelve el mismo `404` en ambos casos, y una prueba afirma que las dos respuestas son iguales. En cualquier caso, la decisión se toma en un solo lugar, después de la misma verificación de la política. Y `401` es otra cosa: significa "no sabemos quién eres", no "no puedes".

## Qué no funciona como corrección

- **Ocultar el botón.** La interfaz corre en la máquina del usuario, y el usuario decide qué solicitudes enviar. Ocultar un enlace es buena usabilidad (el `/me` corregido deriva el menú de la misma política) y cero protección: el servidor debe rechazar la solicitud.
- **Ids imposibles de adivinar (UUID).** Un id aleatorio hace impracticable la adivinación, lo que no es lo mismo que verificar. Los ids no son secretos: aparecen en URLs, historial del navegador, registros, correos, capturas de pantalla y enlaces compartidos, y la propia API suele entregarlos en otras respuestas. Una vez que se conoce un id, una API sin la verificación de propiedad sirve el registro. Los UUID son una capa extra razonable y no reemplazan la verificación.
- **Codificar o aplicar hash al id** (base64, un hash del número). Es oscuridad: quien ve un valor aprende el esquema.
- **Confiar en un dueño o un rol enviado por el cliente** (un `userId` en el cuerpo, una cabecera `X-Role`, una cookie `role` que el servidor no verifica). Esos también los escribe quien llama.
- **Verificar solo las rutas de lectura**, o verificar en la mayoría de las rutas. El control de acceso falla en la única ruta que se olvidó, por eso la corrección es una sola política más una prueba sobre todas las rutas.
- **Solo validación de entrada.** Un id bien formado sigue siendo el id de otra persona.

## Alcance de seguridad del laboratorio

- Todo se ejecuta de forma local en Docker, en una red de compose con `internal: true`. No se publica ningún puerto y una prueba demuestra que el contenedor no puede alcanzar el exterior.
- Ambas APIs corren en memoria, dentro del proceso de pruebas. Ninguna solicitud sale del contenedor, y nada aquí apunta a ningún otro sistema.
- Todos los datos son falsos: `alice-fake`, `bob-fake`, `carol-admin-fake`, tokens como `FAKE-TOKEN-alice-not-real`.
- El "ataque" es un usuario falso con sesión iniciada cambiando un número en una URL. No hay escáner, ni herramienta de enumeración, ni lista de payloads.

## Versiones

| Componente | Versión |
| --- | --- |
| Bun | `oven/bun:1.4.2` |
| ElysiaJS | 1.4.30 |
| Zod | 4.6.5 |
| TypeScript | 7.0.2 |
| @types/bun | 1.4.2 |
