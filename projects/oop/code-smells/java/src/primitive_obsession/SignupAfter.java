public final class SignupAfter implements Signup {
  @Override
  public String register(String name, String email, String phone) {
    return new Account(name, new Email(email), new Phone(phone)).describe();
  }

  @Override
  public String invite(String ownEmail, String friendEmail) {
    Email own = new Email(ownEmail);
    Email friend = new Email(friendEmail);
    if (own.equals(friend)) {
      throw new IllegalArgumentException("cannot invite yourself");
    }
    return own + " invited " + friend;
  }
}
