#!/usr/bin/env sh
# EN: Freezes the naive table and prints the thread dump taken by jstack, the JDK tool that asks
#     a running JVM for the stack of every thread. jstack also runs the deadlock detector of
#     the JVM and prints the cycle it found at the end.
# PT: Congela a mesa ingênua e imprime o thread dump tirado pelo jstack, a ferramenta do JDK que
#     pede a uma JVM em execução a pilha de cada thread. O jstack também roda o detector de
#     deadlock da JVM e imprime no final o ciclo que ele achou.
# ES: Congela la mesa ingenua e imprime el thread dump tomado por jstack, la herramienta del JDK que
#     le pide a una JVM en ejecución la pila de cada thread. jstack también ejecuta el detector de
#     deadlock de la JVM e imprime al final el ciclo que encontró.
set -eu

java -cp /src/build/classes/java/main philosophers.Demo naive --hold >/dev/null &
pid=$!
# The table freezes in milliseconds and the demo needs 500 ms without a meal to notice.
sleep 3
jstack "$pid"
kill "$pid"
