import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// EN: Static by default: `astro build` writes HTML, CSS and JS into `out/`. No adapter, so a page
//     cannot opt into a server. `trailingSlash` keeps each route as a folder with `index.html`.
//     `QUIZ_BASE_PATH` is empty for a domain root (`csf.vukem.dev`) and a subpath for a project site.
// PT: Estático por padrão: `astro build` grava HTML, CSS e JS em `out/`. Sem adapter, uma página
//     não pode optar por um servidor. `trailingSlash` mantém cada rota como pasta com `index.html`.
//     `QUIZ_BASE_PATH` fica vazio na raiz de um domínio (`csf.vukem.dev`) e vira subcaminho num site de projeto.
// ES: Estático por defecto: `astro build` escribe HTML, CSS y JS en `out/`. Sin adapter, una página
//     no puede optar por un servidor. `trailingSlash` mantiene cada ruta como carpeta con `index.html`.
//     `QUIZ_BASE_PATH` queda vacío en la raíz de un dominio (`csf.vukem.dev`) y es un subcamino en un sitio de proyecto.
const base = process.env.QUIZ_BASE_PATH ?? "";

export default defineConfig({
	output: "static",
	outDir: "out",
	trailingSlash: "always",
	...(base === "" ? {} : { base }),
	integrations: [react()],
	vite: {
		plugins: [tailwindcss()],
	},
});
