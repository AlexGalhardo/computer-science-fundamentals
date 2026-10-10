# Inteligencia artificial y LLMs

> English version: [docs/en/artificial-intelligence/README.md](../../en/artificial-intelligence/README.md) · Versão em português: [docs/pt/artificial-intelligence/README.md](../../pt/artificial-intelligence/README.md)

Esta página explica, para un principiante, las ideas detrás de la IA moderna: cómo un programa aprende de los datos, qué son los tokens y los vectores, cómo un modelo de lenguaje escribe texto y cómo dibuja un modelo de imágenes. Sigue el orden de los temas del quiz del área (QC-AI), y cada sección apunta al miniproyecto que muestra la idea en funcionamiento. Cada número de abajo es lo bastante pequeño como para comprobarlo a mano.

Las fuentes usadas para escribir esta área están listadas, con enlaces, en [references.md](references.md).

| Sección | Tema del quiz | Miniproyecto |
| --- | --- | --- |
| [1. IA, aprendizaje automático y aprendizaje profundo](#1-ia-aprendizaje-automático-y-aprendizaje-profundo) | `ai-ml-foundations` | |
| [2. Probabilidad y estadística](#2-probabilidad-y-estadística) | `probability-statistics` | [tiny-language-model](tiny-language-model.md) |
| [3. Vectores y matrices](#3-vectores-y-matrices) | `linear-algebra` | [embeddings-vector-search](embeddings-vector-search.md) |
| [4. Aprendizaje supervisado y pérdida](#4-aprendizaje-supervisado-y-pérdida) | `supervised-learning` | [neural-network-from-scratch](neural-network-from-scratch.md) |
| [5. Neuronas, capas y funciones de activación](#5-neuronas-capas-y-funciones-de-activación) | `neural-networks` | [neural-network-from-scratch](neural-network-from-scratch.md) |
| [6. Descenso de gradiente y retropropagación](#6-descenso-de-gradiente-y-retropropagación) | `training` | [neural-network-from-scratch](neural-network-from-scratch.md) |
| [7. Tokens y tokenización](#7-tokens-y-tokenización) | `tokenization` | [bpe-tokenizer](bpe-tokenizer.md) |
| [8. Embeddings y similitud](#8-embeddings-y-similitud) | `embeddings` | [embeddings-vector-search](embeddings-vector-search.md) |
| [9. Atención y el transformer](#9-atención-y-el-transformer) | `attention-transformer` | [tiny-language-model](tiny-language-model.md) |
| [10. Cómo un modelo de lenguaje predice y muestrea](#10-cómo-un-modelo-de-lenguaje-predice-y-muestrea) | `language-models` | [tiny-language-model](tiny-language-model.md) |
| [11. Uso de LLMs](#11-uso-de-llms) | `using-llms` | [embeddings-vector-search](embeddings-vector-search.md) |
| [12. Generación de imágenes](#12-generación-de-imágenes) | `image-generation` | [diffusion-toy](diffusion-toy.md) |
| [13. Límites, sesgo, seguridad y costo](#13-límites-sesgo-seguridad-y-costo) | `limits-safety-cost` | |
| [14. Qué te da un framework: PyTorch](#14-qué-te-da-un-framework-pytorch) | `pytorch` | [pytorch-basics](pytorch-basics.md) |
| [15. TensorFlow y Keras](#15-tensorflow-y-keras) | `tensorflow-keras` | [tensorflow-keras-basics](tensorflow-keras-basics.md) |
| [16. Visión por computador](#16-visión-por-computador) | `computer-vision` | [computer-vision-cnn](computer-vision-cnn.md) |

## Toda la idea en un párrafo

Un modelo es una **función con números ajustables** (los parámetros, o pesos). El entrenamiento le muestra a la función muchos ejemplos, mide con un solo número (la pérdida) cuán equivocadas son sus salidas, y empuja cada parámetro en la dirección que hace menor la pérdida. Repite eso millones de veces y la función se vuelve útil. Un modelo de lenguaje es una función así cuya entrada es una secuencia de tokens y cuya salida es una probabilidad para cada posible siguiente token. Un modelo de imágenes es una función así cuya entrada es una imagen con ruido y cuya salida es una estimación del ruido. Todo lo demás en esta página es detalle sobre esas tres frases.

## 1. IA, aprendizaje automático y aprendizaje profundo

Los tres términos están anidados, como cajas dentro de cajas:

```text
+--------------------------------------------------------------+
| Artificial intelligence: programs that do tasks we associate |
| with intelligence (playing, translating, recognising)        |
|  +--------------------------------------------------------+  |
|  | Machine learning: the behaviour is learned from data   |  |
|  | instead of being written rule by rule                  |  |
|  |  +--------------------------------------------------+  |  |
|  |  | Deep learning: the learner is a neural network   |  |  |
|  |  | with many layers, which also learns its features |  |  |
|  |  +--------------------------------------------------+  |  |
|  +--------------------------------------------------------+  |
+--------------------------------------------------------------+
```

En la programación clásica una persona escribe las reglas: `if the e-mail contains "prize" then spam`. En el aprendizaje automático una persona aporta ejemplos (correos ya marcados como spam o no) y un algoritmo de aprendizaje encuentra las reglas. El aprendizaje profundo da un paso más. Los métodos anteriores necesitaban que una persona eligiera las características (cantidad de mayúsculas, número de enlaces). Una red profunda recibe la entrada cruda y aprende características útiles en sus propias capas. A eso se refiere "profundo": varias capas de representación aprendida, no profundidad de comprensión.

**Tipos de aprendizaje**, según la señal que recibe el aprendiz:

| Tipo | Los datos | Ejemplo |
| --- | --- | --- |
| Supervisado | entradas con la respuesta correcta (etiqueta) | fotos etiquetadas "gato" o "perro" |
| No supervisado | solo entradas, el objetivo es encontrar estructura | agrupar clientes por comportamiento |
| Autosupervisado | solo entradas, pero la etiqueta se recorta de la propia entrada | ocultar la siguiente palabra de una frase y pedirle al modelo que la prediga |
| Por refuerzo | acciones y recompensas de un entorno | un programa que aprende un juego jugando |

El aprendizaje autosupervisado es la razón por la que los modelos de lenguaje pudieron crecer tanto: cualquier texto es su propia clave de respuestas, así que nadie tiene que etiquetar a mano miles de millones de frases.

Palabras que se usan todo el tiempo:

- **Parámetros** (pesos): los números que ajusta el entrenamiento. **Hiperparámetros**: los números que una persona elige antes de entrenar (tasa de aprendizaje, número de capas).
- **Entrenamiento**: ajustar los parámetros. **Inferencia**: usar el modelo terminado, con los parámetros congelados.
- **Generalización**: desempeñarse bien con ejemplos que el modelo nunca vio. Es el objetivo real. Desempeñarse bien solo con los ejemplos de entrenamiento es memorización.
- Los modelos **discriminativos** responden una pregunta sobre una entrada ("¿esto es spam?"). Los modelos **generativos** producen datos nuevos que se parecen a los datos de entrenamiento (texto, imágenes).

## 2. Probabilidad y estadística

Un modelo que escribe texto no "sabe" la siguiente palabra. Da una **probabilidad** a cada candidata. Así que el lenguaje de la IA es el lenguaje de la probabilidad.

Una **distribución de probabilidad** lista los resultados posibles y cuán probable es cada uno. Los números están entre 0 y 1 y suman 1. Para un dado justo cada una de las seis caras tiene 1/6.

La **esperanza** (media) es el resultado promedio a largo plazo, con cada valor ponderado por su probabilidad. Para el dado: (1 + 2 + 3 + 4 + 5 + 6) / 6 = 3.5. La **varianza** mide cuán dispersos están los resultados alrededor de esa media, y la **desviación estándar** es su raíz cuadrada, en la misma unidad que los datos.

La **distribución normal (gaussiana)** es la curva de campana. Se describe con una media y una desviación estándar, y cerca del 68% de los valores cae a menos de una desviación estándar de la media, cerca del 95% a menos de dos. Aparece en esta área como el ruido que los modelos de difusión añaden a las imágenes, y como los números aleatorios que inicializan los pesos de una red.

La **probabilidad condicional**, escrita P(A | B), es la probabilidad de A cuando ya conocemos B. Un modelo de lenguaje es una máquina de probabilidades condicionales: P(siguiente token | los tokens hasta ahora). La **regla de la cadena** las multiplica para obtener la probabilidad de una frase entera:

```text
P("the cat sat") = P("the") x P("cat" | "the") x P("sat" | "the cat")
```

El **teorema de Bayes** da vuelta una condicional. Supón que el 20% de los correos son spam, que la palabra "prize" aparece en el 40% del spam y en el 5% de los correos normales. Llega un correo con "prize". ¿Qué tan probable es que sea spam?

```text
P(spam | prize) = P(prize | spam) x P(spam) / P(prize)
                = 0.40 x 0.20 / (0.40 x 0.20 + 0.05 x 0.80)
                = 0.08 / 0.12
                = 0.667
```

El error común es responder 40%, que es P(prize | spam), la condicional opuesta. La respuesta correcta también depende de cuán frecuente es el spam (la probabilidad a priori, 20%).

La **verosimilitud** (likelihood) es la probabilidad que un modelo da a los datos que realmente observamos, vista como función de los parámetros. Si una moneda da 7 caras en 10 lanzamientos, el valor de p que hace más probable este resultado es p = 7/10. Elegir parámetros así es **máxima verosimilitud**, y entrenar una red neuronal es exactamente esto. Como un producto de muchas probabilidades pequeñas se vuelve demasiado pequeño para que un computador lo almacene, sumamos logaritmos en lugar de multiplicar, y como los optimizadores minimizan, usamos la **log-verosimilitud negativa**.

La función **softmax** convierte cualquier lista de puntuaciones (llamadas logits) en una distribución de probabilidad: eleva e a cada puntuación y divide entre la suma. Para las puntuaciones (2, 1, 0):

```text
e^2 = 7.389   e^1 = 2.718   e^0 = 1.000   sum = 11.107
softmax = (0.665, 0.245, 0.090)        adds up to 1
```

La **pérdida de entropía cruzada** de una predicción es el logaritmo negativo de la probabilidad dada a la respuesta correcta. Si la clase correcta era la primera, la pérdida es -ln(0.665) = 0.408. Una predicción perfecta (probabilidad 1) cuesta 0, y una predicción equivocada con seguridad cuesta mucho. La **entropía** mide cuán incierta es una distribución: una moneda justa tiene 1 bit, una moneda que siempre cae cara tiene 0.

En funcionamiento: [tiny-language-model](tiny-language-model.md) cuenta una tabla de probabilidades condicionales, comprueba que cada fila suma 1 y mide la entropía de las muestras.

## 3. Vectores y matrices

Las redes neuronales solo hacen aritmética sobre listas de números.

- Un **escalar** es un número. Un **vector** es una lista de números, como (3, 4). Una **matriz** es una tabla de números con filas y columnas. Un **tensor** es el nombre general, con cualquier número de dimensiones: una imagen a color es un tensor de alto x ancho x 3.
- La **forma** (shape) dice cuántos números hay en cada dimensión. La mayoría de los bugs en el código de aprendizaje automático son bugs de forma.

Un vector se puede leer como un punto en el espacio o como una flecha desde el origen hasta ese punto. Su **longitud** (norma) sale de Pitágoras: la longitud de (3, 4) es sqrt(9 + 16) = 5.

El **producto punto** multiplica dos vectores posición por posición y suma los resultados:

```text
(1, 2, 3) . (4, 0, -1) = 1x4 + 2x0 + 3x(-1) = 1
```

Es grande cuando los dos vectores apuntan en el mismo sentido, cero cuando son perpendiculares y negativo cuando apuntan en sentidos opuestos. La **similitud del coseno** es el producto punto dividido entre las dos longitudes, así que solo cuenta la dirección:

```text
a = (3, 4)   b = (4, 3)
a . b = 12 + 12 = 24        |a| = 5   |b| = 5
cosine = 24 / (5 x 5) = 0.96
```

Va de -1 (opuestos) pasando por 0 (sin relación) hasta 1 (misma dirección). (1, 2, 2) y (2, 4, 4) tienen coseno 1, porque uno es el otro multiplicado por 2. Esta única fórmula es como un buscador decide que dos textos hablan de lo mismo (sección 8).

Una **matriz por un vector** es un lote de productos punto: cada fila de la matriz se multiplica por el vector. Una matriz con m filas y n columnas toma un vector de n números y devuelve un vector de m números. Una capa de una red neuronal es esta operación más un vector de sesgos: `y = W x + b`. Cuando se multiplican dos matrices, el número de columnas de la primera debe ser igual al número de filas de la segunda, y el orden importa: A x B en general es distinto de B x A.

En funcionamiento: [embeddings-vector-search](embeddings-vector-search.md) ordena palabras y pasajes por similitud del coseno.

## 4. Aprendizaje supervisado y pérdida

El aprendizaje supervisado tiene pares (entrada, respuesta correcta). Si la respuesta es un número (el precio de una casa) la tarea es **regresión**. Si la respuesta es una categoría (spam o no) es **clasificación**.

La **función de pérdida** convierte "¿cuán equivocado está el modelo?" en un solo número, que el entrenamiento intenta hacer pequeño. Para regresión la habitual es el **error cuadrático medio**:

```text
predictions: 2, 4, 6        right answers: 3, 4, 4
errors:      -1, 0, 2       squares: 1, 0, 4
MSE = (1 + 0 + 4) / 3 = 1.667
```

Para clasificación es la entropía cruzada de la sección 2.

Los datos se dividen en tres partes, y la división es el hábito más importante del campo:

| Parte | Se usa para |
| --- | --- |
| Conjunto de entrenamiento | ajustar los parámetros |
| Conjunto de validación | elegir hiperparámetros y decidir cuándo parar |
| Conjunto de prueba | una medición final y honesta sobre datos nunca usados para ninguna decisión |

El **sobreajuste** (overfitting) es cuando el modelo memoriza el conjunto de entrenamiento, ruido incluido, y le va mal con datos nuevos. La señal es una pérdida de entrenamiento que sigue bajando mientras la pérdida de validación empieza a subir. El **subajuste** (underfitting) es lo contrario: el modelo es demasiado simple (o se entrenó muy poco) y le va mal en ambos.

```text
loss
 |\
 | \   .  validation               . '
 |  \    ' .                 . '
 |   \       ' - . _ _ . - '        <- overfitting starts here
 |    '.
 |      ' - . _  training
 |               ' ' - - . . . _ _ _
 +------------------------------------> training time
```

Dos trampas para un principiante. Primero, **la exactitud puede mentir**: si el 99% de las transacciones son legítimas, un modelo que siempre responde "legítima" tiene 99% de exactitud y es inútil, por eso existen la precisión y el recall. Segundo, la **fuga de datos** (data leakage): si información del conjunto de prueba se cuela en el entrenamiento (el mismo ejemplo en ambos lados, o una característica que no existiría en el momento de predecir), el resultado medido es mejor que la realidad.

En funcionamiento: [neural-network-from-scratch](neural-network-from-scratch.md) entrena un clasificador y lo mide con puntos con los que no entrenó.

## 5. Neuronas, capas y funciones de activación

Una **neurona** artificial hace tres cosas: multiplica cada entrada por un peso, suma todo más un sesgo, y pasa el resultado por una función de activación.

```text
x1 = 1.0 --( w1 =  0.5 )--\
                           (+) --> z = 0.5 - 2.0 + 0.5 = -1.0 --> activation --> output
x2 = 2.0 --( w2 = -1.0 )--/
              bias b = 0.5
```

Con la activación ReLU la salida es max(0, -1.0) = 0. Con tanh es tanh(-1.0) = -0.762.

La **función de activación** es lo que hace que la red sea más que una fórmula lineal. Sin ella, dos capas seguidas serían `W2 (W1 x)`, que es lo mismo que una capa con la matriz `W2 W1`: apilar no añadiría nada. Las más comunes:

| Función | Fórmula | Rango de salida | Nota |
| --- | --- | --- | --- |
| Sigmoide | 1 / (1 + e^-z) | 0 a 1 | se lee como una probabilidad, pero se satura: lejos de cero su pendiente es casi 0 |
| tanh | (e^z - e^-z) / (e^z + e^-z) | -1 a 1 | centrada en cero, también se satura |
| ReLU | max(0, z) | 0 a infinito | barata y no se satura del lado positivo. Una neurona atascada del lado negativo deja de aprender ("dying ReLU") |

Las neuronas se organizan en **capas**. Cada neurona de una capa recibe todas las salidas de la capa anterior. Una red con una entrada, capas ocultas y una salida es un perceptrón multicapa (MLP):

```text
input (2)      hidden (8)      output (1)
   o ----------- o o o o
     \  /  /  /  o o o o ----------- o
   o ----------- (every input goes to every hidden neuron)
```

Contando sus **parámetros**: cada neurona oculta tiene 2 pesos y 1 sesgo, así que 2 x 8 + 8 = 24. La neurona de salida tiene 8 pesos y 1 sesgo, 9. Total: 33. Un modelo de lenguaje es el mismo tipo de cuenta con miles de millones en lugar de 33.

Por qué importan las capas ocultas: una sola neurona solo puede separar sus entradas con una línea recta. XOR ("una o la otra, pero no ambas") no se puede separar con una línea, así que una neurona nunca puede aprenderlo. Una capa oculta curva el espacio de modo que después basta una línea. El teorema clásico dice que una red con una capa oculta puede aproximar cualquier función continua si tiene suficientes neuronas. Dice que existen los pesos correctos, no que el entrenamiento los vaya a encontrar.

En funcionamiento: [neural-network-from-scratch](neural-network-from-scratch.md) construye neuronas, capas y un MLP, y aprende XOR.

## 6. Descenso de gradiente y retropropagación

Entrenar es una búsqueda de los parámetros que hacen pequeña la pérdida. Imagina la pérdida como un paisaje de colinas y los parámetros como tu posición. Estás en la niebla y solo puedes sentir la pendiente bajo tus pies. El plan sensato es dar un paso pequeño cuesta abajo y volver a sentir. Ese plan es el **descenso de gradiente**.

El **gradiente** es la lista de pendientes, una por parámetro: cuánto crecería la pérdida si ese parámetro creciera un poco. Como apunta cuesta arriba, damos el paso en su contra:

```text
new weight = old weight - learning rate x gradient
```

Un caso resuelto con un parámetro. La pérdida es L(w) = (w - 3)^2, cuyo mínimo está en w = 3, y cuya pendiente es 2 (w - 3). Empieza en w = 0 con una tasa de aprendizaje de 0.1:

```text
step 1: slope = 2 x (0 - 3)    = -6.0    w = 0    - 0.1 x (-6.0) = 0.6
step 2: slope = 2 x (0.6 - 3)  = -4.8    w = 0.6  - 0.1 x (-4.8) = 1.08
step 3: slope = 2 x (1.08 - 3) = -3.84   w = 1.08 - 0.1 x (-3.84) = 1.464
```

Cada paso se acerca más a 3. La **tasa de aprendizaje** es el tamaño del paso. Si es muy pequeña el entrenamiento tarda una eternidad. Si es muy grande los pasos saltan por encima del valle y la pérdida crece en lugar de encogerse (con una tasa de 1.1 en este ejemplo, w se aleja de 3 en cada paso).

La **retropropagación** es como se calcula el gradiente de millones de parámetros en una sola pasada. Es la regla de la cadena del cálculo aplicada desde la pérdida hacia las entradas. Cada operación solo conoce su propia pendiente local, y las pendientes se multiplican en el camino de vuelta. Para f = (x + y) x z con x = 2, y = 1, z = 4:

```text
forward:   q = x + y = 3        f = q x z = 12
backward:  df/dz = q = 3        df/dq = z = 4
           df/dx = df/dq x dq/dx = 4 x 1 = 4
           df/dy = df/dq x dq/dy = 4 x 1 = 4
```

Comprobación a mano: subir x de 2 a 2.01 da f = 3.01 x 4 = 12.04, una subida de 0.04 = 4 x 0.01. Así es también como se prueba el código: comparar el gradiente de la retropropagación con (f(x + h) - f(x - h)) / 2h, el **gradiente numérico**.

El vocabulario de una ejecución de entrenamiento:

- **Lote** (batch): los ejemplos usados en una actualización. Usar unos pocos ejemplos a la vez (un mini-batch) es **descenso de gradiente estocástico**: cada paso es más ruidoso pero mucho más barato que usar todos los datos. Una pasada por todo el conjunto de entrenamiento es una **época**.
- Los **optimizadores** cambian cómo se da el paso. El momentum conserva parte del paso anterior, como una bola que gana velocidad. Adam además adapta el tamaño del paso de cada parámetro.
- La **regularización** combate el sobreajuste: el weight decay (L2) empuja los pesos hacia cero, el **dropout** apaga neuronas al azar durante el entrenamiento (nunca en la inferencia), y la parada temprana (early stopping) termina el entrenamiento cuando la pérdida de validación deja de mejorar.
- **Gradientes que se desvanecen**: en una red profunda las pendientes se multiplican capa tras capa. Si son menores que 1 (como en las partes planas de sigmoide y tanh), el producto se encoge hacia cero y las primeras capas dejan de aprender. ReLU, las conexiones residuales (sumar la entrada de un bloque a su salida) y las capas de normalización son las curas habituales.

En funcionamiento: [neural-network-from-scratch](neural-network-from-scratch.md) implementa la regla de la cadena valor por valor, la comprueba contra el gradiente numérico y escribe la curva de pérdida.

## 7. Tokens y tokenización

Un modelo calcula con números, así que el texto primero debe convertirse en números. La unidad es el **token**: un trozo de texto con un id entero. La lista de todos los tokens que un modelo conoce es su **vocabulario**.

Tres formas de cortar el texto:

| Unidad | Vocabulario | Problema |
| --- | --- | --- |
| Palabras | enorme (cada forma de cada palabra) | una palabra fuera del vocabulario no se puede representar |
| Caracteres | diminuto | las secuencias se vuelven muy largas y cada unidad lleva poco significado |
| **Subpalabras** | mediano, elegido por nosotros | ninguno de los dos: las palabras comunes son un token, las palabras raras se dividen en piezas conocidas |

Los modelos modernos usan subpalabras, y el algoritmo más conocido es el **byte-pair encoding (BPE)**. Entrenarlo es un bucle: contar cada par de tokens vecinos, fusionar el par más frecuente en un token nuevo, repetir. Con el texto `banana bandana`, partiendo de caracteres (14 tokens, el espacio incluido):

```text
start     b a n a n a _ b a n d a n a         14 tokens
merge 1   "a"+"n" (4 times)  ->  b an an a _ b an d an a      10 tokens
merge 2   "b"+"an" (2 times) ->  ban an a _ ban d an a         8 tokens
merge 3   "an"+"a" (2 times) ->  ban ana _ ban d ana           6 tokens
```

Cada fusión añade un token al vocabulario y hace más corto el texto. Ese es el intercambio: **un vocabulario mayor da menos tokens para el mismo texto**.

Los tokenizadores reales parten de **bytes**, no de caracteres. Todo texto en UTF-8 es una secuencia de bytes, y un byte tiene solo 256 valores, así que el vocabulario base tiene 256 tokens y ningún texto es nunca "desconocido": `é` son 2 bytes, un emoji son 4. El tamaño del vocabulario es entonces 256 más el número de fusiones (más unos pocos tokens especiales, como el que marca el fin de un texto). Decodificar vuelve a unir los bytes, así que codificar y luego decodificar devuelve exactamente el texto original.

Consecuencias que importan en la práctica:

- **Un token no es una palabra.** Una palabra común en inglés suele ser un token, una palabra rara o larga son varios, y la misma frase da conteos distintos en idiomas distintos y en tokenizadores distintos. Reglas prácticas como "un token son unos tres o cuatro caracteres de inglés" son solo estimaciones.
- **Los modelos están limitados y tarificados en tokens**, porque un token es la unidad de trabajo: el modelo se ejecuta una vez por cada token que lee y una vez por cada token que escribe.
- La **ventana de contexto** es el número máximo de tokens que el modelo puede mirar de una vez: las instrucciones, la conversación hasta ahora, los documentos adjuntos y la respuesta que se está escribiendo la comparten. Es una memoria de trabajo, distinta de lo que el modelo aprendió en el entrenamiento. El texto que no cabe simplemente no se ve.

En funcionamiento: [bpe-tokenizer](bpe-tokenizer.md) entrena BPE sobre bytes, muestra los tokens de una frase con ids y límites, y tabula cómo baja el conteo a medida que crecen las fusiones.

## 8. Embeddings y similitud

Un id de token es solo una etiqueta: el token 512 no es "más" que el token 511. Para calcular con significado, cada token recibe un vector, llamado **embedding**. Es una fila de una tabla grande con una fila por token del vocabulario, y los números de esa tabla son parámetros, aprendidos como cualquier otro.

¿De dónde viene el significado? De la **hipótesis distribucional**: las palabras que aparecen en los mismos contextos tienen significados parecidos. "Coffee" y "tea" aparecen ambas cerca de "cup", "hot" y "drink". Si se cuenta, para cada palabra, qué palabras aparecen cerca de ella, las dos filas de conteos serán parecidas:

```text
            cup   hot   drink   engine   road
coffee       8     6     9        0       0
tea          7     5     8        0       0
car          0     1     0        9       7
```

Cada fila es un vector. La similitud del coseno (sección 3) entre "coffee" y "tea" es cercana a 1, y entre "coffee" y "car" es cercana a 0. Métodos como word2vec y GloVe producen vectores cortos y densos a partir de esta misma señal, y en ellos algunas direcciones llevan significado, por eso una aritmética como king - man + woman cae cerca de queen.

Esos vectores son **estáticos**: un vector por palabra, así que el "bank" de un río y el "bank" del dinero comparten uno. Dentro de un transformer el vector de cada token se actualiza con los tokens que lo rodean (sección 9), dando embeddings **contextuales**.

El mismo truco funciona para frases y documentos enteros: un modelo asigna un texto a un vector, y los textos de significado parecido quedan cerca unos de otros. La **búsqueda vectorial** es entonces: convertir la pregunta en un vector y encontrar los vectores guardados más cercanos a él.

- La **fuerza bruta** compara la pregunta con cada vector guardado. Es exacta, y su costo crece con el número de vectores.
- Un **índice aproximado** mira solo una parte prometedora de los datos. Uno simple dibuja planos aleatorios a través del espacio y registra de qué lado de cada plano cae un vector. Los vectores que apuntan en direcciones parecidas tienden a obtener el mismo patrón de lados, así que terminan en la misma cubeta (bucket), y una consulta se compara solo con su propia cubeta. Es mucho más rápido y a veces no encuentra al verdadero vecino más cercano. La proporción de respuestas correctas que encuentra es su **recall**.

En funcionamiento: [embeddings-vector-search](embeddings-vector-search.md) construye vectores de palabras a partir de conteos de coocurrencia, compara la fuerza bruta con un índice de planos aleatorios y recupera los pasajes que responden una pregunta.

## 9. Atención y el transformer

Para predecir la siguiente palabra de "The animal did not cross the street because it was too tired", el modelo debe deducir que "it" es el animal. El vector de "it" necesita información de otra posición. La **atención** es la operación que mueve información entre posiciones.

Cada token produce tres vectores a partir de su embedding: una **query** ("¿qué busco?"), una **key** ("¿qué ofrezco?") y un **value** ("lo que transmito si me eligen"). Para un token:

1. Su query se compara con la key de cada token mediante un producto punto. Eso da una puntuación por token.
2. Softmax convierte las puntuaciones en pesos que suman 1.
3. La salida es el promedio de los values, ponderado por esos pesos.

```text
query q = (1, 0)
keys     k1 = (1, 0)   k2 = (0, 1)   k3 = (1, 1)
scores   q.k1 = 1      q.k2 = 0      q.k3 = 1
weights  softmax(1, 0, 1) = (0.422, 0.155, 0.422)
values   v1 = 10       v2 = 20       v3 = 30
output   0.422 x 10 + 0.155 x 20 + 0.422 x 30 = 20.0
```

El artículo que introdujo el transformer lo escribe todo en una línea, `softmax(Q K^T / sqrt(d_k)) V`. La división entre la raíz cuadrada del tamaño de las keys evita que las puntuaciones crezcan con el tamaño del vector, lo que empujaría al softmax hacia una salida casi one-hot con casi nada de gradiente.

Tres detalles completan el cuadro:

- La **atención multicabeza** ejecuta varias atenciones en paralelo, cada una con sus propias matrices de query, key y value, así que una cabeza puede seguir la gramática mientras otra sigue quién es "it". Sus salidas se unen.
- **Máscara causal**: un modelo que predice el siguiente token no debe ver el futuro. Antes del softmax, las puntuaciones de las posiciones posteriores se ponen en menos infinito, así que su peso es 0.

    ```text
    position can look at ->   1   2   3   4
    token 1                   x   .   .   .
    token 2                   x   x   .   .
    token 3                   x   x   x   .
    token 4                   x   x   x   x
    ```

- **Información de posición**: la atención trata su entrada como una bolsa de tokens, sin orden. Por eso se suma a cada embedding de token un vector que codifica la posición.

Un **bloque de transformer** es una atención seguida de un MLP pequeño aplicado a cada posición, cada uno de los dos envuelto en una conexión residual y una normalización. Un modelo es una pila de esos bloques:

```text
token ids
   |
[ token embedding + position embedding ]
   |
[ block 1: attention -> MLP ]     tokens exchange information, then each one "thinks"
[ block 2: attention -> MLP ]
   ...
[ final linear layer + softmax ]
   |
a probability for every token of the vocabulary
```

El transformer original tenía un **codificador** (lee toda la entrada, cada token ve a todos los demás) y un **decodificador** (escribe la salida un token a la vez), y se construyó para traducción. Los modelos que solo entienden texto, como BERT, conservan el codificador. Los modelos que generan texto, como GPT, conservan el decodificador.

Comparado con las redes recurrentes que se usaban antes, un transformer procesa todas las posiciones a la vez durante el entrenamiento, lo que encaja con el hardware paralelo. El precio es que cada token mira a todos los demás: con n tokens hay n x n pares, así que duplicar la longitud del texto multiplica ese trabajo por cuatro.

En funcionamiento: [tiny-language-model](tiny-language-model.md) implementa autoatención causal y un bloque de transformer con NumPy, hacia adelante y hacia atrás.

## 10. Cómo un modelo de lenguaje predice y muestrea

Un modelo de lenguaje hace una sola cosa: dados los tokens hasta ahora, produce una **probabilidad para cada posible siguiente token**. La generación de texto es un bucle alrededor de esa única cosa:

```text
"The sky is"  -> model -> { blue: 0.62, clear: 0.11, falling: 0.02, ... }
                 choose one token ("blue"), append it
"The sky is blue" -> model -> { .: 0.41, and: 0.20, ... }
                 ... until an end token or a length limit
```

El modelo de lenguaje más simple cuenta. Un modelo de **bigramas** mira solo el token anterior: cuenta con qué frecuencia cada token sigue a cada otro, y divide cada fila entre su total.

```text
after "the":  cat 3 times, dog 1 time   ->  P(cat | the) = 3/4 = 0.75   P(dog | the) = 0.25
```

Un transformer hace el mismo trabajo con una memoria mucho mejor: condiciona sobre toda la ventana de contexto en lugar de un token, y comparte lo que aprendió entre contextos parecidos en lugar de guardar una fila de tabla por contexto.

El **entrenamiento** no necesita etiquetas: se toma cualquier texto, se oculta el siguiente token, se pide la predicción y se usa la entropía cruzada contra el token que realmente vino. El informe habitual es la pérdida, o su exponencial, la **perplejidad**: un modelo que duda por igual entre 8 tokens en cada paso tiene perplejidad 8. Menor es mejor, y se mide sobre texto reservado del entrenamiento.

El **muestreo** es cómo se elige un token a partir de la distribución. La elección cambia el estilo de la salida más de lo que la gente espera:

| Método | Qué hace |
| --- | --- |
| Voraz (greedy) | siempre el token más probable. Determinista, tiende a ser aburrido y repetitivo |
| Muestreo | sortea un token con la probabilidad que le dio el modelo |
| Temperatura T | divide los logits entre T antes del softmax |
| Top-k | conserva los k tokens más probables, renormaliza y luego muestrea |
| Top-p (núcleo) | conserva el conjunto más pequeño de tokens cuyas probabilidades suman p, renormaliza y luego muestrea |

El efecto de la temperatura sobre los logits (2, 1, 0):

```text
T = 0.5   logits (4, 2, 0)      ->  (0.867, 0.117, 0.016)    sharper, safer
T = 1.0   logits (2, 1, 0)      ->  (0.665, 0.245, 0.090)    the model as trained
T = 2.0   logits (1, 0.5, 0)    ->  (0.506, 0.307, 0.186)    flatter, more varied
```

A medida que T se acerca a 0 el resultado se acerca a la decodificación voraz. Por eso la misma pregunta puede recibir respuestas distintas: el modelo se muestrea, no se consulta en una tabla.

**Preentrenamiento y ajuste fino.** El preentrenamiento es la fase larga y cara sobre una enorme cantidad de texto general con el objetivo del siguiente token, donde el modelo recoge gramática, hechos y patrones de razonamiento. El **ajuste fino** (fine-tuning) continúa el entrenamiento sobre un conjunto de datos más pequeño y específico: conversaciones, para convertirse en asistente, o los documentos de un campo. BERT se preentrena con otro juego: se enmascaran algunos tokens y el modelo rellena los huecos usando ambos lados del contexto, lo que es bueno para entender y no sirve para escribir.

En funcionamiento: [tiny-language-model](tiny-language-model.md) compara una tabla de bigramas con un transformer pequeño sobre texto reservado y tabula cómo la temperatura cambia la entropía de las muestras.

## 11. Uso de LLMs

Un gran modelo de lenguaje (LLM) se usa a través de su ventana de contexto. Todo lo que sabe sobre tu solicitud es el texto de esa ventana más lo que se guardó en sus pesos durante el entrenamiento.

- **Prompt**: el texto que se le da al modelo. Un **prompt de sistema** fija el rol y las reglas, y los mensajes del usuario siguen. Instrucciones claras y específicas con el contexto necesario funcionan mejor que pistas cortas.
- **Few-shot prompting**: poner algunos ejemplos resueltos en el prompt y el modelo continúa el patrón. No se entrena nada: los pesos siguen iguales, los ejemplos actúan solo a través del contexto (aprendizaje en contexto).
- **El modelo no tiene memoria entre llamadas.** Una aplicación de chat reenvía toda la conversación cada vez. Cuando la conversación ya no cabe en la ventana, hay que recortar o resumir algo.

La **generación aumentada por recuperación (RAG)** responde a "¿cómo puede el modelo usar documentos que nunca vio en el entrenamiento?":

```text
question --> [ search: embed the question, find the nearest passages ] --> passages
                                                                              |
answer   <-- [ model: reads question + passages in its context ] <------------+
```

El paso de búsqueda es la búsqueda vectorial de la sección 8. El modelo escribe entonces la respuesta a partir de los pasajes, que se pueden citar y mantener actualizados sin volver a entrenar.

Las **herramientas** permiten que un modelo actúe. La aplicación describe funciones (búsqueda, calculadora, consulta a una base de datos). Cuando el modelo decide que se necesita una, escribe una solicitud estructurada, la aplicación ejecuta la función y pone el resultado de vuelta en el contexto, y el modelo continúa. El modelo nunca ejecuta nada por sí mismo. Un **agente** es esto en un bucle: el modelo elige la siguiente acción, observa el resultado y repite hasta terminar la tarea. Cuando los pasos están fijados en el código y el modelo solo rellena cada paso, es un flujo de trabajo (workflow), que es más simple y más predecible.

La **alucinación** es texto fluido que es falso: una cita inventada, una referencia que no existe. Es una consecuencia directa de cómo funciona el modelo: produce una continuación plausible, y plausible no es lo mismo que verdadero. Lo que la reduce: dar el texto fuente en el contexto y pedirle al modelo que responda solo a partir de él, permitir "no lo sé", pedir citas y comprobar las afirmaciones. Nada la elimina por completo, así que las salidas importantes se verifican.

La **evaluación** significa medir sobre ejemplos que el modelo no vio, con las respuestas definidas de antemano. Una respuesta impresionante es una anécdota. Las preguntas públicas de prueba se filtran con el tiempo en los datos de entrenamiento (contaminación), lo que hace que un modelo parezca mejor de lo que es.

Un riesgo que hay que conocer: todo lo que se coloca en el contexto puede influir en el modelo, incluido el texto escrito por otra persona (una página web, un correo). Las instrucciones escondidas en ese texto se llaman **inyección de prompt** (prompt injection). La defensa es tratar el texto recuperado como datos, restringir lo que pueden hacer las herramientas y mantener a una persona en el circuito para las acciones que importan.

En funcionamiento: [embeddings-vector-search](embeddings-vector-search.md) implementa el paso de recuperación: una pregunta elige los pasajes más relevantes.

## 12. Generación de imágenes

Para un computador una **imagen** es un tensor de números: alto x ancho x 3 canales de color. Una pequeña imagen a color de 64 x 64 ya son 12 288 números.

La **convolución** es la capa hecha para imágenes. Un filtro pequeño (digamos de 3 x 3 pesos) se desliza sobre la imagen, y en cada posición calcula un producto punto con el fragmento que tiene debajo. El mismo filtro se usa en todas partes, así que un patrón aprendido en una esquina se reconoce en cualquier esquina, y la capa necesita pocos parámetros.

```text
output size = (W - F + 2P) / S + 1        W input, F filter, P padding, S stride
28-pixel input, 3-pixel filter, no padding, stride 1:   (28 - 3 + 0) / 1 + 1 = 26
8 filters of 3 x 3 on a 1-channel image:   8 x (3 x 3 x 1) weights + 8 biases = 80 parameters
```

Las primeras capas terminan detectando bordes, las capas posteriores formas y objetos. Así es como ve una red. Generar es la dirección inversa, y lo hacen tres familias.

**Autoencoders.** Un codificador comprime la imagen en un vector corto (el **latente**), y un decodificador reconstruye la imagen a partir de él. Entrenado para que la salida sea igual a la entrada, aprende una descripción comprimida. Un **autoencoder variacional (VAE)** hace que el codificador produzca una pequeña nube (una media y una dispersión) en lugar de un punto y mantiene esas nubes cerca de una normal estándar. Entonces cualquier punto aleatorio sorteado de una normal se puede decodificar en una imagen nueva y plausible.

**GANs (redes generativas antagónicas).** Dos redes juegan una contra otra. El generador convierte ruido aleatorio en una imagen. El discriminador recibe imágenes reales y generadas e intenta distinguir cuál es cuál. Cada una mejora venciendo a la otra, y en el extremo ideal el discriminador solo puede adivinar (50%). Las GAN generan en una sola pasada y pueden ser muy nítidas, pero el juego es inestable de entrenar y el generador puede producir solo unos pocos tipos de imagen (colapso de modos, mode collapse).

Los **modelos de difusión**, que están detrás de la mayoría de los generadores de imágenes actuales, dividen el problema en muchos pasos fáciles.

```text
forward (fixed, no learning): add a little noise, many times
   image  ->  slightly noisy  ->  noisier  ->  ...  ->  pure noise

reverse (learned): remove a little noise, many times
   pure noise  ->  ...  ->  less noisy  ->  slightly noisy  ->  image
```

1. **Proceso directo.** Se añade ruido gaussiano paso a paso hasta que no queda nada de la imagen. Hay un atajo a cualquier paso t: `x_t = sqrt(a) x_0 + sqrt(1 - a) noise`, donde `a` va de casi 1 (primeros pasos) a casi 0 (último paso). Con a = 0.5, un píxel que vale 2 y un sorteo de ruido de -1 dan 0.707 x 2 + 0.707 x (-1) = 0.707.
2. **Entrenamiento.** Se toma una imagen, se elige un paso aleatorio, se añade el ruido, y se le pregunta a la red: "¿qué ruido se añadió?". La pérdida es el error cuadrático medio entre el ruido verdadero y la estimación. Es aprendizaje supervisado simple, con etiquetas que creamos nosotros mismos.
3. **Generación.** Se parte de ruido aleatorio puro y se repite: se le pide el ruido a la red, se resta una parte de él, se pasa al paso anterior. Tras todos los pasos aparece una imagen que nunca estuvo en el conjunto de entrenamiento.

Dos añadidos convierten esto en un sistema de texto a imagen. La **difusión latente** ejecuta todo el proceso sobre el latente pequeño de un autoencoder en lugar de sobre los píxeles, y decodifica solo al final, lo que cuesta mucho menos cómputo. El **condicionamiento por texto** codifica el prompt con un modelo de texto y deja que la red que quita ruido lo mire mediante atención cruzada (sección 9, donde la imagen hace las preguntas y el texto guarda las keys y los values), de modo que cada paso se orienta hacia una imagen que coincida con la descripción.

La difusión es más lenta para generar que una GAN, porque llama a la red una vez por paso en lugar de una, pero se entrena de forma estable y cubre bien la variedad de los datos.

En funcionamiento: [diffusion-toy](diffusion-toy.md) hace todo esto con puntos bidimensionales en lugar de píxeles, de modo que cada paso se puede graficar.

## 13. Límites, sesgo, seguridad y costo

**Tamaño y memoria.** Un modelo son sus parámetros. La memoria es el número de parámetros por los bytes de cada uno:

```text
7 billion parameters x 4 bytes (32-bit floats) = 28 GB
7 billion parameters x 1 byte  (8-bit integers) = 7 GB
```

Guardar cada peso con menos bits es **cuantización**. El modelo se vuelve más pequeño y a menudo más rápido, y pierde un poco de exactitud, ya que cada peso se redondea a uno de solo 256 valores.

**Costo.** El entrenamiento se paga una vez y es enorme: muchos chips especializados durante semanas. La inferencia se paga en cada uso y crece con el número de tokens leídos y escritos, por eso las API cobran por token, y por eso un prompt largo es más caro y más lento que uno corto.

**Lo que un modelo de lenguaje no es.**

- No es una base de datos. Guarda patrones, no registros, así que puede estar equivocado con total seguridad (sección 11).
- Tiene una **fecha de corte del conocimiento**: no sabe nada posterior a la fecha en que terminan sus datos de entrenamiento, a menos que la información se ponga en el contexto.
- Es sensible a la redacción de la solicitud, y la misma solicitud puede dar respuestas distintas.
- Es débil en trabajo exacto por sí solo (aritmética larga, contar caracteres), porque ve tokens y predice texto probable. Las herramientas lo arreglan: una calculadora no adivina.

**Sesgo.** Un modelo aprende los patrones de sus datos, incluidos los injustos. Si los textos del pasado asocian una profesión con un género, el modelo repite la asociación. Curar los datos, probar las salidas entre grupos y corregir durante el ajuste fino reducen el problema y no lo terminan.

**Privacidad y memorización.** Un modelo puede reproducir fragmentos de sus datos de entrenamiento. Los datos sensibles no deben usarse para entrenar sin cuidado, y no deben pegarse en un servicio sin saber cómo se usarán.

**Seguridad, en una regla.** Cuanto más puede hacer un sistema por su cuenta (enviar mensajes, gastar dinero, cambiar archivos), más límites y revisión necesitan sus salidas. Una persona sigue siendo responsable de las decisiones que afectan a las personas: salud, derecho, dinero, contratación.

## 14. Qué te da un framework: PyTorch

Las secciones 5 y 6 se pueden escribir a mano, y los primeros miniproyectos hacen exactamente eso. Nadie entrena un modelo real así. Un **framework** de deep learning aporta cuatro cosas, y son las mismas cuatro en todos los frameworks:

| Pieza | Qué hace | A mano era |
| --- | --- | --- |
| **Tensor** | un arreglo de números de cualquier forma, con operaciones rápidas que también corren en una GPU | listas de Python y bucles |
| **Diferenciación automática** | registra las operaciones del paso hacia adelante y calcula cada gradiente | la función backward que escribiste para cada operación |
| **Módulos (capas)** | bloques listos que son dueños de sus parámetros | tus clases `Neuron` y `Layer` |
| **Optimizadores** | aplican la regla de actualización a todos los parámetros | el bucle `w = w - lr * grad` |

**Tensores.** Un tensor de PyTorch tiene una `shape`, un `dtype` (por ejemplo floats de 32 bits) y un `device` (CPU o GPU). `a * b` multiplica elemento a elemento y `a @ b` es el producto de matrices de la sección 3.

**Diferenciación automática.** Marca un tensor con `requires_grad=True` y PyTorch registra cada operación hecha con él. Llamar a `backward()` sobre el resultado ejecuta la retropropagación y deja cada gradiente en `.grad`:

```python
import torch

x = torch.tensor(2.0, requires_grad=True)
y = x**2 + 3 * x  # dy/dx = 2x + 3
y.backward()
print(x.grad)  # tensor(7.)
```

El grafo se construye mientras corre el código, así que los `if` y `for` comunes de Python pueden ser parte de un modelo. Un detalle sorprende a todos una vez: **los gradientes se acumulan**. Un segundo `backward()` suma a `.grad` en lugar de reemplazarlo, por eso un bucle de entrenamiento limpia los gradientes en cada paso.

**Módulos.** Un modelo es una clase que hereda de `nn.Module`: las capas se crean en `__init__` y el cálculo se escribe en `forward`. El módulo encuentra sus propios parámetros, así que `model.parameters()` los entrega todos al optimizador. Para una pila simple de capas basta `nn.Sequential`.

**El bucle de entrenamiento** lo escribes tú, y siempre son las mismas cinco líneas:

```python
model = nn.Sequential(nn.Linear(2, 8), nn.Tanh(), nn.Linear(8, 1))
loss_fn = nn.BCEWithLogitsLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.5)

for epoch in range(200):
    logits = model(inputs)  # 1. forward pass
    loss = loss_fn(logits, targets)  # 2. how wrong?
    optimizer.zero_grad()  # 3. clear the old gradients
    loss.backward()  # 4. backpropagation
    optimizer.step()  # 5. update every parameter
```

Ese modelo es la red 2-8-1 de la sección 5, con sus 33 parámetros. Dos interruptores son fáciles de confundir. `torch.no_grad()` deja de registrar operaciones: se usa al medir o usar un modelo, ahorra memoria y no calcula nada distinto. `model.eval()` cambia el comportamiento de las capas que actúan distinto en el entrenamiento, como dropout: no detiene los gradientes. El código de evaluación usa ambos.

Un error común más: `nn.CrossEntropyLoss` espera las puntuaciones crudas (logits) y aplica el softmax por sí misma. Pasarle probabilidades aplica el softmax dos veces y el modelo aprende mal sin ningún mensaje de error.

En funcionamiento: [pytorch-basics](pytorch-basics.md) comprueba los gradientes de PyTorch contra gradientes numéricos y contra la retropropagación escrita a mano de [neural-network-from-scratch](neural-network-from-scratch.md), luego entrena la misma red y compara líneas de código y tiempo.

## 15. TensorFlow y Keras

TensorFlow es el otro gran framework, y Keras es su interfaz de alto nivel. Las ideas son las de la sección 14 con otros nombres.

**Tensores y variables.** Un `tf.Tensor` no se puede cambiar después de creado. Una `tf.Variable` guarda un valor que el entrenamiento actualiza, así que los parámetros de un modelo son variables.

**Gradientes con una cinta.** TensorFlow registra las operaciones solo dentro de un bloque `tf.GradientTape`, y luego se le pide el gradiente a la cinta:

```python
import tensorflow as tf

x = tf.Variable(3.0)
with tf.GradientTape() as tape:
    y = x * x  # dy/dx = 2x
print(tape.gradient(y, x))  # 6.0
```

Las variables entrenables se vigilan automáticamente. Una constante no: su gradiente vuelve como `None` a menos que se llame a `tape.watch`. Una cinta sirve para una sola llamada de `gradient`, a menos que se cree con `persistent=True`.

**Keras: el bucle ya está escrito.** Con Keras el modelo se describe, se configura y se entrena en tres llamadas:

```python
model = keras.Sequential(
    [
        keras.Input(shape=(2,)),
        layers.Dense(8, activation="tanh"),
        layers.Dense(1, activation="sigmoid"),
    ]
)
model.compile(optimizer="sgd", loss="binary_crossentropy", metrics=["accuracy"])
history = model.fit(inputs, targets, epochs=200, batch_size=32)
loss, accuracy = model.evaluate(test_inputs, test_targets)
```

`compile` elige el optimizador, la pérdida y las métricas. `fit` ejecuta el bucle de la sección 14 (forward, pérdida, gradientes, actualización) durante el número de épocas dado y devuelve un historial con la pérdida de cada época. `evaluate` mide sobre otros datos y `predict` devuelve salidas. Esto es cómodo, y oculta el bucle: cuando se necesita algo inusual (dos redes que se entrenan una contra otra, como en una GAN), el paso se escribe a mano con una cinta de gradiente, exactamente como el bucle de PyTorch.

**Ejecución eager frente a grafos.** Por defecto TensorFlow ejecuta cada operación de inmediato, a medida que Python llega a ella. Esto es la **ejecución eager** (ansiosa): fácil de depurar, con la sobrecarga de Python en cada paso. Decorar una función con `tf.function` hace que TensorFlow la ejecute una vez para registrar un **grafo** de sus operaciones (esto se llama tracing, o trazado) y después ejecute el grafo directamente. Un grafo es más rápido, se puede optimizar como un todo y se puede guardar y ejecutar donde no hay Python, como un teléfono o un servidor escrito en otro lenguaje. La trampa es que el código Python común dentro de la función, un `print` por ejemplo, corre solo durante el trazado y no en las llamadas posteriores.

| Concepto | PyTorch | TensorFlow y Keras |
| --- | --- | --- |
| Arreglo de números | `torch.Tensor` | `tf.Tensor`, y `tf.Variable` para parámetros |
| Gradiente | `requires_grad=True`, `loss.backward()`, `.grad` | `with tf.GradientTape() as tape`, `tape.gradient(loss, variables)` |
| Capa totalmente conectada | `nn.Linear(2, 8)` | `layers.Dense(8)` |
| Modelo | una clase que hereda de `nn.Module` | `keras.Sequential` o `keras.Model` |
| Paso del optimizador | `optimizer.zero_grad()`, `optimizer.step()` | `optimizer.apply_gradients(...)` |
| Bucle de entrenamiento | escrito a mano | `model.fit(...)`, o a mano con una cinta |
| Ejecución | eager, el grafo se reconstruye en cada paso hacia adelante | eager por defecto, un grafo con `tf.function` |

Aprender un framework hace fácil el otro, porque los conceptos bajo los nombres son los de las secciones 3 a 6.

En funcionamiento: [tensorflow-keras-basics](tensorflow-keras-basics.md) entrena la misma red con `fit` y con una cinta de gradiente, y pone los dos frameworks lado a lado.

## 16. Visión por computador

La visión por computador es la parte de la IA que trabaja con imágenes. La sección 12 presentó la convolución para explicar la generación de imágenes. Esta sección trata de la dirección opuesta: entender una imagen.

**Imágenes como tensores.** Una imagen en escala de grises es una matriz de valores de brillo, normalmente de 0 (negro) a 255 (blanco), escalados al rango de 0 a 1 antes de entrar en una red. Una imagen a color tiene tres de esas matrices, una por canal (rojo, verde, azul). Un lote de 32 imágenes a color de 64 x 64 píxeles es un tensor de forma 32 x 3 x 64 x 64 en PyTorch (canales primero) y 32 x 64 x 64 x 3 en TensorFlow (canales al final). Los números son los mismos, solo el orden de las dimensiones es una convención.

**¿Por qué no una red simple?** Conectar cada píxel con cada neurona cuesta demasiado e ignora lo que es una imagen. Una imagen a color de 64 x 64 tiene 12 288 valores, así que una capa de 100 neuronas ya tiene 12 288 x 100 + 100 = 1 228 900 parámetros. Peor aún, esa capa trata a un gato en la esquina izquierda y al mismo gato en la esquina derecha como entradas sin relación.

La **convolución** arregla ambos problemas. Un filtro pequeño se desliza sobre la imagen y calcula un producto punto en cada posición:

```text
patch of the image       filter (vertical edge)       sum of the products
   0   0   9                -1   0   1
   0   0   9                -1   0   1                (0+0+9) + (0+0+9) + (0+0+9) = 27
   0   0   9                -1   0   1
```

El fragmento va de oscuro a la izquierda a brillante a la derecha, y el filtro responde con un número grande: encontró un borde vertical. Con un fragmento plano (todos los valores iguales) el mismo filtro responde 0. La salida de un filtro sobre toda la imagen es un **mapa de características** (feature map): una imagen de dónde está el patrón.

- **Pesos compartidos.** Los mismos 9 números se usan en cada posición, así que la capa tiene pocos parámetros y un patrón aprendido en un lugar se encuentra en todas partes. Si el objeto se mueve, la respuesta se mueve con él.
- **Los filtros se aprenden.** Nadie escribe el filtro de bordes. El entrenamiento encuentra los filtros que reducen la pérdida, y la primera capa de casi toda red de visión termina con detectores de bordes y de colores.
- El **pooling** encoge un mapa de características conservando un valor por región, normalmente el máximo de cada bloque de 2 x 2. Divide cada lado entre dos, no tiene parámetros y hace el resultado menos sensible a pequeños desplazamientos.
- **Campo receptivo.** Cada capa ve una parte de la imagen algo mayor que la anterior: dos capas de 3 x 3 seguidas ven 5 x 5 píxeles. Por eso las capas profundas reaccionan a formas y objetos enteros.

Una **red convolucional (CNN)** repite convolución, activación y pooling, y termina con un pequeño clasificador:

```text
image -> [conv + ReLU + pool] -> [conv + ReLU + pool] -> flatten -> linear layer -> one score per class
         edges, colours          corners, textures, parts            decision
```

**Las arquitecturas que hay que conocer**, cada una recordada por una idea:

| Red | Año | La idea |
| --- | --- | --- |
| LeNet-5 | 1998 | convolución y submuestreo seguidos de capas totalmente conectadas, leyendo dígitos escritos a mano |
| AlexNet | 2012 | una CNN mucho mayor entrenada en GPUs con ReLU, dropout y aumento de datos. Su victoria en la competencia ImageNet inició la era del deep learning |
| VGG | 2014 | profundidad con solo filtros pequeños de 3 x 3, apilados |
| ResNet | 2015 | conexiones de atajo: un bloque produce su entrada más una corrección, lo que hizo entrenables redes de más de cien capas |

**Aumento de datos.** Un gato movido unos píxeles, ligeramente girado o reflejado sigue siendo un gato. Aplicar esos cambios aleatorios a las imágenes de entrenamiento crea ejemplos nuevos gratis y enseña a la red a ignorarlos. Se aplica solo al conjunto de entrenamiento, y los cambios deben mantener verdadera la etiqueta: reflejar una "b" da una "d".

**Transfer learning.** Las primeras capas de una red entrenada con millones de imágenes detectan bordes, texturas y formas que son útiles para casi cualquier tarea con imágenes. Así que en lugar de entrenar desde cero con pocos datos, se toma una red preentrenada y o bien se congela y se entrena solo una nueva última capa, o bien se continúa el entrenamiento de toda ella con una tasa de aprendizaje pequeña (ajuste fino, como en la sección 10). Es la misma idea que preentrenar un modelo de lenguaje.

**Más allá de la clasificación.**

| Tarea | Salida | Ejemplo |
| --- | --- | --- |
| Clasificación | una etiqueta para la imagen | "gato" |
| Detección | una caja y una etiqueta para cada objeto | YOLO predice todas las cajas y clases en una sola pasada sobre la imagen, lo que lo hace lo bastante rápido para video |
| Segmentación | una etiqueta para cada píxel | U-Net encoge la imagen para entenderla y la expande de vuelta a tamaño completo, con conexiones de atajo que traen el detalle fino |

El solapamiento entre una caja predicha y la verdadera se mide con la **intersección sobre unión** (intersection over union): el área que comparten las dos cajas dividida entre el área que cubren juntas, de 0 (sin solapamiento) a 1 (idénticas).

Hoy los transformers (sección 9) también se usan para imágenes: la imagen se corta en parches y cada parche se trata como un token. Y la red que quita ruido de un modelo de difusión (sección 12) suele ser una U-Net. Las piezas de esta página se siguen recombinando.

En funcionamiento: [computer-vision-cnn](computer-vision-cnn.md) escribe una convolución a mano, entrena una CNN pequeña con formas que dibuja ella misma, la compara con una red totalmente conectada sobre imágenes desplazadas, y guarda los filtros aprendidos como imágenes.

## Para seguir

1. Ejecuta los miniproyectos en este orden: [bpe-tokenizer](bpe-tokenizer.md), [neural-network-from-scratch](neural-network-from-scratch.md), [embeddings-vector-search](embeddings-vector-search.md), [tiny-language-model](tiny-language-model.md), [diffusion-toy](diffusion-toy.md), y luego los tres que usan un framework: [pytorch-basics](pytorch-basics.md), [tensorflow-keras-basics](tensorflow-keras-basics.md), [computer-vision-cnn](computer-vision-cnn.md).
2. Responde el quiz del área (`quiz/content/artificial-intelligence/`), que sigue las mismas dieciséis secciones.
3. Lee y mira el material de [references.md](references.md), que dice para qué sirve cada fuente.
