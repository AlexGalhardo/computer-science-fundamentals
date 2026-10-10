// EN: Integration tests: the only ones that need the PostgreSQL container. They are few on
//     purpose. The business rules were already proven without a database, so here it is enough
//     to prove that the PostgreSQL adapter keeps the same contract as the in-memory one, and
//     that the application composed with it still works end to end.
// PT: Testes de integração: os únicos que precisam do contêiner do PostgreSQL. São poucos de
//     propósito. As regras de negócio já foram provadas sem banco, então aqui basta provar que o
//     adaptador PostgreSQL cumpre o mesmo contrato que o em memória, e que a aplicação composta
//     com ele continua funcionando de ponta a ponta.
// ES: Pruebas de integración: las únicas que necesitan el contenedor de PostgreSQL. Son pocas a
//     propósito. Las reglas de negocio ya se probaron sin base de datos, así que aquí basta
//     probar que el adaptador PostgreSQL cumple el mismo contrato que el de memoria, y que la
//     aplicación compuesta con él sigue funcionando de punta a punta.

import { afterAll, beforeAll, expect, test } from "bun:test";
import { NoteCliController } from "../../src/adapters/note-cli-controller";
import { NoteHttpController } from "../../src/adapters/note-http-controller";
import { createHttpServer } from "../../src/drivers/elysia-server";
import { PostgresNoteRepository } from "../../src/drivers/postgres-note-repository";
import { describeNoteRepositoryContract } from "../repository-contract";
import { buildUseCases } from "../support";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
	throw new Error("DATABASE_URL is required: run these tests with `docker compose run --rm ts-integration`");
}

let repository: PostgresNoteRepository;

beforeAll(async () => {
	repository = await PostgresNoteRepository.connect(databaseUrl);
});

afterAll(async () => {
	await repository.clear();
	await repository.close();
});

describeNoteRepositoryContract("PostgreSQL", async () => {
	await repository.clear();
	return repository;
});

test("a note created through HTTP is listed through the terminal, from the same table", async () => {
	await repository.clear();
	const useCases = buildUseCases(repository);
	const app = createHttpServer(new NoteHttpController(useCases));
	const cli = new NoteCliController(useCases);

	const created = await app.handle(
		new Request("http://localhost/notes", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ title: "Written over HTTP", body: "read in the terminal" }),
		}),
	);
	const listed = await cli.run(["list"]);

	expect(created.status).toBe(201);
	expect(listed.stdout).toEqual(["note-1  2026-01-01T10:00:00.000Z  Written over HTTP  read in the terminal"]);
});

test("notes survive a new connection, which the in-memory adapter cannot offer", async () => {
	await repository.clear();
	await buildUseCases(repository).createNote.execute({ title: "Still here", body: "" });

	const second = await PostgresNoteRepository.connect(databaseUrl);
	try {
		expect((await second.list()).map((note) => note.title.value)).toEqual(["Still here"]);
	} finally {
		await second.close();
	}
});
