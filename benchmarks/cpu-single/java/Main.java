// EN: Single-thread CPU workload in Java: `nbody` (floating point) and `sieve` (integers and
//     memory). The JVM starts by interpreting bytecode and compiles the hot loops to machine
//     code while the program runs (JIT), so short runs pay a warm-up that long runs amortise.
// PT: Carga de CPU em uma thread em Java: `nbody` (ponto flutuante) e `sieve` (inteiros e
//     memória). A JVM começa interpretando bytecode e compila os laços quentes para código de
//     máquina enquanto o programa roda (JIT), então execuções curtas pagam um aquecimento que
//     as longas diluem.
// ES: Carga de CPU en un thread en Java: `nbody` (punto flotante) y `sieve` (enteros y
//     memoria). La JVM empieza interpretando bytecode y compila los bucles calientes a código de
//     máquina mientras el programa corre (JIT), así que las ejecuciones cortas pagan un
//     calentamiento que las largas diluyen.

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

public final class Main {
  private static final double SOLAR_MASS = 4.0 * Math.PI * Math.PI;
  private static final double DAYS_PER_YEAR = 365.24;
  private static final double DT = 0.01;

  private static final class Body {
    double x;
    double y;
    double z;
    double vx;
    double vy;
    double vz;
    final double mass;

    Body(double x, double y, double z, double vx, double vy, double vz, double mass) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.vx = vx * DAYS_PER_YEAR;
      this.vy = vy * DAYS_PER_YEAR;
      this.vz = vz * DAYS_PER_YEAR;
      this.mass = mass * SOLAR_MASS;
    }
  }

  private Main() {}

  // EN: Sun, Jupiter, Saturn, Uranus and Neptune.
  // PT: Sol, Júpiter, Saturno, Urano e Netuno.
  // ES: Sol, Júpiter, Saturno, Urano y Neptuno.
  private static Body[] makeBodies() {
    return new Body[] {
      new Body(0, 0, 0, 0, 0, 0, 1),
      new Body(
          4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01,
          1.66007664274403694e-03, 7.69901118419740425e-03, -6.90460016972063023e-05,
          9.54791938424326609e-04),
      new Body(
          8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01,
          -2.76742510726862411e-03, 4.99852801234917238e-03, 2.30417297573763929e-05,
          2.85885980666130812e-04),
      new Body(
          1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01,
          2.96460137564761618e-03, 2.37847173959480950e-03, -2.96589568540237556e-05,
          4.36624404335156298e-05),
      new Body(
          1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01,
          2.68067772490389322e-03, 1.62824170038242295e-03, -9.51592254519715870e-05,
          5.15138902046611451e-05),
    };
  }

  private static void offsetMomentum(Body[] bodies) {
    double px = 0.0;
    double py = 0.0;
    double pz = 0.0;
    for (Body b : bodies) {
      px += b.vx * b.mass;
      py += b.vy * b.mass;
      pz += b.vz * b.mass;
    }
    bodies[0].vx = -px / SOLAR_MASS;
    bodies[0].vy = -py / SOLAR_MASS;
    bodies[0].vz = -pz / SOLAR_MASS;
  }

  // EN: One time step: every pair pulls on each other, then every body moves.
  // PT: Um passo de tempo: cada par se atrai, depois cada corpo anda.
  // ES: Un paso de tiempo: cada par se atrae, luego cada cuerpo avanza.
  private static void advance(Body[] bodies) {
    for (int i = 0; i < bodies.length; i++) {
      Body a = bodies[i];
      for (int j = i + 1; j < bodies.length; j++) {
        Body b = bodies[j];
        double dx = a.x - b.x;
        double dy = a.y - b.y;
        double dz = a.z - b.z;
        double dist2 = dx * dx + dy * dy + dz * dz;
        double mag = DT / (dist2 * Math.sqrt(dist2));
        a.vx -= dx * b.mass * mag;
        a.vy -= dy * b.mass * mag;
        a.vz -= dz * b.mass * mag;
        b.vx += dx * a.mass * mag;
        b.vy += dy * a.mass * mag;
        b.vz += dz * a.mass * mag;
      }
    }
    for (Body b : bodies) {
      b.x += DT * b.vx;
      b.y += DT * b.vy;
      b.z += DT * b.vz;
    }
  }

  private static double energy(Body[] bodies) {
    double e = 0.0;
    for (int i = 0; i < bodies.length; i++) {
      Body a = bodies[i];
      e += 0.5 * a.mass * (a.vx * a.vx + a.vy * a.vy + a.vz * a.vz);
      for (int j = i + 1; j < bodies.length; j++) {
        Body b = bodies[j];
        double dx = a.x - b.x;
        double dy = a.y - b.y;
        double dz = a.z - b.z;
        e -= a.mass * b.mass / Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
    }
    return e;
  }

  private static String nbody(int n) {
    Body[] bodies = makeBodies();
    offsetMomentum(bodies);
    for (int step = 0; step < n; step++) {
      advance(bodies);
    }
    return String.format(Locale.ROOT, "%.9f", energy(bodies));
  }

  // EN: Sieve of Eratosthenes. The checksum is "how many primes:the largest one".
  // PT: Crivo de Eratóstenes. O checksum é "quantos primos:o maior deles".
  // ES: Criba de Eratóstenes. El checksum es "cuántos primos:el mayor de ellos".
  private static String sieve(int n) {
    boolean[] composite = new boolean[n + 1];
    for (long i = 2; i * i <= n; i++) {
      if (!composite[(int) i]) {
        for (long j = i * i; j <= n; j += i) {
          composite[(int) j] = true;
        }
      }
    }
    int count = 0;
    int largest = 0;
    for (int i = 2; i <= n; i++) {
      if (!composite[i]) {
        count++;
        largest = i;
      }
    }
    return count + ":" + largest;
  }

  // EN: VmHWM in /proc/self/status is the peak resident memory of the whole JVM, in kibibytes.
  // PT: VmHWM em /proc/self/status é o pico de memória residente da JVM inteira, em kibibytes.
  // ES: VmHWM en /proc/self/status es el pico de memoria residente de toda la JVM, en kibibytes.
  private static long peakMemoryKb() {
    try {
      for (String line : Files.readAllLines(Path.of("/proc/self/status"))) {
        if (line.startsWith("VmHWM:")) {
          return Long.parseLong(line.replaceAll("[^0-9]", ""));
        }
      }
    } catch (IOException e) {
      // EN: Not on Linux: report zero instead of failing the run.
      // PT: Fora do Linux: informa zero em vez de derrubar a execução.
      // ES: Fuera de Linux: informa cero en lugar de tumbar la ejecución.
    }
    return 0;
  }

  public static void main(String[] args) {
    String implementation = args.length > 0 ? args[0] : "nbody";
    int n = args.length > 1 ? Integer.parseInt(args[1]) : 1000;

    long start = System.nanoTime();
    String checksum = implementation.equals("sieve") ? sieve(n) : nbody(n);
    double elapsedMs = (System.nanoTime() - start) / 1e6;

    System.out.println(
        String.format(
            Locale.ROOT,
            "{\"n\":%d,\"elapsedMs\":%.3f,\"memoryKb\":%d,\"language\":\"java\",\"implementation\":\"%s\",\"checksum\":\"%s\"}",
            n, elapsedMs, peakMemoryKb(), implementation, checksum));
  }
}
