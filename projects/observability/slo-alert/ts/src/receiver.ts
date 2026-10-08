// EN: The other end of an alert. Alertmanager delivers notifications to receivers (a pager, a
//     chat, an e-mail). Here the receiver is a local webhook that only remembers what it got,
//     so the test can ask "was somebody paged, and when?".
// PT: A outra ponta de um alerta. O Alertmanager entrega notificações a receivers (um pager,
//     um chat, um e-mail). Aqui o receiver é um webhook local que só lembra o que recebeu,
//     para que o teste possa perguntar "alguém foi acionado, e quando?".

import { z } from "zod";

// EN: The webhook payload of Alertmanager (version 4). One notification can carry several
//     alerts, because Alertmanager groups them.
// PT: O corpo do webhook do Alertmanager (versão 4). Uma notificação pode levar vários
//     alertas, porque o Alertmanager os agrupa.
const webhookSchema = z.object({
	status: z.enum(["firing", "resolved"]),
	alerts: z.array(
		z.object({
			status: z.enum(["firing", "resolved"]),
			labels: z.record(z.string(), z.string()),
			annotations: z.record(z.string(), z.string()).default({}),
			startsAt: z.string(),
			endsAt: z.string(),
		}),
	),
});

export interface Notification {
	receivedAt: string;
	alertname: string;
	status: "firing" | "resolved";
	severity: string;
	summary: string;
}

export interface Receiver {
	fetch: (request: Request) => Promise<Response>;
	notifications: Notification[];
}

export function createReceiver(now: () => Date = () => new Date()): Receiver {
	const notifications: Notification[] = [];
	return {
		notifications,
		fetch: async (request) => {
			const { pathname } = new URL(request.url);
			if (request.method === "POST" && pathname === "/alerts") {
				const parsed = webhookSchema.safeParse(await request.json().catch(() => undefined));
				if (!parsed.success) {
					return Response.json({ error: "not an Alertmanager webhook" }, { status: 400 });
				}
				for (const alert of parsed.data.alerts) {
					notifications.push({
						receivedAt: now().toISOString(),
						alertname: alert.labels.alertname ?? "",
						status: alert.status,
						severity: alert.labels.severity ?? "",
						summary: alert.annotations.summary ?? "",
					});
				}
				return Response.json({ received: parsed.data.alerts.length });
			}
			if (request.method === "GET" && pathname === "/notifications") {
				return Response.json(notifications);
			}
			if (pathname === "/health") {
				return new Response("ok");
			}
			return new Response("not found", { status: 404 });
		},
	};
}

if (import.meta.main) {
	const env = z.object({ PORT: z.coerce.number().int().min(1).max(65535).default(8080) }).parse(process.env);
	const receiver = createReceiver();
	const server = Bun.serve({ port: env.PORT, fetch: receiver.fetch });
	console.log(`receiver listening on :${server.port}`);
	process.on("SIGTERM", () => {
		void server.stop().then(() => process.exit(0));
	});
}
