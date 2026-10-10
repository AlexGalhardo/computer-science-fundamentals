# EN: Java HTTP server of the benchmark. The three Jackson jars are downloaded from Maven
#     Central at fixed versions (a released artifact there never changes), which avoids a
#     whole build tool for one source file.
# PT: Servidor HTTP em Java do benchmark. Os três jars do Jackson são baixados do Maven Central
#     em versões fixas (um artefato publicado lá nunca muda), o que evita uma ferramenta de
#     build inteira para um arquivo fonte.
# ES: Servidor HTTP en Java del benchmark. Los tres jars de Jackson se descargan de Maven Central
#     en versiones fijas (un artefacto publicado allí nunca cambia), lo que evita una herramienta
#     de build completa para un archivo fuente.
FROM eclipse-temurin:25.0.4.1_1-jdk-noble
ARG JACKSON_VERSION=3.2.3
ARG JACKSON_ANNOTATIONS_VERSION=2.22
ADD https://repo1.maven.org/maven2/tools/jackson/core/jackson-databind/${JACKSON_VERSION}/jackson-databind-${JACKSON_VERSION}.jar /opt/server/lib/
ADD https://repo1.maven.org/maven2/tools/jackson/core/jackson-core/${JACKSON_VERSION}/jackson-core-${JACKSON_VERSION}.jar /opt/server/lib/
ADD https://repo1.maven.org/maven2/com/fasterxml/jackson/core/jackson-annotations/${JACKSON_ANNOTATIONS_VERSION}/jackson-annotations-${JACKSON_ANNOTATIONS_VERSION}.jar /opt/server/lib/
WORKDIR /src
COPY Main.java .
RUN chmod -R a+rX /opt/server && javac -Xlint:all -Werror -cp "/opt/server/lib/*" -d /opt/server/classes Main.java
USER 65534:65534
EXPOSE 8080
CMD ["java", "-cp", "/opt/server/classes:/opt/server/lib/*", "Main"]
