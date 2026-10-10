// EN: The master theorem as a function. It solves recurrences of divide and conquer algorithms,
//     T(n) = a * T(n / b) + f(n): the problem is split into `a` subproblems of size n / b, and
//     f(n) is the work done outside the recursive calls (splitting and combining).
//     Here f(n) = n^d * (log n)^k, which covers the driving functions found in practice.
// PT: O teorema mestre como uma função. Ele resolve recorrências de algoritmos de divisão e
//     conquista, T(n) = a * T(n / b) + f(n): o problema é dividido em `a` subproblemas de tamanho
//     n / b, e f(n) é o trabalho feito fora das chamadas recursivas (dividir e combinar).
//     Aqui f(n) = n^d * (log n)^k, que cobre as funções encontradas na prática.
// ES: El teorema maestro como una función. Resuelve recurrencias de algoritmos de divide y
//     vencerás, T(n) = a * T(n / b) + f(n): el problema se divide en `a` subproblemas de tamaño
//     n / b, y f(n) es el trabajo hecho fuera de las llamadas recursivas (dividir y combinar).
//     Aquí f(n) = n^d * (log n)^k, que cubre las funciones que se encuentran en la práctica.

import { z } from "zod";

// EN: The theorem has hypotheses, and input from outside (the command line) is checked against
//     them before anything is computed: at least one subproblem, and a size that really shrinks.
// PT: O teorema tem hipóteses, e a entrada externa (a linha de comando) é conferida com elas
//     antes de qualquer cálculo: pelo menos um subproblema, e um tamanho que realmente diminui.
// ES: El teorema tiene hipótesis, y la entrada externa (la línea de comandos) se comprueba contra
//     ellas antes de cualquier cálculo: al menos un subproblema, y un tamaño que realmente disminuye.
export const recurrenceSchema = z.object({
	a: z.number().int().min(1, "a must be at least 1: there is at least one subproblem"),
	b: z.number().gt(1, "b must be greater than 1: the subproblems must be smaller than the problem"),
	d: z.number().min(0, "d must not be negative"),
	k: z.number().int().default(0),
});

export type RecurrenceInput = z.input<typeof recurrenceSchema>;
export type Recurrence = z.output<typeof recurrenceSchema>;

export type MasterCase = "case-1" | "case-2" | "case-3" | "not-applicable";

export interface Classification {
	recurrence: Recurrence;
	/** log_b(a): the exponent of the cost of the leaves of the recursion tree. */
	criticalExponent: number;
	case: MasterCase;
	/** The solution in Theta notation, or null when the basic theorem gives none. */
	solution: string | null;
	/** Why this case was chosen, in English, in Portuguese and in Spanish. */
	reason: { en: string; pt: string; es: string };
	/** What the extended case 2 gives when the basic theorem does not apply, if it gives anything. */
	extendedSolution: string | null;
}

