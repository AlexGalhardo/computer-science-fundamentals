// EN: The demo: `docker compose run --rm demo`. Runs the five scenarios against the two running
//     services, prints what happened and writes results/results.md.
// PT: A demo: `docker compose run --rm demo`. Roda os cinco cenários contra os dois serviços em
//     execução, mostra o que aconteceu e grava results/results.md.
// ES: La demo: `docker compose run --rm demo`. Ejecuta los cinco escenarios contra los dos servicios en
//     ejecución, muestra lo que ocurrió y escribe results/results.md.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	crashAfterCommit,
	failedPayment,
	happyPath,
	type Lab,
	type Outcome,
	renderOutcomes,
	waitHealthy,
} from "./scenarios";
import { loadConfig } from "./shared/config";

const config = loadConfig();
const lab: Lab = { orderServiceUrl: config.ORDER_SERVICE_URL, paymentServiceUrl: config.PAYMENT_SERVICE_URL };
await waitHealthy(lab.orderServiceUrl);
await waitHealthy(lab.paymentServiceUrl);

const outcomes: Outcome[] = [];
for (const run of [
	() => happyPath(lab, "dual-write"),
	() => happyPath(lab, "outbox"),
	() => crashAfterCommit(lab, "dual-write"),
	() => crashAfterCommit(lab, "outbox"),
	() => failedPayment(lab),
]) {
	const outcome = await run();
	outcomes.push(outcome);
	console.log(
		`${outcome.scenario} (${outcome.mode}): order ${outcome.order?.status ?? "missing"}, payment ${outcome.payment?.status ?? "none"}`,
	);
}

const table = renderOutcomes(outcomes);
const report = `# Outbox and saga: scenario results

Generated at ${new Date().toISOString()} by \`docker compose run --rm demo\`, on \`postgres:18.6-alpine\`, \`rabbitmq:4.3.6-alpine\` and \`oven/bun:1.4.2\`.

${table}

- **crash between the write and the publish**: the order service is killed (\`process.exit(1)\`) right after the order is committed, and Docker restarts it. With \`dual-write\` the order stays \`PENDING\` and no payment exists: the event was lost. With \`outbox\` the relay finds the event row after the restart and the saga finishes.
- **payment fails**: the amount is above the fake card limit, the payment service answers \`PaymentFailed\`, and the order service compensates by cancelling the order.
`;

const resultsDir = join(config.PROJECT_DIR, "results");
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(resultsDir, "results.md"), report);
console.log(`\n${table}`);
