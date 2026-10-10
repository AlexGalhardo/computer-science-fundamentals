import { createHash } from "node:crypto";

// EN: A cryptographic hash turns any text into a fixed 256-bit fingerprint (64 hexadecimal
//     digits). The same input always gives the same digest, and changing one character changes
//     the whole digest, so nobody can adjust the input "a little" to reach a wanted hash.
//     Everything else in this project (transaction ids, the Merkle root, block links and proof
//     of work) is built on this one function.
// PT: Um hash criptográfico transforma qualquer texto em uma impressão digital fixa de 256 bits
//     (64 dígitos hexadecimais). A mesma entrada sempre dá o mesmo digest, e trocar um caractere
//     muda o digest inteiro, então ninguém consegue ajustar a entrada "um pouco" para chegar a
//     um hash desejado. Todo o resto deste projeto (ids de transação, raiz de Merkle, ligação
//     entre blocos e prova de trabalho) é construído sobre esta única função.
// ES: Un hash criptográfico transforma cualquier texto en una huella digital fija de 256 bits
//     (64 dígitos hexadecimales). La misma entrada siempre da el mismo digest, y cambiar un
//     carácter cambia el digest entero, así que nadie puede ajustar la entrada "un poco" para
//     llegar a un hash deseado. Todo lo demás en este proyecto (ids de transacción, raíz de
//     Merkle, enlace entre bloques y prueba de trabajo) se construye sobre esta única función.
export function sha256Hex(data: string): string {
	return createHash("sha256").update(data, "utf8").digest("hex");
}
