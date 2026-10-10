"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LANGUAGES, type Language } from "@/content/schema";
import { type Dictionary, LANGUAGE_KEY, LANGUAGE_NAMES, REPOSITORY_URL, THEME_KEY } from "@/i18n";
import { headerControl } from "./ui";

type Theme = "light" | "dark";

// EN: The theme is already on <html> before React starts (see the script in the layout).
//     This component only reads it, flips it and remembers the choice. It is a Base UI
//     `Toggle`: a button with two states. Base UI writes `aria-pressed` for screen readers and
//     `data-pressed` for the styles, so the name of the button never has to change: it is always
//     "dark theme", pressed or not.
// PT: O tema já está no <html> antes de o React começar (veja o script no layout). Este
//     componente só lê, alterna e guarda a escolha. Ele é um `Toggle` do Base UI: um botão com
//     dois estados. O Base UI escreve `aria-pressed` para leitores de tela e `data-pressed` para
//     os estilos, então o nome do botão nunca precisa mudar: é sempre "tema escuro", pressionado
//     ou não.
// ES: El tema ya está en <html> antes de que React arranque (mira el script en el layout). Este
//     componente solo lo lee, lo alterna y guarda la elección. Es un `Toggle` de Base UI: un
//     botón con dos estados. Base UI escribe `aria-pressed` para lectores de pantalla y
//     `data-pressed` para los estilos, así que el nombre del botón nunca tiene que cambiar: es
//     siempre "tema oscuro", presionado o no.
function ThemeToggle({ dictionary }: { dictionary: Dictionary }) {
	const [theme, setTheme] = useState<Theme | undefined>(undefined);

	useEffect(() => {
		setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
	}, []);

	function change(dark: boolean): void {
		const nextTheme: Theme = dark ? "dark" : "light";
		document.documentElement.dataset.theme = nextTheme;
		try {
			localStorage.setItem(THEME_KEY, nextTheme);
		} catch {
			// EN: Storage can be blocked (private mode). The theme still changes for this visit.
			// PT: O storage pode estar bloqueado (modo privado). O tema ainda muda nesta visita.
			// ES: El storage puede estar bloqueado (modo privado). El tema igual cambia en esta visita.
		}
		setTheme(nextTheme);
	}

	return (
		<Toggle
			data-testid="theme-toggle"
			data-keep-enter
			pressed={theme === "dark"}
			onPressedChange={change}
			aria-label={dictionary.theme.label}
			className={`${headerControl} gap-1 rounded-md border border-border`}
		>
			<span aria-hidden="true">☾</span>
			{dictionary.theme.dark}
		</Toggle>
	);
}

// EN: Every page exists at the same path in every language, so switching language is going to
//     the same path with the other prefix. The run of the quiz is stored by question id, not by
//     text, so the same question and the chosen answer are still there after the switch.
//     The three options are a Base UI `ToggleGroup` where only one can be pressed. It also gives
//     the keyboard behaviour of a group: Tab enters the group once, and the arrow keys move
//     between the languages.
// PT: Toda página existe no mesmo caminho em todos os idiomas, então trocar de idioma é ir para
//     o mesmo caminho com o outro prefixo. A rodada do quiz é guardada por id de questão, não por
//     texto, então a mesma questão e a resposta escolhida continuam lá depois da troca.
//     As três opções são um `ToggleGroup` do Base UI em que só uma pode ficar pressionada. Ele
//     também dá o comportamento de teclado de um grupo: o Tab entra no grupo uma vez, e as setas
//     andam entre os idiomas.
// ES: Cada página existe en la misma ruta en todos los idiomas, así que cambiar de idioma es ir
//     a la misma ruta con otro prefijo. La ronda del quiz se guarda por id de pregunta, no por
//     texto, así que la misma pregunta y la respuesta elegida siguen ahí tras el cambio.
//     Las tres opciones son un `ToggleGroup` de Base UI en el que solo una puede quedar
//     presionada. También da el comportamiento de teclado de un grupo: Tab entra al grupo una
//     vez, y las flechas se mueven entre los idiomas.
function LanguageSwitch({ language, dictionary }: { language: Language; dictionary: Dictionary }) {
	const pathname = usePathname();
	const router = useRouter();
	const rest = pathname.replace(/^\/(en|pt|es)(?=\/|$)/, "");

	function change(pressed: Language[]): void {
		// EN: Clicking the language that is already pressed would leave none pressed. A page
		//     always has a language, so that click is ignored.
		// PT: Clicar no idioma que já está pressionado deixaria nenhum pressionado. Uma página
		//     sempre tem um idioma, então esse clique é ignorado.
		// ES: Hacer clic en el idioma que ya está presionado dejaría ninguno presionado. Una
		//     página siempre tiene un idioma, así que ese clic se ignora.
		const option = pressed[0];
		if (option === undefined || option === language) {
			return;
		}
		try {
			localStorage.setItem(LANGUAGE_KEY, option);
		} catch {
			// EN: Without storage the choice simply lasts for this visit.
			// PT: Sem storage, a escolha simplesmente vale só nesta visita.
			// ES: Sin storage, la elección simplemente vale solo en esta visita.
		}
		router.push(`/${option}${rest === "" ? "/" : rest}`);
	}

	return (
		<ToggleGroup<Language>
			aria-label={dictionary.language}
			value={[language]}
			onValueChange={change}
			className="flex overflow-hidden rounded-md border border-border"
		>
			{LANGUAGES.map((option) => (
				<Toggle<Language>
					key={option}
					value={option}
					lang={option}
					data-testid={`lang-${option}`}
					data-keep-enter
					// EN: The group clips its children to get round corners, so the focus ring is
					//     drawn inside the button, where it cannot be cut off.
					// PT: O grupo recorta os filhos para ter cantos arredondados, então o anel de
					//     foco é desenhado dentro do botão, onde não pode ser cortado.
					// ES: El grupo recorta a sus hijos para tener esquinas redondeadas, así que el
					//     anillo de foco se dibuja dentro del botón, donde no se puede cortar.
					className={`${headerControl} focus-visible:-outline-offset-4 data-pressed:focus-visible:outline-on-accent`}
				>
					<span className="sr-only">{LANGUAGE_NAMES[option]}</span>
					<span aria-hidden="true">{option.toUpperCase()}</span>
				</Toggle>
			))}
		</ToggleGroup>
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
			className={`${headerControl} gap-2 rounded-md border border-border`}
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
