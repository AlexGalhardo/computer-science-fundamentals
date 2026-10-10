import { describe, expect, test } from "bun:test";
import * as after from "../src/primitive-obsession/after";
import * as before from "../src/primitive-obsession/before";
import type { Accounts } from "../src/primitive-obsession/contract";

// EN: The account type differs between the versions, so the suite is a generic function that
//     only uses the contract.
// PT: O tipo da conta difere entre as versões, então a suíte é uma função genérica que só usa o
//     contrato.
// ES: El tipo de la cuenta difiere entre las versiones, así que la suite es una función
//     genérica que solo usa el contrato.
function suite<A>(name: string, accounts: Accounts<A>): void {
	describe(`primitive obsession, ${name}`, () => {
		const ana = () => accounts.register("Ana", "  Ana@Example.COM ", "(11) 99999-0000");

		test("e-mail and phone are normalised", () => {
			expect(accounts.describe(ana())).toBe("Ana <ana@example.com> (11) 99999-0000");
			expect(accounts.describe(accounts.register("Bia", "bia@example.com", "1133334444"))).toBe(
				"Bia <bia@example.com> (11) 3333-4444",
			);
		});

		test("invalid values are refused everywhere they can come in", () => {
			expect(() => accounts.register("Ana", "ana.example.com", "11999990000")).toThrow("invalid e-mail");
			expect(() => accounts.register("Ana", "ana@example.com", "9999-0000")).toThrow("invalid phone");
			expect(() => accounts.changeEmail(ana(), "not an e-mail")).toThrow("invalid e-mail");
			expect(() => accounts.inviteText(ana(), "bia@")).toThrow("invalid e-mail");
		});

		test("changing the e-mail returns a new account and keeps the old one", () => {
			const old = ana();
			const changed = accounts.changeEmail(old, "ANA@work.example");
			expect(accounts.describe(changed)).toBe("Ana <ana@work.example> (11) 99999-0000");
			expect(accounts.describe(old)).toBe("Ana <ana@example.com> (11) 99999-0000");
		});

		test("an invitation compares normalised e-mails", () => {
			expect(accounts.inviteText(ana(), " Bia@Example.com")).toBe("ana@example.com invited bia@example.com");
			expect(() => accounts.inviteText(ana(), "ANA@example.com ")).toThrow("cannot invite yourself");
		});
	});
}

suite("before", before.accounts);
suite("after", after.accounts);

describe("primitive obsession, what the compiler sees", () => {
	// EN: With strings, swapped arguments compile. Swapping e-mail and phone is at least caught
	//     at run time, because the e-mail rule rejects a phone number. Swapping name and e-mail
	//     is caught by nobody when the name happens to look like an e-mail.
	// PT: Com strings, argumentos trocados compilam. Trocar e-mail e telefone ao menos é pego em
	//     tempo de execução, porque a regra de e-mail rejeita um número de telefone. Trocar nome e
	//     e-mail não é pego por ninguém quando o nome por acaso parece um e-mail.
	// ES: Con strings, los argumentos intercambiados compilan. Intercambiar correo y teléfono al
	//     menos se detecta en tiempo de ejecución, porque la regla de correo rechaza un número
	//     de teléfono. Intercambiar nombre y correo no lo detecta nadie cuando el nombre por
	//     casualidad parece un correo.
	test("before: swapped arguments compile", () => {
		expect(() => before.createAccount("Ana", "11999990000", "ana@example.com")).toThrow("invalid e-mail");
		const wrong = before.createAccount("ana@example.com", "ana@work.example", "11999990000");
		expect(wrong.name).toBe("ana@example.com");
	});

	// EN: A type test. `@ts-expect-error` is the opposite of silencing an error: it makes the
	//     type check FAIL if the next line ever compiles. The Docker image runs `tsc`, so the
	//     build proves that the swapped call is rejected by the compiler.
	// PT: Um teste de tipos. `@ts-expect-error` é o oposto de silenciar um erro: ele faz a
	//     checagem de tipos FALHAR se a linha seguinte um dia compilar. A imagem Docker roda o
	//     `tsc`, então o build prova que a chamada trocada é recusada pelo compilador.
	// ES: Un test de tipos. `@ts-expect-error` es lo opuesto a silenciar un error: hace que la
	//     verificación de tipos FALLE si la línea siguiente algún día compila. La imagen Docker
	//     ejecuta `tsc`, así que el build prueba que el compilador rechaza la llamada
	//     intercambiada.
	test("after: swapped arguments do not compile", () => {
		const email = after.Email.parse("ana@example.com");
		const phone = after.Phone.parse("11999990000");
		// @ts-expect-error a Phone is not an Email, and an Email is not a Phone
		const swapped = after.createAccount("Ana", phone, email);
		expect(swapped.name).toBe("Ana");
		expect(String(after.createAccount("Ana", email, phone).email)).toBe("ana@example.com");
	});

	test("after: a small type cannot be created without passing the rule", () => {
		expect(() => after.Email.parse("nope")).toThrow("invalid e-mail");
		expect(after.Email.parse(" A@B.co ").equals(after.Email.parse("a@b.co"))).toBe(true);
	});
});
