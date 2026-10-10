// EN: The suites that need a running service (smoke and end-to-end) take its address from
//     BASE_URL. They refuse any host that is not local: `localhost`, a loopback address, or the
//     docker-compose service name `shop`. A test suite pointed by mistake at somebody else's
//     server is a load on a system we do not own.
// PT: As suítes que precisam de um serviço rodando (fumaça e ponta a ponta) leem o endereço de
//     BASE_URL. Elas recusam qualquer host que não seja local: `localhost`, um endereço de
//     loopback ou o nome de serviço `shop` do docker-compose. Uma suíte apontada por engano para
//     o servidor de outra pessoa é carga em um sistema que não é nosso.
// ES: Las suites que necesitan un servicio en ejecución (humo y extremo a extremo) leen la dirección de
//     BASE_URL. Rechazan cualquier host que no sea local: `localhost`, una dirección de
//     loopback o el nombre de servicio `shop` de docker-compose. Una suite apuntada por error al
//     servidor de otra persona es carga sobre un sistema que no es nuestro.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "shop"]);

export function baseUrl(): string {
	const url = new URL(process.env.BASE_URL ?? "http://localhost:3000");
	if (!LOCAL_HOSTS.has(url.hostname)) {
		throw new Error(`BASE_URL must be a local service, got ${url.hostname}`);
	}
	return url.origin;
}
