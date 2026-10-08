// EN: The grid of the experiment: three HTTP versions times three network conditions, nine
//     ports of the same Caddy. This file must agree with caddy/Caddyfile and caddy/entrypoint.sh.
// PT: A grade do experimento: três versões do HTTP vezes três condições de rede, nove portas do
//     mesmo Caddy. Este arquivo precisa concordar com caddy/Caddyfile e caddy/entrypoint.sh.

import { z } from "zod";

// EN: `alpn` is the name the browser reports in `nextHopProtocol`, which is the identifier
//     negotiated with ALPN: "http/1.1", "h2" or "h3".
// PT: `alpn` é o nome que o navegador informa em `nextHopProtocol`, que é o identificador
//     negociado com ALPN: "http/1.1", "h2" ou "h3".
export const PROTOCOLS = [
	{ id: "h1", label: "HTTP/1.1", alpn: "http/1.1", portDigit: 1 },
	{ id: "h2", label: "HTTP/2", alpn: "h2", portDigit: 2 },
	{ id: "h3", label: "HTTP/3", alpn: "h3", portDigit: 3 },
] as const;
export type Protocol = (typeof PROTOCOLS)[number];
export type ProtocolId = Protocol["id"];

export const CONDITION_IDS = ["clean", "latency", "latency-loss"] as const;
export type ConditionId = (typeof CONDITION_IDS)[number];

export interface Condition {
	id: ConditionId;
	/** The ports of this condition are basePort + 1, + 2 and + 3. */
	basePort: number;
	/** The `tc netem` arguments applied to the server's outgoing packets, or null for none. */
	netem: string | null;
}

const envSchema = z.object({
	SITE_HOST: z
		.string()
		.regex(/^[a-z0-9.-]+$/)
		.default("site.http-versions.test"),
	NETEM_LATENCY: z.string().min(1).default("delay 50ms"),
	NETEM_LATENCY_LOSS: z.string().min(1).default("delay 50ms loss 2%"),
	BENCH_RUNS: z.coerce.number().int().min(1).max(50).default(10),
	PROJECT_DIR: z.string().min(1).default("/project"),
});
export type Settings = z.infer<typeof envSchema>;

export function loadSettings(env: Record<string, string | undefined> = process.env): Settings {
	const settings = envSchema.parse({
		SITE_HOST: env.SITE_HOST,
		NETEM_LATENCY: env.NETEM_LATENCY,
		NETEM_LATENCY_LOSS: env.NETEM_LATENCY_LOSS,
		BENCH_RUNS: env.BENCH_RUNS,
		PROJECT_DIR: env.PROJECT_DIR,
	});
	// EN: Load tests in this repository only target local services. The lab host is a name under
	//     the reserved `.test` top-level domain, which never resolves on the public internet,
	//     and the code refuses anything else.
	// PT: Os testes de carga deste repositório só atingem serviços locais. O host do laboratório
	//     é um nome sob o domínio de topo reservado `.test`, que nunca resolve na internet
	//     pública, e o código recusa qualquer outra coisa.
	if (!isLocalHost(settings.SITE_HOST)) {
		throw new Error(
			`refusing to run against "${settings.SITE_HOST}": the target must be localhost or a .test name`,
		);
	}
	return settings;
}

export function isLocalHost(host: string): boolean {
	return host === "localhost" || host === "127.0.0.1" || host.endsWith(".test");
}

export function conditions(settings: Pick<Settings, "NETEM_LATENCY" | "NETEM_LATENCY_LOSS">): Condition[] {
	return [
		{ id: "clean", basePort: 8000, netem: null },
		{ id: "latency", basePort: 8100, netem: settings.NETEM_LATENCY },
		{ id: "latency-loss", basePort: 8200, netem: settings.NETEM_LATENCY_LOSS },
	];
}

export function portOf(condition: Pick<Condition, "basePort">, protocol: Pick<Protocol, "portDigit">): number {
	return condition.basePort + protocol.portDigit;
}

export function originOf(host: string, port: number): string {
	return `https://${host}:${port}`;
}

/** Every `host:port` served over HTTP/3, for the browser flag that starts with QUIC directly. */
export function quicOrigins(host: string, all: readonly Condition[]): string[] {
	const h3 = PROTOCOLS[2];
	return all.map((condition) => `${host}:${portOf(condition, h3)}`);
}
