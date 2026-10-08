// EN: Entry point of the terminal delivery mechanism. It composes the same application as
//     `http.ts` and uses the other controller. `bun run cli add "Buy milk"`.
// PT: Ponto de entrada do mecanismo de entrega por terminal. Compõe a mesma aplicação que
//     `http.ts` e usa o outro controller. `bun run cli add "Comprar leite"`.

import { printToTerminal } from "../drivers/system";
import { composeApplication } from "./composition";
import { loadConfig } from "./config";

const application = await composeApplication(loadConfig());
const result = await application.cliController.run(process.argv.slice(2));
printToTerminal(result);
await application.close();
process.exit(result.exitCode);
