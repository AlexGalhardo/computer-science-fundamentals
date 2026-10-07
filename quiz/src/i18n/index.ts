import { LANGUAGES, type Language } from "../content/schema";
import { type Dictionary, en } from "./en";
import { pt } from "./pt";

const dictionaries: Record<Language, Dictionary> = { en, pt };

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

export const LANGUAGE_KEY = "quiz.lang";
export const THEME_KEY = "quiz.theme";
export const LANGUAGE_NAMES: Record<Language, string> = { pt: "Português", en: "English" };

export type { Dictionary };
