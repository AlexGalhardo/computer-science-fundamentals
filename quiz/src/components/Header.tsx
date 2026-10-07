"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LANGUAGES, type Language } from "@/content/schema";
import { type Dictionary, LANGUAGE_KEY, LANGUAGE_NAMES, THEME_KEY } from "@/i18n";

type Theme = "light" | "dark";

// EN: The theme is already on <html> before React starts (see the script in the layout).
//     This component only reads it, flips it and remembers the choice.
// PT: O tema já está no <html> antes de o React começar (veja o script no layout). Este
//     componente só lê, alterna e guarda a escolha.
function ThemeToggle({ dictionary }: { dictionary: Dictionary }) {
	const [theme, setTheme] = useState<Theme | undefined>(undefined);

	useEffect(() => {
		setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
	}, []);

	function toggle(): void {
		const nextTheme: Theme = theme === "dark" ? "light" : "dark";
		document.documentElement.dataset.theme = nextTheme;
		try {
			localStorage.setItem(THEME_KEY, nextTheme);
		} catch {
			// EN: Storage can be blocked (private mode). The theme still changes for this visit.
			// PT: O storage pode estar bloqueado (modo privado). O tema ainda muda nesta visita.
		}
		setTheme(nextTheme);
	}

	return (
		<button
			type="button"
			data-testid="theme-toggle"
			data-keep-enter
			onClick={toggle}
			aria-label={theme === "dark" ? dictionary.theme.toLight : dictionary.theme.toDark}
			className="min-h-11 min-w-11 rounded-md border border-border bg-surface px-3 text-sm font-medium"
		>
			<span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>{" "}
			{theme === "dark" ? dictionary.theme.light : dictionary.theme.dark}
		</button>
	);
}

// EN: Every page exists at the same path in both languages, so switching language is a link
//     to the same path with the other prefix. The run of the quiz is stored by question id,
//     not by text, so the same question and the chosen answer are still there after the switch.
// PT: Toda página existe no mesmo caminho nos dois idiomas, então trocar de idioma é um link
//     para o mesmo caminho com o outro prefixo. A rodada do quiz é guardada por id de questão,
//     não por texto, então a mesma questão e a resposta escolhida continuam lá depois da troca.
function LanguageSwitch({ language, dictionary }: { language: Language; dictionary: Dictionary }) {
	const pathname = usePathname();
	const rest = pathname.replace(/^\/(pt|en)(?=\/|$)/, "");

	return (
		<nav aria-label={dictionary.language} className="flex overflow-hidden rounded-md border border-border">
			{LANGUAGES.map((option) => (
				<Link
					key={option}
					href={`/${option}${rest === "" ? "/" : rest}`}
					hrefLang={option}
					lang={option}
					data-testid={`lang-${option}`}
					aria-current={option === language ? "true" : undefined}
					onClick={() => {
						try {
							localStorage.setItem(LANGUAGE_KEY, option);
						} catch {
							// EN: Without storage the choice simply lasts for this visit.
							// PT: Sem storage, a escolha simplesmente vale só nesta visita.
						}
					}}
					className={`flex min-h-11 min-w-11 items-center justify-center px-3 text-sm font-medium ${
						option === language ? "bg-accent text-on-accent" : "bg-surface text-text"
					}`}
				>
					<span className="sr-only">{LANGUAGE_NAMES[option]}</span>
					<span aria-hidden="true">{option.toUpperCase()}</span>
				</Link>
			))}
		</nav>
	);
}

export function Header({ language, dictionary }: { language: Language; dictionary: Dictionary }) {
	return (
		<header className="border-b border-border bg-surface">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
				<Link href={`/${language}/`} className="flex min-h-11 items-center text-base font-bold">
					{dictionary.appName}
				</Link>
				<div className="flex items-center gap-2">
					<LanguageSwitch language={language} dictionary={dictionary} />
					<ThemeToggle dictionary={dictionary} />
				</div>
			</div>
		</header>
	);
}
