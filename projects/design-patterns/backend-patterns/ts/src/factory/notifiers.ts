// EN: The products. Both the failing design and the factory version create these classes;
//     what changes is how many places know their names.
// PT: Os produtos. Tanto o desenho com defeito quanto a versão com fábrica criam estas classes;
//     o que muda é quantos lugares conhecem seus nomes.
export interface Notifier {
	notify(to: string, text: string): string;
}

export class EmailNotifier implements Notifier {
	notify(to: string, text: string): string {
		return `email to ${to}: ${text}`;
	}
}

export class SmsNotifier implements Notifier {
	notify(to: string, text: string): string {
		return `sms to ${to}: ${text}`;
	}
}

export class PushNotifier implements Notifier {
	notify(to: string, text: string): string {
		return `push to ${to}: ${text}`;
	}
}
