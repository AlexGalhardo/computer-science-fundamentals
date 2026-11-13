import type { AnchorHTMLAttributes } from "react";
import { withBase } from "@/lib/navigate";

// EN: Same job as a framework link, without a client router: a normal anchor, with the site base.
// PT: O mesmo papel de um link de framework, sem roteador no cliente: uma âncora normal, com a base do site.
// ES: El mismo papel de un enlace de framework, sin enrutador en el cliente: un ancla normal, con la base del sitio.
export function Link({ href, ...props }: { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
	return <a href={withBase(href)} {...props} />;
}
