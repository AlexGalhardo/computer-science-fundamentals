// EN: The PostgreSQL adapter for the `NoteRepository` port. It lives in the outermost layer
//     because it talks directly to the database driver (`pg`). This is the only file of the
//     project that contains SQL, and it implements an interface declared two layers in: the
//     arrow of the import points inward, from the detail to the business rule.
// PT: O adaptador PostgreSQL para a porta `NoteRepository`. Ele mora na camada mais externa
//     porque fala diretamente com o driver do banco (`pg`). Este é o único arquivo do projeto
//     que contém SQL, e ele implementa uma interface declarada duas camadas para dentro: a seta
//     do import aponta para dentro, do detalhe para a regra de negócio.
// ES: El adaptador PostgreSQL para el puerto `NoteRepository`. Vive en la capa más externa
//     porque habla directamente con el driver de la base de datos (`pg`). Este es el único
//     archivo del proyecto que contiene SQL, e implementa una interfaz declarada dos capas
//     hacia adentro: la flecha del import apunta hacia adentro, del detalle a la regla de negocio.

import { Pool } from "pg";
import { Note } from "../entities/note";
import type { NoteRepository } from "../use-cases/ports";

// EN: `position` records the order of insertion, which `created_at` alone cannot do when two
//     notes are created in the same millisecond. The UNIQUE on `title` is a last line of
//     defence: the rule is enforced by the use case, and the constraint only catches two
//     requests that checked at the same instant.
// PT: `position` registra a ordem de inserção, o que `created_at` sozinho não consegue quando
//     duas notas são criadas no mesmo milissegundo. O UNIQUE em `title` é uma última linha de
//     defesa: a regra é aplicada pelo caso de uso, e a restrição só pega duas requisições que
//     conferiram no mesmo instante.
// ES: `position` registra el orden de inserción, lo que `created_at` solo no logra cuando dos
//     notas se crean en el mismo milisegundo. El UNIQUE en `title` es una última línea de
//     defensa: la regla la aplica el caso de uso, y la restricción solo atrapa dos peticiones
//     que verificaron en el mismo instante.
const SCHEMA = `CREATE TABLE IF NOT EXISTS notes (
	id text PRIMARY KEY,
	position bigint GENERATED ALWAYS AS IDENTITY,
	title text NOT NULL UNIQUE,
	body text NOT NULL,
	created_at timestamptz NOT NULL,
	updated_at timestamptz NOT NULL
)`;

const COLUMNS = "id, title, body, created_at, updated_at";

interface NoteRow {
	id: string;
	title: string;
	body: string;
	created_at: Date;
	updated_at: Date;
}

// EN: The mapping between a row and an entity is the reason this adapter exists. The entity
//     has no idea its fields are called `created_at` in a table. A row that the entity rejects
//     means the stored data is corrupted, which nobody expected: that is an exception.
// PT: O mapeamento entre uma linha e uma entidade é a razão de este adaptador existir. A
//     entidade não faz ideia de que os seus campos se chamam `created_at` em uma tabela. Uma
//     linha que a entidade rejeita significa que o dado guardado está corrompido, o que ninguém
//     esperava: isso é uma exceção.
// ES: El mapeo entre una fila y una entidad es la razón de que este adaptador exista. La
//     entidad no sabe que sus campos se llaman `created_at` en una tabla. Una fila que la
//     entidad rechaza significa que el dato guardado está corrupto, lo que nadie esperaba: eso
//     es una excepción.
function toNote(row: NoteRow): Note {
	const note = Note.create({
		id: row.id,
		title: row.title,
		body: row.body,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	});
	if (!note.ok) {
		throw new Error(`stored note ${row.id} is invalid: ${note.error.message}`);
	}
	return note.value;
}

export class PostgresNoteRepository implements NoteRepository {
	private constructor(private readonly pool: Pool) {}

	static async connect(databaseUrl: string): Promise<PostgresNoteRepository> {
		const pool = new Pool({ connectionString: databaseUrl, max: 5 });
		await pool.query(SCHEMA);
		return new PostgresNoteRepository(pool);
	}

	// EN: Every value travels as a parameter ($1, $2), never concatenated into the SQL text.
	// PT: Todo valor viaja como parâmetro ($1, $2), nunca concatenado no texto do SQL.
	// ES: Todo valor viaja como parámetro ($1, $2), nunca concatenado en el texto del SQL.
	async save(note: Note): Promise<void> {
		await this.pool.query(
			`INSERT INTO notes (${COLUMNS}) VALUES ($1, $2, $3, $4, $5)
			 ON CONFLICT (id) DO UPDATE
			 SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = EXCLUDED.updated_at`,
			[note.id, note.title.value, note.body, note.createdAt, note.updatedAt],
		);
	}

	async findById(id: string): Promise<Note | undefined> {
		const { rows } = await this.pool.query<NoteRow>(`SELECT ${COLUMNS} FROM notes WHERE id = $1`, [id]);
		const row = rows[0];
		return row === undefined ? undefined : toNote(row);
	}

	async findByTitle(title: string): Promise<Note | undefined> {
		const { rows } = await this.pool.query<NoteRow>(`SELECT ${COLUMNS} FROM notes WHERE title = $1`, [title]);
		const row = rows[0];
		return row === undefined ? undefined : toNote(row);
	}

	async list(): Promise<Note[]> {
		const { rows } = await this.pool.query<NoteRow>(`SELECT ${COLUMNS} FROM notes ORDER BY position`);
		return rows.map(toNote);
	}

	async remove(id: string): Promise<boolean> {
		const result = await this.pool.query("DELETE FROM notes WHERE id = $1", [id]);
		return (result.rowCount ?? 0) > 0;
	}

	/** Empties the table. Used by the tests and by the demo. */
	async clear(): Promise<void> {
		await this.pool.query("TRUNCATE notes");
	}

	async close(): Promise<void> {
		await this.pool.end();
	}
}
