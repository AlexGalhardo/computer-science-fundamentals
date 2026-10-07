package counterrace;

/** Something that many threads can increment and that is read at the end. */
public interface Counter {
  void inc();

  long value();

  /** Stops any thread the counter started. Most counters start none. */
  default void close() {}
}
