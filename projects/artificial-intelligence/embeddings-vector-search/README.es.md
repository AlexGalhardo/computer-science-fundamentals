# embeddings-vector-search

> English version: [README.md](README.md) · Versão em português: [README.pt-BR.md](README.pt-BR.md)

Enseña **cómo el significado se convierte en un vector y cómo se encuentran vectores parecidos**. Los vectores de palabras se construyen contando qué palabras aparecen cerca unas de otras en un corpus generado para el proyecto, sin ninguna red neuronal. Los vecinos más cercanos de una palabra resultan ser las palabras de su grupo. Una búsqueda por fuerza bruta se compara con un índice de planos aleatorios (LSH) que hace muchas menos comparaciones y a veces se equivoca. Y una pregunta recupera los pasajes con más probabilidad de responderla, que es el paso de búsqueda de RAG.

Explicación completa: [docs/es/artificial-intelligence/embeddings-vector-search.md](../../../docs/es/artificial-intelligence/embeddings-vector-search.md).

## Temas del quiz que demuestra

- `artificial-intelligence` / `embeddings`: la hipótesis distribucional, conteos de coocurrencia, ponderación PPMI, una palabra como una fila de números, similitud del coseno, vecinos más cercanos, fuerza bruta frente a un índice aproximado, recall (con qué frecuencia el índice encuentra el vector verdaderamente más cercano).
- `artificial-intelligence` / `linear-algebra`: producto punto, norma, normalizar un vector a longitud 1, la similitud del coseno como producto punto, una búsqueda como un solo producto matriz-vector.
- `artificial-intelligence` / `using-llms`: el paso de recuperación de RAG, incrustar una pregunta y los pasajes de la misma manera, los k mejores pasajes por puntuación, qué le hace una palabra desconocida a la búsqueda.

## Ejecutar

El único requisito es Docker.

```sh
./setup-unix-embeddings-vector-search.sh        # Linux and macOS
./setup-windows-embeddings-vector-search.ps1    # Windows
```

El script construye ambas imágenes, ejecuta las pruebas, ejecuta las dos demos y recupera los pasajes para una pregunta.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `data/corpus.txt` | 2400 frases cortas escritas por el generador con semilla, sobre 8 grupos de 10 palabras (animales, comidas, vehículos, colores, clima, instrumentos, dispositivos, profesiones) |
| `data/groups.json` | las 80 palabras de prueba y sus grupos. Solo lo leen las pruebas y la demo, nunca el código que construye los vectores |
| `data/passages.json` | 30 pasajes cortos escritos a mano para la demo de recuperación |
| `data/questions.json` | 10 preguntas de la demo con el pasaje que cada una debería recuperar |
| `data/queries.txt` | 400 frases nuevas generadas, las consultas del experimento de búsqueda |
| `data/expected.json` | los vecinos, la tabla de comparaciones y los pasajes recuperados que ambas implementaciones deben reproducir |
| `ts/src/generate-corpus.ts` | el generador de `corpus.txt`, `queries.txt` y `groups.json` |
| `ts/src/rng.ts` | el generador aleatorio con semilla (mulberry32), escrito a mano |
| `ts/src/embeddings.ts` | conteos de coocurrencia, PPMI, coseno, vecinos más cercanos |
| `ts/src/search.ts` | fuerza bruta y el índice de planos aleatorios |
| `ts/src/retrieval.ts` | un texto como el promedio ponderado de sus vectores de palabras, y el ranking de los pasajes |
| `ts/src/experiments.ts`, `ts/src/demo.ts` | los tres experimentos y las tablas de `results/results-ts.md` |
| `ts/src/cli.ts` | imprime los pasajes recuperados para una pregunta |
| `python/*.py` | los mismos módulos en Python con NumPy, escribiendo `results/results-python.md` |
| `results/` | resultados confirmados (committed) de ambos lenguajes |

TypeScript es la implementación de referencia (`oven/bun:1.4.2`, sin dependencias): cada producto punto es un bucle visible. Python (`python:3.14.8-slim-trixie` con `numpy==2.5.3`) está aquí porque la lección cambia: la misma búsqueda es **un solo producto matriz-vector**, `vectors @ query`, y la verdad para las 400 consultas es un producto de matrices, `queries @ vectors.T`. Esa línea es lo que ejecuta una base de datos vectorial para una búsqueda exacta, y explica por qué la fuerza bruta sigue siendo competitiva durante más tiempo de lo que sugieren los conteos de comparaciones.

