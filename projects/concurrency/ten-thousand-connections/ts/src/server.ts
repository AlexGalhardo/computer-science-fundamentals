import { handle } from "./app";

const port = Number(process.env.PORT ?? 8080);

Bun.serve({
	port,
	// EN: Bun closes a connection that stays silent for 10 seconds by default. /delay keeps a
	//     request open for up to a minute on purpose, so the idle timeout is switched off.
	// PT: Por padrão o Bun fecha uma conexão que fica em silêncio por 10 segundos. O /delay
	//     mantém uma requisição aberta por até um minuto de propósito, então o tempo limite de
	//     inatividade é desligado.
	// ES: Por defecto Bun cierra una conexión que se queda en silencio por 10 segundos. /delay
	//     mantiene una solicitud abierta hasta por un minuto a propósito, así que el tiempo límite
	//     de inactividad se desactiva.
	idleTimeout: 0,
	fetch: handle,
});

console.log(`ts server listening on :${port}`);
