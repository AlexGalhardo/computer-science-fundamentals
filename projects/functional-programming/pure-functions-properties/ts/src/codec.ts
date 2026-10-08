// EN: Run-length encoding: "aaabcc" becomes "3a1b2c". The input may contain any character
//     except digits, which the encoded form reserves for the counts.
// PT: Codificação run-length: "aaabcc" vira "3a1b2c". A entrada pode conter qualquer
//     caractere exceto dígitos, que a forma codificada reserva para as contagens.

// EN: A pipeline: the regular expression cuts the text into runs (one character followed by
//     any number of copies of itself), and each run is written as its length followed by its
//     character. It is the same shape as the Elixir version, which groups with
//     `Enum.chunk_by/2`.
// PT: Um pipeline: a expressão regular corta o texto em sequências (um caractere seguido de
//     qualquer número de cópias dele mesmo), e cada sequência é escrita como o seu comprimento
//     seguido do seu caractere. É o mesmo formato da versão em Elixir, que agrupa com
//     `Enum.chunk_by/2`.
export function encode(text: string): string {
	return (text.match(/(.)\1*/gs) ?? []).map((run) => `${run.length}${run.charAt(0)}`).join("");
}

// EN: `\d+` reads a count with any number of digits, so a run of 10 or more decodes
//     correctly.
// PT: `\d+` lê uma contagem com qualquer número de dígitos, então uma sequência de 10 ou
//     mais é decodificada corretamente.
export function decode(encoded: string): string {
	return [...encoded.matchAll(/(\d+)(\D)/g)]
		.map(([, count, letter]) => (letter ?? "").repeat(Number(count)))
		.join("");
}

// EN: SEEDED BUG, kept on purpose. `\d` reads a single digit, so "10a" is read as the pair
//     "0a" and the run disappears. Every example with runs shorter than 10 still passes,
//     which is why the example tests do not notice it and the round-trip property does.
// PT: ERRO PLANTADO, mantido de propósito. `\d` lê um único dígito, então "10a" é lido como
//     o par "0a" e a sequência desaparece. Todo exemplo com sequências menores que 10
//     continua passando, e é por isso que os testes com exemplos não percebem o erro e a
//     propriedade de ida e volta percebe.
export function decodeBuggy(encoded: string): string {
	return [...encoded.matchAll(/(\d)(\D)/g)].map(([, count, letter]) => (letter ?? "").repeat(Number(count))).join("");
}
