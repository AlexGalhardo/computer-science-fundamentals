// EN: The demo and the browser tests only ever talk to the two apps of this lab. The address
//     comes from an environment variable with a local default, and anything that is not a lab
//     host is refused before a single request is sent.
// PT: A demo e os testes de navegador só conversam com os dois apps deste laboratório. O endereço
//     vem de uma variável de ambiente com padrão local, e tudo que não for um host do laboratório
//     é recusado antes de qualquer requisição ser enviada.
// ES: La demo y las pruebas de navegador solo hablan con las dos apps de este laboratorio. La dirección
//     viene de una variable de entorno con valor por defecto local, y todo lo que no sea un host del laboratorio
//     se rechaza antes de que se envíe cualquier solicitud.

const LAB_HOSTS: readonly string[] = ["vulnerable", "fixed", "localhost", "127.0.0.1"];

export interface LabTargets {
	vulnerable: string;
	fixed: string;
}

export function assertLabUrl(raw: string): string {
	const url = new URL(raw);
	if (url.protocol !== "http:" || !LAB_HOSTS.includes(url.hostname)) {
		throw new Error(`Refusing to use "${raw}": only the lab hosts are allowed (${LAB_HOSTS.join(", ")})`);
	}
	return url.origin;
}

export function loadLabTargets(env: Record<string, string | undefined>): LabTargets {
	return {
		vulnerable: assertLabUrl(env.VULNERABLE_URL ?? "http://vulnerable:3000"),
		fixed: assertLabUrl(env.FIXED_URL ?? "http://fixed:3000"),
	};
}
