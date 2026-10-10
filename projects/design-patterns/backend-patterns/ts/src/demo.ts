// EN: `bun run demo`. Runs one small scenario per pattern, first on the failing design and then
//     on the pattern version, and prints what each one did. Every line comes from running the
//     code of this project, so the output is a short tour of the ten folders in `src/`.
// PT: `bun run demo`. Roda um cenário pequeno por padrão, primeiro no desenho com defeito e
//     depois na versão com o padrão, e mostra o que cada um fez. Toda linha vem da execução do
//     código deste projeto, então a saída é um passeio curto pelas dez pastas de `src/`.
// ES: `bun run demo`. Ejecuta un escenario pequeño por patrón, primero sobre el diseño que falla
//     y luego sobre la versión con el patrón, y muestra lo que hizo cada uno. Cada línea sale de
//     la ejecución del código de este proyecto, así que la salida es un recorrido corto por las
//     diez carpetas de `src/`.

import * as adapterAfter from "./adapter/after";
import * as adapterBefore from "./adapter/before";
import { AcmePaySdk, ZetaPayClient } from "./adapter/vendors";
import { RequestBuilder } from "./builder/after";
import { HttpRequest } from "./builder/before";
import * as commandAfter from "./command/after";
import * as commandBefore from "./command/before";
import { Cached, Logged } from "./decorator/after";
import { CachedLoggedUsers } from "./decorator/before";
import { StoredUsers } from "./decorator/users";
import * as factoryAfter from "./factory/after";
import * as factoryBefore from "./factory/before";
import * as observerAfter from "./observer/after";
import * as observerBefore from "./observer/before";
import { InMemoryUserRepository, RegisterUser } from "./repository/after";
import * as singletonAfter from "./singleton/after";
import * as singletonBefore from "./singleton/before";
import * as stateAfter from "./state/after";
import * as stateBefore from "./state/before";
import { Checkout, type ShippingStrategy } from "./strategy/after";
import { shippingCost } from "./strategy/before";

interface Scenario {
	pattern: string;
	before: () => string;
	after: () => string;
}

// EN: A scenario may end in an exception on purpose. The message is part of the story.
// PT: Um cenário pode terminar em exceção de propósito. A mensagem faz parte da história.
// ES: Un escenario puede terminar en una excepción a propósito. El mensaje es parte de la historia.
function attempt(run: () => string): string {
	try {
		return run();
	} catch (error) {
		return `throws "${error instanceof Error ? error.message : String(error)}"`;
	}
}

const scenarios: Scenario[] = [
	{
		pattern: "strategy",
		before: () => `drone shipping: ${shippingCost("drone", 2)}`,
		after: () => {
			const drone: ShippingStrategy = { name: "drone", cost: (kg) => 3500 + kg * 900 };
			return `drone shipping added from outside: total ${new Checkout(drone).total(10000, 2)} cents`;
		},
	},
	{
		pattern: "observer",
		before: () => {
			const order = new observerBefore.Order("o-1", "ana@example.test");
			order.pay();
			return `${order.effects.length} reactions, all written inside Order.pay`;
		},
		after: () => {
			const bus = new observerAfter.EventBus<observerAfter.OrderPaid>();
			const effects: string[] = [];
			for (const name of ["receipt", "stock", "loyalty points"]) {
				bus.subscribe((event) => effects.push(`${name} for ${event.orderId}`));
			}
			new observerAfter.Order("o-1", "ana@example.test", bus).pay();
			return `${effects.length} reactions subscribed, Order not edited`;
		},
	},
	{
		pattern: "factory",
		before: () => factoryBefore.orderShipped("push", "ana"),
		after: () => factoryAfter.orderShipped("push", "ana"),
	},
	{
		pattern: "adapter",
		before: () => `caller reads vendor field: status=${adapterBefore.checkout(new AcmePaySdk(), 2500).status}`,
		after: () => {
			const gateways = [
				new adapterAfter.AcmePayGateway(new AcmePaySdk()),
				new adapterAfter.ZetaPayGateway(new ZetaPayClient()),
			];
			const ids = gateways.map((gateway) => adapterAfter.checkout(gateway, 2500).id);
			return `same rule, two vendors: ${ids.join(", ")}`;
		},
	},
	{
		pattern: "decorator",
		before: () => {
			const users = new CachedLoggedUsers();
			users.find("1");
			users.find("1");
			return `3 classes for 2 features, one fixed order: ${users.lines.length} log line for 2 reads`;
		},
		after: () => {
			const lines: string[] = [];
			const users = new Logged(new Cached(new StoredUsers()), (line) => lines.push(line));
			users.find("1");
			users.find("1");
			return `2 classes, order chosen at assembly: ${lines.length} log lines for 2 reads`;
		},
	},
	{
		pattern: "repository",
		before: () => "the rule is tested through three exact SQL strings (see tests/repository.test.ts)",
		after: () => {
			const register = new RegisterUser(new InMemoryUserRepository());
			register.execute("ana@example.test");
			return `second registration of the same e-mail: ${attempt(() => register.execute("ANA@example.test"))}`;
		},
	},
	{
		pattern: "command",
		before: () => {
			const cart = new commandBefore.Cart();
			cart.add("book", 2);
			cart.undo();
			return `undo through a switch: book=${cart.quantity("book")}, no redo`;
		},
		after: () => {
			const cart = new commandAfter.Cart();
			const history = new commandAfter.History();
			history.run(new commandAfter.AddItem(cart, "book", 2));
			history.undo();
			history.redo();
			return `undo then redo through command objects: book=${cart.quantity("book")}`;
		},
	},
	{
		pattern: "state",
		before: () => {
			const order = new stateBefore.Order();
			order.ship();
			return order.status;
		},
		after: () => {
			const order = new stateAfter.Order();
			order.ship();
			return order.status;
		},
	},
	{
		pattern: "builder",
		before: () => {
			const request = new HttpRequest("POST", "/orders", undefined, undefined, 30, true, false);
			return `POST with body=${request.body} was created`;
		},
		after: () => `POST with no body: ${attempt(() => RequestBuilder.post("/orders").build().method)}`,
	},
	{
		pattern: "singleton",
		before: () => {
			const login = new singletonBefore.RateLimiter(3);
			const search = new singletonBefore.RateLimiter(3);
			for (let i = 0; i < 3; i++) login.allow("203.0.113.9");
			return `after 3 logins, the first search is allowed: ${search.allow("203.0.113.9")}`;
		},
		after: () => {
			const login = new singletonAfter.RateLimiter(new singletonAfter.RequestCounter(), 3);
			const search = new singletonAfter.RateLimiter(new singletonAfter.RequestCounter(), 3);
			for (let i = 0; i < 3; i++) login.allow("203.0.113.9");
			return `after 3 logins, the first search is allowed: ${search.allow("203.0.113.9")}`;
		},
	},
];

export function runDemo(): string[] {
	const lines: string[] = [];
	for (const scenario of scenarios) {
		lines.push(scenario.pattern);
		lines.push(`  before: ${attempt(scenario.before)}`);
		lines.push(`  after:  ${attempt(scenario.after)}`);
	}
	return lines;
}

if (import.meta.main) {
	console.log(runDemo().join("\n"));
}
