import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Computer Science Fundamentals" };

// EN: The address `/` has no language yet, so it has its own tiny layout. The real layout,
//     with the `lang` attribute, lives under `/[lang]`.
// PT: O endereço `/` ainda não tem idioma, então tem um layout mínimo próprio. O layout de
//     verdade, com o atributo `lang`, fica em `/[lang]`.
// ES: La dirección `/` aún no tiene idioma, así que tiene un layout mínimo propio. El layout de
//     verdad, con el atributo `lang`, está en `/[lang]`.
export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
