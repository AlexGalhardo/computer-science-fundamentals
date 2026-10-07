import type { ReactNode } from "react";
import { getAreas } from "@/lib/content";

export const dynamicParams = false;

// EN: One folder per area, pre-rendered. Declared in the layout so the three pages below it
//     (area, questions, result) are all generated for every area and every language.
// PT: Uma pasta por área, pré-renderizada. Declarado no layout para que as três páginas abaixo
//     dele (área, questões, resultado) sejam geradas para toda área e todo idioma.
export function generateStaticParams(): { area: string }[] {
	return getAreas().map((area) => ({ area: area.slug }));
}

export default function AreaLayout({ children }: { children: ReactNode }) {
	return children;
}
