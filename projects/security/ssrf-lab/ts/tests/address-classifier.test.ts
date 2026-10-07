// EN: A table of addresses and the class each one must get. The classifier is the rule that
//     decides where the server may connect, so every range is pinned down by an example. No
//     network is used here.
// PT: Uma tabela de endereços e a classe que cada um precisa receber. O classificador é a regra
//     que decide onde o servidor pode conectar, então cada faixa fica presa a um exemplo.
//     Nenhuma rede é usada aqui.

import { describe, expect, test } from "bun:test";
import { type AddressClass, classifyAddress, isAddressAllowed } from "../src/fixed/fixed-address-classifier";

const TABLE: ReadonlyArray<readonly [address: string, expected: AddressClass]> = [
	// IPv4
	["127.0.0.1", "loopback"],
	["127.255.255.254", "loopback"],
	["10.0.0.5", "private"],
	["172.16.0.1", "private"],
	["172.31.255.255", "private"],
	["192.168.1.10", "private"],
	["169.254.169.254", "link-local"],
	["0.0.0.0", "unspecified"],
	["100.64.0.1", "reserved"],
	["224.0.0.1", "reserved"],
	["255.255.255.255", "reserved"],
	// EN: Just outside the private ranges: the boundaries are where off-by-one mistakes hide.
	// PT: Logo fora das faixas privadas: é nas bordas que os erros de "um a mais" se escondem.
	["172.15.255.255", "public"],
	["172.32.0.1", "public"],
	["192.169.0.1", "public"],
	["203.0.113.10", "public"],
	// IPv6
	["::1", "loopback"],
	["::", "unspecified"],
	["fc00::1", "private"],
	["fd12:3456:789a::1", "private"],
	["fe80::1", "link-local"],
	["fe80::1%eth0", "link-local"],
	["ff02::1", "reserved"],
	["2001:db8::1", "public"],
	// EN: IPv4 addresses wrapped in IPv6: judged by the IPv4 address inside, in both spellings.
	// PT: Endereços IPv4 embrulhados em IPv6: julgados pelo IPv4 de dentro, nas duas grafias.
	["::ffff:127.0.0.1", "loopback"],
	["::ffff:7f00:1", "loopback"],
	["::ffff:10.0.0.5", "private"],
	["::ffff:169.254.169.254", "link-local"],
	["::ffff:203.0.113.10", "public"],
	["64:ff9b::a00:5", "private"],
	// Not addresses
	["localhost", "invalid"],
	["999.1.1.1", "invalid"],
	["", "invalid"],
];

describe("address classifier", () => {
	test.each(TABLE)("%s is %s", (address, expected) => {
		expect(classifyAddress(address)).toBe(expected);
	});

	test("only public addresses are allowed", () => {
		const allowed = TABLE.filter(([address]) => isAddressAllowed(address)).map(([, expected]) => expected);
		expect(new Set(allowed)).toEqual(new Set<AddressClass>(["public"]));
		expect(allowed).toHaveLength(TABLE.filter(([, expected]) => expected === "public").length);
	});
});
