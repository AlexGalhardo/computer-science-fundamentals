window.SCHED_RESULTS = {
	"project": "cpu-scheduling",
	"seed": 2026,
	"command": "docker compose run --rm demo",
	"example": {
		"processes": [
			{
				"id": "A",
				"arrival": 0,
				"burst": 8,
				"priority": 3
			},
			{
				"id": "B",
				"arrival": 1,
				"burst": 4,
				"priority": 1
			},
			{
				"id": "C",
				"arrival": 2,
				"burst": 9,
				"priority": 4
			},
			{
				"id": "D",
				"arrival": 3,
				"burst": 5,
				"priority": 2
			},
			{
				"id": "E",
				"arrival": 6,
				"burst": 2,
				"priority": 5
			}
		],
		"schedules": [
			{
				"policy": "FCFS",
				"slices": [
					{
						"id": "A",
						"start": 0,
						"end": 8
					},
					{
						"id": "B",
						"start": 8,
						"end": 12
					},
					{
						"id": "C",
						"start": 12,
						"end": 21
					},
					{
						"id": "D",
						"start": 21,
						"end": 26
					},
					{
						"id": "E",
						"start": 26,
						"end": 28
					}
				],
				"metrics": [
					{
						"id": "A",
						"waiting": 0,
						"turnaround": 8,
						"response": 0,
						"dispatches": 1
					},
					{
						"id": "B",
						"waiting": 7,
						"turnaround": 11,
						"response": 7,
						"dispatches": 1
					},
					{
						"id": "C",
						"waiting": 10,
						"turnaround": 19,
						"response": 10,
						"dispatches": 1
					},
					{
						"id": "D",
						"waiting": 18,
						"turnaround": 23,
						"response": 18,
						"dispatches": 1
					},
					{
						"id": "E",
						"waiting": 20,
						"turnaround": 22,
						"response": 20,
						"dispatches": 1
					}
				],
				"averages": {
					"waiting": 11,
					"turnaround": 16.6,
					"response": 11,
					"maxWaiting": 20
				}
			},
			{
				"policy": "SJF",
				"slices": [
					{
						"id": "A",
						"start": 0,
						"end": 8
					},
					{
						"id": "E",
						"start": 8,
						"end": 10
					},
					{
						"id": "B",
						"start": 10,
						"end": 14
					},
					{
						"id": "D",
						"start": 14,
						"end": 19
					},
					{
						"id": "C",
						"start": 19,
						"end": 28
					}
				],
				"metrics": [
					{
						"id": "A",
						"waiting": 0,
						"turnaround": 8,
						"response": 0,
						"dispatches": 1
					},
					{
						"id": "B",
						"waiting": 9,
						"turnaround": 13,
						"response": 9,
						"dispatches": 1
					},
					{
						"id": "C",
						"waiting": 17,
						"turnaround": 26,
						"response": 17,
						"dispatches": 1
					},
					{
						"id": "D",
						"waiting": 11,
						"turnaround": 16,
						"response": 11,
						"dispatches": 1
					},
					{
						"id": "E",
						"waiting": 2,
						"turnaround": 4,
						"response": 2,
						"dispatches": 1
					}
				],
				"averages": {
					"waiting": 7.8,
					"turnaround": 13.4,
					"response": 7.8,
					"maxWaiting": 17
				}
			},
			{
				"policy": "RR(q=4)",
				"slices": [
					{
						"id": "A",
						"start": 0,
						"end": 4
					},
					{
						"id": "B",
						"start": 4,
						"end": 8
					},
					{
						"id": "C",
						"start": 8,
						"end": 12
					},
					{
						"id": "D",
						"start": 12,
						"end": 16
					},
					{
						"id": "A",
						"start": 16,
						"end": 20
					},
					{
						"id": "E",
						"start": 20,
						"end": 22
					},
					{
						"id": "C",
						"start": 22,
						"end": 26
					},
					{
						"id": "D",
						"start": 26,
						"end": 27
					},
					{
						"id": "C",
						"start": 27,
						"end": 28
					}
				],
				"metrics": [
					{
						"id": "A",
						"waiting": 12,
						"turnaround": 20,
						"response": 0,
						"dispatches": 2
					},
					{
						"id": "B",
						"waiting": 3,
						"turnaround": 7,
						"response": 3,
						"dispatches": 1
					},
					{
						"id": "C",
						"waiting": 17,
						"turnaround": 26,
						"response": 6,
						"dispatches": 3
					},
					{
						"id": "D",
						"waiting": 19,
						"turnaround": 24,
						"response": 9,
						"dispatches": 2
					},
					{
						"id": "E",
						"waiting": 14,
						"turnaround": 16,
						"response": 14,
						"dispatches": 1
					}
				],
				"averages": {
					"waiting": 13,
					"turnaround": 18.6,
					"response": 6.4,
					"maxWaiting": 19
				}
			},
			{
				"policy": "Priority",
				"slices": [
					{
						"id": "A",
						"start": 0,
						"end": 8
					},
					{
						"id": "B",
						"start": 8,
						"end": 12
					},
					{
						"id": "D",
						"start": 12,
						"end": 17
					},
					{
						"id": "C",
						"start": 17,
						"end": 26
					},
					{
						"id": "E",
						"start": 26,
						"end": 28
					}
				],
				"metrics": [
					{
						"id": "A",
						"waiting": 0,
						"turnaround": 8,
						"response": 0,
						"dispatches": 1
					},
					{
						"id": "B",
						"waiting": 7,
						"turnaround": 11,
						"response": 7,
						"dispatches": 1
					},
					{
						"id": "C",
						"waiting": 15,
						"turnaround": 24,
						"response": 15,
						"dispatches": 1
					},
					{
						"id": "D",
						"waiting": 9,
						"turnaround": 14,
						"response": 9,
						"dispatches": 1
					},
					{
						"id": "E",
						"waiting": 20,
						"turnaround": 22,
						"response": 20,
						"dispatches": 1
					}
				],
				"averages": {
					"waiting": 10.2,
					"turnaround": 15.8,
					"response": 10.2,
					"maxWaiting": 20
				}
			},
			{
				"policy": "MLFQ(q=2,levels=3)",
				"slices": [
					{
						"id": "A",
						"start": 0,
						"end": 2
					},
					{
						"id": "B",
						"start": 2,
						"end": 4
					},
					{
						"id": "C",
						"start": 4,
						"end": 6
					},
					{
						"id": "D",
						"start": 6,
						"end": 8
					},
					{
						"id": "E",
						"start": 8,
						"end": 10
					},
					{
						"id": "A",
						"start": 10,
						"end": 14
					},
					{
						"id": "B",
						"start": 14,
						"end": 16
					},
					{
						"id": "C",
						"start": 16,
						"end": 20
					},
					{
						"id": "D",
						"start": 20,
						"end": 23
					},
					{
						"id": "A",
						"start": 23,
						"end": 25
					},
					{
						"id": "C",
						"start": 25,
						"end": 28
					}
				],
				"metrics": [
					{
						"id": "A",
						"waiting": 17,
						"turnaround": 25,
						"response": 0,
						"dispatches": 3
					},
					{
						"id": "B",
						"waiting": 11,
						"turnaround": 15,
						"response": 1,
						"dispatches": 2
					},
					{
						"id": "C",
						"waiting": 17,
						"turnaround": 26,
						"response": 2,
						"dispatches": 3
					},
					{
						"id": "D",
						"waiting": 15,
						"turnaround": 20,
						"response": 3,
						"dispatches": 2
					},
					{
						"id": "E",
						"waiting": 2,
						"turnaround": 4,
						"response": 2,
						"dispatches": 1
					}
				],
				"averages": {
					"waiting": 12.4,
					"turnaround": 18,
					"response": 1.6,
					"maxWaiting": 17
				}
			}
		]
	},
	"workloads": [
		{
			"workload": "interactive",
			"processes": 200,
			"rows": [
				{
					"policy": "FCFS",
					"waiting": 4.995,
					"turnaround": 9.32,
					"response": 4.995,
					"maxWaiting": 29
				},
				{
					"policy": "SJF",
					"waiting": 3.555,
					"turnaround": 7.88,
					"response": 3.555,
					"maxWaiting": 45
				},
				{
					"policy": "RR(q=4)",
					"waiting": 6.01,
					"turnaround": 10.335,
					"response": 3.695,
					"maxWaiting": 31
				},
				{
					"policy": "Priority",
					"waiting": 5.08,
					"turnaround": 9.405,
					"response": 5.08,
					"maxWaiting": 75
				},
				{
					"policy": "MLFQ(q=2,levels=3)",
					"waiting": 8.575,
					"turnaround": 12.9,
					"response": 0.77,
					"maxWaiting": 79
				}
			]
		},
		{
			"workload": "cpu-bound",
			"processes": 200,
			"rows": [
				{
					"policy": "FCFS",
					"waiting": 64.4,
					"turnaround": 105.05,
					"response": 64.4,
					"maxWaiting": 218
				},
				{
					"policy": "SJF",
					"waiting": 51.435,
					"turnaround": 92.085,
					"response": 51.435,
					"maxWaiting": 1058
				},
				{
					"policy": "RR(q=4)",
					"waiting": 111.91,
					"turnaround": 152.56,
					"response": 9.785,
					"maxWaiting": 390
				},
				{
					"policy": "Priority",
					"waiting": 58.065,
					"turnaround": 98.715,
					"response": 58.065,
					"maxWaiting": 996
				},
				{
					"policy": "MLFQ(q=2,levels=3)",
					"waiting": 118.85,
					"turnaround": 159.5,
					"response": 2.695,
					"maxWaiting": 403
				}
			]
		},
		{
			"workload": "mixed",
			"processes": 200,
			"rows": [
				{
					"policy": "FCFS",
					"waiting": 120.56,
					"turnaround": 134.04,
					"response": 120.56,
					"maxWaiting": 338
				},
				{
					"policy": "SJF",
					"waiting": 40.93,
					"turnaround": 54.41,
					"response": 40.93,
					"maxWaiting": 942
				},
				{
					"policy": "RR(q=4)",
					"waiting": 67.375,
					"turnaround": 80.855,
					"response": 15.475,
					"maxWaiting": 658
				},
				{
					"policy": "Priority",
					"waiting": 102.35,
					"turnaround": 115.83,
					"response": 102.35,
					"maxWaiting": 892
				},
				{
					"policy": "MLFQ(q=2,levels=3)",
					"waiting": 56.335,
					"turnaround": 69.815,
					"response": 2.56,
					"maxWaiting": 718
				}
			]
		}
	]
};
