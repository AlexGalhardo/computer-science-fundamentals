# EN: Compiles the Java implementation of one workload to class files in /opt/bench. The JVM
#     still compiles the hot code to machine code at run time (JIT), which is part of what the
#     benchmark shows.
# PT: Compila a implementação em Java de uma carga de trabalho para arquivos .class em
#     /opt/bench. A JVM ainda compila o código quente para código de máquina em tempo de
#     execução (JIT), o que faz parte do que o benchmark mostra.
FROM eclipse-temurin:25.0.4.1_1-jdk-noble
WORKDIR /src
COPY java/ .
RUN javac -Xlint:all -Werror -d /opt/bench Main.java
