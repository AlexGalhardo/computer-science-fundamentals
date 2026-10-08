// EN: The safety rule of every load test in this repository: the target must be a local
//     service. A benchmark pointed at a host you do not own is an attack, even by accident (a
//     typo in an environment variable is enough). So the list of allowed hosts is closed: the
//     loopback names and the three proxies of this docker-compose file.
// PT: A regra de segurança de todo teste de carga deste repositório: o alvo precisa ser um
//     serviço local. Um benchmark apontado para um host que não é seu é um ataque, mesmo por
//     acidente (basta um erro de digitação em uma variável de ambiente). Por isso a lista de
//     hosts permitidos é fechada: os nomes de loopback e os três proxies deste docker-compose.

export const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "lb-rr", "lb-lc", "nginx"];

/**
 * Returns the host of a plain http URL, or undefined when the text is anything else.
 *
 * EN: The pattern is strict on purpose. `http://localhost@example.com` and
 *     `http://localhost.example.com` look local at a glance and are not. Anything the pattern
 *     does not fully understand is refused.
 * PT: O padrão é rígido de propósito. `http://localhost@example.com` e
 *     `http://localhost.example.com` parecem locais à primeira vista e não são. Tudo que o
 *     padrão não entende por completo é recusado.
 *
 * @param {string} target
 * @returns {string | undefined}
 */
export function hostOf(target) {
	const match = /^http:\/\/(\[[0-9a-fA-F:]+\]|[A-Za-z0-9.-]+)(?::\d{1,5})?(?:\/[^\s]*)?$/.exec(String(target));
	return match?.[1]?.toLowerCase();
}

/**
 * @param {string} target
 * @returns {boolean}
 */
export function isLocalTarget(target) {
	const host = hostOf(target);
	return host !== undefined && LOCAL_HOSTS.includes(host);
}

/**
 * Throws unless the target is local. k6 calls it before sending any request.
 *
 * @param {string} target
 * @returns {string}
 */
export function requireLocalTarget(target) {
	if (!isLocalTarget(target)) {
		throw new Error(`refusing to run: "${target}" is not a local target. Allowed hosts: ${LOCAL_HOSTS.join(", ")}`);
	}
	return target.replace(/\/+$/, "");
}
