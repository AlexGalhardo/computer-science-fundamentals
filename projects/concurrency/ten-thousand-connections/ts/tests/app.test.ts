import { expect, test } from "bun:test";
import { handle } from "../src/app";

const call = (path: string, init?: RequestInit): Promise<Response> =>
	handle(new Request(`http://localhost${path}`, init));

test("echo returns the body and its content type", async () => {
	const response = await call("/echo", {
		method: "POST",
		body: "hello",
		headers: { "Content-Type": "text/plain" },
	});
	expect(response.status).toBe(200);
	expect(response.headers.get("Content-Type")).toBe("text/plain");
	expect(await response.text()).toBe("hello");
});

test("delay rejects input that is not an integer from 0 to 60000", async () => {
	for (const query of ["", "?ms=abc", "?ms=-1", "?ms=1.5", "?ms=60001"]) {
		expect((await call(`/delay${query}`)).status).toBe(400);
	}
});

// EN: 200 requests that each wait 300 ms finish together in about 300 ms on ONE thread. The
//     event loop is not waiting on any of them: it holds 200 timers and stays free.
// PT: 200 requisições que esperam 300 ms cada terminam juntas em cerca de 300 ms em UMA thread.
//     O event loop não fica esperando nenhuma delas: guarda 200 timers e continua livre.
test("delays overlap on a single thread", async () => {
	const start = performance.now();
	const responses = await Promise.all(Array.from({ length: 200 }, () => call("/delay?ms=300")));
	expect(responses.every((response) => response.status === 200)).toBe(true);
	expect(performance.now() - start).toBeLessThan(5000);
});

test("unknown path is 404 and wrong method is 405", async () => {
	expect((await call("/nope")).status).toBe(404);
	expect((await call("/echo")).status).toBe(405);
});
