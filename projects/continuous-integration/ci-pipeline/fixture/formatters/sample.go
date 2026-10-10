// Package sample is a well formatted file.
//
// EN: gofmt has nothing to change here: tabs for indentation, spaces around operators.
// PT: O gofmt não tem nada a mudar aqui: tabs na indentação, espaços em volta dos operadores.
// ES: gofmt no tiene nada que cambiar aquí: tabs en la indentación, espacios alrededor de los operadores.
package sample

// Total returns the sum of the prices.
func Total(prices []int) int {
	sum := 0
	for _, price := range prices {
		sum += price
	}
	return sum
}
