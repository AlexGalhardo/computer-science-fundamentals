// EN: The Drizzle view of the tables created by sql/schema.sql. In Drizzle the schema is plain
//     TypeScript, and the query builder reads column types from these objects.
// PT: A visão do Drizzle das tabelas criadas por sql/schema.sql. No Drizzle o schema é TypeScript
//     puro, e o construtor de consultas lê os tipos das colunas a partir destes objetos.
// ES: La visión de Drizzle de las tablas creadas por sql/schema.sql. En Drizzle el schema es TypeScript
//     puro, y el constructor de consultas lee los tipos de las columnas a partir de estos objetos.

import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";

export const authors = pgTable("authors", {
	id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
	name: text("name").notNull(),
	country: text("country").notNull(),
});

export const posts = pgTable("posts", {
	id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
	authorId: integer("author_id")
		.notNull()
		.references(() => authors.id, { onDelete: "cascade" }),
	title: text("title").notNull(),
	views: integer("views").notNull().default(0),
	published: boolean("published").notNull().default(false),
});

export const comments = pgTable("comments", {
	id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
	postId: integer("post_id")
		.notNull()
		.references(() => posts.id, { onDelete: "cascade" }),
	body: text("body").notNull(),
});
