# Modelo de lenguaje diminuto

> English version: [docs/en/artificial-intelligence/tiny-language-model.md](../../en/artificial-intelligence/tiny-language-model.md) · Versão em português: [docs/pt/artificial-intelligence/tiny-language-model.md](../../pt/artificial-intelligence/tiny-language-model.md)

Miniproyecto MP-AI-4, en [`projects/artificial-intelligence/tiny-language-model`](../../../projects/artificial-intelligence/tiny-language-model). Enseña cómo un modelo de lenguaje predice el siguiente token, desde el conteo hasta la autoatención. La base está en las secciones 9 y 10 de la página del área: [atención y el transformer](README.md#9-atención-y-el-transformer) y [cómo un modelo de lenguaje predice y muestrea](README.md#10-cómo-un-modelo-de-lenguaje-predice-y-muestrea).

## El problema

Un modelo de lenguaje hace una sola cosa: dado el texto hasta ahora, da una probabilidad a cada posible siguiente token. Escribir texto es un bucle alrededor de eso: pedir las probabilidades, elegir un token, añadirlo, volver a pedir.

Este proyecto construye dos modelos así sobre el mismo texto y los compara:

1. una **tabla de bigramas**, hecha contando, que mira solo el token anterior;
2. un pequeño **transformer**, que mira hasta 32 tokens anteriores mediante autoatención.

Ambos están escritos con Python y NumPy. No hay PyTorch ni TensorFlow, así que cada paso, incluido el gradiente de la atención, se puede leer en el código.

Un token aquí es un carácter. Cortar el texto en tokens mayores es otro tema, mostrado en [bpe-tokenizer](bpe-tokenizer.md).

## Un texto donde el contexto importa

Si el siguiente carácter dependiera solo del anterior, una tabla bastaría y la atención no tendría nada que añadir. Así que el texto lo genera una pequeña gramática con cuatro tipos de línea, cada uno escondiendo una pista varios caracteres atrás:

| Kind | Example | The clue |
| --- | --- | --- |
| pronoun | `ana has a cat. she likes it.` | "she" o "he" depende del nombre, 15 caracteres atrás |
| agreement | `the red cats see a dog.` | un gato "sees", dos gatos "see": el verbo depende de la "s" del sujeto |
| arithmetic | `tom says 4+5=9.` | el dígito después de "=" depende de ambos números |
| brackets | `([x]y){z}` | el corchete de cierre debe coincidir con el último que quedó abierto |

El generador tiene una semilla fija y produce 2400 líneas distintas con un vocabulario de 45 caracteres. Una línea se conserva solo la primera vez que se sortea, así que ninguna línea aparece dos veces. Las líneas se barajan, 2160 se usan para entrenar y las últimas 240 se **reservan** (held out): ningún modelo se entrena nunca con ellas, y una prueba comprueba que los dos conjuntos no comparten ninguna línea. Las líneas reservadas son combinaciones nuevas de palabras conocidas. El modelo vio "ana", "cat" y "she" durante el entrenamiento, pero nunca esa frase exacta.

Medir en texto reservado es lo que separa aprender una regla de memorizar las líneas de entrenamiento.

## Paso 1: el bigrama, una tabla de conteos

Se cuenta cuántas veces cada carácter sigue a cada otro, y luego se divide cada fila entre su total:

```text
after "the":  cat 3 times, dog 1 time
P(cat | the) = 3/4 = 0.75      P(dog | the) = 1/4 = 0.25
```

Cada fila es ahora una distribución de probabilidad: sus números están entre 0 y 1 y suman 1. Ese es todo el modelo. No hay bucle de entrenamiento.

Un detalle importa. Un par que nunca apareció en el entrenamiento recibiría probabilidad 0, y un solo par así en el texto reservado dejaría la pérdida infinita. Así que se suma 1 a cada celda antes de dividir (**suavizado add-one**). Con tres tokens posibles el ejemplo pasa a ser (3 + 1) / (4 + 3) = 0.571 para "cat", y el "the the" nunca visto recibe 1/7 y no 0.

Para escribir texto, se parte de un carácter, se sortea el siguiente a partir de su fila, y se repite. El sorteo usa un generador aleatorio con semilla, así que la misma semilla siempre escribe el mismo texto.

## Qué tan buena es una predicción: entropía cruzada y perplejidad

Para cada carácter del texto, se mira la probabilidad que el modelo dio al carácter que realmente vino, y se toma menos su logaritmo natural. La **entropía cruzada** es la media:

```text
the model gave 0.5, 0.25 and 1.0 to the three characters that really came
loss = (-ln 0.5 - ln 0.25 - ln 1.0) / 3 = (0.693 + 1.386 + 0) / 3 = 0.693
```

Dar probabilidad 1 a la verdad cuesta 0. Sorprenderse cuesta mucho. La unidad es el nat, porque el logaritmo es el natural.

La **perplejidad** es exp(pérdida). Aquí exp(0.693) = 2: en promedio este modelo duda como si tuviera que elegir entre 2 caracteres igualmente probables. Un modelo que no sabe nada y da 1/45 a cada uno de los 45 caracteres tiene pérdida ln(45) = 3.807 y perplejidad 45.

## Paso 2: el transformer

```text
character ids
   |
[ token embedding + position embedding ]     one vector of 48 numbers per character
   |
[ block 1: attention -> MLP ]                characters exchange information, then each one "thinks"
[ block 2: attention -> MLP ]
   |
[ final linear layer + softmax ]
   |
a probability for each of the 45 characters, at every position
```

Las piezas, en el orden de `python/transformer.py`:

- **Embeddings.** Cada id de carácter elige una fila de una tabla de vectores aprendidos. La atención por sí sola ve una bolsa de tokens sin orden, así que se suma un segundo vector aprendido, elegido por la posición. Una prueba pone a cero los vectores de posición y muestra que "1 2 3" y "2 1 3" dan entonces la misma predicción.
- **Autoatención.** Cada posición produce una query ("¿qué busco?"), una key ("¿qué ofrezco?") y un value ("lo que transmito si me eligen"). La puntuación entre dos posiciones es el producto punto de una query y una key, dividido entre la raíz cuadrada del tamaño del vector. Softmax convierte las puntuaciones de una fila en pesos que suman 1, y la salida es el promedio de los values con esos pesos.
- **Máscara causal.** Una posición no debe mirar lo que viene después de ella, o copiaría la respuesta. Antes del softmax las puntuaciones de las posiciones posteriores se ponen en menos infinito, así que su peso es exactamente 0.
- **Cuatro cabezas.** Los 48 números se cortan en 4 porciones de 12, y cada porción ejecuta su propia atención.
- **MLP.** Después de la atención, cada posición pasa sola por una red pequeña con ReLU.
- **Conexiones residuales y normalización de capa.** Cada uno de los dos pasos suma su resultado a su entrada (x = x + f(x)) y normaliza primero la entrada. Esta disposición "pre-norm" es la que usa GPT-2.

El modelo tiene 62 253 números que aprender.

### Retropropagación a mano, y cómo saber que es correcta

El entrenamiento necesita, para cada uno de esos números, la dirección en la que baja la pérdida: el gradiente. Un framework lo calcula automáticamente. Aquí se escribe a mano, recorriendo el paso hacia adelante en sentido inverso con la regla de la cadena. Dos reglas cubren casi todo:

```text
y = x @ W          ->   dW = x^T @ dy      dx = dy @ W^T
y = x + f(x)       ->   the gradient of x is the sum of the two paths
```

Los gradientes escritos a mano son fáciles de equivocar, así que se comprueban con un método que no necesita cálculo. Se mueve un peso hacia arriba y hacia abajo una cantidad diminuta y se ve cómo se mueve la pérdida:

```text
f(w) = w^2 at w = 3       the formula says the gradient is 2w = 6
(f(3.001) - f(2.999)) / 0.002 = (9.006001 - 8.994001) / 0.002 = 6.000
```

La prueba hace esto para cada peso de un modelo diminuto en float64 y exige que los dos gradientes de cada grupo de parámetros coincidan con un error relativo inferior a 0.000001.

### Adam y mini-batches

Cada paso de entrenamiento sortea 32 ventanas aleatorias de 32 caracteres. El objetivo de cada posición es simplemente el siguiente carácter, así que no hacen falta etiquetas. Se mide la pérdida, se retropropaga, y el optimizador **Adam** mueve cada peso. Adam guarda dos medias móviles por peso, del gradiente y de su cuadrado, y avanza la primera dividida entre la raíz cuadrada de la segunda: cada peso recibe un paso de tamaño parecido, sea cual sea la escala de su gradiente. El entrenamiento dura 1000 pasos, cerca de medio minuto en un núcleo de CPU.

## Resultados

Todos los números de abajo vienen de la demo y están confirmados (committed) en [`results/results.md`](../../../projects/artificial-intelligence/tiny-language-model/results/results.md).

| Model | Context it sees | Train loss | Held-out loss | Held-out perplexity |
| --- | --- | ---: | ---: | ---: |
| Uniform guess, ln(45) | nothing |  | 3.807 | 45.00 |
| Bigram (counting) | 1 character | 1.730 | 1.741 | 5.70 |
| Transformer | up to 32 characters | 0.640 | 0.662 | 1.94 |

![Loss curve](../../../projects/artificial-intelligence/tiny-language-model/results/loss-curve.svg)

Tres cosas para leer:

1. Ver un carácter lleva la perplejidad de 45 a 5.7. Ver el contexto la lleva a 1.94: en promedio el transformer duda entre dos caracteres, el bigrama entre casi seis.
2. El transformer supera al bigrama en los primeros 100 pasos y luego mejora despacio.
3. Su pérdida de entrenamiento (0.640) y su pérdida reservada (0.662) son cercanas, así que aprendió reglas y no memorizó líneas.

La pérdida no puede llegar a 0. El sustantivo de una frase o los números de una suma los elige al azar el generador, y nadie puede predecirlos.

### Lo que compra el contexto

La probabilidad que cada modelo da al carácter que exige la gramática (`_` es un espacio):

| Context | Right next | Wrong next | Bigram: P(right) | Bigram: P(wrong) | Transformer: P(right) | Transformer: P(wrong) |
| --- | :---: | :---: | ---: | ---: | ---: | ---: |
| `ana_has_a_cat._` | `s` | `h` | 0.141 | 0.077 | 0.982 | 0.011 |
| `leo_has_a_cat._` | `h` | `s` | 0.077 | 0.141 | 0.980 | 0.014 |
| `the_old_dogs_see` | `_` | `s` | 0.395 | 0.099 | 0.999 | 0.000 |
| `the_old_dog_see` | `s` | `_` | 0.099 | 0.395 | 0.998 | 0.001 |
| `tom_says_4+5=` | `9` | `1` | 0.091 | 0.417 | 0.433 | 0.410 |
| `tom_says_7+8=1` | `5` | `.` | 0.051 | 0.110 | 0.350 | 0.000 |
| `{[x]` | `}` | `]` | 0.065 | 0.100 | 0.210 | 0.005 |
| `[{x}` | `]` | `}` | 0.113 | 0.099 | 0.327 | 0.009 |

En las dos primeras filas el bigrama da exactamente los mismos números para "ana" y para "leo": todo lo que ve es el espacio. El transformer lee el nombre. Tras `{[x]` da 0.210 a `}` y solo 0.005 a `]`. El resto de la probabilidad va a continuar con una letra o abrir otro corchete, lo que la gramática también permite.

Las sumas son el punto débil honesto: tras `4+5=` el modelo da 0.433 a "9" y 0.410 a "1". Aprendió que viene un dígito y está a medio camino de aprender la tabla de sumar en 1000 pasos. Una pérdida promedio oculta este tipo de detalle, y sondas como estas lo muestran.

### La atención de una cabeza

![Attention map](../../../projects/artificial-intelligence/tiny-language-model/results/attention.svg)

Cada fila es una posición que pregunta, cada columna una posición que mira, sobre la línea reservada `the sad cups see a hat.`. El triángulo gris es la máscara causal: ninguna posición mira a su derecha. La fila resaltada es la última "e" de "see", donde el modelo tiene que decidir si sigue una "s". La única pista es la "s" de "cups". Esta cabeza, en el bloque 2, pone 0.98 del peso de esa fila en ese único carácter. Nadie lo programó. Salió del entrenamiento.

## Muestreo: cómo se elige el siguiente carácter

El modelo entrenado está fijo. Lo que cambia el estilo de la salida es cómo se elige un carácter a partir de sus probabilidades.

| Method | What it does |
| --- | --- |
| Greedy | toma siempre el carácter más probable |
| Temperature T | divide las puntuaciones entre T antes del softmax |
| Top-k | conserva los k caracteres más probables y renormaliza |
| Top-p (nucleus) | conserva el conjunto más pequeño de caracteres más probables cuyas probabilidades alcanzan p, incluido el que cruza p, y renormaliza |

La variedad se mide con la **entropía** de la distribución, en bits: 0 cuando un carácter tiene toda la probabilidad, 1 para una moneda justa, log2(3) = 1.585 para tres caracteres igualmente probables. Para las puntuaciones (2, 1, 0):

```text
T = 0.5   (0.867, 0.117, 0.016)   entropy 0.636 bits     sharper
T = 1.0   (0.665, 0.245, 0.090)   entropy 1.201 bits     the model as trained
T = 2.0   (0.506, 0.307, 0.186)   entropy 1.472 bits     flatter
```

Y para top-k y top-p sobre las probabilidades (0.5, 0.3, 0.15, 0.05), entropía 1.648 bits:

```text
top-k 2     keeps 0.5 and 0.3                    -> (0.625, 0.375)   0.954 bits
top-p 0.7   0.5 is not enough, 0.5 + 0.3 = 0.8
            crosses 0.7, so both stay            -> (0.625, 0.375)   0.954 bits
```

La demo escribe 100 líneas con cada ajuste, siempre desde la misma semilla, y mide la entropía media de las distribuciones de las que realmente se sortearon los caracteres:

| Setting | Mean entropy (bits) | Distinct lines of 100 | Grammatical lines of 100 | First line written |
| --- | ---: | ---: | ---: | --- |
| greedy | 0.000 | 1 | 100 | `the new cat sees a cup.` |
| temperature 0.2 | 0.304 | 66 | 100 | `the old cups see a cup.` |
| temperature 0.5 | 0.520 | 97 | 95 | `the old bags see a cat.` |
| temperature 1.0 | 0.856 | 99 | 73 | `ana says 5+8=14.` |
| temperature 1.5 | 1.464 | 100 | 38 | `[9=1ups find a k map.` |
| temperature 1.0, top-k 3 | 0.380 | 86 | 85 | `leo says 4+9=14.` |
| temperature 1.0, top-p 0.9 | 0.751 | 99 | 87 | `[[x[y]{zx}x]}x` |
| temperature 1.5, top-k 3 | 0.464 | 92 | 72 | `leo says 4+9=14.` |
| temperature 1.5, top-p 0.9 | 1.039 | 99 | 67 | `[[x(y){z(yzyy)}]` |

- **Menor temperatura, menos variedad.** La entropía baja de 1.464 a 0.856, 0.520 y 0.304 bits, y el número de líneas distintas de 100 a 66. La decodificación voraz es el final del camino: 0 bits, y la misma línea 100 veces.
- **Menos variedad, menos errores.** Una línea es gramatical cuando obedece una de las cuatro reglas. Con temperatura 0.2 las 100 líneas lo hacen, con 1.5 solo 38. Una temperatura alta da una oportunidad real a los caracteres improbables, y un carácter equivocado rompe una línea.
- **Top-k y top-p cortan la cola.** Con temperatura 1.5 devuelven las líneas gramaticales de 38 a 72 y 67 mientras siguen escribiendo más de 90 líneas distintas. Por eso los sistemas reales combinan una temperatura con uno de ellos.

Como comparación, la tabla de bigramas escribe líneas como `likeog w cu2+8=6it.`. Ninguna de sus 100 líneas es gramatical.

## Qué añade un sistema real

- **Tamaño.** Miles de millones de parámetros, decenas de bloques, contextos de miles de tokens, y texto de entrenamiento medido en terabytes, en GPUs. El algoritmo es el que se muestra aquí.
- **Tokens de subpalabra** en lugar de caracteres, como en [bpe-tokenizer](bpe-tokenizer.md).
- **Diferenciación automática.** Nadie escribe el paso hacia atrás a mano: un framework lo deriva del paso hacia adelante.
- **Una caché de clave-valor.** Esta demo vuelve a ejecutar toda la ventana para cada carácter nuevo. Los sistemas reales conservan las keys y values ya calculadas.
- **Trucos de entrenamiento**: dropout, weight decay, warm-up de la tasa de aprendizaje, recorte de gradientes, GELU en lugar de ReLU.
- **Ajuste fino (fine-tuning)** con conversaciones e instrucciones, que convierte a un predictor del siguiente token en un asistente.

## Ejecútalo

```sh
cd projects/artificial-intelligence/tiny-language-model
./setup-unix-tiny-language-model.sh        # or ./setup-windows-tiny-language-model.ps1
docker compose run --rm python-demo        # trains both models and rewrites results/
```
