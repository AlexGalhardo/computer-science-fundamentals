import { z } from "zod";

// EN: A seeded bug is a defect planted on purpose, to see which test suite notices it. There is
//     one per level of the pyramid, switched on by the SEEDED_BUG environment variable. With
//     "none" the application is correct. The value comes from outside the program, so it is
//     validated: a typo fails loudly instead of silently running the correct code.
// PT: Um bug semeado é um defeito plantado de propósito, para ver qual suíte de testes o percebe.
//     Há um por nível da pirâmide, ligado pela variável de ambiente SEEDED_BUG. Com "none" a
//     aplicação está correta. O valor vem de fora do programa, então é validado: um erro de
//     digitação falha de forma visível em vez de rodar o código correto em silêncio.
export const SEEDED_BUGS = ["none", "unit", "integration", "e2e", "smoke", "regression"] as const;

const seededBugSchema = z.enum(SEEDED_BUGS);

export type SeededBug = z.infer<typeof seededBugSchema>;

export function activeBug(): SeededBug {
	return seededBugSchema.parse(process.env.SEEDED_BUG ?? "none");
}

export function bugIs(bug: SeededBug): boolean {
	return activeBug() === bug;
}
