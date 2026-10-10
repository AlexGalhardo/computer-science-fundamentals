import { describe, expect, test } from "bun:test";
import { AcmePayGateway, checkout, type PaymentGateway, ZetaPayGateway } from "../src/adapter/after";
import { checkout as coupledCheckout } from "../src/adapter/before";
import { AcmePaySdk, ZetaPayClient } from "../src/adapter/vendors";

describe("adapter: before", () => {
	// EN: The flaw: the result is the vendor's type, and the caller compares the vendor's text.
	// PT: O defeito: o resultado é o tipo do fornecedor, e o chamador compara o texto do
	//     fornecedor.
	// ES: El defecto: el resultado es el tipo del proveedor, y el llamador compara el texto del
	//     proveedor.
	test("the caller receives the vendor's own type and vocabulary", () => {
		const result = coupledCheckout(new AcmePaySdk(), 2500);
		expect(result).toEqual({ transactionId: "acme-1", status: "OK" });
	});
});

describe("adapter: after", () => {
	test("the same rule works with either vendor behind the gateway", () => {
		const gateways: PaymentGateway[] = [
			new AcmePayGateway(new AcmePaySdk()),
			new ZetaPayGateway(new ZetaPayClient()),
		];
		expect(gateways.map((gateway) => checkout(gateway, 2500))).toEqual([
			{ id: "acme-1", approved: true },
			{ id: "zeta-1", approved: true },
		]);
	});

	test("each adapter translates the vendor's refusal to the same field", () => {
		expect(checkout(new AcmePayGateway(new AcmePaySdk()), 100_001).approved).toBe(false);
		expect(checkout(new ZetaPayGateway(new ZetaPayClient()), 100_001).approved).toBe(false);
	});

	test("the adapter converts the unit: the rule speaks cents, this vendor speaks currency units", () => {
		const amounts: number[] = [];
		const sdk = new AcmePaySdk();
		const original = sdk.createTransaction.bind(sdk);
		sdk.createTransaction = (input) => {
			amounts.push(input.amount);
			return original(input);
		};
		checkout(new AcmePayGateway(sdk), 1999);
		expect(amounts).toEqual([19.99]);
	});

	test("the rule is tested with no vendor at all", () => {
		const charged: number[] = [];
		const fake: PaymentGateway = {
			charge: (cents) => {
				charged.push(cents);
				return { id: "fake-1", approved: true };
			},
		};
		expect(checkout(fake, 700)).toEqual({ id: "fake-1", approved: true });
		expect(charged).toEqual([700]);
		expect(() => checkout(fake, 0)).toThrow("nothing to charge");
	});
});
