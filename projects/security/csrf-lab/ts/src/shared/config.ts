// EN: Everything here is obviously fake: the user, the password and the e-mail addresses exist
//     only inside this lab. `.example` is a top-level domain reserved for documentation, so no
//     address below can ever belong to a real person.
// PT: Tudo aqui é obviamente falso: o usuário, a senha e os e-mails existem apenas dentro deste
//     laboratório. `.example` é um domínio de topo reservado para documentação, então nenhum
//     endereço abaixo pode pertencer a uma pessoa real.
// ES: Todo lo de aquí es obviamente falso: el usuario, la contraseña y los correos existen solo dentro de este
//     laboratorio. `.example` es un dominio de nivel superior reservado para documentación, así que ninguna
//     dirección de abajo puede pertenecer a una persona real.
export const FAKE_USER = {
	username: "alice-fake",
	password: "lab-fake-password",
	initialEmail: "alice-fake@lab.example",
} as const;

export const FORGED_EMAIL = "mallory-fake@forged.example";
export const LEGITIMATE_NEW_EMAIL = "alice-new-fake@lab.example";

export const SESSION_COOKIE = "lab_session";
export const APP_PORT = 3000;

// EN: The only hosts the forging page is able to target: the app containers of this compose
//     file. A host name with no dot only resolves inside the Docker network of the lab.
// PT: Os únicos hosts que a página forjadora consegue atingir: os contêineres de app deste
//     compose. Um nome de host sem ponto só é resolvido dentro da rede Docker do laboratório.
// ES: Los únicos hosts que la página falsificadora puede alcanzar: los contenedores de app de este
//     compose. Un nombre de host sin punto solo se resuelve dentro de la red Docker del laboratorio.
export const LAB_APP_HOSTS = ["app-vulnerable", "app-fixed", "app-token-only", "app-samesite-only"] as const;
export type LabAppHost = (typeof LAB_APP_HOSTS)[number];

export function appUrl(host: LabAppHost): string {
	return `http://${host}:${APP_PORT}`;
}