function formatExponent(value: number): string {
	return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

// EN: Writes n^p * (log n)^q the way a person would: no n^0, no exponent 1.
// PT: Escreve n^p * (log n)^q como uma pessoa escreveria: sem n^0 e sem expoente 1.
// ES: Escribe n^p * (log n)^q como lo escribiría una persona: sin n^0 y sin exponente 1.
export function formatGrowth(power: number, logPower: number): string {
	const parts: string[] = [];
	if (power !== 0) {
		parts.push(power === 1 ? "n" : `n^${formatExponent(power)}`);
	}
	if (logPower !== 0) {
		parts.push(logPower === 1 ? "log n" : `log^${formatExponent(logPower)} n`);
	}
	return parts.length === 0 ? "1" : parts.join(" ");
}

export function formatRecurrence(recurrence: Recurrence): string {
	const calls = recurrence.a === 1 ? "T" : `${recurrence.a}T`;
	return `T(n) = ${calls}(n/${recurrence.b}) + ${formatGrowth(recurrence.d, recurrence.k)}`;
}

// EN: log_b(a) is computed with floating point, so log_2(8) may come out as 2.9999999999999996.
//     Two exponents closer than this are treated as equal.
// PT: log_b(a) é calculado em ponto flutuante, então log_2(8) pode sair como 2.9999999999999996.
//     Dois expoentes mais próximos que isto são tratados como iguais.
// ES: log_b(a) se calcula con punto flotante, así que log_2(8) puede salir como 2.9999999999999996.
//     Dos exponentes más cercanos que esto se tratan como iguales.
const EPSILON = 1e-9;

// EN: The whole theorem is one comparison: f(n) against n^(log_b a), the cost of the leaves.
//     Case 1: f is polynomially smaller, the leaves dominate, T(n) = Theta(n^(log_b a)).
//     Case 2: both have the same order, every level costs the same, and there are log n levels.
//     Case 3: f is polynomially larger, the root dominates, T(n) = Theta(f(n)).
//     "Polynomially" means by a factor n^epsilon. A difference of only a log factor falls in the
//     gap between the cases, and there the basic theorem says nothing.
// PT: O teorema inteiro é uma comparação: f(n) contra n^(log_b a), o custo das folhas.
//     Caso 1: f é polinomialmente menor, as folhas dominam, T(n) = Theta(n^(log_b a)).
//     Caso 2: as duas têm a mesma ordem, todo nível custa o mesmo, e há log n níveis.
//     Caso 3: f é polinomialmente maior, a raiz domina, T(n) = Theta(f(n)).
//     "Polinomialmente" significa por um fator n^epsilon. Uma diferença de apenas um fator log
//     cai na lacuna entre os casos, e ali o teorema básico não diz nada.
// ES: El teorema entero es una comparación: f(n) contra n^(log_b a), el costo de las hojas.
//     Caso 1: f es polinomialmente menor, las hojas dominan, T(n) = Theta(n^(log_b a)).
//     Caso 2: las dos tienen el mismo orden, cada nivel cuesta lo mismo, y hay log n niveles.
//     Caso 3: f es polinomialmente mayor, la raíz domina, T(n) = Theta(f(n)).
//     "Polinomialmente" significa por un factor n^epsilon. Una diferencia de solo un factor log
//     cae en la brecha entre los casos, y ahí el teorema básico no dice nada.
export function classify(input: RecurrenceInput): Classification {
	const recurrence = recurrenceSchema.parse(input);
	const { a, b, d, k } = recurrence;
	const rawExponent = Math.log(a) / Math.log(b);
	const nearest = Math.round(rawExponent);
	const criticalExponent = Math.abs(rawExponent - nearest) < EPSILON ? nearest : rawExponent;
	const critical = formatGrowth(criticalExponent, 0);
	const f = formatGrowth(d, k);
	const base = { recurrence, criticalExponent };

	if (d < criticalExponent - EPSILON) {
		return {
			...base,
			case: "case-1",
			solution: `Θ(${critical})`,
			reason: {
				en: `f(n) = ${f} is polynomially smaller than ${critical}, so the leaves of the recursion tree dominate.`,
				pt: `f(n) = ${f} é polinomialmente menor que ${critical}, então as folhas da árvore de recursão dominam.`,
				es: `f(n) = ${f} es polinomialmente menor que ${critical}, así que las hojas del árbol de recursión dominan.`,
			},
			extendedSolution: null,
		};
	}
	if (d > criticalExponent + EPSILON) {
		// EN: Case 3 also needs the regularity condition a * f(n/b) <= c * f(n) with c < 1.
		//     For f(n) = n^d * log^k n it always holds here: a * f(n/b) is about (a / b^d) * f(n),
		//     and a / b^d < 1 exactly because d > log_b a.
		// PT: O caso 3 também exige a condição de regularidade a * f(n/b) <= c * f(n) com c < 1.
		//     Para f(n) = n^d * log^k n ela sempre vale aqui: a * f(n/b) é cerca de
		//     (a / b^d) * f(n), e a / b^d < 1 justamente porque d > log_b a.
		// ES: El caso 3 también exige la condición de regularidad a * f(n/b) <= c * f(n) con c < 1.
		//     Para f(n) = n^d * log^k n aquí siempre se cumple: a * f(n/b) es aproximadamente
		//     (a / b^d) * f(n), y a / b^d < 1 justamente porque d > log_b a.
		return {
			...base,
			case: "case-3",
			solution: `Θ(${f})`,
			reason: {
				en: `f(n) = ${f} is polynomially larger than ${critical}, so the root of the recursion tree dominates.`,
				pt: `f(n) = ${f} é polinomialmente maior que ${critical}, então a raiz da árvore de recursão domina.`,
				es: `f(n) = ${f} es polinomialmente mayor que ${critical}, así que la raíz del árbol de recursión domina.`,
			},
			extendedSolution: null,
		};
	}
	if (k === 0) {
		return {
			...base,
			case: "case-2",
			solution: `Θ(${formatGrowth(d, 1)})`,
			reason: {
				en: `f(n) = ${f} has the same order as ${critical}, so every level costs the same and there are log n levels.`,
				pt: `f(n) = ${f} tem a mesma ordem de ${critical}, então todo nível custa o mesmo e há log n níveis.`,
				es: `f(n) = ${f} tiene el mismo orden que ${critical}, así que cada nivel cuesta lo mismo y hay log n niveles.`,
			},
			extendedSolution: null,
		};
	}
	// EN: The extended case 2 covers a positive power of the logarithm: one more log factor.
	//     It gives nothing for a negative power such as n / log n, so that stays unsolved here.
	// PT: O caso 2 estendido cobre uma potência positiva do logaritmo: mais um fator log.
	//     Ele não dá nada para uma potência negativa como n / log n, que aqui fica sem solução.
	// ES: El caso 2 extendido cubre una potencia positiva del logaritmo: un factor log más.
	//     No da nada para una potencia negativa como n / log n, que aquí queda sin solución.
	return {
		...base,
		case: "not-applicable",
		solution: null,
		reason: {
			en: `f(n) = ${f} differs from ${critical} only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.`,
			pt: `f(n) = ${f} difere de ${critical} apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui.`,
			es: `f(n) = ${f} difiere de ${critical} solo por un factor logarítmico, que no es polinomialmente menor ni mayor: los tres casos básicos dejan una brecha aquí.`,
		},
		extendedSolution: k > 0 ? `Θ(${formatGrowth(d, k + 1)})` : null,
	};
}
