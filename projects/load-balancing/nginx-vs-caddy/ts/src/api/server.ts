import { z } from "zod";
import { createApp } from "./app";

const env = z
	.object({
		INSTANCE: z.string().regex(/^[a-z0-9-]+$/),
		PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	})
	.parse(process.env);

let server: ReturnType<typeof Bun.serve> | undefined;

const app = createApp(env.INSTANCE, {
	now: () => Date.now(),
	sleep: (ms) => Bun.sleep(ms),
	// EN: A "crash" closes the listening socket and every open connection, which is what the
	//     proxy sees when the process of a back end dies: new connections are refused at once.
	//     The short wait lets the answer of the control request leave first.
	// PT: Um "crash" fecha o socket de escuta e todas as conexões abertas, que é o que o proxy
	//     vê quando o processo de um back end morre: conexões novas são recusadas na hora.
	//     A pequena espera deixa a resposta da requisição de controle sair antes.
	// ES: Un "crash" cierra el socket de escucha y todas las conexiones abiertas, que es lo que el
	//     proxy ve cuando muere el proceso de un back end: las conexiones nuevas se rechazan al instante.
	//     La breve espera deja que salga primero la respuesta de la solicitud de control.
	crash: (ms) => {
		setTimeout(() => {
			void server?.stop(true);
			server = undefined;
			setTimeout(listen, ms);
		}, 20);
	},
});

function listen(): void {
	server = Bun.serve({ port: env.PORT, hostname: "0.0.0.0", idleTimeout: 120, fetch: app.handle });
}

listen();
console.log(`${env.INSTANCE} listening on ${env.PORT}`);
