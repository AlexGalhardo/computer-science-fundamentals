package counterrace;

import com.google.errorprone.annotations.concurrent.GuardedBy;

/**
 * Fix 1: mutual exclusion.
 *
 * <p>EN: Every Java object has a built-in lock (its monitor). A {@code synchronized} method takes
 * the lock of {@code this} on entry and releases it on exit, even when an exception is thrown. Only
 * one thread at a time runs the three steps of the increment. Reading needs the lock too: without
 * it a thread may see a stale value.
 *
 * <p>PT: Todo objeto Java tem uma trava embutida (o monitor). Um método {@code synchronized} pega a
 * trava de {@code this} ao entrar e a solta ao sair, mesmo quando uma exceção é lançada. Só uma
 * thread por vez executa os três passos do incremento. A leitura também precisa da trava: sem ela,
 * uma thread pode enxergar um valor antigo.
 *
 * <p>ES: Todo objeto Java tiene un lock incorporado (el monitor). Un método {@code synchronized}
 * toma el lock de {@code this} al entrar y lo suelta al salir, incluso cuando se lanza una
 * excepción. Solo un thread a la vez ejecuta los tres pasos del incremento. La lectura también
 * necesita el lock: sin él, un thread puede ver un valor antiguo.
 */
public final class MutexCounter implements Counter {
  @GuardedBy("this")
  private long count;

  @Override
  public synchronized void inc() {
    count++;
  }

  @Override
  public synchronized long value() {
    return count;
  }
}
