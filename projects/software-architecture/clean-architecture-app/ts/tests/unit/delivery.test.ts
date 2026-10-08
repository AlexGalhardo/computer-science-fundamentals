// EN: The two delivery mechanisms, tested over the same use cases. The HTTP controller is
//     called with plain objects, and the Elysia driver through `app.handle(request)`, which
//     runs the routes in memory: no port is opened, no server is started.
// PT: Os dois mecanismos de entrega, testados sobre os mesmos casos de uso. O controller HTTP é
//     chamado com objetos simples, e o driver Elysia por `app.handle(request)`, que executa as
//     rotas em memória: nenhuma porta é aberta, nenhum servidor é iniciado.

import { beforeEach, describe, expect, test } from "bun:test";
import { InMemoryNoteRepository } from "../../src/adapters/in-memory-note-repository";
import { NoteCliController } from "../../src/adapters/note-cli-controller";
import { NoteHttpController } from "../../src/adapters/note-http-controller";
import { createHttpServer } from "../../src/drivers/elysia-server";
import type { NoteUseCases } from "../../src/use-cases";
import { describeNoteRepositoryContract } from "../repository-contract";
import { buildUseCases } from "../support";

describeNoteRepositoryContract("in memory", async () => new InMemoryNoteRepository());

let useCases: NoteUseCases;

beforeEach(() => {
	useCases = buildUseCases(new InMemoryNoteRepository());
});

describe("NoteHttpController", () => {
	let controller: NoteHttpController;

	beforeEach(() => {
		controller = new NoteHttpController(useCases);
	});

	test("create answers 201 with the note", async () => {
		const response = await controller.create({ params: {}, body: { title: "Groceries", body: "milk" } });

		expect(response.status).toBe(201);
		expect(response.body).toMatchObject({ id: "note-1", title: "Groceries", body: "milk" });
	});

	test("a body with the wrong shape is a 400 and never reaches the use case", async () => {
		for (const body of [undefined, null, "text", { title: 42 }, { body: "no title" }]) {
			const response = await controller.create({ params: {}, body });

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({ error: "malformed-request" });
		}
		expect(await useCases.listNotes.execute()).toEqual([]);
	});

	test("maps each error of the application to a status code", async () => {
		await controller.create({ params: {}, body: { title: "Groceries" } });

		const invalid = await controller.create({ params: {}, body: { title: "  " } });
		const duplicate = await controller.create({ params: {}, body: { title: "Groceries" } });
		const missing = await controller.update({ params: { id: "nope" }, body: { title: "x" } });
		const empty = await controller.update({ params: { id: "note-1" }, body: {} });

		expect(invalid).toMatchObject({ status: 400, body: { error: "invalid-title" } });
		expect(duplicate).toMatchObject({ status: 409, body: { error: "duplicate-title" } });
		expect(missing).toMatchObject({ status: 404, body: { error: "note-not-found" } });
		expect(empty).toMatchObject({ status: 400, body: { error: "malformed-request" } });
	});

	test("update, list and remove", async () => {
		await controller.create({ params: {}, body: { title: "Groceries" } });

		const updated = await controller.update({ params: { id: "note-1" }, body: { body: "milk" } });
		const listed = await controller.list();
		const removed = await controller.remove({ params: { id: "note-1" }, body: undefined });
		const again = await controller.remove({ params: { id: "note-1" }, body: undefined });

		expect(updated).toMatchObject({ status: 200, body: { title: "Groceries", body: "milk" } });
		expect(listed).toMatchObject({ status: 200, body: [{ id: "note-1" }] });
		expect(removed).toEqual({ status: 204 });
		expect(again.status).toBe(404);
	});
});

describe("Elysia driver", () => {
	function json(method: string, path: string, body?: unknown): Request {
		return new Request(`http://localhost${path}`, {
			method,
			headers: body === undefined ? {} : { "content-type": "application/json" },
			body: body === undefined ? undefined : JSON.stringify(body),
		});
	}

	test("routes a request to the controller and back", async () => {
		const app = createHttpServer(new NoteHttpController(useCases));

		const created = await app.handle(json("POST", "/notes", { title: "Groceries", body: "milk" }));
		const updated = await app.handle(json("PUT", "/notes/note-1", { title: "Market" }));
		const listed = await app.handle(json("GET", "/notes"));
		const removed = await app.handle(json("DELETE", "/notes/note-1"));

		expect(created.status).toBe(201);
		expect(updated.status).toBe(200);
		expect(await listed.json()).toMatchObject([{ id: "note-1", title: "Market", body: "milk" }]);
		expect(removed.status).toBe(204);
		expect(await removed.text()).toBe("");
	});

	test("answers 400 to invalid JSON and 404 to an unknown route", async () => {
		const app = createHttpServer(new NoteHttpController(useCases));
		const broken = new Request("http://localhost/notes", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "{ not json",
		});

		expect((await app.handle(broken)).status).toBe(400);
		expect((await app.handle(json("GET", "/nothing-here"))).status).toBe(404);
	});
});

describe("NoteCliController", () => {
	let controller: NoteCliController;

	beforeEach(() => {
		controller = new NoteCliController(useCases);
	});

	test("add, list, edit and remove print text and exit with 0", async () => {
		const added = await controller.run(["add", "Groceries", "milk"]);
		const listed = await controller.run(["list"]);
		const edited = await controller.run(["edit", "note-1", "Market"]);
		const removed = await controller.run(["remove", "note-1"]);
		const empty = await controller.run(["list"]);

		expect(added).toEqual({
			exitCode: 0,
			stdout: ["created note-1  2026-01-01T10:00:00.000Z  Groceries  milk"],
			stderr: [],
		});
		expect(listed.stdout).toEqual(["note-1  2026-01-01T10:00:00.000Z  Groceries  milk"]);
		expect(edited.stdout).toEqual(["updated note-1  2026-01-01T10:00:00.000Z  Market  milk"]);
		expect(removed.stdout).toEqual(["removed note-1"]);
		expect(empty.stdout).toEqual(["no notes yet"]);
	});

	// EN: The same answer of the use case that HTTP turned into 409 becomes exit code 1 here.
	// PT: A mesma resposta do caso de uso que o HTTP transformou em 409 vira código de saída 1 aqui.
	test("an error of the application goes to stderr with exit code 1", async () => {
		await controller.run(["add", "Groceries"]);

		const duplicate = await controller.run(["add", "Groceries"]);
		const missing = await controller.run(["remove", "nope"]);

		expect(duplicate.exitCode).toBe(1);
		expect(duplicate.stderr[0]).toStartWith("error (duplicate-title)");
		expect(missing.exitCode).toBe(1);
		expect(missing.stderr[0]).toStartWith("error (note-not-found)");
	});

	test("a malformed command prints the usage with exit code 2", async () => {
		for (const argv of [[], ["add"], ["add", "a", "b", "c"], ["edit", "note-1"], ["remove"], ["unknown"]]) {
			const result = await controller.run(argv);

			expect(result.exitCode).toBe(2);
			expect(result.stderr[0]).toBe("usage:");
		}
	});
});
