// EN: THE FIX, part 1: the canonical path check. "Canonical" means the one final form of a path,
//     after every `.` and `..` was applied and every symbolic link was followed. The rule is to
//     compare canonical paths, never the text that arrived: first compute where the path really
//     ends, then ask whether that place is inside the allowed folder.
// PT: A CORREÇÃO, parte 1: a verificação de caminho canônico. "Canônico" é a forma final única de
//     um caminho, depois de aplicar todo `.` e `..` e de seguir todo link simbólico. A regra é
//     comparar caminhos canônicos, nunca o texto que chegou: primeiro calcule onde o caminho
//     realmente termina, depois pergunte se esse lugar está dentro da pasta permitida.
// ES: LA CORRECCIÓN, parte 1: la verificación de ruta canónica. "Canónica" es la forma final única de
//     una ruta, después de aplicar todo `.` y `..` y de seguir todo enlace simbólico. La regla es
//     comparar rutas canónicas, nunca el texto que llegó: primero calcula dónde la ruta
//     realmente termina, luego pregunta si ese lugar está dentro de la carpeta permitida.

import { realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";

// EN: The separator is appended before comparing. Without it, `/data/uploads-old/x` would pass as
//     "starts with /data/uploads", although it is a different folder.
// PT: O separador é acrescentado antes de comparar. Sem ele, `/data/uploads-old/x` passaria como
//     "começa com /data/uploads", embora seja outra pasta.
// ES: El separador se añade antes de comparar. Sin él, `/data/uploads-old/x` pasaría como
//     "empieza con /data/uploads", aunque sea otra carpeta.
function isInside(root: string, candidate: string): boolean {
	return candidate.startsWith(root + sep);
}

// EN: Step 1, pure text: `resolve` applies every `..`, and the result must still be inside the
//     root. Returns `null` when the name walks out (or is the root itself).
// PT: Passo 1, só texto: `resolve` aplica todo `..`, e o resultado ainda precisa estar dentro da
//     raiz. Devolve `null` quando o nome sai da pasta (ou é a própria raiz).
// ES: Paso 1, solo texto: `resolve` aplica todo `..`, y el resultado aún debe estar dentro de la
//     raíz. Devuelve `null` cuando el nombre sale de la carpeta (o es la propia raíz).
export function resolveInsideRoot(root: string, name: string): string | null {
	const base = resolve(root);
	const candidate = resolve(base, name);
	return isInside(base, candidate) ? candidate : null;
}

// EN: Step 2, the disk: a path can look innocent as text and still be a symbolic link that points
//     somewhere else. `realpath` asks the operating system where the path really ends, and the
//     same question is asked again. The root goes through `realpath` too, because the root itself
//     may sit behind a link. Any failure (the file does not exist, a broken link) means "no":
//     deny by default. The caller must read the path RETURNED here, not the one it passed in.
//     Limit of the lab: between this check and the read there is a tiny window in which the file
//     could be swapped (a race known as TOCTOU). The real defence is that only the server writes
//     in this folder, under names it generated.
// PT: Passo 2, o disco: um caminho pode parecer inocente como texto e ainda ser um link simbólico
//     que aponta para outro lugar. `realpath` pergunta ao sistema operacional onde o caminho
//     realmente termina, e a mesma pergunta é feita de novo. A raiz também passa por `realpath`,
//     porque a própria raiz pode estar atrás de um link. Qualquer falha (o arquivo não existe, um
//     link quebrado) significa "não": negar por padrão. Quem chama deve ler o caminho DEVOLVIDO
//     aqui, não o que passou. Limite do laboratório: entre esta verificação e a leitura existe
//     uma janela minúscula em que o arquivo poderia ser trocado (uma corrida conhecida como
//     TOCTOU). A defesa de verdade é que só o servidor escreve nesta pasta, com nomes que ele gerou.
// ES: Paso 2, el disco: una ruta puede parecer inocente como texto y aun así ser un enlace simbólico
//     que apunta a otro lugar. `realpath` pregunta al sistema operativo dónde la ruta
//     realmente termina, y se hace la misma pregunta de nuevo. La raíz también pasa por `realpath`,
//     porque la propia raíz puede estar detrás de un enlace. Cualquier fallo (el archivo no existe, un
//     enlace roto) significa "no": negar por defecto. Quien llama debe leer la ruta DEVUELTA
//     aquí, no la que pasó. Límite del laboratorio: entre esta verificación y la lectura existe
//     una ventana minúscula en la que el archivo podría cambiarse (una carrera conocida como
//     TOCTOU). La defensa de verdad es que solo el servidor escribe en esta carpeta, con nombres que él generó.
export async function realPathInsideRoot(root: string, name: string): Promise<string | null> {
	const candidate = resolveInsideRoot(root, name);
	if (candidate === null) return null;
	try {
		const [realRoot, realCandidate] = await Promise.all([realpath(root), realpath(candidate)]);
		return isInside(realRoot, realCandidate) ? realCandidate : null;
	} catch {
		return null;
	}
}
