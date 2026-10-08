// EN: Shared start-up of a service: read the environment, build the logger whose lines go to
//     stdout and to the shipper, and flush the last lines when the container stops.
// PT: Inicialização comum de um serviço: ler o ambiente, montar o logger cujas linhas vão para
//     stdout e para o shipper, e descarregar as últimas linhas quando o contêiner para.

import { readServiceEnv, type ServiceEnv } from "./config";
import { createLogger, type Logger } from "./logger";
import { createShipper } from "./shipper";

export interface Runtime {
	env: ServiceEnv;
	logger: Logger;
	onStop: (cleanup: () => Promise<void>) => void;
}

export function startRuntime(service: string): Runtime {
	const env = readServiceEnv();
	const shipper = createShipper({ lokiUrl: env.LOKI_URL, labels: { service, format: env.LOG_FORMAT } });
	const logger = createLogger({
		service,
		format: env.LOG_FORMAT,
		write: (line, time) => {
			console.log(line);
			shipper.add(line, time);
		},
	});

	const cleanups: Array<() => Promise<void>> = [];
	const stop = async (): Promise<void> => {
		for (const cleanup of cleanups) {
			await cleanup().catch(() => undefined);
		}
		await shipper.stop();
		process.exit(0);
	};
	process.on("SIGTERM", () => void stop());
	process.on("SIGINT", () => void stop());

	return { env, logger, onStop: (cleanup) => cleanups.push(cleanup) };
}
