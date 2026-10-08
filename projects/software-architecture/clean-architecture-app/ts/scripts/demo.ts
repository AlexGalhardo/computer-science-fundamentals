// EN: The demo: one set of use cases, reached by two delivery mechanisms and stored by two
//     repositories. It runs the terminal program as a real process and calls the HTTP API of
//     the `api` container, then prints what each one answered. `docker compose run --rm demo`.
// PT: A demonstração: um conjunto de casos de uso, alcançado por dois mecanismos de entrega e
//     guardado por dois repositórios. Ela roda o programa de terminal como um processo de
//     verdade e chama a API HTTP do contêiner `api`, depois mostra o que cada um respondeu.
//     `docker compose run --rm demo`.

import { join } from "node:path";
import { z } from "zod";

const env = z.object({ API_URL: z.url().default("http://api:3000") }).parse({ API_URL: process.env.API_URL });

// EN: The demo only ever talks to the service of its own docker-compose network.
// PT: A demonstração só fala com o serviço da sua própria rede do docker-compose.
const host = new URL(env.API_URL).hostname;
if (!["api", "localhost", "127.0.0.1"].includes(host)) {
	console.error(`refusing to run against "${host}": the demo only targets the local api service`);
	process.exit(2);
}

const CLI = join(import.meta.dir, "..", "src", "main", "cli.ts");
const notesSchema = z.array(z.object({ id: z.string(), title: z.string() }));

function step(title: string): void {
	console.log(`\n== ${title}`);
}

function cli(repository: "memory" | "postgres", ...args: string[]): void {
	const result = Bun.spawnSync(["bun", "run", CLI, ...args], {
		env: { ...process.env, NOTES_REPOSITORY: repository },
	});
	const output = `${result.stdout.toString()}${result.stderr.toString()}`.trimEnd();
	console.log(`$ NOTES_REPOSITORY=${repository} cli ${args.map((arg) => JSON.stringify(arg)).join(" ")}`);
	console.log(`${output}\n(exit code ${result.exitCode})`);
}

async function http(method: string, path: string, body?: unknown): Promise<unknown> {
	const response = await fetch(`${env.API_URL}${path}`, {
		method,
		headers: body === undefined ? {} : { "content-type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await response.text();
	console.log(`$ ${method} ${path}${body === undefined ? "" : ` ${JSON.stringify(body)}`}`);
	console.log(`${response.status} ${text}`);
	return text.length > 0 ? JSON.parse(text) : undefined;
}

step("0. Start from an empty table, through the HTTP API");
for (const note of notesSchema.parse(await http("GET", "/notes"))) {
	await http("DELETE", `/notes/${note.id}`);
}

step("1. Terminal + PostgreSQL: create a note");
cli("postgres", "add", "Written in the terminal", "stored in PostgreSQL");

step("2. HTTP + PostgreSQL: the same note is there, and a second one is created");
await http("GET", "/notes");
await http("POST", "/notes", { title: "Written over HTTP", body: "stored in PostgreSQL too" });

step("3. Terminal + PostgreSQL: both notes, whichever door they came through");
cli("postgres", "list");

step("4. One rule, two vocabularies: a repeated title is 409 over HTTP and exit code 1 in the terminal");
await http("POST", "/notes", { title: "Written over HTTP" });
cli("postgres", "add", "Written over HTTP");

step("5. The entity rejects an empty title, whoever asks");
await http("POST", "/notes", { title: "   " });
cli("postgres", "add", "   ");

step("6. Terminal + memory: same program, other repository, chosen by one variable in the composition root");
cli("memory", "list");
cli("memory", "add", "Lives only in this process");

console.log("\ndemo finished");
