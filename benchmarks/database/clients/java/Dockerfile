# EN: Java database client of the benchmark. The jars are downloaded from Maven Central at
#     fixed versions. slf4j-nop is the "do nothing" logger HikariCP asks for.
# PT: Cliente de banco em Java do benchmark. Os jars são baixados do Maven Central em versões
#     fixas. O slf4j-nop é o logger "que não faz nada" que o HikariCP pede.
# ES: Cliente de base de datos en Java del benchmark. Los jars se descargan de Maven Central en
#     versiones fijas. slf4j-nop es el logger "que no hace nada" que pide HikariCP.
FROM eclipse-temurin:25.0.4.1_1-jdk-noble
ARG PGJDBC_VERSION=42.7.14
ARG HIKARI_VERSION=7.1.0
ARG SLF4J_VERSION=2.0.20
ADD https://repo1.maven.org/maven2/org/postgresql/postgresql/${PGJDBC_VERSION}/postgresql-${PGJDBC_VERSION}.jar /opt/client/lib/
ADD https://repo1.maven.org/maven2/com/zaxxer/HikariCP/${HIKARI_VERSION}/HikariCP-${HIKARI_VERSION}.jar /opt/client/lib/
ADD https://repo1.maven.org/maven2/org/slf4j/slf4j-api/${SLF4J_VERSION}/slf4j-api-${SLF4J_VERSION}.jar /opt/client/lib/
ADD https://repo1.maven.org/maven2/org/slf4j/slf4j-nop/${SLF4J_VERSION}/slf4j-nop-${SLF4J_VERSION}.jar /opt/client/lib/
WORKDIR /src
COPY Main.java .
RUN chmod -R a+rX /opt/client && javac -Xlint:all,-classfile -Werror -cp "/opt/client/lib/*" -d /opt/client/classes Main.java
USER 65534:65534
ENTRYPOINT ["java", "-cp", "/opt/client/classes:/opt/client/lib/*", "Main"]
