# EN: Build context is the mini-project folder. Gradle downloads Spotless here, at build time,
#     into a folder that stays in the image. The container then runs offline.
# PT: O contexto de build é a pasta do mini-projeto. O Gradle baixa o Spotless aqui, no build,
#     para uma pasta que fica na imagem. Depois o contêiner roda offline.
FROM gradle:9.8.0-jdk25
# The default Gradle home of this image is a volume, and a volume is not saved in the image.
ENV GRADLE_USER_HOME=/opt/gradle-home
WORKDIR /src
COPY java/ .
# EN: spotlessCheck runs here only to download the formatter into the image. Its verdict is
#     ignored at build time: the real check is the first step of the container command.
# PT: O spotlessCheck roda aqui só para baixar o formatador para dentro da imagem. O veredito
#     dele é ignorado no build: a verificação de verdade é o primeiro passo do comando do contêiner.
RUN gradle --no-daemon -q classes testClasses \
	&& (gradle --no-daemon -q spotlessCheck || true) \
	&& printf '#!/bin/sh\nexec java -cp /src/build/classes/java/main philosophers.Demo "$@"\n' > /usr/local/bin/philosophers-java \
	&& chmod +x /usr/local/bin/philosophers-java
CMD ["sh", "-c", "gradle --offline --no-daemon -q spotlessCheck classes testClasses && java -cp build/classes/java/main:build/classes/java/test philosophers.TableTest"]
