// ============================================================================================
// EN: VULNERABLE ON PURPOSE. Browser script of the lab with a DOM-based XSS flaw. Never copy
//     it and never load it outside this lab. The safe version is `../fixed/fixed-dom-client.js`.
// PT: VULNERÁVEL DE PROPÓSITO. Script de navegador do laboratório com uma falha de XSS baseado
//     em DOM. Nunca o copie e nunca o carregue fora deste laboratório. A versão segura é
//     `../fixed/fixed-dom-client.js`.
// ============================================================================================

// EN: The part of the address after `#` (the fragment) is never sent to the server, so no
//     server-side escaping can help here: the page greets the visitor using only browser code.
// PT: A parte do endereço depois de `#` (o fragmento) nunca é enviada ao servidor, então nenhum
//     escape no servidor ajuda aqui: a página cumprimenta o visitante usando só código do
//     navegador.
const visitorName = decodeURIComponent(window.location.hash.slice(1)) || "guest";

// EN: THE FLAW. `innerHTML` asks the browser to PARSE the text as HTML. If the fragment holds an
//     element with an inline event handler, the element is created and its handler runs.
// PT: A FALHA. `innerHTML` pede ao navegador para INTERPRETAR o texto como HTML. Se o fragmento
//     traz um elemento com um manipulador de evento inline, o elemento é criado e o
//     manipulador roda.
document.getElementById("visitor-name").innerHTML = visitorName;
