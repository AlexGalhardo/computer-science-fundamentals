// EN: One scenario, run against both apps. It asks for four link previews: two legitimate ones
//     and the two demonstration inputs of the lab. The tests and the demo compare what the
//     vulnerable app and the fixed app answer to exactly the same requests.
//     The apps are called in-process (`app.handle`). The URLs they are asked to fetch are built
//     from the lab configuration and name only the two fake services of docker-compose.
// PT: Um cenário, executado contra os dois apps. Ele pede quatro prévias de link: duas legítimas
//     e as duas entradas de demonstração do laboratório. Os testes e a demo comparam o que o app
//     vulnerável e o app corrigido respondem exatamente às mesmas requisições.
//     Os apps são chamados em processo (`app.handle`). As URLs que eles recebem para buscar são
//     montadas a partir da configuração do laboratório e só citam os dois serviços falsos do
//     docker-compose.
// ES: Un escenario, ejecutado contra las dos apps. Pide cuatro vistas previas de enlace: dos legítimas
//     y las dos entradas de demostración del laboratorio. Las pruebas y la demo comparan lo que responden
//     la app vulnerable y la app corregida a exactamente las mismas solicitudes.
//     Las apps se llaman en proceso (`app.handle`). Las URLs que reciben para buscar se
//     arman a partir de la configuración del laboratorio y solo citan los dos servicios falsos de
//     docker-compose.

import { z } from "zod";
import { type Config, FAKE_INTERNAL_TOKEN } from "./config";
import type { LabApp } from "./preview";

export interface PreviewObservation {
	/** HTTP status answered by the app under test (not by the remote site). */
	status: number;
	/** Title of the fetched page, or null when there was no preview. */
	title: string | null;
	/** True when the fake internal token appears anywhere in the answer. Must always be false. */
	leaked: boolean;
	/** Name of the rule that refused the request, when the app says one. */
	reason: string | null;
}

export interface ScenarioResult {
	/** Normal use: a page of the public site. */
	publicArticle: PreviewObservation;
	/** Normal use: a public page that redirects to another public page. */
	publicRedirect: PreviewObservation;
	/** Demonstration input 1: the URL of the internal service, given directly. */
	directInternal: PreviewObservation;
	/** Demonstration input 2: a public URL that answers 302 to the internal service. */
	redirectToInternal: PreviewObservation;
}

export interface ScenarioUrls {
	publicArticle: string;
	publicRedirect: string;
	directInternal: string;
	redirectToInternal: string;
}

export function scenarioUrls(config: Config): ScenarioUrls {
	return {
		publicArticle: `${config.PUBLIC_SITE_ORIGIN}/article`,
		publicRedirect: `${config.PUBLIC_SITE_ORIGIN}/redirect-to-article`,
		// EN: The first URL anyone would try: the internal service by its internal name.
		// PT: A primeira URL que qualquer pessoa tentaria: o serviço interno pelo nome interno.
		// ES: La primera URL que cualquiera probaría: el servicio interno por su nombre interno.
		directInternal: `${config.INTERNAL_ADMIN_ORIGIN}/secret`,
		// EN: This URL looks harmless: its host is the public site. The internal address only
		//     appears in the answer of that site, as the target of a redirect.
		// PT: Esta URL parece inofensiva: o host dela é o site público. O endereço interno só
		//     aparece na resposta desse site, como destino de um redirecionamento.
		// ES: Esta URL parece inofensiva: su host es el sitio público. La dirección interna solo
		//     aparece en la respuesta de ese sitio, como destino de una redirección.
		redirectToInternal: `${config.PUBLIC_SITE_ORIGIN}/redirect-to-internal`,
	};
}

// EN: A response is external input too, so it is parsed instead of trusted.
// PT: Uma resposta também é entrada externa, então ela é interpretada em vez de ser dada como certa.
// ES: Una respuesta también es entrada externa, así que se interpreta en lugar de darla por correcta.
const answerSchema = z.object({
	preview: z.object({ title: z.string().nullable() }).optional(),
	reason: z.string().optional(),
});

// EN: This host is never contacted: `handle` routes the request inside this process.
// PT: Este host nunca é contatado: `handle` roteia a requisição dentro deste processo.
// ES: Este host nunca se contacta: `handle` enruta la solicitud dentro de este proceso.
const BASE = "http://localhost";

export async function requestPreview(app: LabApp, url: string): Promise<PreviewObservation> {
	const response = await app.handle(
		new Request(`${BASE}/preview`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ url }),
		}),
	);
	const text = await response.text();
	let json: unknown = null;
	try {
		json = JSON.parse(text);
	} catch {
		json = null;
	}
	const parsed = answerSchema.safeParse(json);
	return {
		status: response.status,
		title: parsed.success ? (parsed.data.preview?.title ?? null) : null,
		leaked: text.includes(FAKE_INTERNAL_TOKEN),
		reason: parsed.success ? (parsed.data.reason ?? null) : null,
	};
}

export async function runScenario(app: LabApp, config: Config): Promise<ScenarioResult> {
	const urls = scenarioUrls(config);
	return {
		publicArticle: await requestPreview(app, urls.publicArticle),
		publicRedirect: await requestPreview(app, urls.publicRedirect),
		directInternal: await requestPreview(app, urls.directInternal),
		redirectToInternal: await requestPreview(app, urls.redirectToInternal),
	};
}
