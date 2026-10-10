// EN: The load that breaks the objective. For LOAD_S seconds, VUS virtual users call /pay as
//     fast as the pause allows. The shop serves 8 requests at a time, so most of these get a
//     503 and the rest are slow: both error budgets start to burn. Before the load there is a
//     quiet period of START_S seconds, so Prometheus has a healthy baseline to compare with.
//     The target is checked before anything else: k6 refuses a host that is not local.
// PT: A carga que quebra o objetivo. Durante LOAD_S segundos, VUS usuários virtuais chamam /pay
//     tão rápido quanto a pausa permite. A loja atende 8 requisições por vez, então a maioria
//     recebe 503 e o resto fica lento: os dois orçamentos de erro começam a queimar. Antes da
//     carga há um período calmo de START_S segundos, para o Prometheus ter uma linha de base
//     saudável para comparar. O alvo é conferido antes de tudo: o k6 recusa um host que não é
//     local.
// ES: La carga que rompe el objetivo. Durante LOAD_S segundos, VUS usuarios virtuales llaman a /pay
//     tan rápido como lo permite la pausa. La tienda atiende 8 peticiones a la vez, así que la mayoría
//     recibe 503 y el resto se vuelve lento: los dos presupuestos de error empiezan a quemarse. Antes
//     de la carga hay un período tranquilo de START_S segundos, para que Prometheus tenga una línea
//     base sana con la cual comparar. El objetivo se comprueba antes que nada: k6 rechaza un host que
//     no sea local.

import { sleep } from "k6";
import http from "k6/http";
import { requireLocalTarget } from "./target.js";

const TARGET = requireLocalTarget(__ENV.TARGET || "http://localhost:8080");
const VUS = Number(__ENV.VUS || 30);
const START_S = Number(__ENV.START_S || 45);
const LOAD_S = Number(__ENV.LOAD_S || 60);

export const options = {
	scenarios: {
		overload: {
			executor: "constant-vus",
			vus: VUS,
			startTime: `${START_S}s`,
			duration: `${LOAD_S}s`,
			gracefulStop: "2s",
		},
	},
	// EN: The 503s are the point of this run, so they must not count as a failed test.
	// PT: Os 503 são o objetivo desta execução, então não podem contar como teste reprovado.
	// ES: Los 503 son el objetivo de esta ejecución, así que no pueden contar como prueba fallida.
	thresholds: {},
};

export default function overload() {
	http.get(`${TARGET}/pay`, { responseCallback: http.expectedStatuses(200, 503) });
	sleep(0.1);
}
