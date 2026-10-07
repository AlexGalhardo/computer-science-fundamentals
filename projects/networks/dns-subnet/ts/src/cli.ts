// EN: Command line of the subnet calculator. With arguments it describes each CIDR given; with
//     none it prints the table of cases used by the tests.
// PT: Linha de comando da calculadora de sub-redes. Com argumentos ela descreve cada CIDR
//     informado; sem nenhum ela imprime a tabela de casos usada pelos testes.
import { CASES } from "./cases";
import { describe, type Subnet } from "./subnet";

export function table(subnets: Subnet[]): string {
	const lines = [
		"| CIDR | mask | network | broadcast | first host | last host | hosts |",
		"| --- | --- | --- | --- | --- | --- | --- |",
		...subnets.map(
			(s) =>
				`| ${s.address}/${s.prefix} | ${s.mask} | ${s.network} | ${s.broadcast} | ${s.firstHost} | ${s.lastHost} | ${s.hosts} |`,
		),
	];
	return lines.join("\n");
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	try {
		const subnets = args.length > 0 ? args.map(describe) : CASES.map((c) => describe(`${c.address}/${c.prefix}`));
		console.log("# Results: subnet calculator\n");
		console.log(
			`- Command: \`docker compose run --rm -T ts-subnet${args.length > 0 ? ` bun run src/cli.ts ${args.join(" ")}` : ""}\``,
		);
		console.log(`- Runtime: Bun ${Bun.version}\n`);
		console.log(table(subnets));
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exit(1);
	}
}
