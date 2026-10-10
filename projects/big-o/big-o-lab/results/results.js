window.BIG_O_LAB_RESULTS = {
	"project": "big-o-lab",
	"generatedAt": "2026-10-10T10:16:41.396Z",
	"command": "docker compose run --rm ts-demo",
	"repetitions": 5,
	"machine": {
		"CPU": "AMD Ryzen 7 5700X3D 8-Core Processor",
		"logical cores": "16",
		"memory": "15.6 GiB",
		"platform": "linux x64",
		"runtime": "Bun 1.4.2 (oven/bun:1.4.2)"
	},
	"samples": [
		{
			"id": "constant",
			"title": "read the middle element of an array",
			"operation": "array reads",
			"formula": "1",
			"points": [
				{
					"n": 16,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00021000000000093166
				},
				{
					"n": 32,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00012000000000078614
				},
				{
					"n": 64,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.0001000000000015433
				},
				{
					"n": 128,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00012000000000078614
				},
				{
					"n": 256,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00015999999999927184
				},
				{
					"n": 512,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00017000000000066962
				},
				{
					"n": 1024,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.0006500000000002615
				},
				{
					"n": 2048,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.0003100000000006986
				},
				{
					"n": 4096,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.000140000000000029
				},
				{
					"n": 8192,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.000140000000000029
				},
				{
					"n": 16384,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00013000000000040757
				},
				{
					"n": 32768,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00017000000000066962
				}
			],
			"fit": {
				"best": {
					"id": "constant",
					"label": "O(1)",
					"scale": 0,
					"intercept": 1,
					"error": 0
				},
				"candidates": [
					{
						"id": "constant",
						"label": "O(1)",
						"scale": 0,
						"intercept": 1,
						"error": 0
					},
					{
						"id": "logarithmic",
						"label": "O(log n)",
						"scale": 0,
						"intercept": 1,
						"error": 0
					},
					{
						"id": "linear",
						"label": "O(n)",
						"scale": 0,
						"intercept": 1,
						"error": 0
					},
					{
						"id": "linearithmic",
						"label": "O(n log n)",
						"scale": 0,
						"intercept": 1,
						"error": 0
					},
					{
						"id": "quadratic",
						"label": "O(n^2)",
						"scale": 0,
						"intercept": 1,
						"error": 0
					},
					{
						"id": "exponential",
						"label": "O(2^n)",
						"scale": 0,
						"intercept": 0,
						"error": null
					}
				]
			}
		},
		{
			"id": "logarithmic",
			"title": "binary search for a missing value",
			"operation": "halvings of the interval",
			"formula": "floor(log2 n) + 1",
			"points": [
				{
					"n": 16,
					"operations": 5,
					"expected": 5,
					"timeMs": 0.0006199999999996209
				},
				{
					"n": 32,
					"operations": 6,
					"expected": 6,
					"timeMs": 0.001580000000000581
				},
				{
					"n": 64,
					"operations": 7,
					"expected": 7,
					"timeMs": 0.0006799999999991257
				},
				{
					"n": 128,
					"operations": 8,
					"expected": 8,
					"timeMs": 0.000560000000000116
				},
				{
					"n": 256,
					"operations": 9,
					"expected": 9,
					"timeMs": 0.0018899999999995032
				},
				{
					"n": 512,
					"operations": 10,
					"expected": 10,
					"timeMs": 0.000560000000000116
				},
				{
					"n": 1024,
					"operations": 11,
					"expected": 11,
					"timeMs": 0.000460000000000349
				},
				{
					"n": 2048,
					"operations": 12,
					"expected": 12,
					"timeMs": 0.00046999999999997044
				},
				{
					"n": 4096,
					"operations": 13,
					"expected": 13,
					"timeMs": 0.0005199999999998539
				},
				{
					"n": 8192,
					"operations": 14,
					"expected": 14,
					"timeMs": 0.0005699999999997374
				},
				{
					"n": 16384,
					"operations": 15,
					"expected": 15,
					"timeMs": 0.0005699999999997374
				},
				{
					"n": 32768,
					"operations": 16,
					"expected": 16,
					"timeMs": 0.0003799999999998249
				}
			],
			"fit": {
				"best": {
					"id": "logarithmic",
					"label": "O(log n)",
					"scale": 1,
					"intercept": 1,
					"error": 0
				},
				"candidates": [
					{
						"id": "constant",
						"label": "O(1)",
						"scale": 0,
						"intercept": 10.5,
						"error": 0.3287669075747298
					},
					{
						"id": "logarithmic",
						"label": "O(log n)",
						"scale": 1,
						"intercept": 1,
						"error": 0
					},
					{
						"id": "linear",
						"label": "O(n)",
						"scale": 0.0002747252747252747,
						"intercept": 9,
						"error": 0.21638696886066883
					},
					{
						"id": "linearithmic",
						"label": "O(n log n)",
						"scale": 0.000017865198732059247,
						"intercept": 9.134098365741679,
						"error": 0.22485973770695156
					},
					{
						"id": "quadratic",
						"label": "O(n^2)",
						"scale": 6.984919725949748e-9,
						"intercept": 9.666666666666666,
						"error": 0.26274515411260485
					},
					{
						"id": "exponential",
						"label": "O(2^n)",
						"scale": 0,
						"intercept": 0,
						"error": null
					}
				]
			}
		},
		{
			"id": "linear",
			"title": "sum of all elements",
			"operation": "additions",
			"formula": "n",
			"points": [
				{
					"n": 16,
					"operations": 16,
					"expected": 16,
					"timeMs": 0.00370999999999988
				},
				{
					"n": 32,
					"operations": 32,
					"expected": 32,
					"timeMs": 0.0026599999999987745
				},
				{
					"n": 64,
					"operations": 64,
					"expected": 64,
					"timeMs": 0.008001000000000147
				},
				{
					"n": 128,
					"operations": 128,
					"expected": 128,
					"timeMs": 0.003029999999998978
				},
				{
					"n": 256,
					"operations": 256,
					"expected": 256,
					"timeMs": 0.006840000000000401
				},
				{
					"n": 512,
					"operations": 512,
					"expected": 512,
					"timeMs": 0.005839999999999179
				},
				{
					"n": 1024,
					"operations": 1024,
					"expected": 1024,
					"timeMs": 0.011821000000001192
				},
				{
					"n": 2048,
					"operations": 2048,
					"expected": 2048,
					"timeMs": 0.03111200000000025
				},
				{
					"n": 4096,
					"operations": 4096,
					"expected": 4096,
					"timeMs": 0.05644399999999905
				},
				{
					"n": 8192,
					"operations": 8192,
					"expected": 8192,
					"timeMs": 0.05584299999999942
				},
				{
					"n": 16384,
					"operations": 16384,
					"expected": 16384,
					"timeMs": 0.09813600000000022
				},
				{
					"n": 32768,
					"operations": 32768,
					"expected": 32768,
					"timeMs": 0.18876200000000054
				}
			],
			"fit": {
				"best": {
					"id": "linear",
					"label": "O(n)",
					"scale": 1,
					"intercept": 0,
					"error": 0
				},
				"candidates": [
					{
						"id": "constant",
						"label": "O(1)",
						"scale": 0,
						"intercept": 5460,
						"error": 1.7326146720934814
					},
					{
						"id": "logarithmic",
						"label": "O(log n)",
						"scale": 2063.1608391608393,
						"intercept": -14140.027972027972,
						"error": 1.1403679277319312
					},
					{
						"id": "linear",
						"label": "O(n)",
						"scale": 1,
						"intercept": 0,
						"error": 0
					},
					{
						"id": "linearithmic",
						"label": "O(n log n)",
						"scale": 0.06704918287083911,
						"intercept": 333.6876744271249,
						"error": 0.07324780433814206
					},
					{
						"id": "quadratic",
						"label": "O(n^2)",
						"scale": 0.000030589697536370645,
						"intercept": 1810.5071477144133,
						"error": 0.4816703739934969
					},
					{
						"id": "exponential",
						"label": "O(2^n)",
						"scale": 0,
						"intercept": 0,
						"error": null
					}
				]
			}
		},
		{
			"id": "linearithmic",
			"title": "merge sort",
			"operation": "elements written while merging",
			"formula": "n * ceil(log2 n) - 2^ceil(log2 n) + n",
			"points": [
				{
					"n": 16,
					"operations": 64,
					"expected": 64,
					"timeMs": 0.045513000000003245
				},
				{
					"n": 32,
					"operations": 160,
					"expected": 160,
					"timeMs": 0.02637099999999748
				},
				{
					"n": 64,
					"operations": 384,
					"expected": 384,
					"timeMs": 0.0630740000000003
				},
				{
					"n": 128,
					"operations": 896,
					"expected": 896,
					"timeMs": 0.11582600000000198
				},
				{
					"n": 256,
					"operations": 2048,
					"expected": 2048,
					"timeMs": 0.11337599999999881
				},
				{
					"n": 512,
					"operations": 4608,
					"expected": 4608,
					"timeMs": 0.16812000000000182
				},
				{
					"n": 1024,
					"operations": 10240,
					"expected": 10240,
					"timeMs": 0.33525900000000064
				},
				{
					"n": 2048,
					"operations": 22528,
					"expected": 22528,
					"timeMs": 0.5338719999999988
				},
				{
					"n": 4096,
					"operations": 49152,
					"expected": 49152,
					"timeMs": 0.8308190000000053
				},
				{
					"n": 8192,
					"operations": 106496,
					"expected": 106496,
					"timeMs": 2.5384010000000004
				},
				{
					"n": 16384,
					"operations": 229376,
					"expected": 229376,
					"timeMs": 4.628497000000003
				},
				{
					"n": 32768,
					"operations": 491520,
					"expected": 491520,
					"timeMs": 11.463217999999998
				}
			],
			"fit": {
				"best": {
					"id": "linearithmic",
					"label": "O(n log n)",
					"scale": 1,
					"intercept": 0,
					"error": 0
				},
				"candidates": [
					{
						"id": "constant",
						"label": "O(1)",
						"scale": 0,
						"intercept": 76456,
						"error": 1.8437461413540266
					},
					{
						"id": "logarithmic",
						"label": "O(log n)",
						"scale": 29790.545454545456,
						"intercept": -206554.18181818182,
						"error": 1.2610279933628479
					},
					{
						"id": "linear",
						"label": "O(n)",
						"scale": 14.887769060029695,
						"intercept": -4831.21906776214,
						"error": 0.07794598463599854
					},
					{
						"id": "linearithmic",
						"label": "O(n log n)",
						"scale": 1,
						"intercept": 0,
						"error": 0
					},
					{
						"id": "quadratic",
						"label": "O(n^2)",
						"scale": 0.0004607808600210007,
						"intercept": 21482.70537630412,
						"error": 0.4405387174716884
					},
					{
						"id": "exponential",
						"label": "O(2^n)",
						"scale": 0,
						"intercept": 0,
						"error": null
					}
				]
			}
		},
		{
			"id": "quadratic",
			"title": "count inversions comparing every pair",
			"operation": "comparisons",
			"formula": "n * (n - 1) / 2",
			"points": [
				{
					"n": 16,
					"operations": 120,
					"expected": 120,
					"timeMs": 0.012321000000014237
				},
				{
					"n": 32,
					"operations": 496,
					"expected": 496,
					"timeMs": 0.007469999999983656
				},
				{
					"n": 64,
					"operations": 2016,
					"expected": 2016,
					"timeMs": 0.01730099999997492
				},
				{
					"n": 128,
					"operations": 8128,
					"expected": 8128,
					"timeMs": 0.06764400000000137
				},
				{
					"n": 256,
					"operations": 32640,
					"expected": 32640,
					"timeMs": 0.13393800000000056
				},
				{
					"n": 512,
					"operations": 130816,
					"expected": 130816,
					"timeMs": 0.4632179999999835
				},
				{
					"n": 1024,
					"operations": 523776,
					"expected": 523776,
					"timeMs": 1.067212999999981
				},
				{
					"n": 2048,
					"operations": 2096128,
					"expected": 2096128,
					"timeMs": 4.775296999999995
				},
				{
					"n": 4096,
					"operations": 8386560,
					"expected": 8386560,
					"timeMs": 24.607934
				}
			],
			"fit": {
				"best": {
					"id": "quadratic",
					"label": "O(n^2)",
					"scale": 0.49988101911496907,
					"intercept": -158.4947565542534,
					"error": 0.00014001153913343717
				},
				"candidates": [
					{
						"id": "constant",
						"label": "O(1)",
						"scale": 0,
						"intercept": 1242297.7777777778,
						"error": 2.0978951407701913
					},
					{
						"id": "logarithmic",
						"label": "O(log n)",
						"scale": 683314.3999999999,
						"intercept": -4224217.422222221,
						"error": 1.5440850102678247
					},
					{
						"id": "linear",
						"label": "O(n)",
						"scale": 1947.5222345747634,
						"intercept": -526917.9766536963,
						"error": 0.5665290537615018
					},
					{
						"id": "linearithmic",
						"label": "O(n log n)",
						"scale": 164.21611168575842,
						"intercept": -401323.0378503464,
						"error": 0.4700304580000807
					},
					{
						"id": "quadratic",
						"label": "O(n^2)",
						"scale": 0.49988101911496907,
						"intercept": -158.4947565542534,
						"error": 0.00014001153913343717
					},
					{
						"id": "exponential",
						"label": "O(2^n)",
						"scale": 0,
						"intercept": 0,
						"error": null
					}
				]
			}
		},
		{
			"id": "exponential",
			"title": "enumerate every subset",
			"operation": "subsets visited",
			"formula": "2^n",
			"points": [
				{
					"n": 1,
					"operations": 2,
					"expected": 2,
					"timeMs": 0.001829999999984011
				},
				{
					"n": 2,
					"operations": 4,
					"expected": 4,
					"timeMs": 0.0015900000000215186
				},
				{
					"n": 4,
					"operations": 16,
					"expected": 16,
					"timeMs": 0.005269999999995889
				},
				{
					"n": 8,
					"operations": 256,
					"expected": 256,
					"timeMs": 0.0236810000000105
				},
				{
					"n": 16,
					"operations": 65536,
					"expected": 65536,
					"timeMs": 1.1420870000000036
				}
			],
			"fit": {
				"best": {
					"id": "exponential",
					"label": "O(2^n)",
					"scale": 1,
					"intercept": 0,
					"error": 0
				},
				"candidates": [
					{
						"id": "constant",
						"label": "O(1)",
						"scale": 0,
						"intercept": 13162.8,
						"error": 1.989453424557436
					},
					{
						"id": "logarithmic",
						"label": "O(log n)",
						"scale": 13132,
						"intercept": -13101.2,
						"error": 1.4025953403102807
					},
					{
						"id": "linear",
						"label": "O(n)",
						"scale": 4318.892473118278,
						"intercept": -13614.333333333325,
						"error": 0.8683367740261911
					},
					{
						"id": "linearithmic",
						"label": "O(n log n)",
						"scale": 1032.4310442678775,
						"intercept": -7072.848467650401,
						"error": 0.6993622974450633
					},
					{
						"id": "quadratic",
						"label": "O(n^2)",
						"scale": 263.78726140865365,
						"intercept": -4827.491228070179,
						"error": 0.4592858146950206
					},
					{
						"id": "exponential",
						"label": "O(2^n)",
						"scale": 1,
						"intercept": 0,
						"error": 0
					}
				]
			}
		}
	]
};
