import { LANGUAGES, type Language } from "../content/schema";
import { type Dictionary, en } from "./en";
import { es } from "./es";
import { pt } from "./pt";

const dictionaries: Record<Language, Dictionary> = { en, pt, es };

export function getDictionary(language: Language): Dictionary {
	return dictionaries[language];
}

export function isLanguage(value: string): value is Language {
	return (LANGUAGES as readonly string[]).includes(value);
}

/** Replaces `{name}` placeholders in a dictionary text. */
export function format(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}

/** Main repository of the project, linked from the header. */
export const REPOSITORY_URL = "https://github.com/AlexGalhardo/computer-science-fundamentals";

export const LANGUAGE_KEY = "quiz.lang";
export const THEME_KEY = "quiz.theme";
/** BCP 47 tag written on <html lang>, so screen readers pick the right voice. */
export const HTML_LANG: Record<Language, string> = { en: "en", pt: "pt-BR", es: "es" };
export const LANGUAGE_NAMES: Record<Language, string> = { en: "English", pt: "Português", es: "Español" };

export type { Dictionary };
