import { z } from "zod";
import { app } from "./app";

const port = z.coerce.number().int().min(1).max(65535).default(8080).parse(process.env.PORT);
const server = Bun.serve({ port, fetch: app });
console.log(`ts server listening on :${server.port}`);

process.on("SIGTERM", () => {
	void server.stop().then(() => process.exit(0));
});
