import type { User, Users } from "./users";

// EN: DECORATOR. Each feature is one class that implements `Users` and wraps another `Users`.
//     Because wrapper and wrapped have the same interface, features are combined when the
//     objects are assembled, in any order, and each one is written once.
// PT: DECORATOR. Cada recurso é uma classe que implementa `Users` e embrulha outro `Users`.
//     Como embrulho e embrulhado têm a mesma interface, os recursos são combinados na montagem
//     dos objetos, em qualquer ordem, e cada um é escrito uma única vez.
export class Logged implements Users {
	constructor(
		private readonly inner: Users,
		private readonly log: (line: string) => void,
	) {}

	find(id: string): User | null {
		this.log(`find ${id}`);
		return this.inner.find(id);
	}

	save(user: User): void {
		this.log(`save ${user.id}`);
		this.inner.save(user);
	}
}

export class Cached implements Users {
	private readonly seen = new Map<string, User | null>();

	constructor(private readonly inner: Users) {}

	find(id: string): User | null {
		if (!this.seen.has(id)) {
			this.seen.set(id, this.inner.find(id));
		}
		return this.seen.get(id) ?? null;
	}

	// EN: A decorator is a subtype of what it wraps, so it must keep the contract: a read after
	//     a write returns what was written. Without this line the cache would serve old data.
	// PT: Um decorador é um subtipo do que embrulha, então precisa manter o contrato: uma
	//     leitura depois de uma escrita devolve o que foi escrito. Sem esta linha o cache
	//     serviria dados antigos.
	save(user: User): void {
		this.inner.save(user);
		this.seen.delete(user.id);
	}
}
