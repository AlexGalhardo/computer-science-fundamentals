// EN: The only inputs this lab ever sends. A real attack would steal a session or act as the
//     victim; here the "attack" just sets a flag on the page (`window.__labXssExecuted`), which
//     is enough to prove that text typed by a visitor was run as code by the browser. Nothing
//     leaves the page, and the image address is a path of the lab server itself.
// PT: As únicas entradas que este laboratório envia. Um ataque real roubaria uma sessão ou agiria
//     como a vítima; aqui o "ataque" só liga uma marca na página (`window.__labXssExecuted`), o
//     que basta para provar que um texto digitado por um visitante foi executado como código
//     pelo navegador. Nada sai da página, e o endereço da imagem é um caminho do próprio
//     servidor do laboratório.

export const MARKER = "__labXssExecuted";

// EN: Works where the server writes the text into the HTML it sends (stored and reflected):
//     the parser meets a <script> element and runs it.
// PT: Funciona onde o servidor escreve o texto no HTML que envia (armazenado e refletido): o
//     parser encontra um elemento <script> e o executa.
export const SCRIPT_INPUT = `<script>window.${MARKER} = true</script>`;

// EN: A <script> inserted through `innerHTML` never runs, so the DOM-based case needs another
//     element: an image that fails to load and has an inline `onerror` handler.
// PT: Um <script> inserido via `innerHTML` nunca roda, então o caso baseado em DOM precisa de
//     outro elemento: uma imagem que falha ao carregar e tem um manipulador `onerror` inline.
export const IMAGE_INPUT = `<img src="/lab-missing-image" onerror="window.${MARKER} = true">`;

// EN: Honest text that happens to contain the characters HTML treats as special. A correct fix
//     must show it exactly as typed, which is what separates encoding from deleting characters.
// PT: Texto honesto que por acaso contém os caracteres que o HTML trata como especiais. Uma
//     correção certa precisa mostrá-lo exatamente como foi digitado, e é isso que separa
//     codificar de apagar caracteres.
export const NORMAL_INPUT = "Tom & Jerry <3 the lab";

export const FAKE_AUTHOR = "alice-fake";
