window.MASTER_THEOREM_RESULTS = {
	"project": "master-theorem",
	"generatedAt": "2026-10-07T22:49:29.690Z",
	"examples": [
		{
			"name": "binary search",
			"classification": {
				"recurrence": {
					"a": 1,
					"b": 2,
					"d": 0,
					"k": 0
				},
				"criticalExponent": 0,
				"case": "case-2",
				"solution": "Θ(log n)",
				"reason": {
					"en": "f(n) = 1 has the same order as 1, so every level costs the same and there are log n levels.",
					"pt": "f(n) = 1 tem a mesma ordem de 1, então todo nível custa o mesmo e há log n níveis."
				},
				"extendedSolution": null
			}
		},
		{
			"name": "merge sort",
			"classification": {
				"recurrence": {
					"a": 2,
					"b": 2,
					"d": 1,
					"k": 0
				},
				"criticalExponent": 1,
				"case": "case-2",
				"solution": "Θ(n log n)",
				"reason": {
					"en": "f(n) = n has the same order as n, so every level costs the same and there are log n levels.",
					"pt": "f(n) = n tem a mesma ordem de n, então todo nível custa o mesmo e há log n níveis."
				},
				"extendedSolution": null
			}
		},
		{
			"name": "binary tree traversal",
			"classification": {
				"recurrence": {
					"a": 2,
					"b": 2,
					"d": 0,
					"k": 0
				},
				"criticalExponent": 1,
				"case": "case-1",
				"solution": "Θ(n)",
				"reason": {
					"en": "f(n) = 1 is polynomially smaller than n, so the leaves of the recursion tree dominate.",
					"pt": "f(n) = 1 é polinomialmente menor que n, então as folhas da árvore de recursão dominam."
				},
				"extendedSolution": null
			}
		},
		{
			"name": "Karatsuba multiplication",
			"classification": {
				"recurrence": {
					"a": 3,
					"b": 2,
					"d": 1,
					"k": 0
				},
				"criticalExponent": 1.5849625007211563,
				"case": "case-1",
				"solution": "Θ(n^1.58)",
				"reason": {
					"en": "f(n) = n is polynomially smaller than n^1.58, so the leaves of the recursion tree dominate.",
					"pt": "f(n) = n é polinomialmente menor que n^1.58, então as folhas da árvore de recursão dominam."
				},
				"extendedSolution": null
			}
		},
		{
			"name": "Strassen matrix multiplication (7-way split)",
			"classification": {
				"recurrence": {
					"a": 7,
					"b": 2,
					"d": 2,
					"k": 0
				},
				"criticalExponent": 2.807354922057604,
				"case": "case-1",
				"solution": "Θ(n^2.81)",
				"reason": {
					"en": "f(n) = n^2 is polynomially smaller than n^2.81, so the leaves of the recursion tree dominate.",
					"pt": "f(n) = n^2 é polinomialmente menor que n^2.81, então as folhas da árvore de recursão dominam."
				},
				"extendedSolution": null
			}
		},
		{
			"name": "schoolbook matrix multiplication by blocks",
			"classification": {
				"recurrence": {
					"a": 8,
					"b": 2,
					"d": 2,
					"k": 0
				},
				"criticalExponent": 3,
				"case": "case-1",
				"solution": "Θ(n^3)",
				"reason": {
					"en": "f(n) = n^2 is polynomially smaller than n^3, so the leaves of the recursion tree dominate.",
					"pt": "f(n) = n^2 é polinomialmente menor que n^3, então as folhas da árvore de recursão dominam."
				},
				"extendedSolution": null
			}
		},
		{
			"name": "median-like halving with linear work",
			"classification": {
				"recurrence": {
					"a": 1,
					"b": 2,
					"d": 1,
					"k": 0
				},
				"criticalExponent": 0,
				"case": "case-3",
				"solution": "Θ(n)",
				"reason": {
					"en": "f(n) = n is polynomially larger than 1, so the root of the recursion tree dominates.",
					"pt": "f(n) = n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
				},
				"extendedSolution": null
			}
		},
		{
			"name": "two halves with quadratic work",
			"classification": {
				"recurrence": {
					"a": 2,
					"b": 2,
					"d": 2,
					"k": 0
				},
				"criticalExponent": 1,
				"case": "case-3",
				"solution": "Θ(n^2)",
				"reason": {
					"en": "f(n) = n^2 is polynomially larger than n, so the root of the recursion tree dominates.",
					"pt": "f(n) = n^2 é polinomialmente maior que n, então a raiz da árvore de recursão domina."
				},
				"extendedSolution": null
			}
		},
		{
			"name": "two halves with n log n work (gap)",
			"classification": {
				"recurrence": {
					"a": 2,
					"b": 2,
					"d": 1,
					"k": 1
				},
				"criticalExponent": 1,
				"case": "not-applicable",
				"solution": null,
				"reason": {
					"en": "f(n) = n log n differs from n only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
					"pt": "f(n) = n log n difere de n apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
				},
				"extendedSolution": "Θ(n log^2 n)"
			}
		},
		{
			"name": "two halves with n / log n work (gap)",
			"classification": {
				"recurrence": {
					"a": 2,
					"b": 2,
					"d": 1,
					"k": -1
				},
				"criticalExponent": 1,
				"case": "not-applicable",
				"solution": null,
				"reason": {
					"en": "f(n) = n log^-1 n differs from n only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
					"pt": "f(n) = n log^-1 n difere de n apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
				},
				"extendedSolution": null
			}
		}
	],
	"checks": [
		{
			"name": "merge sort",
			"report": {
				"classification": {
					"recurrence": {
						"a": 2,
						"b": 2,
						"d": 1,
						"k": 0
					},
					"criticalExponent": 1,
					"case": "case-2",
					"solution": "Θ(n log n)",
					"reason": {
						"en": "f(n) = n has the same order as n, so every level costs the same and there are log n levels.",
						"pt": "f(n) = n tem a mesma ordem de n, então todo nível custa o mesmo e há log n níveis."
					},
					"extendedSolution": null
				},
				"samples": [
					{
						"n": 256,
						"calls": 511,
						"work": 2304,
						"ratio": 1.125
					},
					{
						"n": 1024,
						"calls": 2047,
						"work": 11264,
						"ratio": 1.1
					},
					{
						"n": 4096,
						"calls": 8191,
						"work": 53248,
						"ratio": 1.0833333333333333
					},
					{
						"n": 16384,
						"calls": 32767,
						"work": 245760,
						"ratio": 1.0714285714285714
					},
					{
						"n": 32768,
						"calls": 65535,
						"work": 524288,
						"ratio": 1.0666666666666667
					},
					{
						"n": 65536,
						"calls": 131071,
						"work": 1114112,
						"ratio": 1.0625
					}
				],
				"drift": {
					"predicted": 0.00390625,
					"oneLogLess": 0.0625,
					"oneLogMore": 0.066162109375
				},
				"agrees": true
			}
		},
		{
			"name": "binary search",
			"report": {
				"classification": {
					"recurrence": {
						"a": 1,
						"b": 2,
						"d": 0,
						"k": 0
					},
					"criticalExponent": 0,
					"case": "case-2",
					"solution": "Θ(log n)",
					"reason": {
						"en": "f(n) = 1 has the same order as 1, so every level costs the same and there are log n levels.",
						"pt": "f(n) = 1 tem a mesma ordem de 1, então todo nível custa o mesmo e há log n níveis."
					},
					"extendedSolution": null
				},
				"samples": [
					{
						"n": 256,
						"calls": 9,
						"work": 9,
						"ratio": 1.125
					},
					{
						"n": 4096,
						"calls": 13,
						"work": 13,
						"ratio": 1.0833333333333333
					},
					{
						"n": 65536,
						"calls": 17,
						"work": 17,
						"ratio": 1.0625
					},
					{
						"n": 1048576,
						"calls": 21,
						"work": 21,
						"ratio": 1.05
					},
					{
						"n": 8388608,
						"calls": 24,
						"work": 24,
						"ratio": 1.0434782608695652
					},
					{
						"n": 16777216,
						"calls": 25,
						"work": 25,
						"ratio": 1.0416666666666667
					}
				],
				"drift": {
					"predicted": 0.0017361111111110494,
					"oneLogLess": 0.04166666666666674,
					"oneLogMore": 0.04333043981481488
				},
				"agrees": true
			}
		},
		{
			"name": "7-way split",
			"report": {
				"classification": {
					"recurrence": {
						"a": 7,
						"b": 2,
						"d": 2,
						"k": 0
					},
					"criticalExponent": 2.807354922057604,
					"case": "case-1",
					"solution": "Θ(n^2.81)",
					"reason": {
						"en": "f(n) = n^2 is polynomially smaller than n^2.81, so the leaves of the recursion tree dominate.",
						"pt": "f(n) = n^2 é polinomialmente menor que n^2.81, então as folhas da árvore de recursão dominam."
					},
					"extendedSolution": null
				},
				"samples": [
					{
						"n": 4,
						"calls": 57,
						"work": 93,
						"ratio": 1.897959183673469
					},
					{
						"n": 8,
						"calls": 400,
						"work": 715,
						"ratio": 2.084548104956268
					},
					{
						"n": 16,
						"calls": 2801,
						"work": 5261,
						"ratio": 2.191170345689296
					},
					{
						"n": 32,
						"calls": 19608,
						"work": 37851,
						"ratio": 2.252097340393883
					},
					{
						"n": 64,
						"calls": 137257,
						"work": 269053,
						"ratio": 2.2869127659393613
					},
					{
						"n": 128,
						"calls": 960800,
						"work": 1899755,
						"ratio": 2.306807294822492
					}
				],
				"drift": {
					"predicted": 0.008699295040647925,
					"oneLogLess": 0.17681584421408902,
					"oneLogMore": 0.1354006042508732
				},
				"agrees": true
			}
		}
	],
	"grid": [
		{
			"recurrence": {
				"a": 1,
				"b": 2,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-2",
			"solution": "Θ(log n)",
			"reason": {
				"en": "f(n) = 1 has the same order as 1, so every level costs the same and there are log n levels.",
				"pt": "f(n) = 1 tem a mesma ordem de 1, então todo nível custa o mesmo e há log n níveis."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 2,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "not-applicable",
			"solution": null,
			"reason": {
				"en": "f(n) = log n differs from 1 only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
				"pt": "f(n) = log n difere de 1 apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
			},
			"extendedSolution": "Θ(log^2 n)"
		},
		{
			"recurrence": {
				"a": 1,
				"b": 2,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 2,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n log n)",
			"reason": {
				"en": "f(n) = n log n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n log n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 2,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 2,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 2,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 2,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 3,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-2",
			"solution": "Θ(log n)",
			"reason": {
				"en": "f(n) = 1 has the same order as 1, so every level costs the same and there are log n levels.",
				"pt": "f(n) = 1 tem a mesma ordem de 1, então todo nível custa o mesmo e há log n níveis."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 3,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "not-applicable",
			"solution": null,
			"reason": {
				"en": "f(n) = log n differs from 1 only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
				"pt": "f(n) = log n difere de 1 apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
			},
			"extendedSolution": "Θ(log^2 n)"
		},
		{
			"recurrence": {
				"a": 1,
				"b": 3,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 3,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n log n)",
			"reason": {
				"en": "f(n) = n log n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n log n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 3,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 3,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 3,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 3,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 4,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-2",
			"solution": "Θ(log n)",
			"reason": {
				"en": "f(n) = 1 has the same order as 1, so every level costs the same and there are log n levels.",
				"pt": "f(n) = 1 tem a mesma ordem de 1, então todo nível custa o mesmo e há log n níveis."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 4,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "not-applicable",
			"solution": null,
			"reason": {
				"en": "f(n) = log n differs from 1 only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
				"pt": "f(n) = log n difere de 1 apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
			},
			"extendedSolution": "Θ(log^2 n)"
		},
		{
			"recurrence": {
				"a": 1,
				"b": 4,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 4,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n log n)",
			"reason": {
				"en": "f(n) = n log n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n log n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 4,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 4,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 4,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 1,
				"b": 4,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 0,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than 1, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que 1, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 2,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-1",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 2,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "case-1",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 2,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-2",
			"solution": "Θ(n log n)",
			"reason": {
				"en": "f(n) = n has the same order as n, so every level costs the same and there are log n levels.",
				"pt": "f(n) = n tem a mesma ordem de n, então todo nível custa o mesmo e há log n níveis."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 2,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "not-applicable",
			"solution": null,
			"reason": {
				"en": "f(n) = n log n differs from n only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
				"pt": "f(n) = n log n difere de n apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
			},
			"extendedSolution": "Θ(n log^2 n)"
		},
		{
			"recurrence": {
				"a": 2,
				"b": 2,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 2,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 2,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 2,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 3,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 0.6309297535714574,
			"case": "case-1",
			"solution": "Θ(n^0.63)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^0.63, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^0.63, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 3,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 0.6309297535714574,
			"case": "case-1",
			"solution": "Θ(n^0.63)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^0.63, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^0.63, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 3,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 0.6309297535714574,
			"case": "case-3",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = n is polynomially larger than n^0.63, so the root of the recursion tree dominates.",
				"pt": "f(n) = n é polinomialmente maior que n^0.63, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 3,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 0.6309297535714574,
			"case": "case-3",
			"solution": "Θ(n log n)",
			"reason": {
				"en": "f(n) = n log n is polynomially larger than n^0.63, so the root of the recursion tree dominates.",
				"pt": "f(n) = n log n é polinomialmente maior que n^0.63, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 3,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 0.6309297535714574,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^0.63, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^0.63, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 3,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 0.6309297535714574,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^0.63, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^0.63, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 3,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 0.6309297535714574,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^0.63, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^0.63, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 3,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 0.6309297535714574,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^0.63, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^0.63, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 4,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 0.5,
			"case": "case-1",
			"solution": "Θ(n^0.50)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^0.50, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^0.50, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 4,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 0.5,
			"case": "case-1",
			"solution": "Θ(n^0.50)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^0.50, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^0.50, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 4,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 0.5,
			"case": "case-3",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = n is polynomially larger than n^0.50, so the root of the recursion tree dominates.",
				"pt": "f(n) = n é polinomialmente maior que n^0.50, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 4,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 0.5,
			"case": "case-3",
			"solution": "Θ(n log n)",
			"reason": {
				"en": "f(n) = n log n is polynomially larger than n^0.50, so the root of the recursion tree dominates.",
				"pt": "f(n) = n log n é polinomialmente maior que n^0.50, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 4,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 0.5,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^0.50, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^0.50, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 4,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 0.5,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^0.50, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^0.50, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 4,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 0.5,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^0.50, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^0.50, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 2,
				"b": 4,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 0.5,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^0.50, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^0.50, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 2,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-1",
			"solution": "Θ(n^1.58)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 2,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-1",
			"solution": "Θ(n^1.58)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 2,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-1",
			"solution": "Θ(n^1.58)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 2,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-1",
			"solution": "Θ(n^1.58)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 2,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.58, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.58, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 2,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.58, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.58, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 2,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.58, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.58, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 2,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.58, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.58, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 3,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-1",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 3,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "case-1",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 3,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-2",
			"solution": "Θ(n log n)",
			"reason": {
				"en": "f(n) = n has the same order as n, so every level costs the same and there are log n levels.",
				"pt": "f(n) = n tem a mesma ordem de n, então todo nível custa o mesmo e há log n níveis."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 3,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "not-applicable",
			"solution": null,
			"reason": {
				"en": "f(n) = n log n differs from n only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
				"pt": "f(n) = n log n difere de n apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
			},
			"extendedSolution": "Θ(n log^2 n)"
		},
		{
			"recurrence": {
				"a": 3,
				"b": 3,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 3,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 3,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 3,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 4,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 0.7924812503605781,
			"case": "case-1",
			"solution": "Θ(n^0.79)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^0.79, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^0.79, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 4,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 0.7924812503605781,
			"case": "case-1",
			"solution": "Θ(n^0.79)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^0.79, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^0.79, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 4,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 0.7924812503605781,
			"case": "case-3",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = n is polynomially larger than n^0.79, so the root of the recursion tree dominates.",
				"pt": "f(n) = n é polinomialmente maior que n^0.79, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 4,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 0.7924812503605781,
			"case": "case-3",
			"solution": "Θ(n log n)",
			"reason": {
				"en": "f(n) = n log n is polynomially larger than n^0.79, so the root of the recursion tree dominates.",
				"pt": "f(n) = n log n é polinomialmente maior que n^0.79, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 4,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 0.7924812503605781,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^0.79, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^0.79, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 4,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 0.7924812503605781,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^0.79, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^0.79, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 4,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 0.7924812503605781,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^0.79, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^0.79, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 3,
				"b": 4,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 0.7924812503605781,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^0.79, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^0.79, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 2,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 2,
			"case": "case-1",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^2, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^2, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 2,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 2,
			"case": "case-1",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^2, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^2, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 2,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 2,
			"case": "case-1",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^2, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^2, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 2,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 2,
			"case": "case-1",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^2, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^2, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 2,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 2,
			"case": "case-2",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 has the same order as n^2, so every level costs the same and there are log n levels.",
				"pt": "f(n) = n^2 tem a mesma ordem de n^2, então todo nível custa o mesmo e há log n níveis."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 2,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 2,
			"case": "not-applicable",
			"solution": null,
			"reason": {
				"en": "f(n) = n^2 log n differs from n^2 only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
				"pt": "f(n) = n^2 log n difere de n^2 apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
			},
			"extendedSolution": "Θ(n^2 log^2 n)"
		},
		{
			"recurrence": {
				"a": 4,
				"b": 2,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 2,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^2, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^2, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 2,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 2,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^2, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^2, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 3,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.2618595071429148,
			"case": "case-1",
			"solution": "Θ(n^1.26)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.26, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.26, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 3,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.2618595071429148,
			"case": "case-1",
			"solution": "Θ(n^1.26)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.26, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.26, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 3,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.2618595071429148,
			"case": "case-1",
			"solution": "Θ(n^1.26)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.26, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.26, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 3,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.2618595071429148,
			"case": "case-1",
			"solution": "Θ(n^1.26)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.26, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.26, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 3,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.2618595071429148,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.26, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.26, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 3,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.2618595071429148,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.26, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.26, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 3,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.2618595071429148,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.26, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.26, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 3,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.2618595071429148,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.26, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.26, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 4,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-1",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 4,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "case-1",
			"solution": "Θ(n)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 4,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-2",
			"solution": "Θ(n log n)",
			"reason": {
				"en": "f(n) = n has the same order as n, so every level costs the same and there are log n levels.",
				"pt": "f(n) = n tem a mesma ordem de n, então todo nível custa o mesmo e há log n níveis."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 4,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "not-applicable",
			"solution": null,
			"reason": {
				"en": "f(n) = n log n differs from n only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
				"pt": "f(n) = n log n difere de n apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
			},
			"extendedSolution": "Θ(n log^2 n)"
		},
		{
			"recurrence": {
				"a": 4,
				"b": 4,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 4,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 4,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 4,
				"b": 4,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 2,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 2.321928094887362,
			"case": "case-1",
			"solution": "Θ(n^2.32)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^2.32, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^2.32, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 2,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 2.321928094887362,
			"case": "case-1",
			"solution": "Θ(n^2.32)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^2.32, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^2.32, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 2,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 2.321928094887362,
			"case": "case-1",
			"solution": "Θ(n^2.32)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^2.32, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^2.32, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 2,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 2.321928094887362,
			"case": "case-1",
			"solution": "Θ(n^2.32)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^2.32, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^2.32, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 2,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 2.321928094887362,
			"case": "case-1",
			"solution": "Θ(n^2.32)",
			"reason": {
				"en": "f(n) = n^2 is polynomially smaller than n^2.32, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^2 é polinomialmente menor que n^2.32, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 2,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 2.321928094887362,
			"case": "case-1",
			"solution": "Θ(n^2.32)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially smaller than n^2.32, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^2 log n é polinomialmente menor que n^2.32, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 2,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 2.321928094887362,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^2.32, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^2.32, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 2,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 2.321928094887362,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^2.32, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^2.32, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 3,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.4649735207179269,
			"case": "case-1",
			"solution": "Θ(n^1.46)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.46, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.46, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 3,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.4649735207179269,
			"case": "case-1",
			"solution": "Θ(n^1.46)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.46, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.46, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 3,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.4649735207179269,
			"case": "case-1",
			"solution": "Θ(n^1.46)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.46, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.46, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 3,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.4649735207179269,
			"case": "case-1",
			"solution": "Θ(n^1.46)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.46, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.46, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 3,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.4649735207179269,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.46, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.46, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 3,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.4649735207179269,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.46, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.46, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 3,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.4649735207179269,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.46, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.46, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 3,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.4649735207179269,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.46, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.46, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 4,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.160964047443681,
			"case": "case-1",
			"solution": "Θ(n^1.16)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.16, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.16, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 4,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.160964047443681,
			"case": "case-1",
			"solution": "Θ(n^1.16)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.16, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.16, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 4,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.160964047443681,
			"case": "case-1",
			"solution": "Θ(n^1.16)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.16, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.16, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 4,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.160964047443681,
			"case": "case-1",
			"solution": "Θ(n^1.16)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.16, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.16, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 4,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.160964047443681,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.16, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.16, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 4,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.160964047443681,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.16, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.16, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 4,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.160964047443681,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.16, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.16, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 5,
				"b": 4,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.160964047443681,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.16, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.16, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 2,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 2.584962500721156,
			"case": "case-1",
			"solution": "Θ(n^2.58)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^2.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^2.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 2,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 2.584962500721156,
			"case": "case-1",
			"solution": "Θ(n^2.58)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^2.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^2.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 2,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 2.584962500721156,
			"case": "case-1",
			"solution": "Θ(n^2.58)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^2.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^2.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 2,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 2.584962500721156,
			"case": "case-1",
			"solution": "Θ(n^2.58)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^2.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^2.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 2,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 2.584962500721156,
			"case": "case-1",
			"solution": "Θ(n^2.58)",
			"reason": {
				"en": "f(n) = n^2 is polynomially smaller than n^2.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^2 é polinomialmente menor que n^2.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 2,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 2.584962500721156,
			"case": "case-1",
			"solution": "Θ(n^2.58)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially smaller than n^2.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^2 log n é polinomialmente menor que n^2.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 2,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 2.584962500721156,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^2.58, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^2.58, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 2,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 2.584962500721156,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^2.58, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^2.58, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 3,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.6309297535714573,
			"case": "case-1",
			"solution": "Θ(n^1.63)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.63, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.63, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 3,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.6309297535714573,
			"case": "case-1",
			"solution": "Θ(n^1.63)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.63, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.63, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 3,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.6309297535714573,
			"case": "case-1",
			"solution": "Θ(n^1.63)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.63, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.63, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 3,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.6309297535714573,
			"case": "case-1",
			"solution": "Θ(n^1.63)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.63, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.63, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 3,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.6309297535714573,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.63, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.63, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 3,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.6309297535714573,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.63, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.63, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 3,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.6309297535714573,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.63, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.63, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 3,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.6309297535714573,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.63, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.63, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 4,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.292481250360578,
			"case": "case-1",
			"solution": "Θ(n^1.29)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.29, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.29, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 4,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.292481250360578,
			"case": "case-1",
			"solution": "Θ(n^1.29)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.29, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.29, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 4,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.292481250360578,
			"case": "case-1",
			"solution": "Θ(n^1.29)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.29, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.29, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 4,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.292481250360578,
			"case": "case-1",
			"solution": "Θ(n^1.29)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.29, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.29, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 4,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.292481250360578,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.29, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.29, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 4,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.292481250360578,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.29, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.29, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 4,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.292481250360578,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.29, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.29, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 6,
				"b": 4,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.292481250360578,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.29, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.29, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 2,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 2.807354922057604,
			"case": "case-1",
			"solution": "Θ(n^2.81)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^2.81, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^2.81, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 2,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 2.807354922057604,
			"case": "case-1",
			"solution": "Θ(n^2.81)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^2.81, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^2.81, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 2,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 2.807354922057604,
			"case": "case-1",
			"solution": "Θ(n^2.81)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^2.81, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^2.81, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 2,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 2.807354922057604,
			"case": "case-1",
			"solution": "Θ(n^2.81)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^2.81, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^2.81, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 2,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 2.807354922057604,
			"case": "case-1",
			"solution": "Θ(n^2.81)",
			"reason": {
				"en": "f(n) = n^2 is polynomially smaller than n^2.81, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^2 é polinomialmente menor que n^2.81, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 2,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 2.807354922057604,
			"case": "case-1",
			"solution": "Θ(n^2.81)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially smaller than n^2.81, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^2 log n é polinomialmente menor que n^2.81, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 2,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 2.807354922057604,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^2.81, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^2.81, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 2,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 2.807354922057604,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^2.81, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^2.81, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 3,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.7712437491614221,
			"case": "case-1",
			"solution": "Θ(n^1.77)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.77, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.77, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 3,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.7712437491614221,
			"case": "case-1",
			"solution": "Θ(n^1.77)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.77, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.77, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 3,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.7712437491614221,
			"case": "case-1",
			"solution": "Θ(n^1.77)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.77, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.77, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 3,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.7712437491614221,
			"case": "case-1",
			"solution": "Θ(n^1.77)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.77, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.77, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 3,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.7712437491614221,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.77, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.77, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 3,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.7712437491614221,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.77, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.77, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 3,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.7712437491614221,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.77, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.77, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 3,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.7712437491614221,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.77, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.77, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 4,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.403677461028802,
			"case": "case-1",
			"solution": "Θ(n^1.40)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.40, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.40, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 4,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.403677461028802,
			"case": "case-1",
			"solution": "Θ(n^1.40)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.40, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.40, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 4,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.403677461028802,
			"case": "case-1",
			"solution": "Θ(n^1.40)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.40, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.40, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 4,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.403677461028802,
			"case": "case-1",
			"solution": "Θ(n^1.40)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.40, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.40, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 4,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.403677461028802,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.40, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.40, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 4,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.403677461028802,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.40, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.40, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 4,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.403677461028802,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.40, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.40, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 7,
				"b": 4,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.403677461028802,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.40, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.40, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 2,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 3,
			"case": "case-1",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^3, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^3, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 2,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 3,
			"case": "case-1",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^3, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^3, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 2,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 3,
			"case": "case-1",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^3, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^3, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 2,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 3,
			"case": "case-1",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^3, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^3, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 2,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 3,
			"case": "case-1",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^2 is polynomially smaller than n^3, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^2 é polinomialmente menor que n^3, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 2,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 3,
			"case": "case-1",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially smaller than n^3, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^2 log n é polinomialmente menor que n^3, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 2,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 3,
			"case": "case-2",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 has the same order as n^3, so every level costs the same and there are log n levels.",
				"pt": "f(n) = n^3 tem a mesma ordem de n^3, então todo nível custa o mesmo e há log n níveis."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 2,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 3,
			"case": "not-applicable",
			"solution": null,
			"reason": {
				"en": "f(n) = n^3 log n differs from n^3 only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
				"pt": "f(n) = n^3 log n difere de n^3 apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
			},
			"extendedSolution": "Θ(n^3 log^2 n)"
		},
		{
			"recurrence": {
				"a": 8,
				"b": 3,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.892789260714372,
			"case": "case-1",
			"solution": "Θ(n^1.89)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.89, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.89, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 3,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.892789260714372,
			"case": "case-1",
			"solution": "Θ(n^1.89)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.89, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.89, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 3,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.892789260714372,
			"case": "case-1",
			"solution": "Θ(n^1.89)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.89, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.89, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 3,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.892789260714372,
			"case": "case-1",
			"solution": "Θ(n^1.89)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.89, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.89, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 3,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.892789260714372,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.89, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.89, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 3,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.892789260714372,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.89, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.89, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 3,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.892789260714372,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.89, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.89, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 3,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.892789260714372,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.89, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.89, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 4,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.5,
			"case": "case-1",
			"solution": "Θ(n^1.50)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.50, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.50, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 4,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.5,
			"case": "case-1",
			"solution": "Θ(n^1.50)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.50, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.50, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 4,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.5,
			"case": "case-1",
			"solution": "Θ(n^1.50)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.50, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.50, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 4,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.5,
			"case": "case-1",
			"solution": "Θ(n^1.50)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.50, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.50, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 4,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.5,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.50, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.50, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 4,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.5,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.50, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.50, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 4,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.5,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.50, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.50, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 8,
				"b": 4,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.5,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.50, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.50, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 2,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 3.1699250014423126,
			"case": "case-1",
			"solution": "Θ(n^3.17)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^3.17, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^3.17, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 2,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 3.1699250014423126,
			"case": "case-1",
			"solution": "Θ(n^3.17)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^3.17, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^3.17, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 2,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 3.1699250014423126,
			"case": "case-1",
			"solution": "Θ(n^3.17)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^3.17, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^3.17, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 2,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 3.1699250014423126,
			"case": "case-1",
			"solution": "Θ(n^3.17)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^3.17, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^3.17, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 2,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 3.1699250014423126,
			"case": "case-1",
			"solution": "Θ(n^3.17)",
			"reason": {
				"en": "f(n) = n^2 is polynomially smaller than n^3.17, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^2 é polinomialmente menor que n^3.17, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 2,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 3.1699250014423126,
			"case": "case-1",
			"solution": "Θ(n^3.17)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially smaller than n^3.17, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^2 log n é polinomialmente menor que n^3.17, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 2,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 3.1699250014423126,
			"case": "case-1",
			"solution": "Θ(n^3.17)",
			"reason": {
				"en": "f(n) = n^3 is polynomially smaller than n^3.17, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^3 é polinomialmente menor que n^3.17, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 2,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 3.1699250014423126,
			"case": "case-1",
			"solution": "Θ(n^3.17)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially smaller than n^3.17, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n^3 log n é polinomialmente menor que n^3.17, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 3,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 2,
			"case": "case-1",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^2, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^2, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 3,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 2,
			"case": "case-1",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^2, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^2, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 3,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 2,
			"case": "case-1",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^2, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^2, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 3,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 2,
			"case": "case-1",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^2, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^2, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 3,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 2,
			"case": "case-2",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 has the same order as n^2, so every level costs the same and there are log n levels.",
				"pt": "f(n) = n^2 tem a mesma ordem de n^2, então todo nível custa o mesmo e há log n níveis."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 3,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 2,
			"case": "not-applicable",
			"solution": null,
			"reason": {
				"en": "f(n) = n^2 log n differs from n^2 only by a logarithmic factor, which is neither polynomially smaller nor larger: the three basic cases leave a gap here.",
				"pt": "f(n) = n^2 log n difere de n^2 apenas por um fator logarítmico, que não é polinomialmente menor nem maior: os três casos básicos deixam uma lacuna aqui."
			},
			"extendedSolution": "Θ(n^2 log^2 n)"
		},
		{
			"recurrence": {
				"a": 9,
				"b": 3,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 2,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^2, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^2, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 3,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 2,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^2, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^2, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 4,
				"d": 0,
				"k": 0
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-1",
			"solution": "Θ(n^1.58)",
			"reason": {
				"en": "f(n) = 1 is polynomially smaller than n^1.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = 1 é polinomialmente menor que n^1.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 4,
				"d": 0,
				"k": 1
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-1",
			"solution": "Θ(n^1.58)",
			"reason": {
				"en": "f(n) = log n is polynomially smaller than n^1.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = log n é polinomialmente menor que n^1.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 4,
				"d": 1,
				"k": 0
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-1",
			"solution": "Θ(n^1.58)",
			"reason": {
				"en": "f(n) = n is polynomially smaller than n^1.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n é polinomialmente menor que n^1.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 4,
				"d": 1,
				"k": 1
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-1",
			"solution": "Θ(n^1.58)",
			"reason": {
				"en": "f(n) = n log n is polynomially smaller than n^1.58, so the leaves of the recursion tree dominate.",
				"pt": "f(n) = n log n é polinomialmente menor que n^1.58, então as folhas da árvore de recursão dominam."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 4,
				"d": 2,
				"k": 0
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-3",
			"solution": "Θ(n^2)",
			"reason": {
				"en": "f(n) = n^2 is polynomially larger than n^1.58, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 é polinomialmente maior que n^1.58, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 4,
				"d": 2,
				"k": 1
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-3",
			"solution": "Θ(n^2 log n)",
			"reason": {
				"en": "f(n) = n^2 log n is polynomially larger than n^1.58, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^2 log n é polinomialmente maior que n^1.58, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 4,
				"d": 3,
				"k": 0
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-3",
			"solution": "Θ(n^3)",
			"reason": {
				"en": "f(n) = n^3 is polynomially larger than n^1.58, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 é polinomialmente maior que n^1.58, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		},
		{
			"recurrence": {
				"a": 9,
				"b": 4,
				"d": 3,
				"k": 1
			},
			"criticalExponent": 1.5849625007211563,
			"case": "case-3",
			"solution": "Θ(n^3 log n)",
			"reason": {
				"en": "f(n) = n^3 log n is polynomially larger than n^1.58, so the root of the recursion tree dominates.",
				"pt": "f(n) = n^3 log n é polinomialmente maior que n^1.58, então a raiz da árvore de recursão domina."
			},
			"extendedSolution": null
		}
	]
};
