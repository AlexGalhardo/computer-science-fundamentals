import {
	createHash,
	createPrivateKey,
	createPublicKey,
	sign as cryptoSign,
	verify as cryptoVerify,
	type KeyObject,
} from "node:crypto";

// EN: A wallet is a key pair. The private key signs, the public key verifies, and the public
//     key is also the "address" that outputs are locked to. The algorithm is Ed25519 from the
//     standard `node:crypto` module (Bitcoin uses ECDSA over secp256k1; the idea is the same).
// PT: Uma carteira é um par de chaves. A chave privada assina, a pública confere, e a pública
//     também é o "endereço" ao qual as saídas ficam presas. O algoritmo é o Ed25519 do módulo
//     padrão `node:crypto` (o Bitcoin usa ECDSA sobre secp256k1; a ideia é a mesma).
export interface Wallet {
	/** Raw 32-byte Ed25519 public key, in hexadecimal. */
	publicKey: string;
	privateKey: KeyObject;
}

// EN: DER headers that wrap a raw 32-byte Ed25519 key (PKCS#8 for private, SPKI for public).
// PT: Cabeçalhos DER que embrulham uma chave Ed25519 crua de 32 bytes (PKCS#8 para a privada,
//     SPKI para a pública).
const PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const PUBLIC_KEY_HEX = /^[0-9a-f]{64}$/;

// EN: TOY KEYS, NEVER USE OUTSIDE THIS LAB. The private key is derived from a public label
//     ("alice", "miner-a"), so anyone who reads this file can recreate it. That is on purpose:
//     the demo and the tests need the same wallets on every run and on every node, and no real
//     key or coin exists anywhere in this project.
// PT: CHAVES DE BRINQUEDO, NUNCA USE FORA DESTE LABORATÓRIO. A chave privada é derivada de um
//     rótulo público ("alice", "miner-a"), então qualquer pessoa que leia este arquivo consegue
//     recriá-la. É de propósito: a demo e os testes precisam das mesmas carteiras em toda
//     execução e em todo nó, e não existe chave nem moeda real em lugar nenhum deste projeto.
export function walletFromLabel(label: string): Wallet {
	const seed = createHash("sha256").update(`didactic-blockchain toy key: ${label}`).digest();
	const privateKey = createPrivateKey({ key: Buffer.concat([PKCS8_PREFIX, seed]), format: "der", type: "pkcs8" });
	const spki = createPublicKey(privateKey).export({ format: "der", type: "spki" });
	return { publicKey: spki.subarray(SPKI_PREFIX.length).toString("hex"), privateKey };
}

export function sign(wallet: Wallet, message: string): string {
	return cryptoSign(null, Buffer.from(message, "utf8"), wallet.privateKey).toString("hex");
}

// EN: Verification needs only public data: the message, the signature and the public key. A
//     malformed key or signature is simply "not valid", never an exception for the caller.
// PT: A verificação só precisa de dados públicos: a mensagem, a assinatura e a chave pública.
//     Uma chave ou assinatura malformada é apenas "inválida", nunca uma exceção para quem chama.
export function verify(publicKey: string, message: string, signature: string): boolean {
	if (!PUBLIC_KEY_HEX.test(publicKey)) {
		return false;
	}
	try {
		const key = createPublicKey({
			key: Buffer.concat([SPKI_PREFIX, Buffer.from(publicKey, "hex")]),
			format: "der",
			type: "spki",
		});
		return cryptoVerify(null, Buffer.from(message, "utf8"), key, Buffer.from(signature, "hex"));
	} catch {
		return false;
	}
}
