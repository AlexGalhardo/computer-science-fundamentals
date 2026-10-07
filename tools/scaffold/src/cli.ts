// EN: `bun run new:project <area> <name> --langs ts,go [--out <dir>] [--no-dashboard]`
//     Creates `projects/<area>/<name>/` with both READMEs, both setup scripts, a docker-compose
//     file, one folder per language and the static dashboard.
// PT: `bun run new:project <area> <name> --langs ts,go [--out <dir>] [--no-dashboard]`
//     Cria `projects/<area>/<name>/` com os dois READMEs, os dois scripts de setup, um
//     docker-compose, uma pasta por linguagem e o dashboard estático.

import { chmodSync, cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { z } from "zod";
import { LANGUAGES, projectFiles } from "./templates";

const repoRoot = resolve(import.meta.dir, "..", "..", "..");
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be lowercase kebab-case");
const argsSchema = z.object({
	area: slug,
	name: slug,
	langs: z.array(z.enum(LANGUAGES)).min(1),
});

export interface ScaffoldOptions {
	area: string;
	name: string;
	langs: string[];
	outRoot: string;
	dashboard: boolean;
}

export function scaffold(options: ScaffoldOptions): string {
	const info = argsSchema.parse({ area: options.area, name: options.name, langs: options.langs });
	const projectDir = join(options.outRoot, info.area, info.name);
	if (existsSync(projectDir)) {
		throw new Error(`${projectDir} already exists`);
	}
	for (const [path, content] of Object.entries(projectFiles(info))) {
		const file = join(projectDir, path);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, content);
		if (path.endsWith(".sh")) {
			chmodSync(file, 0o755);
		}
	}
	if (options.dashboard) {
		const target = join(projectDir, "dashboard");
		cpSync(join(import.meta.dir, "..", "template", "dashboard"), target, { recursive: true });
		// EN: The template already carries its built `tailwind.css` (see `build:css` in
		//     package.json), so a new project gets a page that works with neither Node nor a network.
		// PT: O modelo já traz o `tailwind.css` compilado (veja `build:css` no package.json),
		//     então um projeto novo recebe uma página que funciona sem Node e sem rede.
	}
	return projectDir;
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	const flag = (name: string): string | undefined => {
		const index = args.indexOf(name);
		return index >= 0 ? args[index + 1] : undefined;
	};
	const flagValues = new Set([flag("--langs"), flag("--out")]);
	const [area, name] = args.filter((arg) => !arg.startsWith("--") && !flagValues.has(arg));
	if (area === undefined || name === undefined) {
		console.error(`usage: bun run new:project <area> <name> --langs ${LANGUAGES.join(",")} [--out <dir>]`);
		process.exit(2);
	}
	try {
		const projectDir = scaffold({
			area,
			name,
			langs: (flag("--langs") ?? "ts").split(","),
			outRoot: resolve(flag("--out") ?? join(repoRoot, "projects")),
			dashboard: !args.includes("--no-dashboard"),
		});
		console.log(`created ${projectDir}`);
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}
