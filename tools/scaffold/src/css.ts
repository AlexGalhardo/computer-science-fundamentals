// EN: `bun run dashboard:css <folder with input.css>` rebuilds `tailwind.css` for a static
//     dashboard. Tailwind resolves `@import "tailwindcss"` from the folder of the CSS file, and
//     a mini-project has no `node_modules`. So the input is copied next to this tool, where the
//     pinned Tailwind is installed, with its `@source` paths made absolute.
// PT: `bun run dashboard:css <pasta com input.css>` recompila o `tailwind.css` de um dashboard
//     estático. O Tailwind resolve `@import "tailwindcss"` a partir da pasta do arquivo CSS, e
//     um mini-projeto não tem `node_modules`. Então a entrada é copiada para junto desta
//     ferramenta, onde o Tailwind fixado está instalado, com os caminhos de `@source` absolutos.

import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const target = resolve(process.argv[2] ?? "");
const input = join(target, "input.css");
if (process.argv[2] === undefined || !existsSync(input)) {
	console.error("usage: bun run dashboard:css <folder that contains input.css>");
	process.exit(2);
}

const toolDir = resolve(import.meta.dir, "..");
const entry = join(toolDir, ".dashboard-input.css");
const absolute = target.replaceAll("\\", "/");
writeFileSync(entry, readFileSync(input, "utf8").replaceAll('@source "./', `@source "${absolute}/`));
const build = Bun.spawnSync(["bun", "x", "tailwindcss", "-i", entry, "-o", join(target, "tailwind.css"), "--minify"], {
	cwd: toolDir,
	stdout: "inherit",
	stderr: "inherit",
});
rmSync(entry, { force: true });
process.exit(build.exitCode ?? 1);
