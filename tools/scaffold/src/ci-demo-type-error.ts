// EN: Demonstration change. The file is well formatted, so Biome accepts it, but the function
//     promises a number and returns the text it received. Only the type checker sees that.
// PT: Mudança de demonstração. O arquivo está bem formatado, então o Biome aceita, mas a função
//     promete um número e devolve o texto que recebeu. Só o verificador de tipos enxerga isso.
// ES: Cambio de demostración. El archivo está bien formateado, así que Biome lo acepta, pero la
//     función promete un número y devuelve el texto que recibió. Solo el verificador de tipos lo ve.
export function parsePort(value: string): number {
	return value;
}
