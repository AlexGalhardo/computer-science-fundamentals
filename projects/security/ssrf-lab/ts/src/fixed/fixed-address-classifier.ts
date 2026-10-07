// EN: Classifies an IP address by the kind of network it belongs to. This is the heart of the
//     fix: the decision "may the server connect there?" is taken on the NUMERIC address the
//     connection will really use, never on the text of the URL. A name can be spelled in many
//     ways and can resolve to anything; the address is what the socket connects to.
// PT: Classifica um endereço IP pelo tipo de rede a que ele pertence. Este é o coração da
//     correção: a decisão "o servidor pode conectar ali?" é tomada sobre o endereço NUMÉRICO que
//     a conexão realmente vai usar, nunca sobre o texto da URL. Um nome pode ser escrito de
//     muitas formas e pode resolver para qualquer coisa; o endereço é onde o socket conecta.

import { isIPv4, isIPv6 } from "node:net";

export type AddressClass =
	/** Routable on the internet (in this lab: the documentation range of the fake public site). */
	| "public"
	/** The machine itself: 127.0.0.0/8 and ::1. */
	| "loopback"
	/** Private networks: 10/8, 172.16/12, 192.168/16 (RFC 1918) and fc00::/7 (unique local). */
	| "private"
	/** Link-local: 169.254/16 and fe80::/10. Cloud metadata services live at 169.254.169.254. */
	| "link-local"
	/** "This host, any interface": 0.0.0.0/8 and ::. Often ends up reaching the machine itself. */
	| "unspecified"
	/** Other ranges nobody should fetch a web page from: multicast, shared address space, future use. */
	| "reserved"
	/** Not an IP address at all. */
	| "invalid";

function parseIpv4(text: string): number[] | null {
	// EN: `isIPv4` accepts only the canonical form, four decimal numbers. Other spellings of an
	//     address never get here as text: the URL parser has already normalised them.
	// PT: `isIPv4` aceita só a forma canônica, quatro números decimais. Outras grafias de um
	//     endereço nunca chegam aqui como texto: o parser de URL já as normalizou.
	return isIPv4(text) ? text.split(".").map(Number) : null;
}

function classifyIpv4(octets: readonly number[]): AddressClass {
	const [a = 0, b = 0, c = 0] = octets;
	if (a === 0) return "unspecified";
	if (a === 127) return "loopback";
	if (a === 10) return "private";
	if (a === 172 && b >= 16 && b <= 31) return "private";
	if (a === 192 && b === 168) return "private";
	if (a === 169 && b === 254) return "link-local";
	// EN: 100.64.0.0/10 is shared address space (carrier-grade NAT), 192.0.0.0/24 is kept for
	//     protocol assignments, 224.0.0.0/4 is multicast and 240.0.0.0/4 is reserved, which
	//     includes the broadcast address 255.255.255.255.
	// PT: 100.64.0.0/10 é espaço de endereços compartilhado (NAT de operadora), 192.0.0.0/24 é
	//     guardado para atribuições de protocolo, 224.0.0.0/4 é multicast e 240.0.0.0/4 é
	//     reservado, o que inclui o endereço de broadcast 255.255.255.255.
	if (a === 100 && b >= 64 && b <= 127) return "reserved";
	if (a === 192 && b === 0 && c === 0) return "reserved";
	if (a >= 224) return "reserved";
	// EN: The documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) are not
	//     private, so they count as public here. The lab uses 203.0.113.0/24 as its stand-in for
	//     the internet: it is never routed on the real one. A production allow-list may refuse
	//     these ranges too, since no real site lives there.
	// PT: As faixas de documentação (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) não são
	//     privadas, então contam como públicas aqui. O laboratório usa 203.0.113.0/24 no lugar da
	//     internet: ela nunca é roteada na internet real. Uma lista de permissão de produção pode
	//     recusar essas faixas também, já que nenhum site real mora nelas.
	return "public";
}

