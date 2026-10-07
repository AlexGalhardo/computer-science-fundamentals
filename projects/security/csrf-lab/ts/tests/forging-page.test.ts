import { describe, expect, test } from "bun:test";
import { createForgingPageApp } from "../src/other-origin/forging-page";
import { FORGED_EMAIL, LAB_APP_HOSTS } from "../src/shared/config";

const BASE = "http://other-origin:3000";

// EN: The forging page is part of the lab's safety scope, so it is tested too: it must not be
//     possible to point it at a host that is not one of the lab's own containers.
// PT: A página forjadora faz parte do escopo de segurança do laboratório, então também é
//     testada: não pode ser possível apontá-la para um host que não seja um dos contêineres do
//     próprio laboratório.
describe("forging page: scope", () => {
	const app = createForgingPageApp();

	test("every allowed target is a single-label Docker host name", () => {
		for (const host of LAB_APP_HOSTS) {
			expect(host).toMatch(/^app-[a-z-]+$/);
		}
	});

	test("the POST forgery targets only the chosen lab host, with the fixed fake e-mail", async () => {
		const response = await app.handle(new Request(`${BASE}/forge/post?target=app-vulnerable`));
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(html).toContain("LAB FORGING PAGE");
		expect(html).toContain('action="http://app-vulnerable:3000/email/change"');
		expect(html).toContain(`value="${FORGED_EMAIL}"`);
		expect(html).not.toContain("csrfToken");
	});

	test("the GET forgery targets only the chosen lab host", async () => {
		const response = await app.handle(new Request(`${BASE}/forge/get?target=app-fixed`));
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(html).toContain(`href="http://app-fixed:3000/email/change?email=${encodeURIComponent(FORGED_EMAIL)}"`);
	});

	test.each(["example.com", "http://example.com", "app-vulnerable.example.com", ""])(
		"refuses the target %p",
		async (target) => {
			for (const kind of ["get", "post"]) {
				const response = await app.handle(
					new Request(`${BASE}/forge/${kind}?target=${encodeURIComponent(target)}`),
				);
				const body = await response.text();

				expect(response.status).toBe(400);
				expect(body).not.toContain("<form");
				expect(body).not.toContain("<a ");
			}
		},
	);

	test("refuses a missing target", async () => {
		const response = await app.handle(new Request(`${BASE}/forge/post`));

		expect(response.status).toBe(400);
	});
});
