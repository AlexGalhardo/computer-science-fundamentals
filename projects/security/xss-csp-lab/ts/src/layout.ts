// EN: The page skeleton shared by both apps. `body` is written into the page as HTML, without
//     any change, so the caller is responsible for what goes in it. The fixed app only passes
//     text that went through `escapeHtml`; the vulnerable app passes raw user text, and that
//     difference is the whole lab.
// PT: O esqueleto de página compartilhado pelos dois apps. `body` é escrito na página como HTML,
//     sem nenhuma alteração, então quem chama é responsável pelo que vai nele. O app corrigido
//     só passa texto que passou por `escapeHtml`; o app vulnerável passa o texto cru do usuário,
//     e essa diferença é o laboratório inteiro.

export interface PageParts {
	title: string;
	banner: string;
	body: string;
	scripts?: readonly string[];
}

// EN: No inline <script> and no inline <style>: every script is a file of the same server.
//     That is what allows a strict Content Security Policy later.
// PT: Nenhum <script> inline e nenhum <style> inline: todo script é um arquivo do mesmo
//     servidor. É isso que permite uma Content Security Policy rígida depois.
export function renderPage(page: PageParts): string {
	const scripts = (page.scripts ?? []).map((src) => `<script src="${src}"></script>`).join("\n");
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${page.title}</title>
</head>
<body>
<p><strong>${page.banner}</strong></p>
<h1>${page.title}</h1>
${page.body}
${scripts}
</body>
</html>
`;
}
