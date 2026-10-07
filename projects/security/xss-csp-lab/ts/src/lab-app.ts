// EN: What the vulnerable and the fixed app have in common: a function from an HTTP request to
//     an HTTP response. Tests call `handle` directly, with no network, and the server passes
//     real requests to the same function.
// PT: O que o app vulnerável e o corrigido têm em comum: uma função de uma requisição HTTP para
//     uma resposta HTTP. Os testes chamam `handle` direto, sem rede, e o servidor repassa
//     requisições reais para a mesma função.
export interface LabApp {
	handle(request: Request): Promise<Response>;
}

export const HTML_CONTENT_TYPE = "text/html; charset=utf-8";
export const JS_CONTENT_TYPE = "text/javascript; charset=utf-8";
