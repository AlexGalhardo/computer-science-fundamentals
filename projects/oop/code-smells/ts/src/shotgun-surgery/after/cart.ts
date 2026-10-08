import { formatMoney } from "./money";

export function cartLine(name: string, unitCents: number, quantity: number): string {
	return `${quantity} x ${name}  ${formatMoney(unitCents * quantity)}`;
}
