import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import { Header } from "@/components/Header";
import { LANGUAGES } from "@/content/schema";
import { getDictionary, HTML_LANG, isLanguage, THEME_KEY } from "@/i18n";

// EN: Static site generation: Next.js calls this at build time and writes one HTML file per
//     language. `dynamicParams = false` makes any other value a 404 instead of a server render.
// PT: Geração estática: o Next.js chama isto no build e escreve um arquivo HTML por idioma.
//     `dynamicParams = false` faz qualquer outro valor virar 404 em vez de renderizar no servidor.
export const dynamicParams = false;

export function generateStaticParams(): { lang: string }[] {
	return LANGUAGES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
	const { lang } = await params;
	const dictionary = getDictionary(isLanguage(lang) ? lang : "en");
	return { title: dictionary.appName, description: dictionary.tagline };
}

// EN: This runs before the first paint, while the browser is still reading <head>. It puts the
//     saved theme (or the system preference on a first visit) on <html>, so a reload in dark
//     mode never flashes the light theme. It must be inline: an external file would arrive late.
// PT: Isto roda antes da primeira pintura, enquanto o navegador ainda lê o <head>. Ele coloca
//     no <html> o tema salvo (ou a preferência do sistema na primeira visita), então recarregar
//     no modo escuro nunca pisca o tema claro. Precisa ser inline: um arquivo externo chegaria tarde.
const themeScript = `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(THEME_KEY)})}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t})()`;

export default async function LanguageLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	if (!isLanguage(lang)) {
		notFound();
	}
	const dictionary = getDictionary(lang);
	return (
		// EN: `suppressHydrationWarning`: the script above adds `data-theme` before React runs,
		//     so the server HTML and the browser HTML differ on purpose in that one attribute.
		// PT: `suppressHydrationWarning`: o script acima adiciona `data-theme` antes de o React
		//     rodar, então o HTML do servidor e o do navegador diferem de propósito nesse atributo.
		<html lang={HTML_LANG[lang]} suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: constant script written above, with no user input */}
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
			</head>
			<body className="min-h-screen antialiased">
				<a
					href="#content"
					className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-on-accent"
				>
					{dictionary.skipToContent}
				</a>
				<Header language={lang} dictionary={dictionary} />
				<main id="content" className="mx-auto max-w-6xl px-4 py-6">
					{children}
				</main>
			</body>
		</html>
	);
}
