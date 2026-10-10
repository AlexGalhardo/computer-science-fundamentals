import { workerHandler } from "./apps";
import { connectBroker } from "./broker";
import { startRuntime } from "./runtime";

// EN: The worker has no HTTP API. The small server below exists only for the health check,
//     and it starts after the queue consumer, so "healthy" means "consuming".
// PT: O worker não tem API HTTP. O pequeno servidor abaixo existe só para o health check, e
//     sobe depois do consumidor da fila, então "healthy" significa "consumindo".
// ES: El worker no tiene API HTTP. El pequeño servidor de abajo existe solo para el health check, y
//     arranca después del consumidor de la cola, así que "healthy" significa "consumiendo".
const runtime = startRuntime("worker");
const broker = await connectBroker(runtime.env.BROKER_URL, runtime.env.QUEUE);
await broker.consume(workerHandler({ logger: runtime.logger }));
const server = Bun.serve({ port: runtime.env.PORT, fetch: () => new Response("ok") });
runtime.onStop(() => server.stop());
runtime.onStop(() => broker.close());
