window.BIG_O_LAB_RESULTS = {
	"project": "big-o-lab",
	"generatedAt": "2026-10-07T22:26:18.527Z",
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
					"timeMs": 0.0003900000000012227
				},
				{
					"n": 32,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.0002099999999991553
				},
				{
					"n": 64,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00018999999999991246
				},
				{
					"n": 128,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.0002300000000001745
				},
				{
					"n": 256,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00021000000000093166
				},
				{
					"n": 512,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00018999999999991246
				},
				{
					"n": 1024,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.0006699999999995043
				},
				{
					"n": 2048,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.0002599999999990388
				},
				{
					"n": 4096,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00017000000000066962
				},
				{
					"n": 8192,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00015000000000142677
				},
				{
					"n": 16384,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.000140000000000029
				},
				{
					"n": 32768,
					"operations": 1,
					"expected": 1,
					"timeMs": 0.00016999999999889326
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
					"timeMs": 0.0005699999999997374
				},
				{
					"n": 32,
					"operations": 6,
					"expected": 6,
					"timeMs": 0.000600000000000378
				},
				{
					"n": 64,
					"operations": 7,
					"expected": 7,
					"timeMs": 0.0006400000000006401
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
					"timeMs": 0.001480000000000814
				},
				{
					"n": 512,
					"operations": 10,
					"expected": 10,
					"timeMs": 0.0016400000000000858
				},
				{
					"n": 1024,
					"operations": 11,
					"expected": 11,
					"timeMs": 0.00172000000000061
				},
				{
					"n": 2048,
					"operations": 12,
					"expected": 12,
					"timeMs": 0.0005109999999994841
				},
				{
					"n": 4096,
					"operations": 13,
					"expected": 13,
					"timeMs": 0.00044999999999895124
				},
				{
					"n": 8192,
					"operations": 14,
					"expected": 14,
					"timeMs": 0.000460000000000349
				},
				{
					"n": 16384,
					"operations": 15,
					"expected": 15,
					"timeMs": 0.0006199999999996209
				},
				{
					"n": 32768,
					"operations": 16,
					"expected": 16,
					"timeMs": 0.0005999999999986017
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
					"timeMs": 0.002600000000001046
				},
				{
					"n": 32,
					"operations": 32,
					"expected": 32,
					"timeMs": 0.001760000000000872
				},
				{
					"n": 64,
					"operations": 64,
					"expected": 64,
					"timeMs": 0.005790000000001072
				},
				{
					"n": 128,
					"operations": 128,
					"expected": 128,
					"timeMs": 0.002829999999999444
				},
				{
					"n": 256,
					"operations": 256,
					"expected": 256,
					"timeMs": 0.005899999999996908
				},
				{
					"n": 512,
					"operations": 512,
					"expected": 512,
					"timeMs": 0.01159099999999924
				},
				{
					"n": 1024,
					"operations": 1024,
					"expected": 1024,
					"timeMs": 0.024871000000000976
				},
				{
					"n": 2048,
					"operations": 2048,
					"expected": 2048,
					"timeMs": 0.06865200000000016
				},
				{
					"n": 4096,
					"operations": 4096,
					"expected": 4096,
					"timeMs": 0.09262299999999968
				},
				{
					"n": 8192,
					"operations": 8192,
					"expected": 8192,
					"timeMs": 0.08792299999999997
				},
				{
					"n": 16384,
					"operations": 16384,
					"expected": 16384,
					"timeMs": 0.11680199999999985
				},
				{
					"n": 32768,
					"operations": 32768,
					"expected": 32768,
					"timeMs": 0.2430570000000003
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
					"timeMs": 0.04164199999999951
				},
				{
					"n": 32,
					"operations": 160,
					"expected": 160,
					"timeMs": 0.0276910000000008
				},
				{
					"n": 64,
					"operations": 384,
					"expected": 384,
					"timeMs": 0.056132000000001625
				},
				{
					"n": 128,
					"operations": 896,
					"expected": 896,
					"timeMs": 0.12248500000000107
				},
				{
					"n": 256,
					"operations": 2048,
					"expected": 2048,
					"timeMs": 0.1802740000000007
				},
				{
					"n": 512,
					"operations": 4608,
					"expected": 4608,
					"timeMs": 0.36906199999999956
				},
				{
					"n": 1024,
					"operations": 10240,
					"expected": 10240,
					"timeMs": 0.6699529999999996
				},
				{
					"n": 2048,
					"operations": 22528,
					"expected": 22528,
					"timeMs": 1.2319320000000005
				},
				{
					"n": 4096,
					"operations": 49152,
					"expected": 49152,
					"timeMs": 2.268577999999998
				},
				{
					"n": 8192,
					"operations": 106496,
					"expected": 106496,
					"timeMs": 5.008004000000007
				},
				{
					"n": 16384,
					"operations": 229376,
					"expected": 229376,
					"timeMs": 6.609284000000002
				},
				{
					"n": 32768,
					"operations": 491520,
					"expected": 491520,
					"timeMs": 13.748549999999994
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
					"timeMs": 0.015971000000007507
				},
				{
					"n": 32,
					"operations": 496,
					"expected": 496,
					"timeMs": 0.010649999999998272
				},
				{
					"n": 64,
					"operations": 2016,
					"expected": 2016,
					"timeMs": 0.02941099999998187
				},
				{
					"n": 128,
					"operations": 8128,
					"expected": 8128,
					"timeMs": 0.12789399999999773
				},
				{
					"n": 256,
					"operations": 32640,
					"expected": 32640,
					"timeMs": 0.1528160000000014
				},
				{
					"n": 512,
					"operations": 130816,
					"expected": 130816,
					"timeMs": 0.7476060000000189
				},
				{
					"n": 1024,
					"operations": 523776,
					"expected": 523776,
					"timeMs": 1.3044339999999863
				},
				{
					"n": 2048,
					"operations": 2096128,
					"expected": 2096128,
					"timeMs": 6.2967160000000035
				},
				{
					"n": 4096,
					"operations": 8386560,
					"expected": 8386560,
					"timeMs": 36.25916799999999
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
					"timeMs": 0.002139999999997144
				},
				{
					"n": 2,
					"operations": 4,
					"expected": 4,
					"timeMs": 0.0024800000000482214
				},
				{
					"n": 4,
					"operations": 16,
					"expected": 16,
					"timeMs": 0.008690000000001419
				},
				{
					"n": 8,
					"operations": 256,
					"expected": 256,
					"timeMs": 0.023141000000009626
				},
				{
					"n": 16,
					"operations": 65536,
					"expected": 65536,
					"timeMs": 1.4622100000000273
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
