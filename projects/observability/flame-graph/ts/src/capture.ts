// EN: Step 1 of the profile pipeline: put each variant of each service under load and, while
//     the load runs, ask the service for a CPU profile of itself.
//       Go:         GET /debug/pprof/profile?seconds=N  -> profiles/go-<variant>.pb.gz
//                   (binary; the `go-fold` step turns it into folded stacks)
//       TypeScript: GET /debug/cpuprofile?seconds=N     -> profiles/ts-<variant>.cpuprofile
//                   and, converted here, <out>/ts-<variant>.folded
// PT: Etapa 1 do pipeline de perfil: colocar cada variante de cada serviço sob carga e,
//     enquanto a carga roda, pedir ao serviço um perfil de CPU de si mesmo.
// ES: Paso 1 del pipeline de perfil: poner cada variante de cada servicio bajo carga y,
//     mientras la carga corre, pedirle al servicio un perfil de CPU de sí mismo.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { cpuProfileSchema, cpuProfileToFolded, formatFolded, totalSamples } from "./folded";
import { endpointUrl, readLabEnv, type Subject, subjects, VARIANTS, type Variant } from "./lab";
import { runLoad, waitHealthy } from "./load";
import { writeFresh } from "./output";
import { requireLocalTarget } from "./target";

const env = readLabEnv();
mkdirSync(env.outDir, { recursive: true });
mkdirSync(env.profilesDir, { recursive: true });

async function capture(subject: Subject, variant: Variant): Promise<void> {
	const base = requireLocalTarget(subject.baseUrl);
	const seconds = env.PROFILE_SECONDS;

	// EN: A profile of an idle server shows only the runtime waiting. The load starts first
	//     and outlives the profile by a margin, so every sample is taken under pressure.
	// PT: Um perfil de um servidor ocioso mostra só o runtime esperando. A carga começa antes
	//     e dura mais que o perfil, com folga, então toda amostra é tirada sob pressão.
	// ES: Un perfil de un servidor ocioso muestra solo al runtime esperando. La carga empieza antes
	//     y dura más que el perfil, con margen, así que cada muestra se toma bajo presión.
	const load = runLoad(endpointUrl(subject, variant), env.LOAD_CONCURRENCY, (seconds + 3) * 1000);
	await Bun.sleep(1000);

	const path = subject.language === "go" ? "/debug/pprof/profile" : "/debug/cpuprofile";
	const response = await fetch(`${base}${path}?seconds=${seconds}`);
	if (!response.ok) {
		throw new Error(`${subject.language} ${variant}: profile request failed with ${response.status}`);
	}

	if (subject.language === "go") {
		const file = join(env.profilesDir, `go-${variant}.pb.gz`);
		await writeFresh(file, await response.arrayBuffer());
		console.log(`go ${variant}: raw profile -> ${file}`);
	} else {
		const raw: unknown = await response.json();
		await writeFresh(join(env.profilesDir, `ts-${variant}.cpuprofile`), JSON.stringify(raw));
		const stacks = cpuProfileToFolded(cpuProfileSchema.parse(raw));
		const file = join(env.outDir, `ts-${variant}.folded`);
		await writeFresh(file, formatFolded(stacks));
		console.log(`ts ${variant}: ${totalSamples(stacks)} samples -> ${file}`);
	}

	const result = await load;
	console.log(`${subject.language} ${variant}: ${result.requests} requests served while profiling`);
	if (result.requests === 0) {
		throw new Error(`${subject.language} ${variant}: the load generator completed no request`);
	}
}

for (const subject of subjects(env)) {
	await waitHealthy(subject.baseUrl);
	for (const variant of VARIANTS) {
		await capture(subject, variant);
	}
}
