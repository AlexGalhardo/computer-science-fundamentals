// EN: What each broker guarantees in the two behaviour experiments. The integration tests assert
//     these values, so the table of the README is backed by a test and not by a single lucky run.
//     `null` means "not guaranteed either way": the test only records what it observed.
// PT: O que cada broker garante nos dois experimentos de comportamento. Os testes de integração
//     conferem estes valores, então a tabela do README é sustentada por um teste e não por uma
//     única execução de sorte. `null` significa "sem garantia para nenhum lado": o teste só
//     registra o que observou.

import type { BrokerName } from "./queue";

export interface ExpectedBehaviour {
	globalOrder: boolean | null;
	perKeyOrder: boolean | null;
	redelivered: boolean;
	/** The flag the broker attaches to a second delivery, `null` when it has none. */
	brokerFlag: boolean | null;
}

export const EXPECTED: Record<BrokerName, ExpectedBehaviour> = {
	// One list in Redis, one worker with concurrency 1: first in, first out.
	bullmq: { globalOrder: true, perKeyOrder: true, redelivered: true, brokerFlag: true },
	// One queue, one consumer with prefetch 1: first in, first out.
	rabbitmq: { globalOrder: true, perKeyOrder: true, redelivered: true, brokerFlag: true },
	// Three partitions: order exists only inside a partition, so only per key.
	kafka: { globalOrder: false, perKeyOrder: true, redelivered: true, brokerFlag: null },
	// A standard queue promises best-effort ordering only.
	sqs: { globalOrder: null, perKeyOrder: null, redelivered: true, brokerFlag: true },
};
