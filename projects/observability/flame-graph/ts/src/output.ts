import { rmSync } from "node:fs";

/**
 * Writes a result file, replacing an older one.
 *
 * EN: The old file is removed first instead of being overwritten. A file left by a previous
 *     run may belong to another user (the setup script runs the containers as the host user,
 *     a plain `docker compose run` uses the default one), and a file of another user cannot
 *     be opened for writing, while removing it only needs write access to the folder.
 * PT: O arquivo antigo é removido antes, em vez de ser sobrescrito. Um arquivo deixado por uma
 *     execução anterior pode pertencer a outro usuário (o script de setup roda os contêineres
 *     como o usuário do host, um `docker compose run` simples usa o padrão), e um arquivo de
 *     outro usuário não pode ser aberto para escrita, enquanto removê-lo só exige permissão de
 *     escrita na pasta.
 * ES: El archivo antiguo se elimina antes, en lugar de sobrescribirse. Un archivo dejado por una
 *     ejecución anterior puede pertenecer a otro usuario (el script de setup ejecuta los contenedores
 *     como el usuario del host, un `docker compose run` simple usa el valor por defecto), y un archivo
 *     de otro usuario no se puede abrir para escritura, mientras que eliminarlo solo exige permiso de
 *     escritura en la carpeta.
 */
export async function writeFresh(file: string, content: string | ArrayBuffer): Promise<void> {
	rmSync(file, { force: true });
	await Bun.write(file, content);
}
