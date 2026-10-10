// EN: Output encoding for HTML. The five characters below are the ones that can end a piece of
//     text and start markup: `<` and `>` open and close tags, `&` starts an entity, and the two
//     quotes end an attribute value. Each one is replaced by its entity, which the browser
//     DISPLAYS as the original character and never interprets as markup. The text is not
//     censored or shortened: `Tom & Jerry <3` still reads `Tom & Jerry <3` on the screen.
// PT: Codificação de saída para HTML. Os cinco caracteres abaixo são os que conseguem encerrar
//     um trecho de texto e começar marcação: `<` e `>` abrem e fecham tags, `&` começa uma
//     entidade, e as duas aspas encerram o valor de um atributo. Cada um é trocado pela sua
//     entidade, que o navegador EXIBE como o caractere original e nunca interpreta como
//     marcação. O texto não é censurado nem encurtado: `Tom & Jerry <3` continua aparecendo
//     como `Tom & Jerry <3` na tela.
// ES: Codificación de salida para HTML. Los cinco caracteres de abajo son los que pueden terminar
//     un trozo de texto y empezar marcado: `<` y `>` abren y cierran etiquetas, `&` empieza una
//     entidad, y las dos comillas terminan el valor de un atributo. Cada uno se cambia por su
//     entidad, que el navegador MUESTRA como el carácter original y nunca interpreta como
//     marcado. El texto no se censura ni se acorta: `Tom & Jerry <3` sigue apareciendo
//     como `Tom & Jerry <3` en pantalla.
const HTML_ENTITIES: Readonly<Record<string, string>> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

// EN: This function is correct for two places only: text between tags, and attribute values
//     written inside quotes. Other places have other rules (inside a <script>, a URL in `href`,
//     CSS), so the safe habit is to never write user text there at all.
// PT: Esta função está correta só para dois lugares: texto entre tags e valores de atributo
//     escritos entre aspas. Outros lugares têm outras regras (dentro de um <script>, uma URL em
//     `href`, CSS), então o hábito seguro é nunca escrever texto do usuário neles.
// ES: Esta función es correcta solo para dos lugares: texto entre etiquetas y valores de atributo
//     escritos entre comillas. Otros lugares tienen otras reglas (dentro de un <script>, una URL en
//     `href`, CSS), así que el hábito seguro es nunca escribir texto del usuario en ellos.
export function escapeHtml(text: string): string {
	return text.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character] ?? character);
}
