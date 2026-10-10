# EN: Base image for Java mini-projects: JDK 25 (LTS) with Gradle. Spotless with
#     google-java-format runs as a Gradle plugin declared by each project.
# PT: Imagem base dos mini-projetos em Java: JDK 25 (LTS) com Gradle. O Spotless com
#     google-java-format roda como plugin do Gradle declarado em cada projeto.
# ES: Imagen base de los mini-proyectos en Java: JDK 25 (LTS) con Gradle. Spotless con
#     google-java-format corre como plugin de Gradle declarado en cada proyecto.
FROM gradle:9.8.0-jdk25
WORKDIR /app
CMD ["java", "--version"]
