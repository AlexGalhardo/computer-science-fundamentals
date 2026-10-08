// EN: Host-side tests of the HTTP workload (`bun run test:http`). They build and start the
//     seven servers, run the protocol suite from inside the internal network, and prove that
//     the k6 script refuses every target that is not local. Requires Docker.
// PT: Testes da carga HTTP no lado do host (`bun run test:http`). Eles constroem e sobem os
//     sete servidores, rodam a suíte de protocolo de dentro da rede interna, e provam que o
//     script do k6 recusa todo alvo que não é local. Precisa do Docker.

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { LANGUAGES, mustRun, run } from "../scripts/lib";

const httpDir = import.meta.dir;
const services = LANGUAGES.map((language) => `server-${language}`);

function compose(args: string[]): ReturnType<typeof run> {
	return run(["docker", "compose", ...args], { cwd: httpDir });
}

// EN: `k6 inspect` only executes the top of the script, where the target is checked. With no
//     network at all, even a wrong decision could not reach anything.
// PT: O `k6 inspect` só executa o topo do script, onde o alvo é verificado. Sem rede nenhuma,
//     nem uma decisão errada conseguiria alcançar algo.
function inspectWithTarget(target: string | undefined): ReturnType<typeof run> {
	const env = target === undefined ? [] : ["-e", `TARGET=${target}`];
	return run([
		"docker",
		"run",
		"--rm",
		"--network",
		"none",
		"-v",
		`${join(httpDir, "k6")}:/scripts:ro`,
		...env,
		"grafana/k6:2.3.0",
		"inspect",
		"--include-system-env-vars",
		"/scripts/load.js",
	]);
}

describe("k6 load script", () => {
	test.each([
		"https://example.com",
		"http://example.com",
		"http://example.com:8080",
		"http://localhost@example.com",
		"http://localhost.example.com",
		"http://192.168.0.10:8080",
		"https://localhost:8080",
		"http://server-go.example.com",
		"not a url",
	])(
		"refuses the non-local target %s",
		(target) => {
			const result = inspectWithTarget(target);
			expect(result.exitCode).not.toBe(0);
			expect(result.stderr + result.stdout).toContain("refusing to run");
		},
		60_000,
	);

	test.each([
		undefined,
		"http://localhost:8080",
		"http://127.0.0.1:3000",
		"http://server-go:8080",
		"http://server-python:8080/",
	])(
		"accepts the local target %s",
		(target) => {
			expect(inspectWithTarget(target).exitCode).toBe(0);
		},
		60_000,
	);
});

describe("the seven servers", () => {
	beforeAll(() => {
		mustRun(["docker", "compose", "build", ...services], { cwd: httpDir });
		mustRun(["docker", "compose", "up", "-d", ...services], { cwd: httpDir });
	}, 1_800_000);

	afterAll(() => {
		compose(["--profile", "tools", "down", "-v", "--remove-orphans"]);
	}, 120_000);

	test("speak the same protocol", () => {
		const result = compose([
			"--profile",
			"tools",
			"run",
			"--rm",
			"-T",
			"tools",
			"bun",
			"test",
			"tests/protocol.test.ts",
		]);
		if (result.exitCode !== 0) {
			console.error(result.stdout + result.stderr);
		}
		expect(result.exitCode).toBe(0);
	}, 300_000);

	test("are not reachable from the host: no port is published", () => {
		const ports = mustRun(["docker", "compose", "ps", "--format", "{{.Publishers}}"], { cwd: httpDir });
		expect(ports).not.toContain("0.0.0.0");
		expect(ports).not.toContain("PublishedPort:8080");
	});
});
