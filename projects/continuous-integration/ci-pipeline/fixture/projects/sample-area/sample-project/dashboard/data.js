// EN: The results are a script that sets a global, not a JSON file read with fetch: a page
//     opened from disk (file://) is not allowed to fetch its neighbours.
// PT: Os resultados são um script que define uma global, não um JSON lido com fetch: uma página
//     aberta do disco (file://) não tem permissão para dar fetch nos arquivos vizinhos.
// ES: Los resultados son un script que define una global, no un JSON leído con fetch: una página
//     abierta desde el disco (file://) no tiene permiso para hacer fetch a sus vecinos.
window.SAMPLE_RESULTS = [
	{ gate: "format", seconds: 2 },
	{ gate: "tests", seconds: 5 },
];
