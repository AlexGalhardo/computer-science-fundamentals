package counterrace;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;

/**
 * Fix 3: message passing.
 *
 * <p>EN: One thread owns the number, as a local variable that nobody else can reach. The other
 * threads put messages in a blocking queue, which plays the role of a channel, and the owner
 * handles them one at a time. The queue is bounded: when it is full, {@code put} makes the senders
 * wait, so they cannot outrun the owner (backpressure).
 *
 * <p>PT: Uma thread é dona do número, em uma variável local que ninguém mais alcança. As outras
 * threads colocam mensagens em uma fila bloqueante, que faz o papel de canal, e a dona as trata uma
 * por vez. A fila é limitada: quando enche, {@code put} faz os remetentes esperarem, então eles não
 * conseguem atropelar a dona (backpressure).
 *
 * <p>ES: Un thread es dueño del número, en una variable local que nadie más alcanza. Los otros
 * threads colocan mensajes en una cola bloqueante, que hace el papel de canal, y el dueño los
 * atiende uno por uno. La cola es limitada: cuando se llena, {@code put} hace esperar a los
 * remitentes, así que no pueden atropellar al dueño (backpressure).
 */
public final class QueueCounter implements Counter {
  private sealed interface Message permits Inc, Get, Stop {}

  private record Inc() implements Message {}

  private record Get(CompletableFuture<Long> reply) implements Message {}

  private record Stop() implements Message {}

  private static final Message INC = new Inc();

  private final BlockingQueue<Message> inbox = new ArrayBlockingQueue<>(1024);

  private QueueCounter() {}

  /** Creates the counter and starts the thread that owns the number. */
  public static QueueCounter start() {
    QueueCounter counter = new QueueCounter();
    Thread owner = new Thread(counter::own, "counter-owner");
    owner.setDaemon(true);
    owner.start();
    return counter;
  }

  private void own() {
    long count = 0;
    try {
      while (true) {
        switch (inbox.take()) {
          case Inc inc -> count++;
          case Get get -> get.reply().complete(count);
          case Stop stop -> {
            return;
          }
        }
      }
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }
  }

  private void send(Message message) {
    try {
      inbox.put(message);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("interrupted while sending to the owner", e);
    }
  }

  @Override
  public void inc() {
    send(INC);
  }

  @Override
  public long value() {
    CompletableFuture<Long> reply = new CompletableFuture<>();
    send(new Get(reply));
    return reply.join();
  }

  @Override
  public void close() {
    send(new Stop());
  }
}
