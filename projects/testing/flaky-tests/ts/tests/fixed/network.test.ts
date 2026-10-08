import { expect, test } from "bun:test";
import { fetchRate, type Http, RateUnavailableError } from "../../src/rates";

// EN: FIXED (stubbed network). A stub is a stand-in that returns a prepared answer. No socket is
//     opened: this file runs in a container with no network at all. The stub also makes the
//     failure path testable on demand. With the real service, a 503 shows up only by chance.
//     What the stub cannot tell is whether the real service still answers in this shape. That
//     question belongs to a separate integration or contract test, run on purpose, not to the
//     unit suite.
// PT: CORRIGIDO (rede com stub). Um stub é um substituto que devolve uma resposta preparada.
//     Nenhum socket é aberto: este arquivo roda em um contêiner sem rede nenhuma. O stub também
//     torna o caminho de falha testável sob encomenda. Com o serviço real, um 503 só aparece por
//     acaso. O que o stub não sabe dizer é se o serviço real ainda responde neste formato. Essa
//     pergunta é de um teste de integração ou de contrato separado, rodado de propósito, não da
//     suíte unitária.
const BASE_URL = "http://rates.invalid";

function stub(status: number, body: unknown): { http: Http; urls: string[] } {
	const urls: string[] = [];
	const http: Http = async (url) => {
		urls.push(url);
		return Response.json(body, { status });
	};
	return { http, urls };
}

test("the USD-BRL rate is 5.25", async () => {
	const { http, urls } = stub(200, { pair: "USD-BRL", rate: 5.25 });
	expect(await fetchRate("USD-BRL", BASE_URL, http)).toBe(5.25);
	expect(urls).toEqual(["http://rates.invalid/rates/USD-BRL"]);
});

test("a 503 from the service becomes a RateUnavailableError", async () => {
	const { http } = stub(503, { error: "temporarily unavailable" });
	await expect(fetchRate("USD-BRL", BASE_URL, http)).rejects.toBeInstanceOf(RateUnavailableError);
});

test("a body in an unexpected shape is rejected", async () => {
	const { http } = stub(200, { pair: "USD-BRL", rate: "5.25" });
	await expect(fetchRate("USD-BRL", BASE_URL, http)).rejects.toThrow();
});
