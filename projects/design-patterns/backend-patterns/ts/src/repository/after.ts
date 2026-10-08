export interface User {
	id: string;
	email: string;
}

// EN: REPOSITORY. The use case sees a collection of users, described in its own words. How the
//     users are stored (SQL, a file, memory) stays behind this interface, which belongs to
//     the business side and is implemented by the storage side.
// PT: REPOSITORY. O caso de uso enxerga uma coleção de usuários, descrita com suas próprias
//     palavras. Como os usuários são guardados (SQL, arquivo, memória) fica atrás desta
//     interface, que pertence ao lado do negócio e é implementada pelo lado do armazenamento.
export interface UserRepository {
	findByEmail(email: string): User | null;
	add(user: User): void;
	count(): number;
}

// EN: The implementation used by tests and by the demo. A SQL implementation would be a second
//     class with the same interface, tested apart against a real database.
// PT: A implementação usada pelos testes e pela demo. Uma implementação em SQL seria uma
//     segunda classe com a mesma interface, testada à parte contra um banco real.
export class InMemoryUserRepository implements UserRepository {
	private readonly users = new Map<string, User>();

	findByEmail(email: string): User | null {
		return this.users.get(email) ?? null;
	}

	add(user: User): void {
		this.users.set(user.email, user);
	}

	count(): number {
		return this.users.size;
	}
}

// EN: The use case receives the repository (dependency injection through the constructor) and
//     holds only the rule: normalise, validate, refuse duplicates.
// PT: O caso de uso recebe o repositório (injeção de dependência pelo construtor) e guarda só a
//     regra: normalizar, validar, recusar duplicados.
export class RegisterUser {
	constructor(private readonly users: UserRepository) {}

	execute(email: string): string {
		const normalised = email.trim().toLowerCase();
		if (!normalised.includes("@")) {
			throw new Error("invalid e-mail");
		}
		if (this.users.findByEmail(normalised) !== null) {
			throw new Error("e-mail already registered");
		}
		const id = `u-${this.users.count() + 1}`;
		this.users.add({ id, email: normalised });
		return id;
	}
}
