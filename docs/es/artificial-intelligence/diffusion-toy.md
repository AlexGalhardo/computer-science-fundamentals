# Difusión de juguete

> English version: [docs/en/artificial-intelligence/diffusion-toy.md](../../en/artificial-intelligence/diffusion-toy.md) · Versão em português: [docs/pt/artificial-intelligence/diffusion-toy.md](../../pt/artificial-intelligence/diffusion-toy.md)

Miniproyecto MP-AI-5, en [`projects/artificial-intelligence/diffusion-toy`](../../../projects/artificial-intelligence/diffusion-toy). Enseña cómo un modelo de imágenes aprende a quitar ruido, con puntos bidimensionales en lugar de píxeles. La base está en la sección 12 de [la página del área](README.md#12-generación-de-imágenes), con la distribución gaussiana de la [sección 2](README.md#2-probabilidad-y-estadística) y la retropropagación de la [sección 6](README.md#6-descenso-de-gradiente-y-retropropagación).

## El problema

Dibujar una imagen verosímil de una sola vez es difícil. Quitar un poco de ruido de una imagen casi limpia es fácil. Un modelo de difusión convierte el problema difícil en el fácil, repetido muchas veces: aprende a quitar un poco de ruido, y luego se aplica una y otra vez, partiendo de nada más que ruido.

Una imagen de 64 x 64 píxeles son 12 288 números, y nadie puede mirar un espacio de 12 288 dimensiones. Así que aquí una "imagen" tiene 2 números: es un punto (x, y), y las "imágenes que vale la pena generar" son los puntos de un anillo de radio 1. Todo lo demás es el método real, siguiendo el artículo "Denoising Diffusion Probabilistic Models" (Ho, Jain y Abbeel, 2020), y como los datos son 2D cada paso se puede dibujar.

```text
forward (fixed, nothing to learn):   ring  ->  blurry ring  ->  ...  ->  noise
reverse (a trained network):         noise ->  ...  ->  blurry ring  ->  ring
```

## Los datos

4000 puntos sobre un anillo: un ángulo aleatorio, y un radio de 1 más una pequeña variación (desviación estándar 0.03), porque los datos reales nunca son perfectamente limpios. Se eligió el anillo porque la distancia de cualquier punto p a él es exacta:

```text
distance = | length of p - 1 |
p = (0.6, 0.9):   length = sqrt(0.36 + 0.81) = 1.082    distance = 0.082
```

La media de esta distancia sobre una nube de puntos dice qué tan bien se asienta la nube sobre el anillo. Es el número que usa la prueba de aceptación.

## Proceso directo: añadir ruido paso a paso

Cada paso encoge un poco el punto y le añade un poco de ruido gaussiano:

```text
x_t = sqrt(1 - beta_t) x_(t-1) + sqrt(beta_t) noise          noise ~ normal(0, 1), a fresh draw each step
```

`beta_t` es la varianza del ruido del paso t. El encogimiento es lo que impide que la nube crezca para siempre. Si la varianza era 1 antes del paso, después de él la varianza es (1 - beta) x 1 + beta x 1 = 1. Así el proceso es arrastrado hacia un destino fijo, una distribución normal con media 0 y varianza 1, sea cual sea la forma de partida.

La lista de betas es el **calendario de ruido** (noise schedule). Aquí hay 100 pasos y beta crece en línea recta de 0.001 a 0.2.

Dos nombres más:

- `alpha_t = 1 - beta_t`: la parte del punto anterior que sobrevive al paso t.
- `alpha_bar_t = alpha_1 x alpha_2 x ... x alpha_t`: la parte del punto **original** que sobrevive a t pasos.

| Step t | beta_t | alpha_bar_t | signal = sqrt(alpha_bar_t) | noise = sqrt(1 - alpha_bar_t) |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0.0000 | 1.000000 | 1.0000 | 0.0000 |
| 10 | 0.0191 | 0.903813 | 0.9507 | 0.3101 |
| 25 | 0.0492 | 0.527916 | 0.7266 | 0.6871 |
| 50 | 0.0995 | 0.074197 | 0.2724 | 0.9622 |
| 75 | 0.1497 | 0.002578 | 0.0508 | 0.9987 |
| 100 | 0.2000 | 0.000020 | 0.0045 | 1.0000 |

### El atajo

Una suma de ruidos gaussianos es de nuevo ruido gaussiano. Así que los t ruidos pequeños de t pasos se pueden reemplazar por un ruido mayor, y cualquier paso se alcanza de un solo salto desde el punto limpio:

```text
x_t = sqrt(alpha_bar_t) x_0 + sqrt(1 - alpha_bar_t) noise

x_0 = (1, 0), t = 25, noise = (0.5, -1.0):
x_25 = 0.7266 x (1, 0) + 0.6871 x (0.5, -1.0) = (1.0702, -0.6871)
```

El entrenamiento depende de este atajo: cada ejemplo cuesta una multiplicación en lugar de hasta 100 pasos. Una prueba recorre 20000 puntos paso a paso, envía otros 20000 con el atajo, y comprueba que las dos nubes tienen las mismas estadísticas en los pasos 10, 25, 50 y 100.

![forward process](../../../projects/artificial-intelligence/diffusion-toy/results/forward.svg)

| Step t | Mean distance to the ring | Mean radius | Spread of the radius | Variance of x | Variance of y |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 0.024 | 1.000 | 0.030 | 0.496 | 0.504 |
| 10 | 0.240 | 1.005 | 0.301 | 0.544 | 0.556 |
| 25 | 0.433 | 1.088 | 0.537 | 0.736 | 0.735 |
| 50 | 0.525 | 1.222 | 0.640 | 0.957 | 0.947 |
| 75 | 0.539 | 1.254 | 0.651 | 1.016 | 0.981 |
| 100 | 0.546 | 1.261 | 0.658 | 1.002 | 1.020 |

La varianza de cada coordenada va de 0.5 (un anillo de radio 1) a 1 (el ruido), exactamente como dice el atajo: en el paso 25, 0.528 x 0.5 + 0.472 x 1 = 0.736.

### Por qué 100 pasos aquí y 1000 en el artículo

El proceso inverso, más abajo, supone que deshacer un paso es de nuevo un pequeño movimiento gaussiano. Eso solo es una buena aproximación cuando cada paso directo añade muy poco ruido. El artículo usa 1000 pasos con beta de 0.0001 a 0.02, porque las imágenes son complicadas y necesitan ese cuidado. Aquí hay 10 veces menos pasos y cada beta es 10 veces mayor, así que la cantidad total de ruido es aproximadamente la misma y el final sigue siendo ruido puro. Cada paso es más tosco. Para un anillo eso cuesta un poco de nitidez. Para una fotografía no sería aceptable.

### ¿El último paso es realmente ruido?

El criterio de aceptación dice que tras el último paso los puntos son estadísticamente indistinguibles del ruido gaussiano. La prueba toma 20000 puntos del anillo, les añade ruido a lo largo de los 100 pasos uno por uno, y compara el resultado con una normal estándar de siete maneras:

| Check | Expected for standard Gaussian noise | Measured (x, y) | Tolerance |
| --- | ---: | ---: | ---: |
| Mean | 0 | -0.0033, -0.0110 | 0.0283 |
| Variance | 1 | 1.0021, 1.0202 | 0.0400 |
| Correlation between x and y | 0 | -0.0031 | 0.0283 |
| Correlation with the starting point | 0 | -0.0006, -0.0069 | 0.0283 |
| Share within 1 standard deviation | 0.6827 | 0.6804, 0.6792 | 0.0132 |
| Share within 2 standard deviations | 0.9545 | 0.9537, 0.9520 | 0.0059 |
| Kolmogorov-Smirnov statistic | 0 | 0.0038, 0.0113 | 0.0138 |

Las tolerancias son de unos 4 errores estándar para 20000 puntos. Una medición hecha sobre una muestra nunca es exactamente el valor verdadero, y su error típico se reduce con 1 / sqrt(n): para la media de 20000 valores de varianza 1 es 1 / sqrt(20000) = 0.0071, y 4 veces eso es 0.0283.

El **estadístico de Kolmogorov-Smirnov** compara la forma completa, no solo dos números. Ordena los valores. Después del i-ésimo de n valores la muestra dice "una parte i / n de mí está por debajo de este valor", y la distribución normal tiene su propia respuesta para el mismo valor, calculada con `math.erf`. El estadístico es la mayor brecha entre las dos respuestas. Para una muestra que de verdad es normal se queda por debajo de 1.95 / sqrt(n) = 0.0138 en 999 de cada 1000 casos.

La misma prueba también demuestra que las comprobaciones no son ciegas. El anillo limpio falla la comprobación de Kolmogorov-Smirnov, el paso 25 falla la comprobación de la varianza y sigue correlacionado con su punto de partida, y 20000 valores extraídos directamente de una normal lo pasan todo.

**Qué significa "indistinguible", con honestidad.** Significa "estas comprobaciones no pueden distinguir los dos con 20000 puntos". No significa que no quede nada. El punto original sigue dentro de x_100, multiplicado por sqrt(alpha_bar_100) = 0.0045. Eso aparecería como una correlación de cerca de 0.003 con el punto de partida, y 20000 puntos solo pueden ver correlaciones superiores a cerca de 0.03. Una muestra del orden de un millón de puntos la vería. El calendario está construido para que ese resto sea despreciable, no cero.

## La red y el objetivo del entrenamiento

La red recibe un punto con ruido y el número del paso, y responde con dos números: su estimación del ruido que hay dentro de ese punto.

```text
input (18 numbers): x_t (2)  +  time embedding of t (16)
layers:             18 -> 64 -> 64 -> 64 -> 2      tanh after each hidden layer
parameters:         9666
```

**Por qué el paso es una entrada.** En el paso 5 el punto está casi limpio y el ruido es una corrección pequeña. En el paso 95 el punto es casi ruido puro. La red debe saber en cuál de los casos está. Un número crudo sería una mala entrada, así que el paso se describe con 8 senos y 8 cosenos de distintas velocidades: las ondas lentas dicen "temprano o tarde" y las rápidas separan pasos vecinos. Es la misma idea que la codificación de posición de un transformer.

**El entrenamiento** repite cinco líneas, 6000 veces, con lotes de 256 puntos:

```text
1. take clean points x_0 from the data
2. pick a random step t for each one, from 1 to 100
3. draw the noise and jump to x_t with the shortcut
4. ask the network for the noise, given x_t and t
5. loss = mean of (true noise - guess)^2, and move the weights to make it smaller
```

Las etiquetas (el ruido) las creamos nosotros. Así que esto es aprendizaje supervisado común con un error cuadrático medio, como en la sección 4 de la página del área.

![training loss](../../../projects/artificial-intelligence/diffusion-toy/results/loss.svg)

| Iterations | Loss |
| ---: | ---: |
| 1 to 200 | 0.2465 |
| 801 to 1000 | 0.1877 |
| 2801 to 3000 | 0.1731 |
| 5801 to 6000 | 0.1702 |

Una red que siempre respondiera "sin ruido" (ceros) tendría una pérdida de 1, la varianza del ruido. La pérdida se estabiliza cerca de 0.17 y no puede llegar a 0: el mismo punto con ruido puede venir de muchos pares distintos de punto limpio y ruido, así que la mejor respuesta posible es un promedio de ellos, y el promedio nunca es exactamente el ruido que se sorteó.

### Sin framework: retropropagación y Adam a mano

La única biblioteca es NumPy, para arreglos y productos de matrices. Para una capa `out = in @ W + b`, donde `g` significa "cuánto cambia la pérdida cuando cambia `out`":

```text
dLoss/dW = in.T @ g          dLoss/db = sum of g over the batch          g for the layer before = g @ W.T
crossing a tanh multiplies g by (1 - tanh^2)
```

**Comprobación del gradiente.** Una derivada escrita a mano es fácil de equivocar, así que una prueba la compara con una pendiente medida sin ningún cálculo: mueve un peso en +h y en -h, y calcula (loss_plus - loss_minus) / 2h. Con h = 0.000001 y floats de 64 bits los dos coinciden para cada uno de los 195 pesos de una red pequeña, con un error relativo inferior a 0.00001.

**Adam** reemplaza el único tamaño de paso del descenso de gradiente simple. Para cada peso guarda una media móvil del gradiente (la dirección) y del gradiente al cuadrado (el tamaño habitual), y divide la primera entre la raíz cuadrada de la segunda. Así cada peso avanza cerca de una tasa de aprendizaje por paso, sea cual sea la escala de su gradiente. La tasa de aprendizaje empieza en 0.003 y baja suavemente hasta 0.

## Proceso inverso: generar

La generación parte de 2000 puntos de ruido gaussiano puro y aplica este paso 100 veces, de t = 100 a t = 1:

```text
x_(t-1) = ( x_t - (1 - alpha_t) / sqrt(1 - alpha_bar_t) x guess ) / sqrt(alpha_t)  +  sigma_t z
```

- `guess` es el ruido que la red ve en x_t. Solo se retira la parte que pertenece a este único paso.
- Dividir entre `sqrt(alpha_t)` deshace el encogimiento del paso directo.
- `sigma_t z` suma de vuelta un poco de ruido nuevo, con `sigma_t = sqrt(beta_t)` (una de las dos opciones del artículo). La red da una respuesta media, y sin este ruido los puntos resbalarían hacia un promedio borroso. En el último paso z = 0, porque el resultado debe quedar limpio.

Un paso con números, en t = 25, para el punto del ejemplo del atajo y una red que estima el ruido exactamente:

```text
beta_25 = 0.0492    sqrt(alpha_25) = 0.9751    (1 - alpha_25) / sqrt(1 - alpha_bar_25) = 0.0492 / 0.6871 = 0.0716
x = (1.0702 - 0.0716 x 0.5) / 0.9751 = 1.0608
y = (-0.6871 - 0.0716 x (-1.0)) / 0.9751 = -0.6312
then add sigma_25 z, with sigma_25 = sqrt(0.0492) = 0.2218
```

El punto se movió solo un poco, de (1.0702, -0.6871) a cerca de (1.0608, -0.6312). Ningún paso por sí solo hace el trabajo. Cien pasos sí.

![reverse process](../../../projects/artificial-intelligence/diffusion-toy/results/reverse.svg)

| Step t | Mean distance to the ring | Mean radius | Spread of the radius | Variance of x | Variance of y |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 0.535 | 1.244 | 0.647 | 0.967 | 0.995 |
| 75 | 0.543 | 1.252 | 0.654 | 0.971 | 1.023 |
| 50 | 0.509 | 1.206 | 0.622 | 0.936 | 0.905 |
| 25 | 0.449 | 1.099 | 0.556 | 0.772 | 0.744 |
| 10 | 0.256 | 0.992 | 0.320 | 0.552 | 0.534 |
| 0 | 0.047 | 0.987 | 0.066 | 0.496 | 0.482 |

Lee esta tabla junto a la del proceso directo: las filas coinciden, en orden inverso. El proceso inverso vuelve a recorrer las mismas nubes. La mayor parte del cambio visible ocurre en los últimos 25 pasos, igual que la mayor parte de la destrucción ocurrió en los primeros 25.

### ¿Aterrizó sobre el anillo?

| Points | Mean distance to the ring |
| --- | ---: |
| Real data (the training set) | 0.024 |
| Generated (step 0 of the reverse process) | 0.047 |
| Pure noise (step 100, where generation starts) | 0.535 |
| Threshold of the test | 0.10 |

El umbral documentado es **0.10**: aproximadamente el doble del 0.047 medido, y menos de una quinta parte de la distancia del ruido puro. Los puntos generados están 11 veces más cerca del anillo que el ruido del que partieron, y aproximadamente el doble de lejos que los datos reales. El anillo generado es más grueso que el real (dispersión del radio 0.066 frente a 0.030), lo que viene del error de una red pequeña y de los pasos gruesos.

Una distancia pequeña no basta. Un modelo que pusiera todos los puntos en el mismo lugar del anillo también la tendría. Por eso una segunda prueba corta el plano en 12 porciones iguales y exige que cada una contenga entre 50% y 150% de una parte equitativa. Medido: de 137 a 182 puntos por porción, con 167 para un anillo perfectamente equitativo. Una tercera prueba comprueba que los puntos son nuevos: ninguno es una copia de un punto de entrenamiento.

### Por qué la difusión es lenta al generar

La red se llamó 100 veces para producir un lote de puntos. Una GAN o el decodificador de un autoencoder se llama una vez. Ese es el precio de dividir un problema difícil en pasos fáciles, y es la razón por la que se dedicó tanto trabajo a muestreadores que necesitan menos pasos.

## Qué añade un modelo de imágenes real

- **Píxeles en lugar de puntos 2D.** Las mismas fórmulas, aplicadas a todos los números del tensor de la imagen a la vez. Una imagen a color de 512 x 512 tiene 786 432 de ellos.
- **Una U-Net (o un transformer) en lugar de una MLP.** La red que estima el ruido debe entender la imagen, así que se construye con convoluciones que reducen la imagen, la procesan y la vuelven a agrandar, con atajos entre las dos mitades. Tiene cientos de millones de parámetros en lugar de 9666.
- **Difusión latente.** Todo el proceso corre sobre el latente pequeño de un autoencoder (por ejemplo 64 x 64 x 4 números en lugar de 512 x 512 x 3), y el decodificador convierte el resultado en píxeles solo al final. Cuesta mucho menos cómputo.
- **Condicionamiento por texto.** La red recibe una tercera entrada además de la imagen con ruido y el paso: el prompt, codificado por un modelo de texto y leído mediante atención cruzada (cross-attention). Aquí no hay condición, así que el modelo solo puede dibujar el anillo.
- **Menos pasos.** Los muestreadores que saltan pasos generan con unas pocas decenas de llamadas en lugar de 1000.
- **Detalles del entrenamiento a escala.** Otros calendarios de ruido, un promedio móvil de los pesos, y muchos más datos y pasos.

Ninguno de ellos cambia las tres ideas que se muestran aquí: destruir los datos con un ruido conocido, aprender a estimar ese ruido, y generar quitándolo poco a poco.

## Ejecútalo

```sh
cd projects/artificial-intelligence/diffusion-toy
./setup-unix-diffusion-toy.sh          # build, tests, demo
docker compose run --rm python-test    # the tests only
docker compose run --rm python-demo    # rewrites results/
```

Todos los números de esta página están en [`results/results.md`](../../../projects/artificial-intelligence/diffusion-toy/results/results.md), escrito por la demo con semillas fijas.
