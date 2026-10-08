// EN: The operations on user accounts. `A` is the type each version uses for an account, so the
//     same tests run on an account made of strings and on an account made of small types.
// PT: As operações sobre contas de usuário. `A` é o tipo que cada versão usa para uma conta,
//     então os mesmos testes rodam sobre uma conta feita de strings e sobre uma conta feita de
//     tipos pequenos.

export interface Accounts<A> {
	register(name: string, email: string, phone: string): A;
	changeEmail(account: A, email: string): A;
	/** The invitation text, or an error when the friend e-mail is invalid or is the own e-mail. */
	inviteText(account: A, friendEmail: string): string;
	describe(account: A): string;
}
