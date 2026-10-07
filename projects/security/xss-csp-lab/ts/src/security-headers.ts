// EN: A Content Security Policy (CSP) is a response header that tells the browser which
//     sources of code it may run on this page. It does not change the HTML: the injected markup
//     still arrives, the browser simply refuses to execute it. That makes CSP a second layer
//     (defence in depth), useful for the day an encoding bug slips through, and never a
//     replacement for encoding the output.
// PT: Uma Content Security Policy (CSP) é um cabeçalho de resposta que diz ao navegador de quais
//     origens ele pode executar código nesta página. Ela não altera o HTML: a marcação injetada
//     continua chegando, o navegador apenas se recusa a executá-la. Isso faz da CSP uma segunda
//     camada (defesa em profundidade), útil no dia em que um bug de codificação escapar, e nunca
//     um substituto para codificar a saída.

// EN: One directive per line:
//     - default-src 'self': anything not listed below may only come from this same server.
//     - script-src 'self': scripts only from files of this server. Because 'unsafe-inline' is
//       absent, inline <script> blocks and inline handlers such as onerror="..." do not run.
//     - object-src 'none': no plugins (<object>, <embed>), an old way of running code.
//     - base-uri 'none': no <base> element, which could redirect relative script addresses.
//     - form-action 'self': forms may only post back to this server.
//     - frame-ancestors 'none': other sites cannot put this page inside a frame.
// PT: Uma diretiva por linha:
//     - default-src 'self': tudo que não está listado abaixo só pode vir deste mesmo servidor.
//     - script-src 'self': scripts só de arquivos deste servidor. Como 'unsafe-inline' está
//       ausente, blocos <script> inline e manipuladores inline como onerror="..." não rodam.
//     - object-src 'none': nenhum plugin (<object>, <embed>), um jeito antigo de executar código.
//     - base-uri 'none': nenhum elemento <base>, que poderia redirecionar endereços relativos de
//       script.
//     - form-action 'self': formulários só podem enviar de volta para este servidor.
//     - frame-ancestors 'none': outros sites não podem colocar esta página dentro de um frame.
export const CSP_DIRECTIVES: Readonly<Record<string, string>> = {
	"default-src": "'self'",
	"script-src": "'self'",
	"object-src": "'none'",
	"base-uri": "'none'",
	"form-action": "'self'",
	"frame-ancestors": "'none'",
};

export function buildContentSecurityPolicy(directives: Readonly<Record<string, string>>): string {
	return Object.entries(directives)
		.map(([name, value]) => `${name} ${value}`)
		.join("; ");
}

export const CONTENT_SECURITY_POLICY: string = buildContentSecurityPolicy(CSP_DIRECTIVES);

// EN: `nosniff` stops the browser from guessing a content type, so a response sent as plain
//     text is never reinterpreted as HTML or as a script.
// PT: `nosniff` impede o navegador de adivinhar o tipo do conteúdo, então uma resposta enviada
//     como texto puro nunca é reinterpretada como HTML ou como script.
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
	"content-security-policy": CONTENT_SECURITY_POLICY,
	"x-content-type-options": "nosniff",
};
