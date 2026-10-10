import { z } from "zod";
import { app } from "./app";

const port = z.coerce.number().int().min(1).max(65535).default(8080).parse(process.env.PORT);
// EN: Bun closes a connection that stays silent for 10 seconds by default. A profile request is
//     silent for as long as the profile lasts (up to 30 seconds), so the limit is raised above
//     that. Without it, any profile longer than 10 seconds ended in a connection reset.
// PT: O Bun fecha uma conexão que fica em silêncio por 10 segundos por padrão. Um pedido de perfil
//     fica em silêncio enquanto o perfil durar (até 30 segundos), então o limite fica acima disso.
//     Sem isso, qualquer perfil com mais de 10 segundos terminava em conexão reiniciada.
// ES: Bun cierra una conexión que queda en silencio por 10 segundos por defecto. Una petición de
//     perfil queda en silencio mientras dure el perfil (hasta 30 segundos), así que el límite
//     queda por encima de eso. Sin esto, todo perfil de más de 10 segundos terminaba en una
//     conexión reiniciada.
const server = Bun.serve({ port, fetch: app, idleTimeout: 60 });
console.log(`ts server listening on :${server.port}`);

process.on("SIGTERM", () => {
	void server.stop().then(() => process.exit(0));
});
