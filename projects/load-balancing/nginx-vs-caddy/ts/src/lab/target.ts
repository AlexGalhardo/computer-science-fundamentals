// EN: The safety rule of every load test in this repository: the target must be a local
//     service. Thousands of requests sent to a host you do not own are an attack, even by
//     accident (a typo in an environment variable is enough). So the list of allowed hosts is
//     closed: the loopback names and the service names of this docker-compose file.
// PT: A regra de segurança de todo teste de carga deste repositório: o alvo precisa ser um
//     serviço local. Milhares de requisições mandadas para um host que não é seu são um ataque,
//     mesmo por acidente (basta um erro de digitação em uma variável de ambiente). Por isso a
//     lista de hosts permitidos é fechada: os nomes de loopback e os nomes de serviço deste
//     docker-compose.
// ES: La regla de seguridad de toda prueba de carga de este repositorio: el destino debe ser un
//     servicio local. Miles de solicitudes enviadas a un host que no es tuyo son un ataque, incluso
//     por accidente (basta un error de tipeo en una variable de entorno). Por eso la lista de hosts
//     permitidos es cerrada: los nombres de loopback y los nombres de servicio de este
//     docker-compose.

export const LOCAL_HOSTS: readonly string[] = [
	"localhost",
	"127.0.0.1",
	"[::1]",
	"nginx",
	"caddy",
	"api-1",
	"api-2",
	"api-3",
];

// EN: The pattern is strict on purpose. `http://localhost@example.com` and
//     `http://localhost.example.com` look local at a glance and are not. Anything the pattern
//     does not fully understand is refused.
// PT: O padrão é rígido de propósito. `http://localhost@example.com` e
//     `http://localhost.example.com` parecem locais à primeira vista e não são. Tudo que o
//     padrão não entende por completo é recusado.
// ES: El patrón es estricto a propósito. `http://localhost@example.com` y
//     `http://localhost.example.com` parecen locales a primera vista y no lo son. Todo lo que el
//     patrón no entiende por completo se rechaza.
export function hostOf(target: string): string | undefined {
	const match = /^http:\/\/(\[[0-9a-fA-F:]+\]|[A-Za-z0-9.-]+)(?::\d{1,5})?(?:\/[^\s]*)?$/.exec(target);
	return match?.[1]?.toLowerCase();
}

export function isLocalTarget(target: string): boolean {
	const host = hostOf(target);
	return host !== undefined && LOCAL_HOSTS.includes(host);
}

/** Returns the target without a final slash, or throws when it is not local. */
export function requireLocalTarget(target: string): string {
	if (!isLocalTarget(target)) {
		throw new Error(`refusing to run: "${target}" is not a local target. Allowed hosts: ${LOCAL_HOSTS.join(", ")}`);
	}
	return target.replace(/\/+$/, "");
}
