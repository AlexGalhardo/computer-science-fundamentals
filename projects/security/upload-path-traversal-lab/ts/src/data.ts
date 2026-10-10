// EN: Fake data shared by both versions of the lab: two fake users with fake session tokens, the
//     fake secret that lives OUTSIDE the upload folder, and a few tiny sample files. Nothing here
//     is real, and nothing here is a security decision.
// PT: Dados falsos compartilhados pelas duas versões do laboratório: dois usuários falsos com
//     tokens de sessão falsos, o segredo falso que fica FORA da pasta de uploads, e alguns
//     arquivos de exemplo minúsculos. Nada aqui é real, e nada aqui é uma decisão de segurança.
// ES: Datos falsos compartidos por las dos versiones del laboratorio: dos usuarios falsos con
//     tokens de sesión falsos, el secreto falso que queda FUERA de la carpeta de cargas, y algunos
//     archivos de ejemplo minúsculos. Nada aquí es real, y nada aquí es una decisión de seguridad.

export const TOKENS = {
	alice: "FAKE-TOKEN-alice-not-real",
	bob: "FAKE-TOKEN-bob-not-real",
} as const;

const USERS_BY_TOKEN: ReadonlyMap<string, string> = new Map([
	[TOKENS.alice, "alice-fake"],
	[TOKENS.bob, "bob-fake"],
]);

// EN: Authentication is not the subject of this lab, so it is the simplest thing that works: a
//     fixed token in the `Authorization` header maps to a fake user name.
// PT: Autenticação não é o assunto deste laboratório, então é a coisa mais simples que funciona:
//     um token fixo no cabeçalho `Authorization` corresponde a um nome de usuário falso.
// ES: La autenticación no es el tema de este laboratorio, así que es lo más simple que funciona:
//     un token fijo en la cabecera `Authorization` corresponde a un nombre de usuario falso.
export function authenticate(header: string | null): string | null {
	if (header === null || !header.startsWith("Bearer ")) return null;
	return USERS_BY_TOKEN.get(header.slice("Bearer ".length)) ?? null;
}

// EN: The file the server never meant to hand out. The lab creates it in a temporary folder next
//     to the upload folder. It stands for a configuration file or a key, and it is not one.
// PT: O arquivo que o servidor nunca quis entregar. O laboratório o cria em uma pasta temporária
//     ao lado da pasta de uploads. Ele representa um arquivo de configuração ou uma chave, e não
//     é nenhum dos dois.
// ES: El archivo que el servidor nunca quiso entregar. El laboratorio lo crea en una carpeta temporal
//     junto a la carpeta de cargas. Representa un archivo de configuración o una clave, y no
//     es ninguno de los dos.
export const SECRET_FILE_NAME = "FAKE-SECRET.txt";
export const SECRET_CONTENT = "FAKE-SECRET-not-real";

const encoder = new TextEncoder();

export function textBytes(text: string): Uint8Array {
	return encoder.encode(text);
}

// EN: Sample files. A PNG always starts with the same 8 bytes and a PDF with `%PDF-`. These are
//     not complete, viewable files: only the leading bytes matter for the lesson.
// PT: Arquivos de exemplo. Um PNG sempre começa com os mesmos 8 bytes e um PDF com `%PDF-`. Não
//     são arquivos completos e visualizáveis: só os primeiros bytes importam para a lição.
// ES: Archivos de ejemplo. Un PNG siempre empieza con los mismos 8 bytes y un PDF con `%PDF-`. No
//     son archivos completos ni visualizables: solo los primeros bytes importan para la lección.
export const SAMPLE_PNG: Uint8Array = new Uint8Array([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);
export const SAMPLE_PDF: Uint8Array = textBytes("%PDF-1.7\n% FAKE lab document, not a real PDF\n");
export const SAMPLE_TEXT: Uint8Array = textBytes("alice-fake: fake quarterly report\n");

// EN: A harmless HTML page with no script. It stands for "content a browser would render as a
//     page" when the server lets the uploader choose the type.
// PT: Uma página HTML inofensiva, sem script. Ela representa "conteúdo que um navegador
//     renderizaria como página" quando o servidor deixa quem envia escolher o tipo.
// ES: Una página HTML inofensiva, sin script. Representa "contenido que un navegador
//     renderizaría como página" cuando el servidor deja que quien envía elija el tipo.
export const SAMPLE_HTML: Uint8Array = textBytes(
	"<!doctype html><title>FAKE</title><p>FAKE page from the lab, not an image</p>",
);
