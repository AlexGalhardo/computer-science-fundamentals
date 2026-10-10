import { expect, test } from "bun:test";
import { type App, createApp } from "../src/api/app";

// EN: The handler is tested with no socket: time and the crash are injected, so the tests are
//     instant and deterministic.
// PT: O handler é testado sem socket: o tempo e o crash são injetados, então os testes são
//     instantâneos e determinísticos.
// ES: El handler se prueba sin socket: el tiempo y el crash se inyectan, así que las pruebas son
//     instantáneas y deterministas.
function setup(): { app: App; slept: number[]; crashes: number[]; clock: { now: number } } {
	const slept: number[] = [];
	const crashes: number[] = [];
	const clock = { now: 1000 };
	const app = createApp("api-9", {
		now: () => clock.now,
		sleep: async (ms) => {
			slept.push(ms);
			clock.now += ms;
		},
		crash: (ms) => crashes.push(ms),
	});
	return { app, slept, crashes, clock };
}

const get = (app: App, path: string): Promise<Response> => app.handle(new Request(`http://api-9:3000${path}`));
const post = (app: App, path: string): Promise<Response> =>
	app.handle(new Request(`http://api-9:3000${path}`, { method: "POST" }));

test("every answer names the instance", async () => {
	const { app } = setup();
	const response = await get(app, "/work");
	expect(response.status).toBe(200);
	expect(response.headers.get("X-Instance")).toBe("api-9");
	expect(await response.json()).toEqual({ instance: "api-9" });
});

test("stats count the work requests and reset clears them", async () => {
	const { app } = setup();
	await get(app, "/work");
	await get(app, "/work");
	await get(app, "/health");
	expect(await (await get(app, "/stats")).json()).toEqual({ instance: "api-9", served: 2, delayMs: 0 });
	await post(app, "/control/reset");
	expect(await (await get(app, "/stats")).json()).toEqual({ instance: "api-9", served: 0, delayMs: 0 });
});

test("the artificial delay applies to work only", async () => {
	const { app, slept } = setup();
	expect((await post(app, "/control/delay?ms=40")).status).toBe(200);
	await get(app, "/health");
	expect(slept).toEqual([]);
	await get(app, "/work");
	expect(slept).toEqual([40]);
});

test("control input is validated", async () => {
	const { app, crashes } = setup();
	expect((await post(app, "/control/delay?ms=abc")).status).toBe(400);
	expect((await post(app, "/control/delay?ms=-1")).status).toBe(400);
	expect((await post(app, "/control/delay?ms=60001")).status).toBe(400);
	expect((await post(app, "/control/outage?mode=explode&ms=10")).status).toBe(400);
	expect((await post(app, "/control/outage?mode=crash")).status).toBe(400);
	expect((await get(app, "/control/reset")).status).toBe(405);
	expect((await post(app, "/control/unknown")).status).toBe(404);
	expect(crashes).toEqual([]);
});

test("a crash is delegated to the server with its duration", async () => {
	const { app, crashes } = setup();
	expect((await post(app, "/control/outage?mode=crash&ms=4000")).status).toBe(200);
	expect(crashes).toEqual([4000]);
});

test("a frozen instance answers nothing until the freeze ends", async () => {
	const { app, slept } = setup();
	await post(app, "/control/outage?mode=freeze&ms=4000");
	await get(app, "/health");
	expect(slept).toEqual([4000]);
	await get(app, "/health");
	expect(slept).toEqual([4000]);
});

test("unknown paths and methods are refused", async () => {
	const { app } = setup();
	expect((await get(app, "/nothing")).status).toBe(404);
	expect((await post(app, "/work")).status).toBe(405);
});
