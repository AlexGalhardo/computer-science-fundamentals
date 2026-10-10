# normalisation-tool

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Una herramienta pequeña que muestra cómo las **dependencias funcionales determinan las formas normales**. Dale una relación y sus dependencias e imprime, paso a paso, la cobertura mínima, los cierres de atributos, las claves candidatas, la forma normal más alta con la dependencia que viola la siguiente, y las descomposiciones a la 3FN y a la FNBC. Cada descomposición se verifica con la prueba **chase** (join sin pérdida) y en cuanto a la preservación de dependencias. Python, solo con la biblioteca estándar.

Explicación completa: [docs/es/databases/normalisation-tool.md](../../../docs/es/databases/normalisation-tool.md).

## Temas del quiz que demuestra

- `databases` / `functional-dependencies-and-normalisation`: cierre, claves candidatas, cobertura mínima, 2FN, 3FN, FNBC, descomposición sin pérdida y preservación de dependencias.
- `databases` / `relational-model`: claves candidatas y superclaves.

## Cómo ejecutarla

El único requisito es Docker.

```sh
./setup-unix-normalisation-tool.sh        # Linux y macOS
./setup-windows-normalisation-tool.ps1    # Windows
```

El script construye la imagen fijada, ejecuta el linter, la verificación del formateador y las pruebas, y luego imprime la explicación del ejemplo por defecto.

## Demo

Un comando imprime el razonamiento para el esquema de ejemplo `AULA(aluno, disciplina, professor)`:

```sh
docker compose run --rm explain --lang es
```

Otros usos:

```sh
docker compose run --rm explain --list --lang es               # ejemplos incluidos
docker compose run --rm explain --example supplier --lang es   # un ejemplo, en español (`--lang` acepta `en`, `pt` o `es`)
docker compose run --rm explain --lang es "R(A, B, C, D)" "A, B -> C; C -> D; D -> A"
```

Un fragmento de la salida (algunas líneas omitidas):

```text
2. Claves candidatas
  atributos en ningún lado derecho (están en toda clave): {aluno}
  {aluno, disciplina}+ = {aluno, disciplina, professor}
      aluno, disciplina -> professor  agrega {professor}
      alcanza todos los atributos, así que es clave.
  claves candidatas: {aluno, disciplina}  {aluno, professor}

3. Forma normal
  2FN: ok
  3FN: ok
  FNBC: violada
      professor -> disciplina: el determinante no es superclave.
  forma normal más alta: 3FN
```

## Estructura

| Archivo en `python/` | Contenido |
| --- | --- |
| `fd.py` | lectura, cierre, claves candidatas, cobertura mínima, proyección de dependencias |
| `normal_forms.py` | verificaciones de 2FN, 3FN y FNBC, con la dependencia que viola |
| `decompose.py` | síntesis a la 3FN, descomposición a la FNBC, prueba chase, preservación de dependencias |
| `explain.py` | el texto paso a paso, en inglés, portugués y español |
| `cli.py` | línea de comandos |
| `examples.py` | esquemas de aula con sus claves y formas normales documentadas |

## Pruebas

```sh
docker compose run --rm python-test
```

- Ocho esquemas de aula devuelven las claves candidatas y la forma normal documentadas.
- El chase acepta la división sin pérdida y rechaza las divisiones con pérdida del clásico `R(A, B, C)` con `A -> B`.
- Para los esquemas de aula y para 300 conjuntos aleatorios de dependencias, las dos descomposiciones son sin pérdida según el chase, la síntesis a la 3FN preserva todas las dependencias y produce relaciones en 3FN, y el algoritmo de la FNBC produce relaciones en FNBC.
- La línea de comandos se prueba en los tres idiomas.

## Límites

La herramienta razona solo con dependencias funcionales, así que se detiene en la FNBC: las dependencias multivaluadas y de join (4FN y 5FN) quedan fuera. La búsqueda de claves y la proyección de dependencias prueban subconjuntos de atributos, así que la línea de comandos acepta como máximo 12 atributos.
