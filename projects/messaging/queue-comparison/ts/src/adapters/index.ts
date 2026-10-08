// EN: The registry of adapters. `satisfies Record<BrokerName, ...>` makes the compiler refuse the
//     build when a broker has no adapter, and each class is declared `implements QueueAdapter`,
//     so "the four adapters implement the same interface" is checked by `tsc`, not by a promise.
// PT: O registro de adaptadores. `satisfies Record<BrokerName, ...>` faz o compilador recusar o
//     build quando um broker não tem adaptador, e cada classe é declarada `implements
//     QueueAdapter`, então "os quatro adaptadores implementam a mesma interface" é conferido
//     pelo `tsc`, não por uma promessa.

import type { Config } from "../config";
import type { AdapterFactory, BrokerName, QueueAdapter } from "../queue";
import { BullmqAdapter } from "./bullmq";
import { KafkaAdapter } from "./kafka";
import { RabbitmqAdapter } from "./rabbitmq";
import { SqsAdapter } from "./sqs";

const ADAPTERS = {
	bullmq: BullmqAdapter,
	rabbitmq: RabbitmqAdapter,
	kafka: KafkaAdapter,
	sqs: SqsAdapter,
} satisfies Record<BrokerName, new (config: Config, channel: string) => QueueAdapter>;

export function adapterFactory(broker: BrokerName, config: Config): AdapterFactory {
	return (channel) => new ADAPTERS[broker](config, channel);
}
