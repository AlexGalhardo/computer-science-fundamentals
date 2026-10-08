// EN: A load test is only ever pointed at a service of this lab. This function refuses any
//     target that is not the local machine or the `api` service of docker-compose, and both k6
//     scripts call it before a single request is sent. It is a separate file so the unit tests
//     can import it too.
// PT: Um teste de carga só é apontado para um serviço deste laboratório. Esta função recusa
//     qualquer alvo que não seja a máquina local ou o serviço `api` do docker-compose, e os dois
//     scripts do k6 a chamam antes de enviar uma única requisição. É um arquivo separado para
//     os testes unitários também poderem importá-la.

export const LOCAL_HOSTS = ["localhost", "127.0.0.1", "api"];

export function assertLocalTarget(baseUrl) {
	const target = /^http:\/\/([a-z0-9.-]+)(:\d+)?$/.exec(String(baseUrl));
	if (target === null || !LOCAL_HOSTS.includes(target[1])) {
		throw new Error(`refusing to run: BASE_URL "${baseUrl}" is not a local service (${LOCAL_HOSTS.join(", ")})`);
	}
	return baseUrl;
}

export function metricValue(data, metric, field) {
	const found = data.metrics[metric];
	return found === undefined ? 0 : (found.values[field] ?? 0);
}
