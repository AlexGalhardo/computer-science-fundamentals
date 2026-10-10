import { escapeHtml } from "./http";

export type HomeView = {
	title: string;
	note: string;
	// EN: `null` means nobody is logged in, so the page shows the login form.
	// PT: `null` significa que ninguém está logado, então a página mostra o formulário de login.
	// ES: `null` significa que nadie tiene la sesión iniciada, así que la página muestra el formulario de inicio de sesión.
	username: string | null;
	email: string;
	// EN: `null` means this version of the app has no anti-CSRF token in its form.
	// PT: `null` significa que esta versão do app não tem token anti-CSRF no formulário.
	// ES: `null` significa que esta versión de la app no tiene token anti-CSRF en el formulario.
	csrfToken: string | null;
};

function layout(title: string, note: string, body: string): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p><em>${escapeHtml(note)}</em></p>
${body}
</body>
</html>
`;
}

// EN: The one page of the app. The hidden `csrfToken` field is the whole idea of the
//     synchroniser token: the server writes a secret into its OWN form. A page on another site
//     can make the browser send a form, but it cannot read this page, so it cannot know the value.
// PT: A única página do app. O campo oculto `csrfToken` é a ideia inteira do token
//     sincronizador: o servidor escreve um segredo no SEU PRÓPRIO formulário. Uma página de
//     outro site consegue fazer o navegador enviar um formulário, mas não consegue ler esta
//     página, então não tem como saber o valor.
// ES: La única página de la app. El campo oculto `csrfToken` es toda la idea del token
//     sincronizador: el servidor escribe un secreto en SU PROPIO formulario. Una página de
//     otro sitio puede hacer que el navegador envíe un formulario, pero no puede leer esta
//     página, así que no tiene cómo saber el valor.
export function renderHome(view: HomeView): string {
	if (view.username === null) {
		return layout(
			view.title,
			view.note,
			`<form method="post" action="/login">
<label>User <input name="username" autocomplete="off"></label>
<label>Password <input name="password" type="password" autocomplete="off"></label>
<button type="submit">Log in</button>
</form>`,
		);
	}
	const tokenField =
		view.csrfToken === null ? "" : `<input type="hidden" name="csrfToken" value="${escapeHtml(view.csrfToken)}">\n`;
	return layout(
		view.title,
		view.note,
		`<p>Logged in as <strong id="current-user">${escapeHtml(view.username)}</strong></p>
<p>Current e-mail: <strong id="current-email">${escapeHtml(view.email)}</strong></p>
<form method="post" action="/email/change">
${tokenField}<label>New e-mail <input name="email" type="email" autocomplete="off"></label>
<button type="submit">Change e-mail</button>
</form>`,
	);
}
