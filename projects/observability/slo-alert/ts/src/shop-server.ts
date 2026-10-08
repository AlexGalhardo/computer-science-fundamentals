import { z } from "zod";
import { createShop } from "./shop";

const env = z.object({ PORT: z.coerce.number().int().min(1).max(65535).default(8080) }).parse(process.env);
const shop = createShop();
const server = Bun.serve({ port: env.PORT, fetch: shop.fetch });
console.log(`shop listening on :${server.port}`);

process.on("SIGTERM", () => {
	void server.stop().then(() => process.exit(0));
});
