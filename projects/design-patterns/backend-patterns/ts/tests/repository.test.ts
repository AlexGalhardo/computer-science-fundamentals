import { describe, expect, test } from "bun:test";
import { InMemoryUserRepository, RegisterUser } from "../src/repository/after";
import { registerUser, type SqlDatabase } from "../src/repository/before";

// EN: The double the failing design forces on its tests: it has to recognise the exact SQL
//     text. Renaming a column or reordering a query breaks the test of a rule that did not
//     change.
// PT: O dublê que o desenho com defeito impõe aos testes: ele precisa reconhecer o texto SQL
//     exato. Renomear uma coluna ou reordenar uma consulta quebra o teste de uma regra que não
//     mudou.
// ES: El doble que el diseño que falla impone a las pruebas: necesita reconocer el texto SQL
//     exacto. Renombrar una columna o reordenar una consulta rompe la prueba de una regla que no
//     cambió.
class ScriptedDatabase implements SqlDatabase {
	readonly statements: string[] = [];
	private readonly rows: Array<Record<string, string>> = [];

	query(sql: string, params: string[]): Array<Record<string, string>> {
		this.statements.push(sql);
		if (sql === "SELECT id FROM users WHERE email = ?") {
			return this.rows.filter((row) => row.email === params[0]);
		}
		if (sql === "SELECT id FROM users") {
			return this.rows;
		}
		if (sql === "INSERT INTO users (id, email) VALUES (?, ?)") {
			this.rows.push({ id: params[0] ?? "", email: params[1] ?? "" });
			return [];
		}
		throw new Error(`the test double does not know this SQL: ${sql}`);
	}
}

describe("repository: before", () => {
	test("the rule works, tested through SQL strings", () => {
		const database = new ScriptedDatabase();
		expect(registerUser(database, " Ana@Example.test ")).toBe("u-1");
		expect(() => registerUser(database, "ana@example.test")).toThrow("e-mail already registered");
	});

	// EN: The flaw made visible: the test of a business rule asserts on storage details.
	// PT: O defeito visível: o teste de uma regra de negócio verifica detalhes de armazenamento.
	// ES: El defecto visible: la prueba de una regla de negocio verifica detalles de almacenamiento.
	test("the business rule cannot be exercised without knowing the storage vocabulary", () => {
		const database = new ScriptedDatabase();
		registerUser(database, "ana@example.test");
		expect(database.statements).toEqual([
			"SELECT id FROM users WHERE email = ?",
			"SELECT id FROM users",
			"INSERT INTO users (id, email) VALUES (?, ?)",
		]);
	});
});

describe("repository: after", () => {
	test("the same rule is tested with a collection in memory, with no SQL in sight", () => {
		const users = new InMemoryUserRepository();
		const register = new RegisterUser(users);
		expect(register.execute(" Ana@Example.test ")).toBe("u-1");
		expect(register.execute("bia@example.test")).toBe("u-2");
		expect(users.findByEmail("ana@example.test")).toEqual({ id: "u-1", email: "ana@example.test" });
	});

	test("duplicates are refused whatever the letter case", () => {
		const register = new RegisterUser(new InMemoryUserRepository());
		register.execute("ana@example.test");
		expect(() => register.execute("ANA@example.test")).toThrow("e-mail already registered");
	});

	test("an invalid e-mail never reaches the repository", () => {
		const users = new InMemoryUserRepository();
		expect(() => new RegisterUser(users).execute("not-an-email")).toThrow("invalid e-mail");
		expect(users.count()).toBe(0);
	});
});
