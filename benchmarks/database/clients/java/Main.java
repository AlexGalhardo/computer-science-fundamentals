// EN: Database client of the benchmark in Java, with the official PostgreSQL JDBC driver and
//     HikariCP, the most used connection pool. The four phases are the same in the 7
//     languages: insert n rows one by one, read each by primary key, run a query with a filter
//     and an aggregate, and read by key again from 8 threads sharing a pool of 8 connections.
//     JDBC calls block, so each worker is a thread that waits for its answer.
// PT: Cliente de banco de dados do benchmark em Java, com o driver JDBC oficial do PostgreSQL e
//     o HikariCP, o pool de conexões mais usado. As quatro fases são as mesmas nas 7 linguagens:
//     inserir n linhas uma a uma, ler cada uma pela chave primária, rodar uma consulta com
//     filtro e agregação, e ler pela chave de novo a partir de 8 threads dividindo um pool de 8
//     conexões. As chamadas JDBC bloqueiam, então cada worker é uma thread que espera a resposta.
// ES: Cliente de base de datos del benchmark en Java, con el driver JDBC oficial de PostgreSQL y
//     HikariCP, el pool de conexiones más usado. Las cuatro fases son las mismas en los 7 lenguajes:
//     insertar n filas una por una, leer cada una por la clave primaria, ejecutar una consulta con
//     filtro y agregación, y leer por la clave de nuevo desde 8 threads que comparten un pool de 8
//     conexiones. Las llamadas JDBC bloquean, así que cada worker es un thread que espera la respuesta.

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public final class Main {
  private static final String TABLE = "items_java";
  private static final int QUERY_OPS = 200;
  private static final int CATEGORIES = 10;

  private interface Operation {
    long run(int i) throws SQLException;
  }

  private static final class Phase {
    int ops;
    double elapsedMs;
    long total;
    final List<Double> latencies = new ArrayList<>();

    String json() {
      Collections.sort(latencies);
      return String.format(
          Locale.ROOT,
          "{\"ops\":%d,\"elapsedMs\":%.3f,\"p50Ms\":%.4f,\"p95Ms\":%.4f,\"p99Ms\":%.4f}",
          ops, elapsedMs, at(0.50), at(0.95), at(0.99));
    }

    private double at(double q) {
      return latencies.isEmpty()
          ? 0
          : latencies.get(Math.min(latencies.size() - 1, (int) (q * latencies.size())));
    }
  }

  private Main() {}

  // EN: Runs the operation for every id from..to in steps, timing each call.
  // PT: Roda a operação para cada id de from a to em passos, cronometrando cada chamada.
  // ES: Ejecuta la operación para cada id de from a to con paso, cronometrando cada llamada.
  private static Phase timed(int from, int to, int step, Operation operation) throws SQLException {
    Phase phase = new Phase();
    long start = System.nanoTime();
    for (int i = from; i <= to; i += step) {
      long before = System.nanoTime();
      phase.total += operation.run(i);
      phase.latencies.add((System.nanoTime() - before) / 1e6);
      phase.ops++;
    }
    phase.elapsedMs = (System.nanoTime() - start) / 1e6;
    return phase;
  }

  private static String env(String key, String fallback) {
    String value = System.getenv(key);
    return value == null || value.isEmpty() ? fallback : value;
  }

  private static long peakMemoryKb() throws java.io.IOException {
    for (String line : Files.readAllLines(Path.of("/proc/self/status"))) {
      if (line.startsWith("VmHWM:")) {
        return Long.parseLong(line.replaceAll("[^0-9]", ""));
      }
    }
    return 0;
  }

  public static void main(String[] args) throws Exception {
    int n = args.length > 0 ? Integer.parseInt(args[0]) : 1000;
    int workers = args.length > 1 ? Integer.parseInt(args[1]) : 8;
    String url =
        "jdbc:postgresql://" + env("PGHOST", "localhost") + ":" + env("PGPORT", "5432") + "/" + env("PGDATABASE", "bench");
    String user = env("PGUSER", "bench");
    String password = env("PGPASSWORD", "bench");
    String readSql = "SELECT name, price FROM " + TABLE + " WHERE id = ?";
    Phase insert;
    Phase read;
    Phase query;
    Phase pooled = new Phase();

    try (Connection conn = DriverManager.getConnection(url, user, password)) {
      try (Statement statement = conn.createStatement()) {
        statement.execute("DROP TABLE IF EXISTS " + TABLE);
        statement.execute(
            "CREATE TABLE " + TABLE + " (id integer PRIMARY KEY, name text NOT NULL, category integer NOT NULL, price integer NOT NULL)");
      }

      // EN: A PreparedStatement sends the values apart from the SQL text, which is also what
      //     keeps user input from ever being run as SQL.
      // PT: Um PreparedStatement envia os valores separados do texto SQL, e é isso também que
      //     impede que uma entrada do usuário seja executada como SQL.
      // ES: Un PreparedStatement envía los valores separados del texto SQL, y eso también es lo que
      //     impide que una entrada del usuario se ejecute como SQL.
      try (PreparedStatement ps =
          conn.prepareStatement("INSERT INTO " + TABLE + " (id, name, category, price) VALUES (?, ?, ?, ?)")) {
        insert =
            timed(1, n, 1, i -> {
              ps.setInt(1, i);
              ps.setString(2, "item-" + i);
              ps.setInt(3, i % CATEGORIES);
              ps.setInt(4, (i * 37) % 1000);
              ps.executeUpdate();
              return 0;
            });
      }
      try (PreparedStatement ps = conn.prepareStatement(readSql)) {
        read =
            timed(1, n, 1, i -> {
              ps.setInt(1, i);
              try (ResultSet rows = ps.executeQuery()) {
                rows.next();
                return rows.getLong(2);
              }
            });
      }
      try (PreparedStatement ps =
          conn.prepareStatement("SELECT count(*), coalesce(sum(price), 0) FROM " + TABLE + " WHERE category = ?")) {
        query =
            timed(0, QUERY_OPS - 1, 1, i -> {
              ps.setInt(1, i % CATEGORIES);
              try (ResultSet rows = ps.executeQuery()) {
                rows.next();
                return rows.getLong(1) + rows.getLong(2);
              }
            });
      }

      // EN: A pool keeps connections open and lends one to each thread that asks.
      // PT: Um pool mantém conexões abertas e empresta uma a cada thread que pedir.
      // ES: Un pool mantiene conexiones abiertas y presta una a cada thread que la pida.
      HikariConfig config = new HikariConfig();
      config.setJdbcUrl(url);
      config.setUsername(user);
      config.setPassword(password);
      config.setMaximumPoolSize(workers);
      config.setMinimumIdle(workers);
      try (HikariDataSource pool = new HikariDataSource(config);
          ExecutorService executor = Executors.newFixedThreadPool(workers)) {
        for (int w = 0; w < workers; w++) {
          try (Connection warm = pool.getConnection()) {
            warm.isValid(1);
          }
        }
        List<Future<Phase>> futures = new ArrayList<>();
        long start = System.nanoTime();
        for (int w = 0; w < workers; w++) {
          int first = w + 1;
          futures.add(
              executor.submit(
                  () ->
                      timed(first, n, workers, i -> {
                        try (Connection lent = pool.getConnection();
                            PreparedStatement ps = lent.prepareStatement(readSql)) {
                          ps.setInt(1, i);
                          try (ResultSet rows = ps.executeQuery()) {
                            rows.next();
                            return rows.getLong(2);
                          }
                        }
                      })));
        }
        for (Future<Phase> future : futures) {
          Phase part = future.get();
          pooled.ops += part.ops;
          pooled.total += part.total;
          pooled.latencies.addAll(part.latencies);
        }
        pooled.elapsedMs = (System.nanoTime() - start) / 1e6;
      }

      try (Statement statement = conn.createStatement()) {
        statement.execute("DROP TABLE " + TABLE);
      }
    }

    // EN: CPU time of every thread of the JVM and peak memory of the JVM, counted by the kernel.
    // PT: Tempo de CPU de todas as threads da JVM e pico de memória da JVM, contados pelo kernel.
    // ES: Tiempo de CPU de todos los threads de la JVM y pico de memoria de la JVM, contados por el kernel.
    double cpuMs = ProcessHandle.current().info().totalCpuDuration().orElse(Duration.ZERO).toNanos() / 1e6;
    System.out.println(
        String.format(
            Locale.ROOT,
            "{\"language\":\"java\",\"driver\":\"pgjdbc + HikariCP\",\"n\":%d,\"concurrency\":%d,\"checksum\":\"%d\",\"cpuMs\":%.1f,\"memoryKb\":%d,\"phases\":{\"insert\":%s,\"read\":%s,\"query\":%s,\"pool\":%s}}",
            n, workers, read.total + query.total + pooled.total, cpuMs, peakMemoryKb(),
            insert.json(), read.json(), query.json(), pooled.json()));
  }
}