// EN: An IPv6 address is eight groups of 16 bits. The text form has two shortcuts that must be
//     undone before comparing anything: `::` stands for a run of zero groups, and the last two
//     groups may be written as a dotted IPv4 address.
// PT: Um endereço IPv6 são oito grupos de 16 bits. A forma em texto tem dois atalhos que precisam
//     ser desfeitos antes de comparar qualquer coisa: `::` representa uma sequência de grupos
//     zero, e os dois últimos grupos podem ser escritos como um endereço IPv4 com pontos.
function parseIpv6(text: string): number[] | null {
	// EN: A zone index ("%eth0") only says which interface to use, it is not part of the address.
	// PT: Um índice de zona ("%eth0") só diz qual interface usar, não faz parte do endereço.
	let source = text.split("%")[0] ?? "";
	if (!isIPv6(source)) {
		return null;
	}
	const lastColon = source.lastIndexOf(":");
	const dotted = parseIpv4(source.slice(lastColon + 1));
	if (dotted !== null) {
		const [a = 0, b = 0, c = 0, d = 0] = dotted;
		const high = ((a << 8) | b).toString(16);
		const low = ((c << 8) | d).toString(16);
		source = `${source.slice(0, lastColon + 1)}${high}:${low}`;
	}
	const [head = "", tail] = source.split("::");
	const headGroups = head === "" ? [] : head.split(":");
	const tailGroups = tail === undefined || tail === "" ? [] : tail.split(":");
	const missing = tail === undefined ? 0 : 8 - headGroups.length - tailGroups.length;
	const zeros = Array.from({ length: Math.max(missing, 0) }, () => "0");
	const groups = [...headGroups, ...zeros, ...tailGroups].map((group) => Number.parseInt(group, 16));
	return groups.length === 8 && groups.every((group) => Number.isInteger(group)) ? groups : null;
}

function embeddedIpv4(high: number, low: number): number[] {
	return [high >> 8, high & 0xff, low >> 8, low & 0xff];
}

function classifyIpv6(groups: readonly number[]): AddressClass {
	const [g0 = 0, g1 = 0, g2 = 0, g3 = 0, g4 = 0, g5 = 0, g6 = 0, g7 = 0] = groups;
	const firstSixAreZero = g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0;
	if (firstSixAreZero && g6 === 0 && g7 === 0) return "unspecified";
	if (firstSixAreZero && g6 === 0 && g7 === 1) return "loopback";
	// EN: Some IPv6 addresses are only a wrapper around an IPv4 address: the IPv4-mapped form
	//     (::ffff:a.b.c.d) and the NAT64 prefix (64:ff9b::/96). The connection ends at the IPv4
	//     address inside, so that is the one to judge. Forgetting this is a classic hole:
	//     ::ffff:127.0.0.1 is loopback written in IPv6 clothes.
	// PT: Alguns endereços IPv6 são só um embrulho em volta de um endereço IPv4: a forma
	//     IPv4-mapeada (::ffff:a.b.c.d) e o prefixo NAT64 (64:ff9b::/96). A conexão termina no
	//     endereço IPv4 de dentro, então é ele que deve ser julgado. Esquecer disso é um furo
	//     clássico: ::ffff:127.0.0.1 é loopback vestido de IPv6.
	const isMapped = g0 === 0 && g1 === 0 && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0xffff;
	const isNat64 = g0 === 0x64 && g1 === 0xff9b && g2 === 0 && g3 === 0 && g4 === 0 && g5 === 0;
	if (isMapped || isNat64) return classifyIpv4(embeddedIpv4(g6, g7));
	if ((g0 & 0xfe00) === 0xfc00) return "private";
	if ((g0 & 0xffc0) === 0xfe80) return "link-local";
	if ((g0 & 0xff00) === 0xff00) return "reserved";
	return "public";
}

export function classifyAddress(address: string): AddressClass {
	const ipv4 = parseIpv4(address);
	if (ipv4 !== null) {
		return classifyIpv4(ipv4);
	}
	const ipv6 = parseIpv6(address);
	return ipv6 === null ? "invalid" : classifyIpv6(ipv6);
}

// EN: The rule is an allow-list of ONE class: only "public" passes. Listing what is forbidden
//     would let through whatever the list forgot.
// PT: A regra é uma lista de permissão de UMA classe: só "public" passa. Listar o que é proibido
//     deixaria passar tudo o que a lista esqueceu.
export function isAddressAllowed(address: string): boolean {
	return classifyAddress(address) === "public";
}
