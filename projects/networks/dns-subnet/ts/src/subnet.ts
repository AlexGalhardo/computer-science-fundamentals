// EN: Subnet calculator for IPv4. An address is a 32-bit number, a prefix /n says that the first
//     n bits name the network and the remaining 32 - n bits name the host inside it. Everything
//     below is bit arithmetic on that one number.
// PT: Calculadora de sub-redes IPv4. Um endereço é um número de 32 bits, um prefixo /n diz que os
//     primeiros n bits identificam a rede e os 32 - n bits restantes identificam a máquina dentro
//     dela. Tudo o que vem abaixo é aritmética de bits sobre esse único número.
// ES: Calculadora de subredes IPv4. Una dirección es un número de 32 bits, un prefijo /n dice que
//     los primeros n bits nombran la red y los 32 - n bits restantes nombran el host dentro de
//     ella. Todo lo que viene abajo es aritmética de bits sobre ese único número.

export interface Subnet {
	/** The address as given, for example 192.168.10.77. */
	address: string;
	prefix: number;
	mask: string;
	network: string;
	broadcast: string;
	firstHost: string;
	lastHost: string;
	/** Addresses that can be assigned to machines. */
	hosts: number;
}

/** Parses dotted decimal into an unsigned 32-bit number. */
export function parseIpv4(text: string): number {
	const parts = text.trim().split(".");
	if (parts.length !== 4) {
		throw new Error(`invalid IPv4 address: ${text}`);
	}
	let value = 0;
	for (const part of parts) {
		const octet = Number(part);
		if (!/^\d{1,3}$/.test(part) || octet > 255) {
			throw new Error(`invalid IPv4 address: ${text}`);
		}
		// EN: Multiplying instead of shifting keeps the number positive. In JavaScript the bitwise
		//     operators work on signed 32-bit integers, so 192 << 24 is negative.
		// PT: Multiplicar em vez de deslocar mantém o número positivo. Em JavaScript os operadores
		//     de bits trabalham com inteiros de 32 bits com sinal, então 192 << 24 é negativo.
		// ES: Multiplicar en lugar de desplazar mantiene el número positivo. En JavaScript los
		//     operadores de bits trabajan con enteros de 32 bits con signo, así que 192 << 24 es negativo.
		value = value * 256 + octet;
	}
	return value;
}

/** Formats an unsigned 32-bit number as dotted decimal. */
export function formatIpv4(value: number): string {
	return [24, 16, 8, 0].map((shift) => (value >>> shift) & 0xff).join(".");
}

/** Returns the mask of a prefix as an unsigned 32-bit number: n ones followed by zeros. */
export function maskOf(prefix: number): number {
	if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
		throw new Error(`invalid prefix length: ${prefix}`);
	}
	// EN: Two traps of JavaScript in one line. A shift count is taken modulo 32, so shifting by 32
	//     does nothing and /0 needs its own case. And the result of << is signed, so >>> 0 turns it
	//     back into an unsigned number.
	// PT: Duas armadilhas do JavaScript em uma linha. O número de posições de um deslocamento é
	//     tomado módulo 32, então deslocar 32 não faz nada e o /0 precisa de um caso próprio. E o
	//     resultado de << tem sinal, então >>> 0 o transforma de volta em número sem sinal.
	// ES: Dos trampas de JavaScript en una línea. El número de posiciones de un desplazamiento se
	//     toma módulo 32, así que desplazar 32 no hace nada y el /0 necesita un caso propio. Y el
	//     resultado de << tiene signo, así que >>> 0 lo convierte de nuevo en un número sin signo.
	return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

/** Describes the subnet that an address in CIDR notation, such as 192.168.10.77/26, belongs to. */
export function describe(cidr: string): Subnet {
	const [addressText, prefixText, ...rest] = cidr.trim().split("/");
	if (addressText === undefined || prefixText === undefined || rest.length > 0 || !/^\d{1,2}$/.test(prefixText)) {
		throw new Error(`invalid CIDR notation: ${cidr}`);
	}
	const prefix = Number(prefixText);
	const address = parseIpv4(addressText);
	const mask = maskOf(prefix);

	// EN: AND with the mask clears the host bits: that is the network address. OR with the
	//     inverted mask sets every host bit: that is the broadcast address.
	// PT: O E lógico com a máscara zera os bits de máquina: esse é o endereço da rede. O OU com a
	//     máscara invertida liga todos os bits de máquina: esse é o endereço de broadcast.
	// ES: El Y lógico con la máscara pone en cero los bits de host: esa es la dirección de la red. El
	//     O con la máscara invertida enciende todos los bits de host: esa es la dirección de broadcast.
	const network = (address & mask) >>> 0;
	const broadcast = (network | ~mask) >>> 0;
	const size = 2 ** (32 - prefix);

	// EN: Normally the first and the last address of the block are reserved (network and
	//     broadcast), which leaves size - 2 hosts. Two exceptions: a /31 is a point-to-point link
	//     where both addresses are usable (RFC 3021), and a /32 is a single machine.
	// PT: Normalmente o primeiro e o último endereço do bloco são reservados (rede e broadcast), o
	//     que deixa size - 2 máquinas. Duas exceções: um /31 é um enlace ponto a ponto em que os
	//     dois endereços são utilizáveis (RFC 3021), e um /32 é uma única máquina.
	// ES: Normalmente la primera y la última dirección del bloque están reservadas (red y
	//     broadcast), lo que deja size - 2 hosts. Dos excepciones: un /31 es un enlace punto a
	//     punto en el que ambas direcciones son utilizables (RFC 3021), y un /32 es un único host.
	const reserved = prefix >= 31 ? 0 : 1;
	return {
		address: formatIpv4(address),
		prefix,
		mask: formatIpv4(mask),
		network: formatIpv4(network),
		broadcast: formatIpv4(broadcast),
		firstHost: formatIpv4(network + reserved),
		lastHost: formatIpv4(broadcast - reserved),
		hosts: size - 2 * reserved,
	};
}

/** Tells whether an address belongs to the subnet of the given CIDR. */
export function contains(cidr: string, address: string): boolean {
	const subnet = describe(cidr);
	const mask = maskOf(subnet.prefix);
	return (parseIpv4(address) & mask) >>> 0 === parseIpv4(subnet.network);
}

/** Splits a block into equal subnets of a longer prefix, in order. */
export function split(cidr: string, newPrefix: number): string[] {
	const subnet = describe(cidr);
	if (!Number.isInteger(newPrefix) || newPrefix < subnet.prefix || newPrefix > 32) {
		throw new Error(`cannot split /${subnet.prefix} into /${newPrefix}`);
	}
	// EN: Each extra bit in the prefix halves the block, so k extra bits give 2^k subnets.
	// PT: Cada bit a mais no prefixo divide o bloco ao meio, então k bits a mais dão 2^k sub-redes.
	// ES: Cada bit extra en el prefijo divide el bloque a la mitad, así que k bits extra dan 2^k subredes.
	const count = 2 ** (newPrefix - subnet.prefix);
	if (count > 1024) {
		throw new Error(`splitting /${subnet.prefix} into /${newPrefix} would give ${count} subnets`);
	}
	const size = 2 ** (32 - newPrefix);
	const first = parseIpv4(subnet.network);
	return Array.from({ length: count }, (_, index) => `${formatIpv4(first + index * size)}/${newPrefix}`);
}
