// EN: The safety rule of every load test in this repository: the target must be a local
//     service. Load sent to a host you do not own is an attack, even by accident (a typo in an
//     environment variable is enough). So the list of allowed hosts is closed: the loopback
//     names and the service names of this docker-compose file. The idea is copied from
//     `projects/concurrency/ten-thousand-connections/load/target.js`; mini-projects do not
//     import code from each other.
// PT: A regra de segurança de todo teste de carga deste repositório: o alvo precisa ser um
//     serviço local. Carga enviada a um host que não é seu é um ataque, mesmo por acidente
//     (basta um erro de digitação em uma variável de ambiente). Por isso a lista de hosts
//     permitidos é fechada: os nomes de loopback e os nomes de serviço deste docker-compose. A
//     ideia foi copiada de `projects/concurrency/ten-thousand-connections/load/target.js`;
//     mini-projetos não importam código uns dos outros.

export const LOCAL_HOSTS: readonly string[] = ["localhost", "127.0.0.1", "[::1]", "go-server", "ts-server"];

/**
 * The host of a plain http URL, or undefined when the text is not one.
 *
 * EN: The pattern is strict on purpose. `http://localhost@example.com` and
 *     `http://localhost.example.com` look local at a glance and are not. Anything the pattern
 *     does not fully understand is refused.
 * PT: O padrão é rígido de propósito. `http://localhost@example.com` e
 *     `http://localhost.example.com` parecem locais à primeira vista e não são. Tudo que o
 *     padrão não entende por completo é recusado.
 */
export function hostOf(target: string): string | undefined {
	const match = /^http:\/\/(\[[0-9a-fA-F:]+\]|[A-Za-z0-9.-]+)(?::\d{1,5})?(?:\/[^\s]*)?$/.exec(target);
	return match?.[1]?.toLowerCase();
}

export function isLocalTarget(target: string): boolean {
	const host = hostOf(target);
	return host !== undefined && LOCAL_HOSTS.includes(host);
}

/** Throws unless the target is local. Called before the first request is sent. */
export function requireLocalTarget(target: string): string {
	if (!isLocalTarget(target)) {
		throw new Error(`refusing to run: "${target}" is not a local target. Allowed hosts: ${LOCAL_HOSTS.join(", ")}`);
	}
	return target.replace(/\/+$/, "");
}
