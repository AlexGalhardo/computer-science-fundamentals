import type { Database } from "bun:sqlite";
import { bugIs } from "./seeded-bugs";

export interface StoredLine {
	productId: string;
	quantity: number;
}

// EN: The schema lives in one function so that the server and the integration tests create the
//     table the same way. A test that used a hand-written table of its own would be testing a
//     database that does not exist in production.
// PT: O esquema fica em uma função para que o servidor e os testes de integração criem a tabela
//     do mesmo jeito. Um teste com uma tabela escrita à mão só para ele estaria testando um
//     banco que não existe em produção.
export function migrate(db: Database): void {
	db.run(
		"CREATE TABLE IF NOT EXISTS cart_items (product_id TEXT PRIMARY KEY, quantity INTEGER NOT NULL CHECK (quantity > 0))",
	);
}

// EN: The repository is where TypeScript meets SQL. A unit test cannot see a mistake here,
//     because the mistake is in the SQL text, and SQL only means something to a real database.
//     That is the job of the integration level: two correct-looking parts, checked together.
// PT: O repositório é onde o TypeScript encontra o SQL. Um teste unitário não enxerga um erro
//     aqui, porque o erro está no texto SQL, e SQL só significa algo para um banco de verdade.
//     Esse é o papel do nível de integração: duas partes aparentemente corretas, conferidas juntas.
export class CartRepository {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	add(productId: string, quantity: number): void {
		// EN: SEEDED BUG "integration": on a repeated product the new quantity replaces the old
		//     one instead of being added to it. The TypeScript around it is unchanged.
		// PT: BUG SEMEADO "integration": em um produto repetido a nova quantidade substitui a
		//     antiga em vez de ser somada. O TypeScript em volta não muda.
		const merged = bugIs("integration") ? "excluded.quantity" : "cart_items.quantity + excluded.quantity";
		this.db
			.query(
				`INSERT INTO cart_items (product_id, quantity) VALUES (?1, ?2)
				 ON CONFLICT (product_id) DO UPDATE SET quantity = ${merged}`,
			)
			.run(productId, quantity);
	}

	list(): StoredLine[] {
		return this.db
			.query<StoredLine, []>("SELECT product_id AS productId, quantity FROM cart_items ORDER BY product_id")
			.all();
	}

	clear(): void {
		this.db.run("DELETE FROM cart_items");
	}
}
