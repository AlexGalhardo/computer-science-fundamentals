import type { NextConfig } from "next";

// EN: `output: "export"` turns the app into plain HTML, CSS and JS files in `out/`. There is no
//     server at run time, so any static file host can serve the quiz. `trailingSlash` makes each
//     route a folder with an `index.html`, which is what such hosts expect.
// PT: `output: "export"` transforma o app em arquivos HTML, CSS e JS puros em `out/`. Não há
//     servidor em tempo de execução, então qualquer hospedagem de arquivos estáticos serve o
//     quiz. `trailingSlash` faz de cada rota uma pasta com `index.html`, que é o que elas esperam.
const config: NextConfig = {
	output: "export",
	trailingSlash: true,
	basePath: process.env.QUIZ_BASE_PATH ?? "",
	env: { NEXT_PUBLIC_BASE_PATH: process.env.QUIZ_BASE_PATH ?? "" },
	images: { unoptimized: true },
};

export default config;
