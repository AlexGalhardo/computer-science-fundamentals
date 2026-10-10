package regex

// BacktrackMatch reports whether the pattern tree matches the whole input by trying one path at
// a time, and how many steps it took. It exists only to be compared with the automata.
//
// EN: This is how many popular regex libraries work. To match a node it makes a choice (take
// this branch of the alternation, repeat once more) and carries on with the rest of the pattern;
// when the rest fails, it comes back and tries the other choice. `rest` is the continuation:
// "what still has to match after this node, starting at position i".
//
// The danger is that the same position of the input is explored again and again through
// different chains of choices. For `(a*)*b` against a run of n letters a and no b, every way of
// cutting the run into pieces is tried before giving up: about 2^n attempts. The automata never
// do that, because a set of states cannot contain the same state twice.
//
// PT: É assim que muitas bibliotecas populares de regex funcionam. Para casar um nó ela faz uma
// escolha (seguir este ramo da alternância, repetir mais uma vez) e continua com o resto do
// padrão; quando o resto falha, ela volta e tenta a outra escolha. `rest` é a continuação: "o que
// ainda precisa casar depois deste nó, a partir da posição i".
//
// O perigo é que a mesma posição da entrada seja explorada repetidas vezes por cadeias diferentes
// de escolhas. Para `(a*)*b` contra uma sequência de n letras a e nenhum b, todas as formas de
// cortar a sequência em pedaços são tentadas antes de desistir: cerca de 2^n tentativas. Os
// autômatos nunca fazem isso, porque um conjunto de estados não pode conter o mesmo estado duas
// vezes.
//
// ES: Así funcionan muchas bibliotecas populares de regex. Para emparejar un nodo hace una
// elección (seguir esta rama de la alternancia, repetir una vez más) y continúa con el resto del
// patrón; cuando el resto falla, vuelve atrás y prueba la otra elección. `rest` es la
// continuación: "lo que aún debe emparejar después de este nodo, desde la posición i".
//
// El peligro es que la misma posición de la entrada se explore una y otra vez por cadenas
// distintas de elecciones. Para `(a*)*b` contra una secuencia de n letras a y ninguna b, se
// prueban todas las formas de cortar la secuencia en pedazos antes de rendirse: cerca de 2^n
// intentos. Los autómatas nunca hacen eso, porque un conjunto de estados no puede contener el
// mismo estado dos veces.
func BacktrackMatch(node *Node, input string) (matched bool, steps int) {
	matched = backtrack(node, input, 0, &steps, func(i int) bool { return i == len(input) })
	return matched, steps
}

func backtrack(node *Node, input string, i int, steps *int, rest func(int) bool) bool {
	*steps++
	switch node.Kind {
	case Class:
		return i < len(input) && node.Set.Has(input[i]) && rest(i+1)
	case Concat:
		return backtrack(node.Left, input, i, steps, func(j int) bool {
			return backtrack(node.Right, input, j, steps, rest)
		})
	case Alternate:
		return backtrack(node.Left, input, i, steps, rest) ||
			backtrack(node.Right, input, i, steps, rest)
	case Optional:
		return backtrack(node.Left, input, i, steps, rest) || rest(i)
	case Star, Plus:
		// EN: Greedy: try one more repetition first, and only then try to stop here. An
		//     iteration that consumed nothing is not repeated, or `(a*)*` would loop for ever.
		// PT: Guloso: tente primeiro mais uma repetição, e só depois tente parar aqui. Uma
		//     iteração que não consumiu nada não é repetida, senão `(a*)*` entraria em laço
		//     infinito.
		// ES: Codicioso: prueba primero una repetición más, y solo después prueba detenerte aquí.
		//     Una iteración que no consumió nada no se repite, o `(a*)*` entraría en un bucle
		//     infinito.
		star := &Node{Kind: Star, Left: node.Left}
		again := backtrack(node.Left, input, i, steps, func(j int) bool {
			if j == i {
				return node.Kind == Plus && rest(j)
			}
			return backtrack(star, input, j, steps, rest)
		})
		return again || (node.Kind == Star && rest(i))
	default:
		return rest(i)
	}
}
