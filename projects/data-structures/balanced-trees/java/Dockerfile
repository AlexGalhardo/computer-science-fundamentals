# EN: Gradle on a pinned image checks the format with Spotless (google-java-format) while the
#     image is built, which is the only step that needs the network. The code is compiled with
#     javac and every lint warning is an error. The tests then run with no network.
# PT: O Gradle em uma imagem fixada confere o formato com o Spotless (google-java-format) durante
#     o build da imagem, que é a única etapa que precisa de rede. O código é compilado com javac
#     e todo aviso de lint é erro. Os testes depois rodam sem rede.
# ES: Gradle en una imagen fijada revisa el formato con Spotless (google-java-format) durante
#     el build de la imagen, que es el único paso que necesita red. El código se compila con javac
#     y todo aviso de lint es un error. Las pruebas después corren sin red.
FROM gradle:9.8.0-jdk25
WORKDIR /app
COPY . .
RUN gradle --no-daemon --quiet spotlessCheck \
	&& javac -Xlint:all -Werror -d /opt/classes src/*.java
CMD ["java", "-cp", "/opt/classes", "TreeTests"]
