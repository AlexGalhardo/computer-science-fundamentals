import { LANGUAGE_KEY } from "@/i18n";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// EN: A static site has no server to read the Accept-Language header, so the choice happens
//     in the browser: the saved language wins, then the browser language, then English.
// PT: Um site estático não tem servidor para ler o cabeçalho Accept-Language, então a escolha
//     acontece no navegador: vale o idioma salvo, depois o idioma do navegador, depois inglês.
const redirectScript = `(function(){var l;try{l=localStorage.getItem(${JSON.stringify(LANGUAGE_KEY)})}catch(e){}if(l!=="pt"&&l!=="en"){l=(navigator.language||"en").toLowerCase().indexOf("pt")===0?"pt":"en"}location.replace(${JSON.stringify(basePath)}+"/"+l+"/")})()`;

export default function RootPage() {
	return (
		<main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: constant script written above, with no user input */}
			<script dangerouslySetInnerHTML={{ __html: redirectScript }} />
			<h1>Computer Science Quiz</h1>
			<p>
				<a href={`${basePath}/pt/`} lang="pt-BR">
					Português
				</a>
				{" · "}
				<a href={`${basePath}/en/`}>English</a>
			</p>
		</main>
	);
}