Obtener las mismas tablas en dos lenguajes exige que cada elección aleatoria sea reproducible en ambos. Los generadores aleatorios incorporados difieren, así que `rng.ts` y `rng.py` implementan el mismo generador de 32 bits, y los planos usan solo sumas (sin `log` ni `cos`, cuyo último dígito puede diferir entre lenguajes).

## Pruebas

```sh
docker compose run --rm ts-test
docker compose run --rm python-test
```

El servicio de Python también ejecuta `ruff check` y `ruff format --check`. Cada suite tiene pruebas con el nombre de los criterios de aceptación (`MP-AI-3.1`, `MP-AI-3.2`, `MP-AI-3.3`) y compara sus vecinos, su tabla de comparaciones y sus pasajes recuperados con `data/expected.json`, que es como se verifica que son "iguales en ambos lenguajes". La suite de TypeScript también comprueba que el generador sigue escribiendo el corpus confirmado byte por byte.

## Demo

Un comando imprime los pasajes recuperados para una pregunta:

```sh
docker compose run --rm ts-search "Which animal guards the farm at night?"
docker compose run --rm python-search "Which animal guards the farm at night?"
```

```text
question: "Which animal guards the farm at night?"
words used: guards farm night
not in the vocabulary: animal
compared with 30 passages by brute force

1. score 0.666  p01  The farm dog
   A farm dog sleeps lightly beside the barn. At night it guards the yard and barks when a fox comes near the hens. In the morning the farmer rewards it with a bone.
2. score 0.315  p08  Night trains
   A night train crosses the country while its passengers sleep in narrow beds. It stops at small stations in the dark, and the engine is changed at the border before sunrise.
3. score 0.282  p15  The first snow
   The first snow of winter usually falls at night and melts by noon. Real cold comes later, when frost hardens the ground and the snow stays on the hills for weeks.
```

Una pregunta que no comparte ninguna palabra de contenido con los pasajes que encuentra funciona solo a través de los vectores de palabras ("drizzle" y "hail" están cerca de "rain" y "snow"):

```text
question: "Will drizzle or hail come tomorrow?"
words used: drizzle hail
not in the vocabulary: come tomorrow
compared with 30 passages by brute force

1. score 0.558  p13  A summer storm
2. score 0.382  p14  Morning fog
3. score 0.361  p15  The first snow
```

Las tres tablas salen de las demos:

```sh
docker compose run --rm ts-demo        # writes results/results-ts.md
docker compose run --rm python-demo    # writes results/results-python.md
```

**Vectores de palabras (MP-AI-3.1).** Los 5 vecinos más cercanos de una palabra de cada grupo, por similitud del coseno:

| Word | Group | 5 nearest neighbours (cosine similarity) |
| --- | --- | --- |
| dog | animals | wolf 0.689, cat 0.674, cow 0.669, rabbit 0.640, deer 0.631 |
| bread | foods | stew 0.657, cake 0.611, rice 0.611, pasta 0.599, soup 0.577 |
| car | vehicles | ship 0.715, tram 0.667, van 0.653, truck 0.643, plane 0.624 |
| red | colours | purple 0.729, yellow 0.724, blue 0.716, black 0.707, pink 0.703 |
| rain | weather | thunder 0.793, sunshine 0.779, drizzle 0.749, hail 0.745, fog 0.650 |
| piano | instruments | harp 0.596, flute 0.561, organ 0.542, cello 0.532, trumpet 0.506 |
| laptop | devices | monitor 0.565, keyboard 0.550, server 0.549, tablet 0.531, phone 0.529 |
| doctor | professions | plumber 0.708, nurse 0.646, lawyer 0.643, engineer 0.625, teacher 0.619 |

Entre las 80 palabras de prueba, 99.8% de los 5 vecinos más cercanos pertenecen al grupo de la palabra (399 de 400, y 79 palabras tienen los 5 en su grupo). El único intruso es "behind" como quinto vecino de "rabbit": el corpus usa "behind" solo en frases sobre animales. El vocabulario tiene 760 palabras, y los vecinos se buscan entre todas ellas, no solo entre las palabras de prueba.

