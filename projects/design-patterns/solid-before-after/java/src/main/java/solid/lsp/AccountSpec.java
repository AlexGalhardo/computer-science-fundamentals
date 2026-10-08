package solid.lsp;

// EN: How the tests describe an account to both versions: "checking", "savings" or "fixed-term".
// PT: Como os testes descrevem uma conta para as duas versões: "checking", "savings" ou
//     "fixed-term".
public record AccountSpec(String kind, long balanceCents) {}
