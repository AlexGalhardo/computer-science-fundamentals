package solid.lsp;

import java.util.ArrayList;
import java.util.List;

// EN: LISKOV SUBSTITUTION. The hierarchy now promises only what every member can keep. Every
//     account has a balance; only some can be withdrawn, and that is a second, narrower type.
//     A fixed-term account is simply not a `Withdrawable`, so no method throws and no client
//     asks what it is holding.
// PT: SUBSTITUIÇÃO DE LISKOV. A hierarquia agora promete só o que todo membro consegue cumprir.
//     Toda conta tem saldo; só algumas permitem saque, e isso é um segundo tipo, mais estreito.
//     Uma conta a prazo fixo simplesmente não é um `Withdrawable`, então nenhum método lança
//     exceção e nenhum cliente pergunta o que tem em mãos.
public final class LspAfter {
  private LspAfter() {}

  interface Account {
    long balance();
  }

  interface Withdrawable extends Account {
    void withdraw(long amountCents);
  }

  static final class DemandAccount implements Withdrawable {
    private long balanceCents;

    DemandAccount(long balanceCents) {
      this.balanceCents = balanceCents;
    }

    @Override
    public long balance() {
      return balanceCents;
    }

    @Override
    public void withdraw(long amountCents) {
      if (amountCents > balanceCents) {
        throw new IllegalStateException("insufficient funds");
      }
      balanceCents -= amountCents;
    }
  }

  record FixedTermAccount(long balance) implements Account {}

  record Portfolio(List<Account> all, List<Withdrawable> withdrawable) {}

  // EN: The one place that knows the concrete classes. It sorts each account by what it can do,
  //     once, and the clients receive lists whose types already say it.
  // PT: O único lugar que conhece as classes concretas. Ele separa cada conta pelo que ela sabe
  //     fazer, uma única vez, e os clientes recebem listas cujos tipos já dizem isso.
  private static Portfolio open(List<AccountSpec> specs) {
    Portfolio portfolio = new Portfolio(new ArrayList<>(), new ArrayList<>());
    for (AccountSpec spec : specs) {
      if (spec.kind().equals("fixed-term")) {
        portfolio.all().add(new FixedTermAccount(spec.balanceCents()));
      } else {
        DemandAccount account = new DemandAccount(spec.balanceCents());
        portfolio.all().add(account);
        portfolio.withdrawable().add(account);
      }
    }
    return portfolio;
  }

  public static List<Long> chargeMonthlyFee(List<AccountSpec> specs, long feeCents) {
    Portfolio portfolio = open(specs);
    for (Withdrawable account : portfolio.withdrawable()) {
      if (account.balance() >= feeCents) {
        account.withdraw(feeCents);
      }
    }
    return portfolio.all().stream().map(Account::balance).toList();
  }

  public static long availableNow(List<AccountSpec> specs) {
    return open(specs).withdrawable().stream().mapToLong(Account::balance).sum();
  }
}
