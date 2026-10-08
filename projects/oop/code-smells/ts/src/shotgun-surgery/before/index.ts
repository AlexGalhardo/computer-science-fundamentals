import type { Billing } from "../contract";
import { cartLine } from "./cart";
import { invoiceTotal } from "./invoice";
import { reportRow } from "./report";

export const billing: Billing = { cartLine, invoiceTotal, reportRow };
