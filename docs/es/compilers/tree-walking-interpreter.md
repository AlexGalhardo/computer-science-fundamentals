# Intérprete que recorre el árbol

> English version: [docs/en/compilers/tree-walking-interpreter.md](../../en/compilers/tree-walking-interpreter.md) · Versão em português: [docs/pt/compilers/tree-walking-interpreter.md](../../pt/compilers/tree-walking-interpreter.md)

Mini-proyecto MP-COMP-2, en [`projects/compilers/tree-walking-interpreter`](../../../projects/compilers/tree-walking-interpreter). Enseña cómo se ejecuta un árbol de sintaxis: entornos, ámbitos y closures. El lenguaje es el definido en [MP-COMP-1](mini-language-parser.md).

## Ejecutar un árbol

El parser deja un árbol. La forma más simple de ejecutarlo es recorrerlo: para ejecutar un nodo, se ejecutan los hijos que necesita y se combinan los resultados. `1 + 2 * 3` se evalúa de abajo hacia arriba, primero `2 * 3` porque está más profundo en el árbol, sin que quede ninguna regla de precedencia por aplicar. El evaluador de `ts/src/interpreter.ts` es un `switch` con un caso por tipo de nodo, así que tiene la misma forma que la gramática.

Nada se traduce: el programa que corre es el propio árbol. Esa es la diferencia con un compilador, que traduciría el árbol a otro programa (código máquina o bytecode) para ejecutarlo más tarde.

## Entornos

Una variable necesita un lugar donde vivir. Un **entorno** es una tabla de nombres a valores para un ámbito, con un puntero al entorno del ámbito que lo rodea.

```text
let x = 1;            global:   x = 1, f = <fn f>
fn f(a) {                ▲
	let y = a + x;    call f:   a = 10, y = 11
	{                    ▲
		let x = 5;    block:    x = 5
		print x + y;
	}
}
f(10);
```

- Una búsqueda empieza en el entorno actual y avanza hacia afuera. Gana la primera coincidencia, por eso la `x` interna oculta a la global.
- Un bloque crea un entorno cuando empieza y lo descarta cuando termina.
- Una llamada crea un entorno para los parámetros: esta es la activación de la función, el trabajo que hace un marco de pila en el código compilado.

## Ámbito estático y closures

Cuando se llama a `f`, el padre de su nuevo entorno es **el entorno donde se definió `f`**, no el entorno de quien llama. Esto es ámbito estático (léxico): a qué variable se refiere un nombre puede leerse del texto del programa. El ejemplo `scopes.mini` lo muestra: `show()` imprime la `x` global incluso cuando se llama desde un bloque que tiene su propia `x`.

Para que eso sea posible, un valor función es una **closure**: el código más el entorno que estaba activo cuando se ejecutó el comando `fn`.

```text
fn makeCounter() {
	let count = 0;
	fn increment() { count = count + 1; return count; }
	return increment;
}
let first = makeCounter();
```

Después de que `makeCounter` retorna, su entorno normalmente sería basura. Pero `increment` aún apunta a él, así que `count` sigue vivo, y cada llamada a `makeCounter` crea un `count` separado. Esta es la razón por la que los entornos no pueden vivir en una pila simple en un lenguaje con closures: una activación puede sobrevivir a la llamada que la creó. Aquí el recolector de basura del anfitrión (JavaScript) los libera cuando desaparece la última closure.

## Salir antes de tiempo

`return` tiene que abandonar todos los bloques y bucles entre él y la llamada. Un intérprete que recorre el árbol no tiene una instrucción de salto, así que `execute` devuelve un pequeño valor de finalización: `undefined` para "continuar", o `{ returned: value }`, que cada sentencia envolvente pasa hacia arriba hasta que la llamada lo recibe.

## Errores de ejecución

El lexer y el parser rechazan el texto que no es un programa. Algunos fallos solo aparecen cuando el programa corre: un nombre que nunca se declaró, una llamada con la cantidad equivocada de argumentos, una división entre cero, `1 + "a"`. Cada nodo del árbol lleva la línea y la columna de su token, así que el error dice dónde:

```text
[line 2, column 10] runtime error: expected 2 arguments but got 1
```

## Por qué es lento

Recorrer un árbol cuesta más que el trabajo que pide el programa. Cada visita a un nodo es un despacho según el tipo de nodo, los nodos están dispersos en la memoria, y cada acceso a una variable busca por nombre en la cadena de entornos, en una tabla hash. [MP-COMP-3](bytecode-vm.md) compila el mismo árbol a bytecode, resuelve las variables locales a posiciones de la pila antes de ejecutar, y mide la diferencia.

## Cómo ejecutarlo

```sh
./setup-unix-tree-walking-interpreter.sh                                  # construye y prueba
docker compose run --rm ts-repl                                           # REPL que conserva el estado
docker compose run --rm ts-repl bun run mini ../examples/closures.mini    # ejecuta un programa
```

## Criterios de aceptación

| Ítem | Criterio | Dónde se verifica |
| --- | --- | --- |
| MP-COMP-2.1 | una suite de programas de ejemplo imprime la salida esperada | `examples/*.mini` contra `examples/*.out`, en `ts/tests/interpreter.test.ts` |
| MP-COMP-2.2 | las pruebas cubren variable no definida, cantidad incorrecta de argumentos y división entre cero | `ts/tests/interpreter.test.ts` |
| MP-COMP-2.3 | una sesión grabada define una función y la llama más tarde | README del mini-proyecto, y la prueba de la sesión del REPL |

## Temas relacionados del quiz

- `compilers` / `compiler-structure`
- `compilers` / `run-time-environments`
- `compilers` / `interpreters-vms-jit`
