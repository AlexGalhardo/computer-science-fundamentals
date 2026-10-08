// EN: HTTP server of the benchmark in Java, with the server that ships in the JDK
//     (com.sun.net.httpserver) and Jackson, the most used JSON library, because the JDK has no
//     JSON parser.
//     Model: one virtual thread per request. The handler is plain blocking code. When it
//     waits for the network, the JVM parks the virtual thread and its carrier (OS) thread
//     serves another request. CPU work runs on the carriers, a pool with one thread per core.
//     Protocol (the same in the 7 languages): GET /health, POST /echo, GET /primes?limit=N.
// PT: Servidor HTTP do benchmark em Java, com o servidor que vem no JDK
//     (com.sun.net.httpserver) e o Jackson, a biblioteca de JSON mais usada, porque o JDK não
//     tem parser de JSON.
//     Modelo: uma virtual thread por requisição. O handler é código bloqueante comum. Quando
//     ele espera a rede, a JVM estaciona a virtual thread e a thread carregadora (do SO) atende
//     outra requisição. O trabalho de CPU roda nas carregadoras, um pool com uma thread por
//     núcleo.
//     Protocolo (o mesmo nas 7 linguagens): GET /health, POST /echo, GET /primes?limit=N.

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

public final class Main {
  private static final int MAX_LIMIT = 100000;
  private static final JsonMapper MAPPER = JsonMapper.builder().build();

  private Main() {}

  private static boolean isPrime(int k) {
    if (k < 2) {
      return false;
    }
    if (k < 4) {
      return true;
    }
    if (k % 2 == 0) {
      return false;
    }
    for (int d = 3; d * d <= k; d += 2) {
      if (k % d == 0) {
        return false;
      }
    }
    return true;
  }

  // EN: The CPU-bound endpoint: count the primes up to limit by trial division.
  // PT: O endpoint preso à CPU: conta os primos até limit por divisão por tentativa.
  private static int countPrimes(int limit) {
    int count = 0;
    for (int k = 2; k <= limit; k++) {
      if (isPrime(k)) {
        count++;
      }
    }
    return count;
  }

  private static void send(HttpExchange exchange, int status, String type, byte[] body)
      throws IOException {
    exchange.getResponseHeaders().set("Content-Type", type);
    exchange.sendResponseHeaders(status, body.length);
    try (exchange) {
      exchange.getResponseBody().write(body);
    }
  }

  private static void sendJson(HttpExchange exchange, int status, ObjectNode body)
      throws IOException {
    send(exchange, status, "application/json", MAPPER.writeValueAsBytes(body));
  }

  private static ObjectNode error(String message) {
    return MAPPER.createObjectNode().put("error", message);
  }

  // EN: The echo endpoint parses the JSON body and serialises it again, so it measures the
  //     JSON library and the HTTP stack, not a copy of bytes.
  // PT: O endpoint de eco interpreta o corpo JSON e o serializa de novo, então mede a
  //     biblioteca de JSON e a pilha HTTP, não uma cópia de bytes.
  private static void echo(HttpExchange exchange) throws IOException {
    if (!exchange.getRequestMethod().equals("POST")) {
      send(exchange, 404, "text/plain", "not found".getBytes(StandardCharsets.UTF_8));
      return;
    }
    JsonNode value;
    try {
      value = MAPPER.readTree(exchange.getRequestBody().readAllBytes());
    } catch (JacksonException e) {
      value = null;
    }
    if (value == null || value.isMissingNode()) {
      sendJson(exchange, 400, error("invalid json"));
      return;
    }
    ObjectNode body = MAPPER.createObjectNode().put("language", "java");
    body.set("echo", value);
    sendJson(exchange, 200, body);
  }

  private static int parseLimit(String query) {
    if (query == null) {
      return -1;
    }
    for (String pair : query.split("&")) {
      if (pair.startsWith("limit=")) {
        try {
          return Integer.parseInt(pair.substring("limit=".length()));
        } catch (NumberFormatException e) {
          return -1;
        }
      }
    }
    return -1;
  }

  private static void primes(HttpExchange exchange) throws IOException {
    int limit = parseLimit(exchange.getRequestURI().getQuery());
    if (!exchange.getRequestMethod().equals("GET") || limit < 2 || limit > MAX_LIMIT) {
      sendJson(exchange, 400, error("invalid limit"));
      return;
    }
    sendJson(
        exchange,
        200,
        MAPPER
            .createObjectNode()
            .put("language", "java")
            .put("limit", limit)
            .put("count", countPrimes(limit)));
  }

  public static void main(String[] args) throws IOException {
    HttpServer server = HttpServer.create(new InetSocketAddress(8080), 1024);
    server.createContext(
        "/health", exchange -> send(exchange, 200, "text/plain", "ok".getBytes(StandardCharsets.UTF_8)));
    server.createContext("/echo", Main::echo);
    server.createContext("/primes", Main::primes);
    // EN: This one line is the whole concurrency model: every request gets a new virtual thread.
    // PT: Esta linha é o modelo de concorrência inteiro: cada requisição ganha uma virtual thread.
    server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    server.start();
  }
}
