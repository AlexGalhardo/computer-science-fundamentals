import { ordersApp } from "./apps";
import { connectBroker } from "./broker";
import { startRuntime } from "./runtime";

const runtime = startRuntime("orders");
const broker = await connectBroker(runtime.env.BROKER_URL, runtime.env.QUEUE);
const server = Bun.serve({
	port: runtime.env.PORT,
	fetch: ordersApp({ logger: runtime.logger, publish: broker.publish, queue: runtime.env.QUEUE }),
});
runtime.onStop(() => server.stop());
runtime.onStop(() => broker.close());