| Weighting | Mean cosine, same group | Mean cosine, different groups | Gap |
| --- | ---: | ---: | ---: |
| raw counts | 0.964 | 0.820 | 0.144 |
| PPMI | 0.650 | 0.031 | 0.619 |

Con conteos crudos, dos palabras de grupos distintos aún tienen un coseno de 0.82, porque cada fila está dominada por las mismas columnas frecuentes ("the", "a", "and"). PPMI baja las palabras no relacionadas a 0.03.

**Fuerza bruta frente al índice (MP-AI-3.2).** Indexadas: las 1927 frases del corpus con palabras de contenido distintas, un vector de 760 números cada una. Consultas: las 400 frases de `data/queries.txt`, ninguna de ellas en el corpus.

| Search | Tables | Bits | Probing | Same top result as brute force | Vectors compared (average) | Plane dot products | Total | Share of brute force |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| brute force | - | - | - | 100.0% | 1927 | 0 | 1927 | 100.0% |
| index | 1 | 12 | no | 37.0% | 9.8 | 12 | 21.8 | 1.1% |
| index | 4 | 12 | no | 82.8% | 51.5 | 48 | 99.5 | 5.2% |
| index | 8 | 12 | no | 94.3% | 84.4 | 96 | 180.4 | 9.4% |
| index | 8 | 10 | no | 97.3% | 117.1 | 80 | 197.1 | 10.2% |
| index | 2 | 10 | 1 bit | 94.3% | 113.1 | 20 | 133.1 | 6.9% |
| **index (chosen)** | 4 | 12 | 1 bit | 98.5% | 172.5 | 48 | 220.5 | 11.4% |
| index | 8 | 12 | 1 bit | 100.0% | 250.1 | 96 | 346.1 | 18.0% |

La configuración elegida devuelve el mismo mejor resultado que la fuerza bruta en 98.5% de las consultas con 11.4% de los productos punto. La configuración más rápida hace 1.1% del trabajo y acierta solo 37.0% de las veces. "Plane dot products" es el costo de calcular las claves de cubeta de la consulta, que un conteo honesto debe incluir.

**Recuperación (MP-AI-3.3).** Las 10 preguntas de la demo de `data/questions.json` recuperan primero el pasaje esperado. La tabla completa, con los tres pasajes y las puntuaciones de cada pregunta, está en [`results/results-ts.md`](results/results-ts.md).

No hay panel (dashboard): las tablas de [`results/`](results/) son el resultado. Los dos lenguajes escribieron las mismas tablas.

## Límites

- El corpus se genera a partir de plantillas, así que sus grupos son mucho más limpios que en el texto real. Por eso 99.8% de los vecinos son correctos, y por eso incluso los conteos crudos ordenan bien los vecinos aquí (100.0%). Lo que pierden los conteos crudos es el contraste entre palabras relacionadas y no relacionadas, mostrado en la segunda tabla.
- Un vector de texto es un promedio, así que se pierde el orden de las palabras: "the dog chased the cat" y "the cat chased the dog" reciben el mismo vector.
- Una palabra fuera del vocabulario se ignora, y también toda forma que el corpus nunca mostró. La pregunta "Why does the sea rise and fall?" recupera primero "The street band" y en segundo lugar el pasaje correcto, "Tides": el pasaje dice "rises" y "falls", que son palabras distintas para un modelo sin noción de formas de palabra, mientras que "fall" aparece en el pasaje equivocado.
- Los pesos idf se cuentan sobre 2492 frases, muy pocas para reconocer palabras funcionales, así que se usa una lista de exclusión (stop list) de 90 palabras cuando se incrusta un texto.
- Cada vector de palabra tiene 760 números, uno por palabra del vocabulario, y la mayoría son cero. Los embeddings reales son densos y cortos (cientos de números), producidos por un modelo entrenado.
- 1927 vectores es poco. A este tamaño la fuerza bruta es lo bastante rápida y no hace falta ningún índice. El índice se muestra porque el costo de la fuerza bruta crece con el número de vectores, y con millones de vectores importa. Los sistemas reales usan mejores índices que los planos aleatorios (grafos HNSW, archivos invertidos con cuantización).
- La coincidencia y los conteos de comparaciones dependen de la semilla de los planos. La semilla confirmada es 42. Otras cinco semillas, probadas a mano y que no forman parte de la suite de pruebas, dieron de 99.0% a 99.8% de coincidencia para la configuración elegida, con 132 a 167 vectores comparados en promedio.
