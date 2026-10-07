// EN: A bit is the only value a wire of a digital circuit can carry: 0 (low) or 1 (high).
//     Giving it its own type stops a stray number such as 2 from entering a gate.
// PT: Um bit é o único valor que um fio de um circuito digital pode carregar: 0 (baixo) ou
//     1 (alto). Dar a ele um tipo próprio impede que um número solto, como 2, entre em uma porta.
export type Bit = 0 | 1;

// EN: The three primitive operations of Boolean algebra. NOT inverts, AND is 1 only when every
//     input is 1 (logical product), OR is 1 when at least one input is 1 (logical sum).
//     Every other gate below is written with these three, exactly as a circuit would be wired.
// PT: As três operações primitivas da álgebra booleana. NOT inverte, AND vale 1 só quando todas
//     as entradas valem 1 (produto lógico), OR vale 1 quando pelo menos uma entrada vale 1
//     (soma lógica). Todas as outras portas abaixo são escritas com essas três, do mesmo modo
//     que um circuito seria ligado.
export function not(a: Bit): Bit {
	return a === 1 ? 0 : 1;
}

export function and(a: Bit, b: Bit): Bit {
	return a === 1 && b === 1 ? 1 : 0;
}

export function or(a: Bit, b: Bit): Bit {
	return a === 1 || b === 1 ? 1 : 0;
}

// EN: Derived gates. NAND and NOR are AND and OR followed by an inverter. XOR is 1 when the
//     inputs differ: A'·B + A·B'. XNOR is its complement, 1 when the inputs are equal.
// PT: Portas derivadas. NAND e NOR são AND e OR seguidas de um inversor. XOR vale 1 quando as
//     entradas são diferentes: A'·B + A·B'. XNOR é o seu complemento, 1 quando são iguais.
export function nand(a: Bit, b: Bit): Bit {
	return not(and(a, b));
}

export function nor(a: Bit, b: Bit): Bit {
	return not(or(a, b));
}

export function xor(a: Bit, b: Bit): Bit {
	return or(and(not(a), b), and(a, not(b)));
}

export function xnor(a: Bit, b: Bit): Bit {
	return not(xor(a, b));
}
