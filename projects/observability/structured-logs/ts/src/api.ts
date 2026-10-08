import { apiApp } from "./apps";
import { startRuntime } from "./runtime";

const runtime = startRuntime("api");
const server = Bun.serve({
	port: runtime.env.PORT,
	fetch: apiApp({ logger: runtime.logger, ordersUrl: runtime.env.ORDERS_URL }),
});
runtime.onStop(() => server.stop());
