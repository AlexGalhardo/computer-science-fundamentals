// EN: SMELL: Shotgun Surgery (file 3 of 3). And a third copy, split by hand.
// PT: MAU CHEIRO: Cirurgia com Espingarda (arquivo 3 de 3). E uma terceira cópia, separada à
//     mão.
export function reportRow(label: string, cents: number): string {
	const text = (cents / 100).toFixed(2);
	const [whole = "0", fraction = "00"] = text.split(".");
	const groups: string[] = [];
	for (let end = whole.length; end > 0; end -= 3) {
		groups.unshift(whole.slice(Math.max(0, end - 3), end));
	}
	return `${label.padEnd(12, ".")} R$ ${groups.join(".")},${fraction}`;
}
