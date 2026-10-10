// EN: A correlation id is one value shared by everything a single request causes, in every
//     service. It is created at the edge (or accepted from the caller), and from then on it
//     travels with the work: in an HTTP header between services, in a message property through
//     the queue. Each service writes it in every log line, and that is what turns thousands of
//     unrelated lines into the story of one request.
// PT: Um correlation id é um valor compartilhado por tudo que uma única requisição causa, em
//     todos os serviços. Ele é criado na borda (ou aceito de quem chamou), e daí em diante
//     viaja com o trabalho: em um cabeçalho HTTP entre serviços, em uma propriedade da mensagem
//     através da fila. Cada serviço o escreve em toda linha de log, e é isso que transforma
//     milhares de linhas sem relação na história de uma requisição.
// ES: Un correlation id es un valor compartido por todo lo que una única petición causa, en
//     todos los servicios. Se crea en el borde (o se acepta de quien llamó), y de ahí en adelante
//     viaja con el trabajo: en un encabezado HTTP entre servicios, en una propiedad del mensaje
//     a través de la cola. Cada servicio lo escribe en cada línea de log, y eso es lo que convierte
//     miles de líneas sin relación en la historia de una petición.

import { AsyncLocalStorage } from "node:async_hooks";

export const CORRELATION_HEADER = "x-correlation-id";

// EN: The id comes from outside, so it is validated before it reaches a log line or a query.
//     Without this, a caller could send a line break and forge extra log lines (log
//     injection), or a quote that changes the meaning of a search.
// PT: O id vem de fora, então é validado antes de chegar a uma linha de log ou a uma consulta.
//     Sem isso, quem chama poderia mandar uma quebra de linha e forjar linhas de log (log
//     injection), ou uma aspa que muda o sentido de uma busca.
// ES: El id viene de fuera, así que se valida antes de llegar a una línea de log o a una consulta.
//     Sin eso, quien llama podría mandar un salto de línea y falsificar líneas de log (log
//     injection), o una comilla que cambia el sentido de una búsqueda.
const CORRELATION_ID = /^[A-Za-z0-9._-]{8,64}$/;

export function isCorrelationId(value: unknown): value is string {
	return typeof value === "string" && CORRELATION_ID.test(value);
}

export function newCorrelationId(): string {
	return crypto.randomUUID();
}

/** Keeps a valid incoming id, so a trace that started upstream continues; otherwise starts a new one. */
export function correlationIdFrom(candidate: unknown): string {
	return isCorrelationId(candidate) ? candidate : newCorrelationId();
}

// EN: AsyncLocalStorage is a variable that follows one chain of asynchronous calls. Inside
//     `runWithCorrelation`, any function reached through `await`, however deep, reads the id of
//     its own request, even while other requests run interleaved in the same process. This is
//     why the logger needs no `correlationId` parameter in every function signature.
// PT: AsyncLocalStorage é uma variável que acompanha uma cadeia de chamadas assíncronas. Dentro
//     de `runWithCorrelation`, qualquer função alcançada por `await`, por mais funda que
//     esteja, lê o id da sua própria requisição, mesmo com outras requisições intercaladas no
//     mesmo processo. É por isso que o logger não precisa de um parâmetro `correlationId` na
//     assinatura de toda função.
// ES: AsyncLocalStorage es una variable que acompaña una cadena de llamadas asíncronas. Dentro
//     de `runWithCorrelation`, cualquier función alcanzada por `await`, por más profunda que
//     esté, lee el id de su propia petición, incluso con otras peticiones intercaladas en el
//     mismo proceso. Por eso el logger no necesita un parámetro `correlationId` en la
//     firma de cada función.
const storage = new AsyncLocalStorage<string>();

export function runWithCorrelation<T>(correlationId: string, work: () => T): T {
	return storage.run(correlationId, work);
}

export function currentCorrelationId(): string | undefined {
	return storage.getStore();
}
