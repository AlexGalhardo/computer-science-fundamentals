// EN: Fixed browser script. It is served as a file of the same server, which is what the
//     policy `script-src 'self'` allows.
// PT: Script de navegador corrigido. Ele é servido como um arquivo do mesmo servidor, que é o
//     que a política `script-src 'self'` permite.
// ES: Script de navegador corregido. Se sirve como un archivo del mismo servidor, que es lo
//     que permite la política `script-src 'self'`.

// EN: A broken percent-sequence (for example a lone `%`) makes `decodeURIComponent` throw.
//     The page then falls back to a neutral name instead of stopping with an error.
// PT: Uma sequência de porcentagem quebrada (por exemplo um `%` sozinho) faz
//     `decodeURIComponent` lançar um erro. A página então usa um nome neutro em vez de parar
//     com erro.
// ES: Una secuencia de porcentaje rota (por ejemplo un `%` solo) hace que
//     `decodeURIComponent` lance un error. La página entonces usa un nombre neutro en lugar de detenerse
//     con un error.
function readVisitorName() {
	try {
		return decodeURIComponent(window.location.hash.slice(1)) || "guest";
	} catch {
		return "guest";
	}
}

// EN: THE FIX. `textContent` never parses HTML: it creates one text node with exactly these
//     characters. `<img ...>` is shown on the screen as the characters it is, and no element is
//     created. Use `textContent` (or `createElement` + `setAttribute` for known-safe
//     attributes) whenever the value is data.
// PT: A CORREÇÃO. `textContent` nunca interpreta HTML: ele cria um único nó de texto com
//     exatamente esses caracteres. `<img ...>` aparece na tela como os caracteres que é, e
//     nenhum elemento é criado. Use `textContent` (ou `createElement` + `setAttribute` para
//     atributos sabidamente seguros) sempre que o valor for um dado.
// ES: LA CORRECCIÓN. `textContent` nunca interpreta HTML: crea un único nodo de texto con
//     exactamente esos caracteres. `<img ...>` aparece en pantalla como los caracteres que es, y
//     no se crea ningún elemento. Usa `textContent` (o `createElement` + `setAttribute` para
//     atributos conocidos como seguros) siempre que el valor sea un dato.
document.getElementById("visitor-name").textContent = readVisitorName();
