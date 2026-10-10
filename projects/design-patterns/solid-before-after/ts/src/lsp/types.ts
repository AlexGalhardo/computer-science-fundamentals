// EN: How the tests describe an account to both versions.
// PT: Como os testes descrevem uma conta para as duas versões.
// ES: Cómo describen las pruebas una cuenta para las dos versiones.
export interface AccountSpec {
	kind: "checking" | "savings" | "fixed-term";
	balanceCents: number;
}
