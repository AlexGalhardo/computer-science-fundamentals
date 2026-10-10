import { expect, test } from "bun:test";
import { PROFILES, peakRate, phaseAt, poolCapacity, SCENARIOS, stagesOf, totalSeconds } from "../../../k6/profiles.js";
import { hostOf, isLocalTarget, requireLocalTarget } from "../../../k6/target.js";

const QUERY_MS = 20;
const POOL_BEFORE = 2;
const POOL_AFTER = 20;

test("there are exactly the four scenarios of the lesson", () => {
	expect(SCENARIOS).toEqual(["load", "stress", "spike", "soak"]);
});

test("poolCapacity is connections divided by the time each request holds one", () => {
	expect(poolCapacity(2, 20)).toBe(100);
	expect(poolCapacity(20, 20)).toBe(1_000);
	expect(poolCapacity(10, 50)).toBe(200);
});

// EN: The design of the demo, checked as arithmetic. Every scenario asks for more than the small
//     pool can serve (so it must fail before the fix) and for at most 60% of what the large pool
//     can serve (so it passes after the fix with headroom, even on a noisy machine).
// PT: O desenho da demonstração, conferido como aritmética. Todo cenário pede mais do que o pool
//     pequeno consegue atender (então precisa falhar antes da correção) e no máximo 60% do que o
//     pool grande consegue atender (então passa depois da correção com folga, mesmo em máquina com ruído).
// ES: El diseño de la demostración, verificado como aritmética. Todo escenario pide más de lo que el
//     pool pequeño puede atender (así que debe fallar antes de la corrección) y como máximo el 60% de
//     lo que puede atender el pool grande (así que pasa después de la corrección con holgura, incluso
//     en una máquina con ruido).
test("every scenario is above the capacity of the small pool and well below the large one", () => {
	for (const scenario of SCENARIOS) {
		const peak = peakRate(PROFILES[scenario]);
		expect(peak).toBeGreaterThan(poolCapacity(POOL_BEFORE, QUERY_MS));
		expect(peak).toBeLessThanOrEqual(0.6 * poolCapacity(POOL_AFTER, QUERY_MS));
	}
});

test("each profile has the shape of its test type", () => {
	const rates = (name: keyof typeof PROFILES): number[] => PROFILES[name].phases.map((phase) => phase.rate);
	// Load: up to a plateau and down again.
	expect(rates("load")).toEqual([150, 150, 10]);
	// Stress: every step is higher than the one before.
	expect(rates("stress")).toEqual([...rates("stress")].sort((a, b) => a - b));
	expect(new Set(rates("stress")).size).toBe(rates("stress").length);
	// Spike: a burst of more than ten times the base traffic, then back to the base.
	const [base = 0, burst = 0, back = 0] = rates("spike");
	expect(burst).toBeGreaterThan(10 * base);
	expect(back).toBe(base);
	// Soak: one constant rate, and the longest of the four.
	expect(new Set(rates("soak")).size).toBe(1);
	for (const scenario of SCENARIOS) {
		expect(totalSeconds(PROFILES.soak)).toBeGreaterThanOrEqual(totalSeconds(PROFILES[scenario]));
	}
});

test("stagesOf keeps the total duration and turns a step into a one-second jump plus a hold", () => {
	for (const scenario of SCENARIOS) {
		const stages = stagesOf(PROFILES[scenario]);
		const seconds = stages.reduce((sum, stage) => sum + Number.parseInt(stage.duration, 10), 0);
		expect(seconds).toBe(totalSeconds(PROFILES[scenario]));
	}
	expect(stagesOf(PROFILES.spike).slice(2, 4)).toEqual([
		{ target: 500, duration: "1s" },
		{ target: 500, duration: "5s" },
	]);
	expect(stagesOf(PROFILES.load)[0]).toEqual({ target: 150, duration: "5s" });
});

test("phaseAt names the phase that is running at a given second", () => {
	expect(phaseAt(PROFILES.spike, 0)).toBe("before");
	expect(phaseAt(PROFILES.spike, 7.9)).toBe("before");
	expect(phaseAt(PROFILES.spike, 8)).toBe("spike");
	expect(phaseAt(PROFILES.spike, 14)).toBe("recovery");
	// Requests that finish during the graceful stop still belong to the last phase.
	expect(phaseAt(PROFILES.spike, 999)).toBe("recovery");
});

test("loopback and the docker-compose service name are local", () => {
	for (const target of ["http://localhost:3000", "http://127.0.0.1:3000/", "http://[::1]:3000", "http://api:3000"]) {
		expect(isLocalTarget(target)).toBe(true);
	}
});

// EN: Each of these is a way a host that is not local could slip past a careless check.
// PT: Cada um destes é um jeito de um host não local passar por uma verificação descuidada.
// ES: Cada uno de estos es una forma en que un host no local pasa una verificación descuidada.
test("everything else is refused", () => {
	for (const target of [
		"https://example.com",
		"http://example.com:3000/products/1",
		"http://api.example.com",
		"http://localhost.example.com",
		"http://localhost@example.com",
		"http://api:3000@example.com",
		"http://example.com/?host=localhost",
		"http://192.168.0.10:3000",
		"ftp://localhost",
		"api:3000",
		"",
	]) {
		expect(isLocalTarget(target)).toBe(false);
		expect(() => requireLocalTarget(target)).toThrow("refusing to run");
	}
	expect(hostOf("http://api:3000/stats")).toBe("api");
	expect(requireLocalTarget("http://api:3000/")).toBe("http://api:3000");
});
