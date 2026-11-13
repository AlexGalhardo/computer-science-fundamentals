// EN: The static host may serve the site under a subpath (`import.meta.env.BASE_URL`). Every
//     in-app link adds that prefix once. A full navigation reloads the page; progress stays in
//     the browser storage, which does not depend on the client-side router.
// PT: O host estático pode servir o site num subcaminho (`import.meta.env.BASE_URL`). Todo link
//     interno acrescenta esse prefixo uma vez. A navegação recarrega a página; o progresso fica
//     no storage do navegador, que não depende de um roteador no cliente.
// ES: El host estático puede servir el sitio en un subcamino (`import.meta.env.BASE_URL`). Todo
//     enlace interno añade ese prefijo una vez. La navegación recarga la página; el progreso queda
//     en el storage del navegador, que no depende de un enrutador en el cliente.

export function withBase(path: string): string {
	if (!path.startsWith("/")) {
		return path;
	}
	const base = import.meta.env.BASE_URL.replace(/\/$/, "");
	return `${base}${path}`;
}

export function navigate(path: string): void {
	window.location.assign(withBase(path));
}

// EN: `location.pathname` includes the base. Language switching compares paths without it.
// PT: `location.pathname` inclui a base. A troca de idioma compara caminhos sem ela.
// ES: `location.pathname` incluye la base. El cambio de idioma compara rutas sin ella.
export function pathWithoutBase(): string {
	const base = import.meta.env.BASE_URL.replace(/\/$/, "");
	const path = window.location.pathname;
	const stripped = base !== "" && path.startsWith(base) ? path.slice(base.length) : path;
	return stripped.startsWith("/") ? stripped : `/${stripped}`;
}
