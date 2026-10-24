"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { LANGUAGES, type Language } from "@/content/schema";
import { type Dictionary, LANGUAGE_KEY, LANGUAGE_NAMES, REPOSITORY_URL, THEME_KEY } from "@/i18n";
import { SearchDialog, type SearchEntry } from "./SearchDialog";
import { headerControl } from "./ui";

type Theme = "light" | "dark";

const themeIcons: Record<Theme, ReactNode> = {
	light: (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width="18"
			height="18"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
		</svg>
	),
	dark: (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			width="18"
			height="18"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
		</svg>
	),
};

// EN: The theme is already on <html> before React starts (see the script in the layout).
//     This component only reads it, flips it and remembers the choice. Like the language
//     switch, it is a Base UI `ToggleGroup` where only one option is pressed, drawn as two round
//     icon buttons (sun and moon). Base UI writes `aria-pressed` for screen readers and
//     `data-pressed` for the styles.
// PT: O tema já está no <html> antes de o React começar (veja o script no layout). Este
//     componente só lê, alterna e guarda a escolha. Como o seletor de idioma, ele é um
//     `ToggleGroup` do Base UI em que só uma opção fica pressionada, desenhado como dois botões
//     redondos com ícone (sol e lua). O Base UI escreve `aria-pressed` para leitores de tela e
//     `data-pressed` para os estilos.
// ES: El tema ya está en <html> antes de que React arranque (mira el script en el layout). Este
//     componente solo lo lee, lo alterna y guarda la elección. Como el selector de idioma, es un
//     `ToggleGroup` de Base UI en el que solo una opción queda presionada, dibujado como dos
//     botones redondos con ícono (sol y luna). Base UI escribe `aria-pressed` para lectores de
//     pantalla y `data-pressed` para los estilos.
function ThemeToggle({ dictionary }: { dictionary: Dictionary }) {
	const [theme, setTheme] = useState<Theme | undefined>(undefined);

	useEffect(() => {
		setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
	}, []);

	function change(pressed: Theme[]): void {
		// EN: Clicking the pressed option would leave none pressed. A page always has a theme.
		// PT: Clicar na opção pressionada deixaria nenhuma pressionada. Uma página sempre tem um tema.
		// ES: Hacer clic en la opción presionada dejaría ninguna presionada. Una página siempre tiene un tema.
		const nextTheme = pressed[0];
		if (nextTheme === undefined || nextTheme === theme) {
			return;
		}
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
		<ToggleGroup<Theme>
			aria-label={dictionary.theme.label}
			value={theme === undefined ? [] : [theme]}
			onValueChange={change}
			className="flex items-center gap-0.5 rounded-full border border-border p-0.5"
		>
			{(["light", "dark"] as const).map((option) => (
				<Toggle<Theme>
					key={option}
					value={option}
					data-testid={`theme-${option}`}
					data-keep-enter
					aria-label={dictionary.theme[option]}
					title={dictionary.theme[option]}
					className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full text-muted select-none hover:text-text data-pressed:bg-accent data-pressed:text-on-accent"
				>
					{themeIcons[option]}
				</Toggle>
			))}
		</ToggleGroup>
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
			<span>{dictionary.sourceCode.label}</span>
		</a>
	);
}

// EN: On a phone the controls do not fit in one row, so they move into a drawer opened by the
//     hamburger button. It is a Base UI `Dialog`: it traps the focus, closes with Escape and
//     tells screen readers that the rest of the page is inert while it is open.
// PT: No celular os controles não cabem em uma linha, então vão para uma gaveta aberta pelo
//     botão hambúrguer. Ela é um `Dialog` do Base UI: prende o foco, fecha com Escape e avisa os
//     leitores de tela que o resto da página está inerte enquanto ela está aberta.
// ES: En un teléfono los controles no caben en una fila, así que pasan a un cajón que abre el
//     botón hamburguesa. Es un `Dialog` de Base UI: atrapa el foco, cierra con Escape y avisa a
//     los lectores de pantalla que el resto de la página está inerte mientras está abierto.
function MobileMenu({ language, dictionary }: { language: Language; dictionary: Dictionary }) {
	return (
		<Dialog.Root>
			<Dialog.Trigger
				data-testid="menu-open"
				aria-label={dictionary.nav.open}
				className={`${headerControl} rounded-md border border-border md:hidden`}
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					width="20"
					height="20"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
				>
					<path d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
				<Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,85vw)] flex-col gap-4 border-l border-border bg-surface p-4 transition-transform duration-200 data-ending-style:translate-x-full data-starting-style:translate-x-full">
					<div className="flex items-center justify-between">
						<Dialog.Title className="text-base font-bold">{dictionary.nav.title}</Dialog.Title>
						<Dialog.Close
							data-testid="menu-close"
							aria-label={dictionary.nav.close}
							className={`${headerControl} rounded-md`}
						>
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								width="20"
								height="20"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							>
								<path d="M6 6l12 12M18 6L6 18" />
							</svg>
						</Dialog.Close>
					</div>
					<Dialog.Close
						render={<Link href={`/${language}/`} />}
						className="flex min-h-11 items-center rounded-md px-3 font-semibold hover:bg-code-bg"
					>
						{dictionary.home}
					</Dialog.Close>
					<div className="flex flex-wrap items-center gap-2">
						<LanguageSwitch language={language} dictionary={dictionary} />
						<ThemeToggle dictionary={dictionary} />
					</div>
					<SourceCodeLink dictionary={dictionary} />
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

// EN: Below `md` the title is only "Quiz" and the controls live in the drawer. From `md` up the
//     full name and the controls show in the bar. The search is always there: a field on a wide
//     screen, a magnifier button on a phone.
// PT: Abaixo de `md` o título é só "Quiz" e os controles ficam na gaveta. De `md` para cima o
//     nome completo e os controles aparecem na barra. A busca está sempre lá: um campo em tela
//     larga, um botão de lupa no celular.
// ES: Debajo de `md` el título es solo "Quiz" y los controles viven en el cajón. Desde `md` el
//     nombre completo y los controles se muestran en la barra. La búsqueda siempre está: un
//     campo en pantalla ancha, un botón de lupa en el teléfono.
export function Header({
	language,
	dictionary,
	searchEntries,
}: {
	language: Language;
	dictionary: Dictionary;
	searchEntries: SearchEntry[];
}) {
	return (
		<header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
			<div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
				<Link href={`/${language}/`} className="flex min-h-11 items-center text-base font-bold">
					<span className="md:hidden">{dictionary.appNameShort}</span>
					<span className="hidden md:inline">{dictionary.appName}</span>
				</Link>
				<div className="flex flex-1 justify-end md:justify-center">
					<SearchDialog dictionary={dictionary} entries={searchEntries} />
				</div>
				<div className="hidden items-center gap-2 md:flex">
					<SourceCodeLink dictionary={dictionary} />
					<LanguageSwitch language={language} dictionary={dictionary} />
					<ThemeToggle dictionary={dictionary} />
				</div>
				<MobileMenu language={language} dictionary={dictionary} />
			</div>
		</header>
	);
}
