# EN: Gradle on a pinned image checks the format with Spotless (google-java-format) while the
#     image is built, which is the only step that needs the network. The code is compiled with
#     javac and every lint warning is an error. The last build step is a negative test: javac
#     must REJECT negative/SwappedArguments.java, and the build fails if it is accepted. The
#     tests then run with no network.
# PT: O Gradle em uma imagem fixada confere o formato com o Spotless (google-java-format) durante
#     o build da imagem, que é a única etapa que precisa de rede. O código é compilado com javac
#     e todo aviso de lint é erro. A última etapa do build é um teste negativo: o javac precisa
#     RECUSAR negative/SwappedArguments.java, e o build falha se ele for aceito. Os testes depois
#     rodam sem rede.
# ES: Gradle en una imagen fijada verifica el formato con Spotless (google-java-format) mientras
#     se construye la imagen, que es el único paso que necesita red. El código se compila con
#     javac y toda advertencia de lint es un error. El último paso del build es un test negativo:
#     javac debe RECHAZAR negative/SwappedArguments.java, y el build falla si lo acepta. Los
#     tests después se ejecutan sin red.
FROM gradle:9.8.0-jdk25
WORKDIR /app
COPY . .
RUN gradle --no-daemon --quiet spotlessCheck \
	&& javac -Xlint:all -Werror -d /opt/classes src/*/*.java
RUN if javac -cp /opt/classes -d /tmp/negative negative/SwappedArguments.java 2>/tmp/negative.log; then \
		echo "negative/SwappedArguments.java compiled, but it must not" >&2; exit 1; \
	else \
		grep -q "incompatible types" /tmp/negative.log; \
	fi
CMD ["java", "-cp", "/opt/classes", "SmellTests"]
