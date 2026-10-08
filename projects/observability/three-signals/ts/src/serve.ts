// EN: Shared start-up of a TypeScript service: read the environment, start the SDK, serve, and
//     flush the telemetry when the container is stopped.
// PT: Inicialização comum de um serviço TypeScript: ler o ambiente, iniciar o SDK, servir, e
//     descarregar a telemetria quando o contêiner é parado.

import type { App } from "./apps";
import { readServiceEnv, type ServiceEnv } from "./config";
import { createTelemetry, otlpPipelines, type Telemetry } from "./telemetry";

export function serve(serviceName: string, build: (telemetry: Telemetry, env: ServiceEnv) => App): void {
	const env = readServiceEnv();
	const telemetry = createTelemetry(serviceName, otlpPipelines(env.OTEL_EXPORTER_OTLP_ENDPOINT));
	const server = Bun.serve({ port: env.PORT, fetch: build(telemetry, env) });
	console.log(`${serviceName} listening on :${server.port}`);

	const stop = async (): Promise<void> => {
		await server.stop();
		await telemetry.shutdown();
		process.exit(0);
	};
	process.on("SIGTERM", () => void stop());
	process.on("SIGINT", () => void stop());
}
