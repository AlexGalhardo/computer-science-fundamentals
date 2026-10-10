# EN: The image is built in one step that needs the network (Gradle downloads the Spotless
#     plugin and google-java-format) and does three things: checks the formatting, compiles with
#     every warning as an error, and leaves the classes ready. After that the container runs the
#     tests with plain `java` and no network.
# PT: A imagem é construída em um passo que precisa de rede (o Gradle baixa o plugin Spotless e
#     o google-java-format) e faz três coisas: confere a formatação, compila com todo aviso
#     tratado como erro, e deixa as classes prontas. Depois disso o contêiner roda os testes com
#     `java` puro e sem rede.
# ES: La imagen se construye en un paso que necesita red (Gradle descarga el plugin Spotless y
#     google-java-format) y hace tres cosas: comprueba el formato, compila tratando todo aviso
#     como error, y deja las clases listas. Después de eso el contenedor ejecuta las pruebas con
#     `java` puro y sin red.
FROM gradle:9.8.0-jdk25
WORKDIR /app
COPY . .
RUN gradle --no-daemon --console=plain spotlessCheck testClasses
CMD ["java", "-cp", "build/classes/java/main:build/classes/java/test", "solid.SolidTest"]
