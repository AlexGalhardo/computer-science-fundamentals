import java.io.IOException;
import java.nio.file.Path;

/** Prints the receipt of every shared scenario, computed by the Java cart. */
public final class Demo {
  private Demo() {}

  public static void main(String[] args) throws IOException {
    for (Scenarios.Result result : Scenarios.runAll(Path.of(args[0]))) {
      System.out.println("== " + result.name());
      System.out.println(Scenarios.format(result.actual()));
    }
  }
}
