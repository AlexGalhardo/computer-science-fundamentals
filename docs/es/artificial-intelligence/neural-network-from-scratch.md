# Red neuronal desde cero

> English version: [docs/en/artificial-intelligence/neural-network-from-scratch.md](../../en/artificial-intelligence/neural-network-from-scratch.md) · Versão em português: [docs/pt/artificial-intelligence/neural-network-from-scratch.md](../../pt/artificial-intelligence/neural-network-from-scratch.md)

Miniproyecto MP-AI-2, en [`projects/artificial-intelligence/neural-network-from-scratch`](../../../projects/artificial-intelligence/neural-network-from-scratch). Enseña qué calcula una neurona y cómo la retropropagación encuentra los gradientes. La base está en las secciones [5](README.md#5-neuronas-capas-y-funciones-de-activación) y [6](README.md#6-descenso-de-gradiente-y-retropropagación) de la página del área.

## El plan

Entrenar una red necesita una cosa que es difícil de hacer a mano: la pendiente de la pérdida respecto a cada peso. Este proyecto construye la herramienta que calcula esas pendientes automáticamente, y luego la usa.

1. `engine.py`: un número que recuerda cómo se calculó (`Value`).
2. `nn.py`: una neurona, una capa y una red hechas de esos números.
3. `train.py`: la pérdida y el bucle de descenso de gradiente.

No hay NumPy ni ningún framework. Los tres archivos tienen unas 430 líneas de Python puro, y la mitad de esas líneas son comentarios.

## Un número que recuerda

```python
x, y, z = Value(2.0), Value(1.0), Value(4.0)
f = (x + y) * z  # f.data == 12.0
f.backward()
# x.grad == 4.0, y.grad == 4.0, z.grad == 3.0
```

Cada operación aritmética crea un nuevo `Value` y guarda en él dos cosas: los valores de los que vino, y una pequeña función con la **pendiente local** de esa operación.

| Operation | Local slopes |
| --- | --- |
| `a + b` | 1 for `a`, 1 for `b` |
| `a * b` | `b` for `a`, `a` for `b` |
| `a ** n` | `n * a^(n-1)` |
| `tanh(a)` | `1 - tanh(a)^2` |
| `relu(a)` | 1 if `a > 0`, otherwise 0 |
| `sigmoid(a)` | `s * (1 - s)` |
| `exp(a)` | `exp(a)` |
| `log(a)` | `1 / a` |

El grafo del ejemplo:

```text
x = 2 --\
         (+) --> q = 3 --\
y = 1 --/                 (*) --> f = 12
z = 4 -------------------/
```

`backward()` empieza en `f` con un gradiente de 1 y recorre el grafo desde el resultado hasta las entradas. En cada nodo multiplica el gradiente que llegó por la pendiente local y entrega el producto a las entradas:

```text
f:  gradient 1
*:  q receives 1 x z = 4      z receives 1 x q = 3
+:  x receives 4 x 1 = 4      y receives 4 x 1 = 4
```

Eso es la regla de la cadena, y hacerlo para cada nodo en el orden correcto es la retropropagación. Dos detalles la hacen correcta:

- **Orden.** Un nodo puede pasar su gradiente solo después de haberlo recibido entero. Los nodos se ordenan de modo que cada uno venga después de aquellos a partir de los cuales se construyó (un orden topológico), y el recorrido recorre esa lista hacia atrás.
- **Acumulación.** Cuando un valor se usa en dos lugares, recibe gradiente de ambos, así que los gradientes se suman (`+=`) y nunca se sobrescriben. Para `x * x` con x = 3 las dos contribuciones son 3 + 3 = 6, la derivada de x². La otra cara de esto: los gradientes deben ponerse de nuevo a cero antes de la siguiente pasada hacia atrás, o los antiguos se suman a los nuevos.

## ¿El gradiente es correcto?

La definición de pendiente da una segunda manera, independiente, de calcularla: mover la entrada un poquito y ver cómo se mueve la salida.

```text
numerical gradient = (f(x + h) - f(x - h)) / 2h        with h = 0.000001
```

Las pruebas comparan las dos para cada operación por separado, para combinaciones, para un valor usado dos veces y para **cada peso de una red completa**, dentro de 1e-6. Esta es la prueba que atrapa un signo equivocado o un término olvidado, y es como las bibliotecas reales prueban sus propios gradientes.

## De un número a una red

Una **neurona** es una expresión corta hecha de objetos `Value`: `activation(w1 x1 + w2 x2 + bias)`. Una **capa** es una lista de neuronas que reciben las mismas entradas. Un **MLP** es una lista de capas, donde las salidas de una alimentan a la siguiente. Como cada número involucrado es un `Value`, la pérdida calculada al final también es un `Value`, y una sola llamada a `backward()` rellena el gradiente de cada peso.

Los pesos empiezan como números aleatorios entre -1 y 1. Si todos empezaran iguales, las neuronas de una capa calcularían la misma salida, recibirían el mismo gradiente y seguirían siendo copias unas de otras.

## La pérdida y el bucle

La red produce un número, el logit `z`. `sigmoid(z)` se lee como la probabilidad de la clase 1. La pérdida de un ejemplo es el logaritmo negativo de la probabilidad dada a la clase correcta, que es `log(1 + e^(-s z))` con s = +1 para la clase 1 y -1 para la clase 0: cerca de 0 cuando la red acierta y está segura, grande cuando se equivoca y está segura.

```python
for epoch in range(epochs):
    loss = mean_loss(model, points, labels)  # 1. forward
    model.zero_grad()  # 2. clear the old gradients
    loss.backward()  # 3. backward
    for p in model.parameters():  # 4. step against the gradient
        p.data -= learning_rate * p.grad
```

Estos cuatro pasos son el bucle de entrenamiento de todo framework.

## XOR

XOR responde 1 cuando exactamente una de las dos entradas es 1. Dibujadas en papel, las dos clases quedan en esquinas opuestas de un cuadrado, y ninguna línea recta las separa. Una sola neurona es una línea recta, así que acierta como máximo 3 de los 4 puntos, y una prueba lo comprueba. Con una capa oculta de 4 neuronas (17 parámetros):

| x1 | x2 | XOR | P(class 1) | Answer |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 0 | 0 | 0.005 | 0 |
| 0 | 1 | 1 | 0.974 | 1 |
| 1 | 0 | 1 | 0.973 | 1 |
| 1 | 1 | 0 | 0.037 | 0 |

La pérdida pasó de 0.7863 a 0.0244 en 300 épocas.

## Dos lunas

El segundo conjunto de datos tiene dos semicírculos entrelazados con ruido, 80 puntos para entrenar y otros 200 para probar. Una red 2-8-8-1 (105 parámetros) entrenada durante 120 épocas:

| Set | Points | Accuracy |
| --- | ---: | ---: |
| Training | 80 | 98.8% |
| Test (never used in training) | 200 | 99.5% |

El conjunto de prueba es el número honesto: está hecho de puntos que la red nunca vio.

![Loss per epoch](../../../projects/artificial-intelligence/neural-network-from-scratch/results/loss-curve.svg)

La pérdida baja rápido al principio, avanza despacio durante un rato y luego vuelve a bajar cuando la red encuentra cómo curvar la frontera. Una curva de pérdida es lo primero que hay que mirar en cualquier entrenamiento.

![Decision boundary](../../../projects/artificial-intelligence/neural-network-from-scratch/results/decision-boundary.svg)

La **frontera de decisión** es donde la respuesta cambia de una clase a la otra. Se dibuja preguntándole a la red su respuesta en cada celda de una cuadrícula. El color es más fuerte donde la red está más segura, y la frontera es una curva: esa curva es lo que compraron las capas ocultas.

## Qué añade un framework real

- **Tensores.** Aquí cada número es un objeto de Python. Un framework guarda una capa entera como un arreglo y la calcula en una sola operación optimizada, en una CPU o una GPU. La idea del grafo y de las pendientes locales es la misma.
- **Más operaciones**, con la pendiente de cada una ya escrita.
- **Optimizadores** mejores que el descenso de gradiente simple, como Adam.

El miniproyecto [pytorch-basics](pytorch-basics.md) rehace esta red con PyTorch y comprueba que el framework calcula los mismos gradientes que este motor.

## Ejecútalo

```sh
cd projects/artificial-intelligence/neural-network-from-scratch
./setup-unix-neural-network-from-scratch.sh
```
