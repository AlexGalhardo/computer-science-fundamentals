// EN: How the tests describe an account to both versions.
// PT: Como os testes descrevem uma conta para as duas versões.
export interface AccountSpec {
	kind: "checking" | "savings" | "fixed-term";
	balanceCents: number;
}
