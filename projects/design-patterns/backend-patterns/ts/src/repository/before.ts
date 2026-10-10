// EN: FAILING DESIGN. The use case writes SQL. The business rule (one account per e-mail,
//     compared without case) is mixed with table and column names, and it can only be tested
//     by a double that recognises these exact SQL strings.
// PT: DESENHO COM DEFEITO. O caso de uso escreve SQL. A regra de negócio (uma conta por e-mail,
//     comparado sem diferenciar maiúsculas) está misturada com nomes de tabela e de coluna, e
//     só pode ser testada por um dublê que reconheça exatamente estes textos SQL.
// ES: DISEÑO QUE FALLA. El caso de uso escribe SQL. La regla de negocio (una cuenta por correo
//     electrónico, comparado sin distinguir mayúsculas) está mezclada con nombres de tabla y de
//     columna, y solo se puede probar con un doble que reconozca exactamente estos textos SQL.
export interface SqlDatabase {
	query(sql: string, params: string[]): Array<Record<string, string>>;
}

export function registerUser(database: SqlDatabase, email: string): string {
	const normalised = email.trim().toLowerCase();
	if (!normalised.includes("@")) {
		throw new Error("invalid e-mail");
	}
	const rows = database.query("SELECT id FROM users WHERE email = ?", [normalised]);
	if (rows.length > 0) {
		throw new Error("e-mail already registered");
	}
	const id = `u-${database.query("SELECT id FROM users", []).length + 1}`;
	database.query("INSERT INTO users (id, email) VALUES (?, ?)", [id, normalised]);
	return id;
}
