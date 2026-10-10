// EN: Base UI components come with behaviour and accessibility, but with no styles at all. The
//     look is given here, with Tailwind classes built only from the theme tokens of
//     `globals.css`. Base UI reports the state of a component through `data-*` attributes
//     (`data-disabled`, `data-pressed`, `data-highlighted`, `data-popup-open`), and Tailwind
//     turns each one into a variant such as `data-disabled:opacity-60`. Keeping the class lists
//     in one file makes every button of the quiz look and react the same way.
// PT: Os componentes do Base UI vêm com comportamento e acessibilidade, mas sem nenhum estilo. A
//     aparência é dada aqui, com classes do Tailwind feitas só com os tokens de tema do
//     `globals.css`. O Base UI informa o estado de um componente por atributos `data-*`
//     (`data-disabled`, `data-pressed`, `data-highlighted`, `data-popup-open`), e o Tailwind
//     transforma cada um em uma variante como `data-disabled:opacity-60`. Manter as listas de
//     classes em um arquivo faz todo botão do quiz ter a mesma aparência e a mesma reação.
// ES: Los componentes de Base UI vienen con comportamiento y accesibilidad, pero sin ningún
//     estilo. La apariencia se da aquí, con clases de Tailwind hechas solo con los tokens de tema
//     de `globals.css`. Base UI informa el estado de un componente con atributos `data-*`
//     (`data-disabled`, `data-pressed`, `data-highlighted`, `data-popup-open`), y Tailwind
//     convierte cada uno en una variante como `data-disabled:opacity-60`. Mantener las listas de
//     clases en un archivo hace que todo botón del quiz se vea y reaccione igual.

const buttonBase =
	"inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-base font-semibold select-none data-disabled:cursor-not-allowed data-disabled:opacity-60";

/** The main action of a screen: filled with the accent colour. */
export const primaryButton = `${buttonBase} bg-accent text-on-accent hover:not-data-disabled:bg-accent/90 active:not-data-disabled:bg-accent/80`;

/** A secondary action: an outlined button on the surface colour. */
export const secondaryButton = `${buttonBase} border border-border bg-surface text-text hover:not-data-disabled:bg-code-bg active:not-data-disabled:bg-bg`;

/** A link that looks like the main button. It stays a link, because it goes to another page. */
export const primaryLink =
	"inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-semibold text-on-accent hover:bg-accent/90 active:bg-accent/80";

/** A control of the header. A toggle is filled with the accent colour while it is pressed. */
export const headerControl =
	"flex min-h-11 min-w-11 cursor-pointer items-center justify-center bg-surface px-3 text-sm font-medium text-text select-none hover:bg-code-bg data-pressed:bg-accent data-pressed:text-on-accent";
