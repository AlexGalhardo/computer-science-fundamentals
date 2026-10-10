# Laboratorio de control de acceso: IDOR y verificación de rol (MP-SEC-4)

> English version: [docs/en/security/access-control-lab.md](../../en/security/access-control-lab.md) · Versão em português: [docs/pt/security/access-control-lab.md](../../pt/security/access-control-lab.md)

Miniproyecto: [`projects/security/access-control-lab`](../../../projects/security/access-control-lab/README.es.md). Temas del quiz: `access-control`, `owasp-threat-modelling`.

Este es un laboratorio defensivo. Se ejecuta solo en Docker, en una red interna, en memoria y con datos falsos. El código vulnerable existe únicamente para hacer observable la falla.

## El concepto

Se hacen dos preguntas distintas sobre cada solicitud:

| Pregunta | Nombre | Respuesta cuando falla |
| --- | --- | --- |
| ¿Quién eres? | Autenticación | `401 Unauthorized` |
| ¿Puedes hacer esto con ese registro? | Autorización (control de acceso) | `403 Forbidden`, o `404` cuando se oculta la existencia |

El control de acceso roto es el primer elemento del OWASP Top 10 porque la segunda pregunta es fácil de olvidar: una aplicación con un inicio de sesión perfecto sigue fallando cuando trata "con sesión iniciada" como "autorizado". En este laboratorio aparecen dos formas del mismo error:

- **IDOR** (referencia directa insegura a objetos), también llamado **BOLA** (autorización rota a nivel de objeto): la solicitud nombra un registro por su id y el servidor lo devuelve sin comprobar de quién es.
- **Verificación a nivel de función ausente**: una ruta hecha para un rol (admin) solo comprueba que haya alguien con sesión iniciada.

## La falla

```text
bob-fake (con sesión iniciada como él mismo)   servidor (vulnerable)
GET /invoices/1002  ------------------> carga la factura 1002 -> 200, factura de él
GET /invoices/1001  ------------------> carga la factura 1001 -> 200, factura de alice-fake
GET /admin/users    ------------------> "¿hay alguien con sesión?" sí -> 200
```

El id de la URL lo elige quien llama. La API vulnerable carga cualquier id que reciba y nunca compara `invoice.ownerId` con el usuario de la sesión. La misma ausencia en `PATCH` y `DELETE` permite que un extraño modifique y destruya el registro, y el listado devuelve todas las facturas. La ruta de admin está "protegida" por el menú: `/me` no muestra el enlace de admin a los usuarios comunes, y la ruta en sí nunca mira el rol.

Nada falla para un usuario honesto, y por eso esta falla sobrevive a las revisiones y a las pruebas del camino feliz: la verificación ausente no produce ningún error.

## La corrección

Una única función pura decide, y niega por defecto:

```ts
can(user, action, resource): boolean
```

| Regla | Permitido cuando |
| --- | --- |
| `list` en la colección de facturas | quien llama tiene sesión iniciada (el contenido se filtra con la regla de `read`) |
| `read`, `update`, `delete` en una factura | quien llama es el dueño, o es admin |
| `use-admin-route` en el área de admin | quien llama es admin |
| cualquier otra cosa | nunca |

Cómo la usan las rutas:

1. Autenticar (`401`).
2. Validar el id con Zod (`400`): solo dígitos, `^[1-9][0-9]{0,8}$`.
3. Cargar el registro (`404`).
4. Preguntar a `can()` usando el dueño **guardado en el servidor** (`403`).
5. Solo entonces entregar el registro al handler. El cuerpo de la modificación es un objeto Zod estricto, así que los campos desconocidos como `ownerId` se rechazan.

El dueño y el rol nunca vienen de la solicitud. El menú que devuelve `/me` se deriva de la misma política, como comodidad: la protección es la verificación dentro de la ruta.

### 403 o 404

`403` es honesto y fácil de monitorear, y confirma que el id existe. `404` oculta la existencia, a costa de una depuración más difícil, y solo funciona cuando las dos respuestas son realmente idénticas. El laboratorio usa `403` por defecto y ofrece `hideExistence: true`, que responde el mismo `404` para una factura ajena y para una inexistente. Elige `404` cuando la propia existencia es sensible.

### Qué no es control de acceso

- **Ocultar un botón**: la interfaz se ejecuta en la máquina del usuario, y es el usuario quien decide qué solicitudes se envían.
- **Ids imposibles de adivinar (UUID)**: hacen impracticable la adivinación, y los ids aun así se filtran por URLs, registros, historial, correos y otras respuestas de la API. Un id conocido más una verificación ausente es la misma falla.
- **Ids codificados o con hash**, y **un dueño o rol enviado por el cliente**: ambos los controla quien llama.
- **Solo validar la entrada**: un id bien formado sigue siendo el id de otra persona.

## Qué demuestran las pruebas

| Elemento | Cómo se verifica |
| --- | --- |
| MP-SEC-4.1 una prueba lee el registro de otro usuario falso en la API vulnerable | `tests/idor.test.ts`, "vulnerable API: the flaw is observable": `bob-fake` recibe `200` y la factura de `alice-fake`, la modifica, la borra, lista todas las facturas y llama a la ruta de admin mientras su menú oculta el enlace |
| MP-SEC-4.2 la misma prueba recibe `403` en la API corregida | `tests/idor.test.ts`, "fixed API: the same attempts are blocked": las mismas funciones de escenario reciben `403`, el registro guardado no cambia y el uso normal sigue respondiendo `200` |
| MP-SEC-4.2 matriz de autorización | `tests/matrix.test.ts`: 4 filas (anónimo, dueño, otro usuario, admin) por 5 columnas (leer, modificar, borrar, listar, ruta de admin), generadas desde una tabla, cada celda afirmada, para las dos versiones. También el contenido del listado para cada llamador |
| MP-SEC-4.2 una política, negar por defecto | `tests/policy.test.ts` prueba `can()` por separado, incluidas acciones y tipos de recurso desconocidos. `tests/matrix.test.ts` recorre todas las rutas registradas y exige `401` sin sesión |
| MP-SEC-4.2 ids validados con Zod | `tests/idor.test.ts`: los ids mal formados reciben `400`, un cuerpo con un `ownerId` de más se rechaza y el dueño no cambia |
| Aislamiento del laboratorio | `tests/network.test.ts`: una solicitud a `http://example.com` falla desde dentro del contenedor |

La matriz de la API corregida:

| | leer | modificar | borrar | listar | ruta de admin |
| --- | --- | --- | --- | --- | --- |
| anónimo | 401 | 401 | 401 | 401 | 401 |
| dueño | 200 | 200 | 200 | 200 (propias) | 403 |
| otro usuario | 403 | 403 | 403 | 200 (propias) | 403 |
| admin | 200 | 200 | 200 | 200 (todas) | 200 |

## Cómo ejecutarlo

```sh
cd projects/security/access-control-lab
./setup-unix-access-control-lab.sh     # build, verificación de tipos y pruebas
docker compose run --rm demo           # el paso a paso
docker compose down -v --remove-orphans
```
