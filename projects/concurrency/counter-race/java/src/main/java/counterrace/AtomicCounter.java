package counterrace;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Fix 2: an atomic operation.
 *
 * <p>EN: {@code incrementAndGet} uses a processor instruction that reads, adds and writes as one
 * indivisible step, so no lock is needed. Atomics protect one variable. When two variables must
 * change together, a lock is still the right tool.
 *
 * <p>PT: {@code incrementAndGet} usa uma instrução do processador que lê, soma e grava como um
 * passo indivisível, então não é preciso trava. Atômicos protegem uma variável. Quando duas
 * variáveis precisam mudar juntas, a trava continua sendo a ferramenta certa.
 */
public final class AtomicCounter implements Counter {
  private final AtomicLong count = new AtomicLong();

  @Override
  public void inc() {
    count.incrementAndGet();
  }

  @Override
  public long value() {
    return count.get();
  }
}
