// EN: One pre-rendered page per language, and one per area in each language. Unknown params are
//     not generated, so the host answers them with `404.html`.
// PT: Uma página pré-renderizada por idioma, e uma por área em cada idioma. Parâmetros
//     desconhecidos não são gerados, então o host responde com `404.html`.
// ES: Una página pre-renderizada por idioma, y una por área en cada idioma. Los parámetros
//     desconocidos no se generan, así que el host responde con `404.html`.

import { LANGUAGES } from "../content/schema";
import { getAreas } from "./content";

export function languagePaths(): { params: { lang: string } }[] {
	return LANGUAGES.map((lang) => ({ params: { lang } }));
}

export function areaPaths(): { params: { lang: string; area: string } }[] {
	return LANGUAGES.flatMap((lang) => getAreas().map((area) => ({ params: { lang, area: area.slug } })));
}
