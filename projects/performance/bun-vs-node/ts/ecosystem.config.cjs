// EN: PM2 process file. `exec_mode: "cluster"` makes PM2 start `instances` copies of the server
//     with the `cluster` module of Node, all accepting connections on the same port. The usual
//     choice is one worker per core that the service may use: more workers than cores only add
//     context switches, because CPU-bound work cannot run faster than the cores available.
// PT: Arquivo de processos do PM2. `exec_mode: "cluster"` faz o PM2 iniciar `instances` cópias do
//     servidor com o módulo `cluster` do Node, todas aceitando conexões na mesma porta. A escolha
//     usual é um worker por núcleo que o serviço pode usar: mais workers que núcleos só adicionam
//     trocas de contexto, porque trabalho CPU-bound não roda mais rápido que os núcleos disponíveis.
module.exports = {
	apps: [
		{
			name: "api",
			script: "dist/node-server.cjs",
			exec_mode: "cluster",
			instances: Number(process.env.WORKERS ?? 4),
		},
	],
};
