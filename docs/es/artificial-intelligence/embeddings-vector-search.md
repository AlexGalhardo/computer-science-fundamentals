# Embeddings y búsqueda vectorial

> English version: [docs/en/artificial-intelligence/embeddings-vector-search.md](../../en/artificial-intelligence/embeddings-vector-search.md) · Versão em português: [docs/pt/artificial-intelligence/embeddings-vector-search.md](../../pt/artificial-intelligence/embeddings-vector-search.md)

Miniproyecto MP-AI-3, en [`projects/artificial-intelligence/embeddings-vector-search`](../../../projects/artificial-intelligence/embeddings-vector-search). Enseña cómo el significado se convierte en un vector y cómo se encuentran vectores parecidos. La base está en la sección 8 de [la página del área](README.md#8-embeddings-y-similitud), con el producto punto y el coseno de la [sección 3](README.md#3-vectores-y-matrices) y el paso de recuperación de la [sección 11](README.md#11-uso-de-llms).

## El problema

Un programa compara números, no significados. Para preguntar "¿qué texto trata de lo mismo que esta pregunta?", cada palabra y cada texto debe convertirse primero en una lista de números, un **vector**, construido de modo que significados parecidos den vectores parecidos. Después aparecen dos problemas más: cómo medir "parecido", y cómo encontrar el vector más parecido entre muchos sin mirarlos todos.

El proyecto hace los tres pasos solo con conteo y aritmética. No hay red neuronal y no se entrena nada.

## Paso 1: a una palabra se la conoce por la compañía que tiene

La **hipótesis distribucional** dice que las palabras usadas en los mismos contextos tienen significados parecidos. Así que, para cada palabra, se cuentan las palabras que aparecen cerca de ella. Toma un corpus de cuatro frases y llama "cerca" a cualquier cosa de la misma frase:

```text
the dog eats     the cat eats     the car stops     the bus stops
```

La **tabla de coocurrencia** tiene una fila y una columna por palabra. La fila "dog" dice con qué frecuencia apareció cada otra palabra cerca de "dog":

```text
          bus  car  cat  dog  eats  stops  the
dog        0    0    0    0    1     0      1
cat        0    0    0    0    1     0      1
car        0    0    0    0    0     1      1
the        1    1    1    1    2     2      0
```

Cada fila es el vector de su palabra. "dog" y "cat" tienen la misma fila, aunque nunca aparecen en la misma frase: son parecidas porque tienen la misma compañía. Esa es toda la idea de un embedding.

En el proyecto, "cerca" es una ventana de 4 palabras a cada lado, dentro de una frase, y el corpus tiene 2492 frases y 760 palabras distintas, así que cada vector de palabra tiene 760 números.

## Paso 2: medir la similitud con el coseno

El **producto punto** de dos vectores los multiplica posición por posición y suma los resultados. La **norma** es la longitud de un vector: la raíz cuadrada de su producto punto consigo mismo. La **similitud del coseno** es el producto punto dividido entre las dos normas:

```text
cosine(a, b) = dot(a, b) / (norm(a) * norm(b))
```

Mide el ángulo entre los vectores e ignora su longitud: 1 significa la misma dirección, 0 significa nada en común. Para "dog" y "car" de arriba:

```text
dot(dog, car)  = 1*1 (the column "the") + 0 everywhere else = 1
norm(dog)      = sqrt(1*1 + 1*1) = 1.414        norm(car) = 1.414
cosine         = 1 / (1.414 * 1.414) = 0.5
```

Medio parecidas, y lo único que comparten es "the". Eso es un problema.

Si cada vector se divide primero entre su propia norma, todas las normas son 1 y el coseno es solo el producto punto. El proyecto guarda cada vector así.

## Paso 3: por qué los conteos crudos no bastan, y PPMI

"the" está cerca de casi toda palabra. En una tabla real su columna contiene el mayor número de casi todas las filas, así que todas las filas apuntan en casi la misma dirección y cada palabra se parece a cualquier otra.

**PMI** (información mutua puntual, pointwise mutual information) hace una pregunta mejor: ¿cuántas veces más a menudo se encuentran estas dos palabras de lo que lo harían por azar, dada la frecuencia de cada una?

```text
pmi(w, c) = log2( count(w, c) * total / (row sum of w * row sum of c) )
```

En la tabla pequeña el total de todos los conteos es 24, la fila de "dog" suma 2, la de "the" suma 8 y la de "eats" suma 4:

```text
pmi(dog, the)  = log2(1 * 24 / (2 * 8)) = log2(1.5) = 0.585    no surprise
pmi(dog, eats) = log2(1 * 24 / (2 * 4)) = log2(3)   = 1.585    typical of "dog"
```

**PPMI** conserva los valores positivos y escribe 0 para el resto (un par visto con menos frecuencia que el azar, o nunca). Con las filas PPMI, el coseno de "dog" y "car" baja de 0.5 a 0.12, y el coseno de "dog" y "cat" se queda en 1. Ambos números los comprueban las pruebas.

## El corpus

El corpus lo genera `ts/src/generate-corpus.ts` con una semilla fija, así que no se usa texto de terceros y el archivo se puede reconstruir byte por byte. Hay 8 grupos de 10 palabras (animales, comidas, vehículos, colores, clima, instrumentos, dispositivos, profesiones). Cada grupo tiene sus propias plantillas de frase y sus propias palabras de contexto:

```text
the rabbit and the goat slept behind the meadow
the warm bread smelled good in the kitchen
the driver parked the bus beside the train
he mixed black and pink paint on the palette
```

Una frase de cada diez mezcla dos grupos ("a black deer stood beside the tram"), porque el texto real no está ordenado. Los 30 pasajes escritos a mano de la demo de recuperación se añaden al corpus, para que sus palabras también tengan vectores.

El código que construye los vectores nunca ve los grupos. Recuperarlos es la prueba.

## Resultado 1: los vecinos caen en el grupo esperado

Los 5 vecinos más cercanos de una palabra de cada grupo, entre las 760 palabras:

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

Para las 80 palabras de prueba, 399 de los 400 vecinos pertenecen al grupo de la palabra (99.8%). La excepción es instructiva: el quinto vecino de "rabbit" es "behind". El corpus usa "behind" solo en frases sobre animales, así que su fila se parece a la fila de un animal. Los vectores capturan cómo se usa una palabra, que no siempre es lo que una persona llamaría su significado.

Lo que cambia PPMI se ve en el contraste entre palabras relacionadas y no relacionadas:

| Weighting | Mean cosine, same group | Mean cosine, different groups | Gap |
| --- | ---: | ---: | ---: |
| raw counts | 0.964 | 0.820 | 0.144 |
| PPMI | 0.650 | 0.031 | 0.619 |

Con conteos crudos, dos palabras de grupos distintos (un perro y una impresora, por ejemplo) tienen un coseno de 0.82 en promedio. En este corpus tan regular el ranking de los vecinos sigue saliendo bien con conteos crudos (100.0% en el grupo), pero todo queda apretado entre 0.82 y 0.96. Con PPMI, las palabras no relacionadas quedan cerca de 0 y los grupos se separan.

## Encontrar el vector más cercano: fuerza bruta

La **fuerza bruta** compara la consulta con cada vector guardado y se queda con el mejor. Siempre acierta, y cuesta un producto punto por vector guardado: n comparaciones para n vectores.

En TypeScript eso es un bucle. En Python con NumPy es una línea, `vectors @ query`: una matriz con un vector guardado por fila, multiplicada por la consulta, da todas las similitudes a la vez. Esto es lo que hace una base de datos vectorial cuando ejecuta una búsqueda exacta.

## Encontrar el vector más cercano: un índice de planos aleatorios

Un **índice aproximado** mira solo una parte prometedora de los datos. El que se construye aquí es LSH de hiperplanos aleatorios (locality-sensitive hashing).

Dibuja un plano aleatorio que pase por el origen. Cada vector cae de un lado o del otro, y el lado es el signo del producto punto del vector con la dirección perpendicular al plano. El hecho útil es:

```text
chance that two vectors fall on the same side = 1 - (angle between them) / 180 degrees
```

Los vectores que apuntan casi en la misma dirección rara vez quedan separados. Ahora dibuja varios planos y escribe los lados como bits. Cada patrón de bits es una **cubeta** (bucket):

```text
3 planes:   vector a -> above, below, above -> 101 -> bucket 5
            vector b -> above, below, above -> 101 -> bucket 5   (a and b are similar)
            vector c -> below, above, below -> 010 -> bucket 2
```

Para buscar, calcula la cubeta de la consulta y compárala solo con los vectores de esa cubeta.

Hay tres perillas:

- **Bits** (planos por tabla). Más bits dan más cubetas y más pequeñas: menos comparaciones, y una mayor probabilidad de que uno de los planos aparte al vecino verdadero.
- **Tablas.** Una tabla puede fallar, así que el índice mantiene varias, cada una con sus propios planos, y une sus candidatos: menos fallos, más comparaciones.
- **Sondeo (probing).** El fallo más probable es un vecino que difiere en exactamente un bit. Invertir un bit de la clave a la vez visita esas cubetas también.

Un cálculo muestra por qué una tabla no basta. Un vecino con coseno 0.97 está a 14 grados, así que un plano mantiene al par junto con probabilidad 1 - 14/180 = 0.92. Doce planos lo mantienen todos juntos con probabilidad 0.92 elevado a 12, cerca de 0.38. Con cuatro tablas independientes la probabilidad de que al menos una funcione es 1 - (1 - 0.38) elevado a 4, cerca de 0.85.

## Resultado 2: coincidencia frente a comparaciones

Qué se indexó: las 1927 frases del corpus con palabras de contenido distintas, cada una convertida en un vector de 760 números (como en el paso "Recuperación" de más abajo). Los 80 vectores de palabras y los 30 pasajes por sí solos serían muy pocos para que un índice importara. Las consultas son 400 frases nuevas de otra semilla, ninguna de ellas en el corpus. Para cada consulta, la fuerza bruta da la frase verdaderamente más cercana, y el índice acierta cuando su mejor resultado es esa misma frase.

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

Cómo leerla:

1. Una tabla de 12 bits compara la consulta con unos 10 vectores de 1927 y encuentra al vecino verdadero solo 37.0% de las veces. La velocidad se pagó con respuestas equivocadas.
2. Más tablas suben la coincidencia y el costo a la vez: 37.0%, 82.8%, 94.3% para 1, 4 y 8 tablas. El 82.8% de cuatro tablas se acerca al 0.85 del cálculo de arriba.
3. Menos bits (10 en lugar de 12) hacen cubetas más grandes: 97.3% en lugar de 94.3%, con más vectores comparados.
4. Sondear las cubetas vecinas es la forma más barata de subir: 4 tablas con sondeo llegan a 98.5% con 11.4% del trabajo de la fuerza bruta. Esa es la configuración elegida, y la prueba de MP-AI-3.2 afirma que se mantiene en 95% o más.
5. La columna "Plane dot products" es el costo de calcular las claves de cubeta de la consulta (tablas por bits). Es parte del trabajo, así que se cuenta en el total.

La proporción de respuestas correctas de un índice aproximado es su **recall**. Todo índice vectorial real es un punto de una curva como esta, y elegir el punto es una decisión de ingeniería.

## Recuperación: la pregunta elige los pasajes

Un texto completo se convierte en un vector sumando los vectores de sus palabras y normalizando la suma:

```text
vector(text) = normalise( sum over the words of idf(word) * vector(word) )
idf(word)    = ln( number of sentences / sentences that contain the word )
```

El peso **idf** hace que una palabra rara cuente más que una común. Una lista de exclusión (stop list) corta elimina las palabras funcionales ("the", "how", "why"), que un corpus tan pequeño no puede reconocer contando. Una palabra que no está en el vocabulario no tiene vector y se ignora.

Los 30 pasajes se incrustan una vez. Una pregunta se incrusta de la misma manera, se compara con los 30 vectores de pasajes por fuerza bruta, y se imprimen los 3 mejores:

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

Este es el paso de recuperación de **RAG** (generación aumentada por recuperación, retrieval-augmented generation): los pasajes encontrados aquí son lo que se pegaría en el prompt de un modelo de lenguaje, para que responda a partir de ellos. El proyecto se detiene en la recuperación. No se llama a ningún modelo de lenguaje.

## Resultado 3: los pasajes recuperados

| Question | Expected | 1st | 2nd | 3rd |
| --- | --- | --- | --- | --- |
| Which animal guards the farm at night? | p01 | p01 The farm dog (0.666) | p08 Night trains (0.315) | p15 The first snow (0.282) |
| How do I bake a loaf of bread? | p04 | p04 Baking bread (0.554) | p05 A pot of soup (0.217) | p10 Mixing paint (0.208) |
| Which colours do I mix to get green? | p10 | p10 Mixing paint (0.569) | p04 Baking bread (0.348) | p05 A pot of soup (0.172) |
| Why is my computer so slow? | p19 | p19 A slow laptop (0.519) | p16 Learning the piano (0.217) | p07 The morning bus (0.124) |
| What happens when thunder and rain arrive? | p13 | p13 A summer storm (0.594) | p14 Morning fog (0.281) | p15 The first snow (0.266) |
| How do musicians tune the strings of a guitar? | p18 | p18 Tuning a guitar (0.702) | p16 Learning the piano (0.314) | p17 The street band (0.197) |
| Who checks each patient in the hospital at night? | p22 | p22 The night nurse (0.558) | p03 Sheep in the hills (0.239) | p18 Tuning a guitar (0.142) |
| What do bees make from flowers? | p26 | p26 Bees and honey (0.611) | p27 Why we sleep (0.221) | p05 A pot of soup (0.121) |
| Why do leaves turn red in autumn? | p11 | p11 Autumn leaves (0.839) | p07 The morning bus (0.274) | p02 Foxes at dusk (0.225) |
| Is the wolf a danger to the flock? | p03 | p03 Sheep in the hills (0.556) | p01 The farm dog (0.209) | p20 The office printer (0.173) |
| Will drizzle or hail come tomorrow? | p13, p14 or p15 | p13 A summer storm (0.558) | p14 Morning fog (0.382) | p15 The first snow (0.361) |
| Why does the sea rise and fall? | p25 | p17 The street band (0.346) | p25 Tides (0.272) | p04 Baking bread (0.255) |

Tres cosas para leer en ella:

1. Las 10 preguntas de la demo recuperan primero el pasaje esperado, con una distancia clara respecto al segundo.
2. "Will drizzle or hail come tomorrow?" encuentra los tres pasajes del clima, y ninguno contiene "drizzle" ni "hail". Una búsqueda por palabras exactas no devolvería nada. Aquí los vectores de "drizzle" y "hail" están cerca de los de "rain", "snow" y "fog", que los pasajes sí contienen. Esto es lo que los embeddings añaden a una búsqueda.
3. "Why does the sea rise and fall?" es un fallo, conservado a propósito. El pasaje correcto dice "rises" y "falls". Para un modelo que solo cuenta palabras, "rise" y "rises" no tienen relación, y "fall" aparece en el pasaje sobre la banda callejera (caen monedas en un estuche de guitarra). El pasaje correcto queda en segundo lugar.

## El mismo resultado en dos lenguajes

TypeScript es la implementación de referencia, con cada producto punto escrito como un bucle. Python está aquí porque NumPy cambia cómo se lee el código: la tabla de coocurrencia es una matriz, PPMI es una expresión sobre toda la matriz, y una búsqueda es `vectors @ query`.

Ambos deben escribir las mismas tablas, y tres detalles lo hacen posible:

- El vocabulario está ordenado, así que cada palabra tiene el mismo número de fila en ambos.
- Los planos aleatorios vienen de un pequeño generador con semilla (mulberry32) escrito a mano en ambos lenguajes, usando solo aritmética de enteros. Los generadores incorporados de los dos lenguajes nunca pueden coincidir.
- El índice guarda cada contenido distinto una sola vez. Dos frases con las mismas palabras de contenido en otro orden tienen el mismo vector, y un empate entre dos copias lo decidiría el último dígito de una suma.

Las pruebas de ambos lenguajes comparan su salida con `data/expected.json`, y los dos archivos de resultados son idénticos salvo por el título y el comando que los generó.

## Qué añade un sistema real

- **Embeddings aprendidos y densos.** Un modelo entrenado asigna a una palabra o a un texto entero unos cientos de números, ninguno atado a una palabra concreta. Los significados parecidos quedan cerca incluso cuando la redacción difiere ("rise" y "rises", "car" y "automobile"), y el vector de una palabra puede depender de la frase que la rodea.
- **Tokens de subpalabra.** Con los tokens de [bpe-tokenizer](bpe-tokenizer.md) no hay palabra desconocida: una palabra nunca vista se divide en piezas conocidas.
- **Mejores índices.** Los índices de grafos (HNSW) y los archivos invertidos con cuantización alcanzan un recall alto con muchas menos comparaciones que los planos aleatorios, con millones de vectores.
- **Fragmentación (chunking).** Los documentos largos se cortan en pasajes antes de incrustarse, y el tamaño de los trozos cambia lo que se encuentra.
- **Búsqueda híbrida y reordenamiento (reranking).** Muchos sistemas combinan la búsqueda vectorial con la búsqueda por palabras clave y luego reordenan los mejores candidatos con un modelo más lento y más preciso.
- **El paso de generación.** En RAG los pasajes recuperados van al prompt de un modelo de lenguaje. La respuesta solo puede ser tan buena como lo que se recuperó.

## Ejecútalo

```sh
cd projects/artificial-intelligence/embeddings-vector-search
./setup-unix-embeddings-vector-search.sh
docker compose run --rm ts-search "any question you like"
docker compose run --rm python-search "any question you like"
```

Las palabras que conoce el modelo son las de `data/corpus.txt` y `data/passages.json`, así que las preguntas deben estar en inglés y usar ese vocabulario. El comando imprime qué palabras usó y cuáles ignoró.
