import { expect, test } from "bun:test";
import { fetchRate, localRatesUrl } from "../../src/rates";

// EN: FLAKY ON PURPOSE (cause: real network). The test makes a real HTTP call to the
//     `unstable-api` service of this lab, which fails one request in four. Nothing in our code
//     is wrong when it fails. The test is measuring the health of a dependency.
// PT: INTERMITENTE DE PROPÓSITO (causa: rede real). O teste faz uma chamada HTTP real ao serviço
//     `unstable-api` deste laboratório, que falha uma requisição em cada quatro. Nada no nosso
//     código está errado quando ele falha. O teste está medindo a saúde de uma dependência.
// ES: INTERMITENTE A PROPÓSITO (causa: red real). La prueba hace una llamada HTTP real al servicio
//     `unstable-api` de este laboratorio, que falla una solicitud de cada cuatro. No hay nada mal en
//     nuestro código cuando falla. La prueba está midiendo la salud de una dependencia.
test("the USD-BRL rate is 5.25", async () => {
	expect(await fetchRate("USD-BRL", localRatesUrl())).toBe(5.25);
});
