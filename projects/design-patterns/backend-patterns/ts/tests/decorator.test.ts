import { describe, expect, test } from "bun:test";
import { Cached, Logged } from "../src/decorator/after";
import { CachedLoggedUsers, CachedUsers, LoggedUsers } from "../src/decorator/before";
import { StoredUsers, type Users } from "../src/decorator/users";

const ana = { id: "1", name: "Ana" };

// EN: The contract of `Users`, run against every way of building one. A subclass or a decorator
//     that changes observable behaviour fails here.
// PT: O contrato de `Users`, executado contra todas as formas de montar um. Uma subclasse ou um
//     decorador que mude o comportamento observável falha aqui.
function contract(name: string, create: () => Users): void {
	test(`${name}: a read after a write returns what was written`, () => {
		const users = create();
		expect(users.find("1")).toBeNull();
		users.save(ana);
		expect(users.find("1")).toEqual(ana);
		users.save({ id: "1", name: "Ana Maria" });
		expect(users.find("1")?.name).toBe("Ana Maria");
	});
}

describe("decorator: before", () => {
	contract("StoredUsers", () => new StoredUsers());
	contract("LoggedUsers", () => new LoggedUsers());
	contract("CachedUsers", () => new CachedUsers());
	contract("CachedLoggedUsers", () => new CachedLoggedUsers());

	// EN: The flaw: one class per combination, and only one stacking order exists. A log that
	//     records every call, including the ones served by the cache, needs a fourth class.
	// PT: O defeito: uma classe por combinação, e só existe uma ordem de empilhamento. Um log
	//     que registre toda chamada, inclusive as atendidas pelo cache, exige uma quarta classe.
	test("the only combination available logs just the calls that miss the cache", () => {
		const users = new CachedLoggedUsers();
		users.find("1");
		users.find("1");
		expect(users.lines).toEqual(["find 1"]);
		expect(users.reads).toBe(1);
	});
});

describe("decorator: after", () => {
	contract("Cached", () => new Cached(new StoredUsers()));
	contract("Logged", () => new Logged(new StoredUsers(), () => {}));
	contract("Logged over Cached", () => new Logged(new Cached(new StoredUsers()), () => {}));
	contract("Cached over Logged", () => new Cached(new Logged(new StoredUsers(), () => {})));

	test("the cache answers the second read without reaching the store", () => {
		const store = new StoredUsers();
		const users = new Cached(store);
		users.find("1");
		users.find("1");
		expect(store.reads).toBe(1);
	});

	test("the stacking order is chosen at assembly time and changes what is logged", () => {
		const outside: string[] = [];
		const loggedOutside = new Logged(new Cached(new StoredUsers()), (line) => outside.push(line));
		loggedOutside.find("1");
		loggedOutside.find("1");
		expect(outside).toEqual(["find 1", "find 1"]);

		const inside: string[] = [];
		const cachedOutside = new Cached(new Logged(new StoredUsers(), (line) => inside.push(line)));
		cachedOutside.find("1");
		cachedOutside.find("1");
		expect(inside).toEqual(["find 1"]);
	});
});
