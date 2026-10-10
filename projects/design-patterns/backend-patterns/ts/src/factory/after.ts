import { EmailNotifier, type Notifier, PushNotifier, SmsNotifier } from "./notifiers";

export const CHANNELS = ["email", "sms", "push"] as const;
export type Channel = (typeof CHANNELS)[number];

// EN: FACTORY. One place decides which class to create, and returns the abstract type. The
//     table is typed by `Channel`, so a channel added to the list without an entry here does
//     not compile: the compiler now remembers what a person forgot in the failing design.
// PT: FACTORY. Um único lugar decide qual classe criar, e devolve o tipo abstrato. A tabela é
//     tipada por `Channel`, então um canal acrescentado à lista sem entrada aqui não compila:
//     o compilador passa a lembrar o que uma pessoa esqueceu no desenho com defeito.
// ES: FACTORY. Un único lugar decide qué clase crear, y devuelve el tipo abstracto. La tabla
//     está tipada por `Channel`, así que un canal añadido a la lista sin entrada aquí no
//     compila: el compilador pasa a recordar lo que una persona olvidó en el diseño que falla.
const creators: Record<Channel, () => Notifier> = {
	email: () => new EmailNotifier(),
	sms: () => new SmsNotifier(),
	push: () => new PushNotifier(),
};

export function isChannel(value: string): value is Channel {
	return (CHANNELS as readonly string[]).includes(value);
}

export function createNotifier(channel: Channel): Notifier {
	return creators[channel]();
}

// EN: The clients depend on the product interface only. Neither names a concrete class.
// PT: Os clientes dependem só da interface do produto. Nenhum cita uma classe concreta.
// ES: Los clientes dependen solo de la interfaz del producto. Ninguno cita una clase concreta.
export function welcome(channel: Channel, to: string): string {
	return createNotifier(channel).notify(to, "Welcome!");
}

export function orderShipped(channel: Channel, to: string): string {
	return createNotifier(channel).notify(to, "Your order was shipped");
}
