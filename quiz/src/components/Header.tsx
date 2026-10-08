"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LANGUAGES, type Language } from "@/content/schema";
import { type Dictionary, LANGUAGE_KEY, LANGUAGE_NAMES, REPOSITORY_URL, THEME_KEY } from "@/i18n";

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

// EN: Every page exists at the same path in every language, so switching language is a link
//     to the same path with the other prefix. The run of the quiz is stored by question id,
//     not by text, so the same question and the chosen answer are still there after the switch.
// PT: Toda página existe no mesmo caminho em todos os idiomas, então trocar de idioma é um link
//     para o mesmo caminho com o outro prefixo. A rodada do quiz é guardada por id de questão,
//     não por texto, então a mesma questão e a resposta escolhida continuam lá depois da troca.
// ES: Cada página existe en la misma ruta en todos los idiomas, así que cambiar de idioma es un
//     enlace a la misma ruta con otro prefijo. La ronda del quiz se guarda por id de pregunta,
//     no por texto, así que la misma pregunta y la respuesta elegida siguen ahí tras el cambio.
function LanguageSwitch({ language, dictionary }: { language: Language; dictionary: Dictionary }) {
	const pathname = usePathname();
	const rest = pathname.replace(/^\/(en|pt|es)(?=\/|$)/, "");

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

// EN: A plain external link: `target="_blank"` opens a new tab, and `rel="noopener noreferrer"`
//     stops the new page from reaching back to this one through `window.opener`.
// PT: Um link externo simples: `target="_blank"` abre uma nova aba, e `rel="noopener noreferrer"`
//     impede a nova página de alcançar esta de volta por `window.opener`.
// ES: Un enlace externo simple: `target="_blank"` abre una pestaña nueva, y `rel="noopener noreferrer"`
//     impide que la nueva página acceda de vuelta a esta mediante `window.opener`.
function SourceCodeLink({ dictionary }: { dictionary: Dictionary }) {
	return (
		<a
			href={REPOSITORY_URL}
			target="_blank"
			rel="noopener noreferrer"
			data-testid="source-code"
			title={dictionary.sourceCode.title}
			className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium"
		>
			<svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
				<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
			</svg>
			<span className="hidden sm:inline">{dictionary.sourceCode.label}</span>
			<span className="sr-only sm:hidden">{dictionary.sourceCode.label}</span>
		</a>
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
					<SourceCodeLink dictionary={dictionary} />
					<LanguageSwitch language={language} dictionary={dictionary} />
					<ThemeToggle dictionary={dictionary} />
				</div>
			</div>
		</header>
	);
}
