window.TREE_STEPS = {
	sequence: [10, 20, 30, 40, 50, 60, 55, 25, 22, 5, 7, 45],
	trees: {
		bst: [
			{ label: "empty tree", rotations: 0, tree: null },
			{ label: "insert 10", rotations: 0, tree: { k: 10, c: "", l: null, r: null } },
			{
				label: "insert 20",
				rotations: 0,
				tree: { k: 10, c: "", l: null, r: { k: 20, c: "", l: null, r: null } },
			},
			{
				label: "insert 30",
				rotations: 0,
				tree: { k: 10, c: "", l: null, r: { k: 20, c: "", l: null, r: { k: 30, c: "", l: null, r: null } } },
			},
			{
				label: "insert 40",
				rotations: 0,
				tree: {
					k: 10,
					c: "",
					l: null,
					r: { k: 20, c: "", l: null, r: { k: 30, c: "", l: null, r: { k: 40, c: "", l: null, r: null } } },
				},
			},
			{
				label: "insert 50",
				rotations: 0,
				tree: {
					k: 10,
					c: "",
					l: null,
					r: {
						k: 20,
						c: "",
						l: null,
						r: {
							k: 30,
							c: "",
							l: null,
							r: { k: 40, c: "", l: null, r: { k: 50, c: "", l: null, r: null } },
						},
					},
				},
			},
			{
				label: "insert 60",
				rotations: 0,
				tree: {
					k: 10,
					c: "",
					l: null,
					r: {
						k: 20,
						c: "",
						l: null,
						r: {
							k: 30,
							c: "",
							l: null,
							r: {
								k: 40,
								c: "",
								l: null,
								r: { k: 50, c: "", l: null, r: { k: 60, c: "", l: null, r: null } },
							},
						},
					},
				},
			},
			{
				label: "insert 55",
				rotations: 0,
				tree: {
					k: 10,
					c: "",
					l: null,
					r: {
						k: 20,
						c: "",
						l: null,
						r: {
							k: 30,
							c: "",
							l: null,
							r: {
								k: 40,
								c: "",
								l: null,
								r: {
									k: 50,
									c: "",
									l: null,
									r: { k: 60, c: "", l: { k: 55, c: "", l: null, r: null }, r: null },
								},
							},
						},
					},
				},
			},
			{
				label: "insert 25",
				rotations: 0,
				tree: {
					k: 10,
					c: "",
					l: null,
					r: {
						k: 20,
						c: "",
						l: null,
						r: {
							k: 30,
							c: "",
							l: { k: 25, c: "", l: null, r: null },
							r: {
								k: 40,
								c: "",
								l: null,
								r: {
									k: 50,
									c: "",
									l: null,
									r: { k: 60, c: "", l: { k: 55, c: "", l: null, r: null }, r: null },
								},
							},
						},
					},
				},
			},
			{
				label: "insert 22",
				rotations: 0,
				tree: {
					k: 10,
					c: "",
					l: null,
					r: {
						k: 20,
						c: "",
						l: null,
						r: {
							k: 30,
							c: "",
							l: { k: 25, c: "", l: { k: 22, c: "", l: null, r: null }, r: null },
							r: {
								k: 40,
								c: "",
								l: null,
								r: {
									k: 50,
									c: "",
									l: null,
									r: { k: 60, c: "", l: { k: 55, c: "", l: null, r: null }, r: null },
								},
							},
						},
					},
				},
			},
			{
				label: "insert 5",
				rotations: 0,
				tree: {
					k: 10,
					c: "",
					l: { k: 5, c: "", l: null, r: null },
					r: {
						k: 20,
						c: "",
						l: null,
						r: {
							k: 30,
							c: "",
							l: { k: 25, c: "", l: { k: 22, c: "", l: null, r: null }, r: null },
							r: {
								k: 40,
								c: "",
								l: null,
								r: {
									k: 50,
									c: "",
									l: null,
									r: { k: 60, c: "", l: { k: 55, c: "", l: null, r: null }, r: null },
								},
							},
						},
					},
				},
			},
			{
				label: "insert 7",
				rotations: 0,
				tree: {
					k: 10,
					c: "",
					l: { k: 5, c: "", l: null, r: { k: 7, c: "", l: null, r: null } },
					r: {
						k: 20,
						c: "",
						l: null,
						r: {
							k: 30,
							c: "",
							l: { k: 25, c: "", l: { k: 22, c: "", l: null, r: null }, r: null },
							r: {
								k: 40,
								c: "",
								l: null,
								r: {
									k: 50,
									c: "",
									l: null,
									r: { k: 60, c: "", l: { k: 55, c: "", l: null, r: null }, r: null },
								},
							},
						},
					},
				},
			},
			{
				label: "insert 45",
				rotations: 0,
				tree: {
					k: 10,
					c: "",
					l: { k: 5, c: "", l: null, r: { k: 7, c: "", l: null, r: null } },
					r: {
						k: 20,
						c: "",
						l: null,
						r: {
							k: 30,
							c: "",
							l: { k: 25, c: "", l: { k: 22, c: "", l: null, r: null }, r: null },
							r: {
								k: 40,
								c: "",
								l: null,
								r: {
									k: 50,
									c: "",
									l: { k: 45, c: "", l: null, r: null },
									r: { k: 60, c: "", l: { k: 55, c: "", l: null, r: null }, r: null },
								},
							},
						},
					},
				},
			},
		],
		avl: [
			{ label: "empty tree", rotations: 0, tree: null },
			{ label: "insert 10", rotations: 0, tree: { k: 10, c: "", l: null, r: null } },
			{
				label: "insert 20",
				rotations: 0,
				tree: { k: 10, c: "", l: null, r: { k: 20, c: "", l: null, r: null } },
			},
			{
				label: "insert 30",
				rotations: 0,
				tree: { k: 10, c: "", l: null, r: { k: 20, c: "", l: null, r: { k: 30, c: "", l: null, r: null } } },
			},
			{
				label: "rotate left at 10",
				rotations: 1,
				tree: { k: 20, c: "", l: { k: 10, c: "", l: null, r: null }, r: { k: 30, c: "", l: null, r: null } },
			},
			{
				label: "insert 40",
				rotations: 1,
				tree: {
					k: 20,
					c: "",
					l: { k: 10, c: "", l: null, r: null },
					r: { k: 30, c: "", l: null, r: { k: 40, c: "", l: null, r: null } },
				},
			},
			{
				label: "insert 50",
				rotations: 1,
				tree: {
					k: 20,
					c: "",
					l: { k: 10, c: "", l: null, r: null },
					r: { k: 30, c: "", l: null, r: { k: 40, c: "", l: null, r: { k: 50, c: "", l: null, r: null } } },
				},
			},
			{
				label: "rotate left at 30",
				rotations: 2,
				tree: {
					k: 20,
					c: "",
					l: { k: 10, c: "", l: null, r: null },
					r: { k: 40, c: "", l: { k: 30, c: "", l: null, r: null }, r: { k: 50, c: "", l: null, r: null } },
				},
			},
			{
				label: "insert 60",
				rotations: 2,
				tree: {
					k: 20,
					c: "",
					l: { k: 10, c: "", l: null, r: null },
					r: {
						k: 40,
						c: "",
						l: { k: 30, c: "", l: null, r: null },
						r: { k: 50, c: "", l: null, r: { k: 60, c: "", l: null, r: null } },
					},
				},
			},
			{
				label: "rotate left at 20",
				rotations: 3,
				tree: {
					k: 40,
					c: "",
					l: { k: 20, c: "", l: { k: 10, c: "", l: null, r: null }, r: { k: 30, c: "", l: null, r: null } },
					r: { k: 50, c: "", l: null, r: { k: 60, c: "", l: null, r: null } },
				},
			},
			{
				label: "insert 55",
				rotations: 3,
				tree: {
					k: 40,
					c: "",
					l: { k: 20, c: "", l: { k: 10, c: "", l: null, r: null }, r: { k: 30, c: "", l: null, r: null } },
					r: { k: 50, c: "", l: null, r: { k: 60, c: "", l: { k: 55, c: "", l: null, r: null }, r: null } },
				},
			},
			{
				label: "rotate right at 60",
				rotations: 4,
				tree: {
					k: 40,
					c: "",
					l: { k: 20, c: "", l: { k: 10, c: "", l: null, r: null }, r: { k: 30, c: "", l: null, r: null } },
					r: { k: 50, c: "", l: null, r: { k: 55, c: "", l: null, r: { k: 60, c: "", l: null, r: null } } },
				},
			},
			{
				label: "rotate left at 50",
				rotations: 5,
				tree: {
					k: 40,
					c: "",
					l: { k: 20, c: "", l: { k: 10, c: "", l: null, r: null }, r: { k: 30, c: "", l: null, r: null } },
					r: { k: 55, c: "", l: { k: 50, c: "", l: null, r: null }, r: { k: 60, c: "", l: null, r: null } },
				},
			},
			{
				label: "insert 25",
				rotations: 5,
				tree: {
					k: 40,
					c: "",
					l: {
						k: 20,
						c: "",
						l: { k: 10, c: "", l: null, r: null },
						r: { k: 30, c: "", l: { k: 25, c: "", l: null, r: null }, r: null },
					},
					r: { k: 55, c: "", l: { k: 50, c: "", l: null, r: null }, r: { k: 60, c: "", l: null, r: null } },
				},
			},
			{
				label: "insert 22",
				rotations: 5,
				tree: {
					k: 40,
					c: "",
					l: {
						k: 20,
						c: "",
						l: { k: 10, c: "", l: null, r: null },
						r: {
							k: 30,
							c: "",
							l: { k: 25, c: "", l: { k: 22, c: "", l: null, r: null }, r: null },
							r: null,
						},
					},
					r: { k: 55, c: "", l: { k: 50, c: "", l: null, r: null }, r: { k: 60, c: "", l: null, r: null } },
				},
			},
			{
				label: "rotate right at 30",
				rotations: 6,
				tree: {
					k: 40,
					c: "",
					l: {
						k: 20,
						c: "",
						l: { k: 10, c: "", l: null, r: null },
						r: {
							k: 25,
							c: "",
							l: { k: 22, c: "", l: null, r: null },
							r: { k: 30, c: "", l: null, r: null },
						},
					},
					r: { k: 55, c: "", l: { k: 50, c: "", l: null, r: null }, r: { k: 60, c: "", l: null, r: null } },
				},
			},
			{
				label: "insert 5",
				rotations: 6,
				tree: {
					k: 40,
					c: "",
					l: {
						k: 20,
						c: "",
						l: { k: 10, c: "", l: { k: 5, c: "", l: null, r: null }, r: null },
						r: {
							k: 25,
							c: "",
							l: { k: 22, c: "", l: null, r: null },
							r: { k: 30, c: "", l: null, r: null },
						},
					},
					r: { k: 55, c: "", l: { k: 50, c: "", l: null, r: null }, r: { k: 60, c: "", l: null, r: null } },
				},
			},
			{
				label: "insert 7",
				rotations: 6,
				tree: {
					k: 40,
					c: "",
					l: {
						k: 20,
						c: "",
						l: { k: 10, c: "", l: { k: 5, c: "", l: null, r: { k: 7, c: "", l: null, r: null } }, r: null },
						r: {
							k: 25,
							c: "",
							l: { k: 22, c: "", l: null, r: null },
							r: { k: 30, c: "", l: null, r: null },
						},
					},
					r: { k: 55, c: "", l: { k: 50, c: "", l: null, r: null }, r: { k: 60, c: "", l: null, r: null } },
				},
			},
			{
				label: "rotate left at 5",
				rotations: 7,
				tree: {
					k: 40,
					c: "",
					l: {
						k: 20,
						c: "",
						l: { k: 10, c: "", l: { k: 7, c: "", l: { k: 5, c: "", l: null, r: null }, r: null }, r: null },
						r: {
							k: 25,
							c: "",
							l: { k: 22, c: "", l: null, r: null },
							r: { k: 30, c: "", l: null, r: null },
						},
					},
					r: { k: 55, c: "", l: { k: 50, c: "", l: null, r: null }, r: { k: 60, c: "", l: null, r: null } },
				},
			},
			{
				label: "rotate right at 10",
				rotations: 8,
				tree: {
					k: 40,
					c: "",
					l: {
						k: 20,
						c: "",
						l: { k: 7, c: "", l: { k: 5, c: "", l: null, r: null }, r: { k: 10, c: "", l: null, r: null } },
						r: {
							k: 25,
							c: "",
							l: { k: 22, c: "", l: null, r: null },
							r: { k: 30, c: "", l: null, r: null },
						},
					},
					r: { k: 55, c: "", l: { k: 50, c: "", l: null, r: null }, r: { k: 60, c: "", l: null, r: null } },
				},
			},
			{
				label: "insert 45",
				rotations: 8,
				tree: {
					k: 40,
					c: "",
					l: {
						k: 20,
						c: "",
						l: { k: 7, c: "", l: { k: 5, c: "", l: null, r: null }, r: { k: 10, c: "", l: null, r: null } },
						r: {
							k: 25,
							c: "",
							l: { k: 22, c: "", l: null, r: null },
							r: { k: 30, c: "", l: null, r: null },
						},
					},
					r: {
						k: 55,
						c: "",
						l: { k: 50, c: "", l: { k: 45, c: "", l: null, r: null }, r: null },
						r: { k: 60, c: "", l: null, r: null },
					},
				},
			},
		],
		"red-black": [
			{ label: "empty tree", rotations: 0, tree: null },
			{ label: "insert 10", rotations: 0, tree: { k: 10, c: "R", l: null, r: null } },
			{ label: "recolour: root 10 black", rotations: 0, tree: { k: 10, c: "B", l: null, r: null } },
			{
				label: "insert 20",
				rotations: 0,
				tree: { k: 10, c: "B", l: null, r: { k: 20, c: "R", l: null, r: null } },
			},
			{
				label: "insert 30",
				rotations: 0,
				tree: { k: 10, c: "B", l: null, r: { k: 20, c: "R", l: null, r: { k: 30, c: "R", l: null, r: null } } },
			},
			{
				label: "rotate left at 10",
				rotations: 1,
				tree: { k: 20, c: "B", l: { k: 10, c: "R", l: null, r: null }, r: { k: 30, c: "R", l: null, r: null } },
			},
			{
				label: "insert 40",
				rotations: 1,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "R", l: null, r: null },
					r: { k: 30, c: "R", l: null, r: { k: 40, c: "R", l: null, r: null } },
				},
			},
			{
				label: "recolour: 30 and 10 black, 20 red",
				rotations: 1,
				tree: {
					k: 20,
					c: "R",
					l: { k: 10, c: "B", l: null, r: null },
					r: { k: 30, c: "B", l: null, r: { k: 40, c: "R", l: null, r: null } },
				},
			},
			{
				label: "recolour: root 20 black",
				rotations: 1,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: { k: 30, c: "B", l: null, r: { k: 40, c: "R", l: null, r: null } },
				},
			},
			{
				label: "insert 50",
				rotations: 1,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: {
						k: 30,
						c: "B",
						l: null,
						r: { k: 40, c: "R", l: null, r: { k: 50, c: "R", l: null, r: null } },
					},
				},
			},
			{
				label: "rotate left at 30",
				rotations: 2,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: {
						k: 40,
						c: "B",
						l: { k: 30, c: "R", l: null, r: null },
						r: { k: 50, c: "R", l: null, r: null },
					},
				},
			},
			{
				label: "insert 60",
				rotations: 2,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: {
						k: 40,
						c: "B",
						l: { k: 30, c: "R", l: null, r: null },
						r: { k: 50, c: "R", l: null, r: { k: 60, c: "R", l: null, r: null } },
					},
				},
			},
			{
				label: "recolour: 50 and 30 black, 40 red",
				rotations: 2,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: {
						k: 40,
						c: "R",
						l: { k: 30, c: "B", l: null, r: null },
						r: { k: 50, c: "B", l: null, r: { k: 60, c: "R", l: null, r: null } },
					},
				},
			},
			{
				label: "insert 55",
				rotations: 2,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: {
						k: 40,
						c: "R",
						l: { k: 30, c: "B", l: null, r: null },
						r: {
							k: 50,
							c: "B",
							l: null,
							r: { k: 60, c: "R", l: { k: 55, c: "R", l: null, r: null }, r: null },
						},
					},
				},
			},
			{
				label: "rotate right at 60",
				rotations: 3,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: {
						k: 40,
						c: "R",
						l: { k: 30, c: "B", l: null, r: null },
						r: {
							k: 50,
							c: "B",
							l: null,
							r: { k: 55, c: "R", l: null, r: { k: 60, c: "R", l: null, r: null } },
						},
					},
				},
			},
			{
				label: "rotate left at 50",
				rotations: 4,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: {
						k: 40,
						c: "R",
						l: { k: 30, c: "B", l: null, r: null },
						r: {
							k: 55,
							c: "B",
							l: { k: 50, c: "R", l: null, r: null },
							r: { k: 60, c: "R", l: null, r: null },
						},
					},
				},
			},
			{
				label: "insert 25",
				rotations: 4,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: {
						k: 40,
						c: "R",
						l: { k: 30, c: "B", l: { k: 25, c: "R", l: null, r: null }, r: null },
						r: {
							k: 55,
							c: "B",
							l: { k: 50, c: "R", l: null, r: null },
							r: { k: 60, c: "R", l: null, r: null },
						},
					},
				},
			},
			{
				label: "insert 22",
				rotations: 4,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: {
						k: 40,
						c: "R",
						l: {
							k: 30,
							c: "B",
							l: { k: 25, c: "R", l: { k: 22, c: "R", l: null, r: null }, r: null },
							r: null,
						},
						r: {
							k: 55,
							c: "B",
							l: { k: 50, c: "R", l: null, r: null },
							r: { k: 60, c: "R", l: null, r: null },
						},
					},
				},
			},
			{
				label: "rotate right at 30",
				rotations: 5,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: null, r: null },
					r: {
						k: 40,
						c: "R",
						l: {
							k: 25,
							c: "B",
							l: { k: 22, c: "R", l: null, r: null },
							r: { k: 30, c: "R", l: null, r: null },
						},
						r: {
							k: 55,
							c: "B",
							l: { k: 50, c: "R", l: null, r: null },
							r: { k: 60, c: "R", l: null, r: null },
						},
					},
				},
			},
			{
				label: "insert 5",
				rotations: 5,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: { k: 5, c: "R", l: null, r: null }, r: null },
					r: {
						k: 40,
						c: "R",
						l: {
							k: 25,
							c: "B",
							l: { k: 22, c: "R", l: null, r: null },
							r: { k: 30, c: "R", l: null, r: null },
						},
						r: {
							k: 55,
							c: "B",
							l: { k: 50, c: "R", l: null, r: null },
							r: { k: 60, c: "R", l: null, r: null },
						},
					},
				},
			},
			{
				label: "insert 7",
				rotations: 5,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: { k: 5, c: "R", l: null, r: { k: 7, c: "R", l: null, r: null } }, r: null },
					r: {
						k: 40,
						c: "R",
						l: {
							k: 25,
							c: "B",
							l: { k: 22, c: "R", l: null, r: null },
							r: { k: 30, c: "R", l: null, r: null },
						},
						r: {
							k: 55,
							c: "B",
							l: { k: 50, c: "R", l: null, r: null },
							r: { k: 60, c: "R", l: null, r: null },
						},
					},
				},
			},
			{
				label: "rotate left at 5",
				rotations: 6,
				tree: {
					k: 20,
					c: "B",
					l: { k: 10, c: "B", l: { k: 7, c: "R", l: { k: 5, c: "R", l: null, r: null }, r: null }, r: null },
					r: {
						k: 40,
						c: "R",
						l: {
							k: 25,
							c: "B",
							l: { k: 22, c: "R", l: null, r: null },
							r: { k: 30, c: "R", l: null, r: null },
						},
						r: {
							k: 55,
							c: "B",
							l: { k: 50, c: "R", l: null, r: null },
							r: { k: 60, c: "R", l: null, r: null },
						},
					},
				},
			},
			{
				label: "rotate right at 10",
				rotations: 7,
				tree: {
					k: 20,
					c: "B",
					l: { k: 7, c: "B", l: { k: 5, c: "R", l: null, r: null }, r: { k: 10, c: "R", l: null, r: null } },
					r: {
						k: 40,
						c: "R",
						l: {
							k: 25,
							c: "B",
							l: { k: 22, c: "R", l: null, r: null },
							r: { k: 30, c: "R", l: null, r: null },
						},
						r: {
							k: 55,
							c: "B",
							l: { k: 50, c: "R", l: null, r: null },
							r: { k: 60, c: "R", l: null, r: null },
						},
					},
				},
			},
			{
				label: "insert 45",
				rotations: 7,
				tree: {
					k: 20,
					c: "B",
					l: { k: 7, c: "B", l: { k: 5, c: "R", l: null, r: null }, r: { k: 10, c: "R", l: null, r: null } },
					r: {
						k: 40,
						c: "R",
						l: {
							k: 25,
							c: "B",
							l: { k: 22, c: "R", l: null, r: null },
							r: { k: 30, c: "R", l: null, r: null },
						},
						r: {
							k: 55,
							c: "B",
							l: { k: 50, c: "R", l: { k: 45, c: "R", l: null, r: null }, r: null },
							r: { k: 60, c: "R", l: null, r: null },
						},
					},
				},
			},
			{
				label: "recolour: 50 and 60 black, 55 red",
				rotations: 7,
				tree: {
					k: 20,
					c: "B",
					l: { k: 7, c: "B", l: { k: 5, c: "R", l: null, r: null }, r: { k: 10, c: "R", l: null, r: null } },
					r: {
						k: 40,
						c: "R",
						l: {
							k: 25,
							c: "B",
							l: { k: 22, c: "R", l: null, r: null },
							r: { k: 30, c: "R", l: null, r: null },
						},
						r: {
							k: 55,
							c: "R",
							l: { k: 50, c: "B", l: { k: 45, c: "R", l: null, r: null }, r: null },
							r: { k: 60, c: "B", l: null, r: null },
						},
					},
				},
			},
			{
				label: "rotate left at 20",
				rotations: 8,
				tree: {
					k: 40,
					c: "B",
					l: {
						k: 20,
						c: "R",
						l: {
							k: 7,
							c: "B",
							l: { k: 5, c: "R", l: null, r: null },
							r: { k: 10, c: "R", l: null, r: null },
						},
						r: {
							k: 25,
							c: "B",
							l: { k: 22, c: "R", l: null, r: null },
							r: { k: 30, c: "R", l: null, r: null },
						},
					},
					r: {
						k: 55,
						c: "R",
						l: { k: 50, c: "B", l: { k: 45, c: "R", l: null, r: null }, r: null },
						r: { k: 60, c: "B", l: null, r: null },
					},
				},
			},
		],
	},
};
