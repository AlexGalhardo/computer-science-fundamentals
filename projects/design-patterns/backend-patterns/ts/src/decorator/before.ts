import { StoredUsers, type User } from "./users";

// EN: FAILING DESIGN. Each optional feature is a subclass, so each combination is a subclass
//     too. Two features already need three classes, and the third class repeats the cache
//     code. With n features the count is 2^n - 1, and the stacking order is frozen in the
//     class hierarchy.
// PT: DESENHO COM DEFEITO. Cada recurso opcional é uma subclasse, então cada combinação também
//     é uma subclasse. Dois recursos já pedem três classes, e a terceira repete o código do
//     cache. Com n recursos a conta é 2^n - 1, e a ordem de empilhamento fica congelada na
//     hierarquia de classes.
// ES: DISEÑO QUE FALLA. Cada funcionalidad opcional es una subclase, así que cada combinación
//     también es una subclase. Dos funcionalidades ya piden tres clases, y la tercera repite el
//     código de la caché. Con n funcionalidades la cuenta es 2^n - 1, y el orden de
//     apilamiento queda congelado en la jerarquía de clases.
export class LoggedUsers extends StoredUsers {
	readonly lines: string[] = [];

	find(id: string): User | null {
		this.lines.push(`find ${id}`);
		return super.find(id);
	}
}

export class CachedUsers extends StoredUsers {
	private readonly seen = new Map<string, User | null>();

	find(id: string): User | null {
		if (!this.seen.has(id)) {
			this.seen.set(id, super.find(id));
		}
		return this.seen.get(id) ?? null;
	}

	save(user: User): void {
		super.save(user);
		this.seen.delete(user.id);
	}
}

export class CachedLoggedUsers extends LoggedUsers {
	private readonly seen = new Map<string, User | null>();

	find(id: string): User | null {
		if (!this.seen.has(id)) {
			this.seen.set(id, super.find(id));
		}
		return this.seen.get(id) ?? null;
	}

	save(user: User): void {
		super.save(user);
		this.seen.delete(user.id);
	}
}
