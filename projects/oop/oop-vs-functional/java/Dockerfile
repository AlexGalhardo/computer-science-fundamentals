# EN: The build context is the mini-project folder, not java/, because scenarios.txt is shared
#     with the other implementations. Gradle on a pinned image checks the format with Spotless
#     (google-java-format) while the image is built, which is the only step that needs the
#     network. The code is compiled with javac and every lint warning is an error. The tests
#     then run with no network.
# PT: O contexto de build é a pasta do mini-projeto, e não java/, porque scenarios.txt é
#     compartilhado com as outras implementações. O Gradle em uma imagem fixada confere o
#     formato com o Spotless (google-java-format) durante o build da imagem, que é a única etapa
#     que precisa de rede. O código é compilado com javac e todo aviso de lint é erro. Os testes
#     depois rodam sem rede.
# ES: El contexto de build es la carpeta del miniproyecto, y no java/, porque scenarios.txt se
#     comparte con las otras implementaciones. Gradle en una imagen fija verifica el formato con
#     Spotless (google-java-format) durante la construcción de la imagen, que es el único paso que
#     necesita red. El código se compila con javac y todo aviso de lint es un error. Después las
#     pruebas corren sin red.
FROM gradle:9.8.0-jdk25
WORKDIR /app/java
COPY java ./
RUN gradle --no-daemon --quiet spotlessCheck \
	&& javac -Xlint:all -Werror -d /opt/classes src/cart/*.java src/support/*.java
COPY scenarios.txt /app/scenarios.txt
CMD ["java", "-cp", "/opt/classes", "CartTests", "/app/scenarios.txt"]
