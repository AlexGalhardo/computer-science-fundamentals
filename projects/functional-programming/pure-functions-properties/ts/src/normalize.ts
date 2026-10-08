// EN: Turns a product name typed by a person into a code: no spaces around it, upper case,
//     and each run of white space replaced by one hyphen. A normaliser should be idempotent:
//     normalising an already normal value changes nothing, so it is safe to apply it again
//     at every layer.
// PT: Transforma um nome de produto digitado por uma pessoa em um código: sem espaços em
//     volta, em maiúsculas, e com cada sequência de espaços em branco trocada por um hífen.
//     Um normalizador deve ser idempotente: normalizar um valor já normal não muda nada,
//     então é seguro aplicá-lo de novo em cada camada.
export function normalizeCode(name: string): string {
	return name.trim().toUpperCase().replace(/\s+/g, "-");
}
