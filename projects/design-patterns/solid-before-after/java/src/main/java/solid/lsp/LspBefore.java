package solid.lsp;

import java.util.ArrayList;
import java.util.List;

// EN: VIOLATES THE LISKOV SUBSTITUTION PRINCIPLE. A fixed-term account "is an" account, so it
//     inherits `withdraw`, a promise it cannot keep, and answers with
//     UnsupportedOperationException. The JDK has the same wound: an unmodifiable List still has
//     `add`. From then on every client must ask for the concrete type before calling.
// PT: QUEBRA O PRINCÍPIO DA SUBSTITUIÇÃO DE LISKOV. Uma conta a prazo fixo "é uma" conta, então
//     herda `withdraw`, uma promessa que não consegue cumprir, e responde com
//     UnsupportedOperationException. O JDK tem a mesma ferida: uma List não modificável ainda
//     tem `add`. Daí em diante todo cliente precisa perguntar o tipo concreto antes de chamar.
public final class LspBefore {
  private LspBefore() {}

  static class Account {
    protected long balanceCents;

    Account(long balanceCents) {
      this.balanceCents = balanceCents;
    }

    long balance() {
      return balanceCents;
    }

    void withdraw(long amountCents) {
      if (amountCents > balanceCents) {
        throw new IllegalStateException("insufficient funds");
      }
      balanceCents -= amountCents;
    }
  }

  static final class FixedTermAccount extends Account {
    FixedTermAccount(long balanceCents) {
      super(balanceCents);
    }

    @Override
    void withdraw(long amountCents) {
      throw new UnsupportedOperationException("a fixed-term account cannot be withdrawn");
    }
  }

  private static Account open(AccountSpec spec) {
    return spec.kind().equals("fixed-term")
        ? new FixedTermAccount(spec.balanceCents())
        : new Account(spec.balanceCents());
  }

  public static List<Long> chargeMonthlyFee(List<AccountSpec> specs, long feeCents) {
    List<Long> balances = new ArrayList<>();
    for (AccountSpec spec : specs) {
      Account account = open(spec);
      if (!(account instanceof FixedTermAccount) && account.balance() >= feeCents) {
        account.withdraw(feeCents);
      }
      balances.add(account.balance());
    }
    return balances;
  }

  public static long availableNow(List<AccountSpec> specs) {
    long total = 0;
    for (AccountSpec spec : specs) {
      Account account = open(spec);
      if (!(account instanceof FixedTermAccount)) {
        total += account.balance();
      }
    }
    return total;
  }
}
