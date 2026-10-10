// EN: `bun run src/crash-consumer.ts <broker> <channel>`: the victim of the redelivery
//     experiment. It receives one message, says so, and then never finishes the handler, so the
//     message is never acknowledged. The parent process kills it with SIGKILL.
// PT: `bun run src/crash-consumer.ts <broker> <channel>`: a vítima do experimento de reentrega.
//     Recebe uma mensagem, avisa, e depois nunca termina o handler, então a mensagem nunca é
//     confirmada. O processo pai o mata com SIGKILL.
// ES: `bun run src/crash-consumer.ts <broker> <channel>`: la víctima del experimento de reentrega.
//     Recibe un mensaje, lo avisa, y luego nunca termina el handler, así que el mensaje nunca se
//     confirma. El proceso padre lo mata con SIGKILL.

import { z } from "zod";
import { adapterFactory } from "./adapters";
import { loadConfig } from "./config";
import { BROKERS } from "./queue";

const args = z.tuple([z.enum(BROKERS), z.string().min(1)]).parse(process.argv.slice(2));
const [broker, channel] = args;

await adapterFactory(
	broker,
	loadConfig(),
)(channel).consume(
	() => {
		console.log("RECEIVED");
		return new Promise<void>(() => {});
	},
	{ parallelism: 1 },
);
