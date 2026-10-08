// EN: The component: a user store and its plain implementation, which counts how many times it
//     was really reached. That counter is what lets the tests see a cache working.
// PT: O componente: um armazenamento de usuários e sua implementação simples, que conta quantas
//     vezes foi de fato alcançada. Esse contador é o que permite aos testes ver um cache
//     funcionando.
export interface User {
	id: string;
	name: string;
}

export interface Users {
	find(id: string): User | null;
	save(user: User): void;
}

export class StoredUsers implements Users {
	reads = 0;
	private readonly rows = new Map<string, User>();

	find(id: string): User | null {
		this.reads++;
		return this.rows.get(id) ?? null;
	}

	save(user: User): void {
		this.rows.set(user.id, user);
	}
}
