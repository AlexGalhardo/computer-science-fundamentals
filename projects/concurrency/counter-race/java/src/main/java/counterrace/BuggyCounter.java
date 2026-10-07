package counterrace;

import com.google.errorprone.annotations.concurrent.GuardedBy;

/**
 * DELIBERATELY WRONG: this class loses updates. It exists only to show the bug.
 *
 * <p>EN: {@code count++} looks like one step, but the JVM does three: read the field, add 1, write
 * the field. Two threads can both read 41 and both write 42, and one increment is lost. The field
 * says it is guarded by {@code this}, but {@code inc} never takes that lock.
 *
 * <p>PT: {@code count++} parece um passo só, mas a JVM faz três: lê o campo, soma 1, grava o campo.
 * Duas threads podem ler 41 e gravar 42, e um incremento se perde. O campo diz que é protegido por
 * {@code this}, mas {@code inc} nunca pega essa trava.
 */
public final class BuggyCounter implements Counter {
  // EN: `volatile` does NOT fix the bug. It only guarantees visibility: every read sees the last
  //     write. The read, the addition and the write are still three separate steps. It is here
  //     for an honest demo: with a plain field the JIT compiler may merge the whole loop into a
  //     single addition, and the bug would hide by luck (we measured 8 clean runs out of 10).
  // PT: `volatile` NÃO corrige o bug. Ele só garante visibilidade: toda leitura enxerga a última
  //     escrita. A leitura, a soma e a escrita continuam sendo três passos separados. Ele está
  //     aqui para a demo ser honesta: com um campo comum o compilador JIT pode juntar o laço
  //     inteiro em uma única soma, e o bug se esconderia por sorte (medimos 8 execuções limpas
  //     em 10).
  @GuardedBy("this")
  private volatile long count;

  @Override
  public void inc() {
    count++; // DELIBERATELY WRONG: no lock is held here.
  }

  @Override
  public long value() {
    return count; // DELIBERATELY WRONG: no lock is held here either.
  }
}
