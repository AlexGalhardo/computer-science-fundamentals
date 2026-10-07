FROM eclipse-temurin:25.0.4.1_1-jdk-noble
WORKDIR /app
COPY . .
RUN javac -Xlint:all -Werror -d out Sorts.java Bench.java SortsTest.java
CMD ["java", "-cp", "out", "SortsTest"]
