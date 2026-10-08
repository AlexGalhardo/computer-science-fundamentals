public record Phone(String digits) {
  public Phone {
    digits = digits.replaceAll("\\D", "");
    if (digits.length() < 10 || digits.length() > 11) {
      throw new IllegalArgumentException("invalid phone");
    }
  }

  @Override
  public String toString() {
    String rest = digits.substring(2);
    int split = rest.length() - 4;
    return "("
        + digits.substring(0, 2)
        + ") "
        + rest.substring(0, split)
        + "-"
        + rest.substring(split);
  }
}
