// Package cidemo is a demonstration change.
//
// EN: The code is correct, but gofmt would indent it with tabs and put spaces around `:=`.
// PT: O código está correto, mas o gofmt o indentaria com tabs e poria espaços em volta de `:=`.
// ES: El código es correcto, pero gofmt lo indentaría con tabs y pondría espacios alrededor de `:=`.
package cidemo

// Total returns the sum of the prices.
func Total(prices []int) int {
  sum:=0
  for _, price := range prices {
    sum += price
  }
  return sum
}
