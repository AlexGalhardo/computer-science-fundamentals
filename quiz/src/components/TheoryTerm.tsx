"use client";

import { Popover } from "@base-ui/react/popover";
import { type ReactNode, useId, useRef, useState } from "react";

// EN: A term of the theory summary with its meaning in a small popup. It is a Base UI `Popover`
//     and not a `Tooltip`, because a tooltip opens only with a mouse or a keyboard, and half of
//     the readers are on a phone. This one opens in three ways: a click or a tap, the mouse
//     resting on the term (`openOnHover`), and keyboard focus. Escape, the close button, a click
//     outside and leaving the term close it.
//     Base UI places the popup: it is rendered in a portal at the end of `<body>`, kept next to
//     the term, and flipped or shifted when it would leave the screen, which pure CSS cannot do.
//     Accessibility: the meaning is also in a hidden `<span>` that the term points to with
//     `aria-describedby`. So a screen reader announces the meaning together with the term, like
//     it does for a tooltip, even while the popup is closed.
// PT: Um termo do resumo teórico com o significado em um popup pequeno. É um `Popover` do Base UI
//     e não um `Tooltip`, porque um tooltip só abre com mouse ou teclado, e metade dos leitores
//     está no celular. Este abre de três jeitos: um clique ou um toque, o mouse parado sobre o
//     termo (`openOnHover`), e o foco do teclado. Escape, o botão de fechar, um clique fora e
//     sair do termo fecham.
//     O Base UI posiciona o popup: ele é renderizado em um portal no fim do `<body>`, mantido ao
//     lado do termo, e virado ou deslocado quando sairia da tela, o que CSS puro não consegue.
//     Acessibilidade: o significado também está em um `<span>` escondido para o qual o termo
//     aponta com `aria-describedby`. Assim o leitor de tela anuncia o significado junto com o
//     termo, como faz com um tooltip, mesmo com o popup fechado.
// ES: Un término del resumen teórico con su significado en un popup pequeño. Es un `Popover` de
//     Base UI y no un `Tooltip`, porque un tooltip solo se abre con mouse o teclado, y la mitad de
//     los lectores está en el celular. Este se abre de tres formas: un clic o un toque, el mouse
//     detenido sobre el término (`openOnHover`), y el foco del teclado. Escape, el botón de
//     cerrar, un clic afuera y salir del término lo cierran.
//     Base UI posiciona el popup: se renderiza en un portal al final de `<body>`, se mantiene
//     junto al término, y se voltea o se desplaza cuando saldría de la pantalla, algo que el CSS
//     puro no puede hacer.
//     Accesibilidad: el significado también está en un `<span>` oculto al que el término apunta
//     con `aria-describedby`. Así el lector de pantalla anuncia el significado junto con el
//     término, como hace con un tooltip, incluso con el popup cerrado.
export function TheoryTerm({
	term,
	meaning,
	closeLabel,
}: {
	term: string;
	meaning: string;
	closeLabel: string;
}): ReactNode {
	const [open, setOpen] = useState(false);
	const meaningId = useId();
	const triggerId = useId();
	const popupRef = useRef<HTMLDivElement>(null);

	// EN: When the term loses focus, the popup closes only if the focus really left: it may have
	//     gone into the popup, to the close button. The check waits one frame, because during the
	//     `blur` event the browser has not yet said where the focus is going.
	// PT: Quando o termo perde o foco, o popup só fecha se o foco saiu de verdade: ele pode ter ido
	//     para dentro do popup, para o botão de fechar. A checagem espera um quadro, porque durante
	//     o evento `blur` o navegador ainda não disse para onde o foco vai.
	// ES: Cuando el término pierde el foco, el popup solo se cierra si el foco salió de verdad:
	//     pudo haber ido adentro del popup, al botón de cerrar. La revisión espera un cuadro,
	//     porque durante el evento `blur` el navegador aún no dijo a dónde va el foco.
	function closeIfFocusLeft(): void {
		requestAnimationFrame(() => {
			const focused = document.activeElement;
			if (!document.getElementById(triggerId)?.contains(focused) && !popupRef.current?.contains(focused)) {
				setOpen(false);
			}
		});
	}

	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			{/* EN: The trigger is a `<span>` with the button role, not a `<button>`, so a long term
			        still breaks across lines like the text around it.
			    PT: O gatilho é um `<span>` com papel de botão, não um `<button>`, para que um termo
			        longo ainda quebre entre linhas como o texto ao redor.
			    ES: El disparador es un `<span>` con rol de botón, no un `<button>`, para que un
			        término largo aún se parta entre líneas como el texto de alrededor. */}
			<Popover.Trigger
				id={triggerId}
				nativeButton={false}
				render={<span />}
				openOnHover
				delay={150}
				closeDelay={100}
				data-testid="theory-tooltip"
				aria-describedby={meaningId}
				// EN: Only keyboard focus opens the popup (`:focus-visible`). A click also gives
				//     focus, and opening on that focus would make the click close it again.
				// PT: Só o foco do teclado abre o popup (`:focus-visible`). Um clique também dá
				//     foco, e abrir nesse foco faria o clique fechá-lo de novo.
				// ES: Solo el foco del teclado abre el popup (`:focus-visible`). Un clic también da
				//     foco, y abrir con ese foco haría que el clic lo cerrara de nuevo.
				onFocus={(event) => {
					if (event.currentTarget.matches(":focus-visible")) {
						setOpen(true);
					}
				}}
				onBlur={closeIfFocusLeft}
				className="cursor-help rounded-sm underline decoration-dotted underline-offset-4 hover:decoration-solid data-popup-open:decoration-solid"
			>
				{term}
			</Popover.Trigger>
			<span id={meaningId} hidden>
				{meaning}
			</span>
			<Popover.Portal>
				<Popover.Positioner sideOffset={6} collisionPadding={8} className="z-10">
					{/* EN: `initialFocus={false}` keeps the focus on the term when the popup opens, so
					        reading on with Tab is not interrupted. The next Tab goes to the close
					        button, and one more leaves the popup and closes it.
					    PT: `initialFocus={false}` mantém o foco no termo quando o popup abre, então
					        continuar lendo com Tab não é interrompido. O próximo Tab vai para o botão de
					        fechar, e mais um sai do popup e o fecha.
					    ES: `initialFocus={false}` mantiene el foco en el término cuando el popup se
					        abre, así que seguir leyendo con Tab no se interrumpe. El siguiente Tab va al
					        botón de cerrar, y uno más sale del popup y lo cierra. */}
					<Popover.Popup
						ref={popupRef}
						initialFocus={false}
						onBlur={closeIfFocusLeft}
						data-testid="theory-tooltip-popup"
						className="w-64 max-w-(--available-width) rounded-md border border-border bg-surface py-1 pr-1 pl-3 text-sm text-text shadow-md outline-hidden"
					>
						<div className="flex items-start justify-between gap-2">
							<Popover.Title render={<p />} className="py-3 font-semibold">
								{term}
							</Popover.Title>
							<Popover.Close
								aria-label={closeLabel}
								data-testid="theory-tooltip-close"
								className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-base text-muted select-none hover:bg-code-bg hover:text-text"
							>
								<span aria-hidden="true">✕</span>
							</Popover.Close>
						</div>
						<Popover.Description className="pr-2 pb-2 leading-relaxed">{meaning}</Popover.Description>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}
