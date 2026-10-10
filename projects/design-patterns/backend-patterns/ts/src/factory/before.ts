import { EmailNotifier, PushNotifier, SmsNotifier } from "./notifiers";

// EN: FAILING DESIGN. Every function that needs a notifier repeats the decision of which class
//     to create. When the push channel was added, `welcome` was updated and `orderShipped`
//     was forgotten: nothing links the two copies, so the mistake compiles and ships.
// PT: DESENHO COM DEFEITO. Toda função que precisa de um notificador repete a decisão de qual
//     classe criar. Quando o canal push foi acrescentado, `welcome` foi atualizada e
//     `orderShipped` foi esquecida: nada liga as duas cópias, então o erro compila e vai para
//     produção.
// ES: DISEÑO QUE FALLA. Toda función que necesita un notificador repite la decisión de qué
//     clase crear. Cuando se añadió el canal push, `welcome` se actualizó y `orderShipped` se
//     olvidó: nada une las dos copias, así que el error compila y llega a producción.
export function welcome(channel: string, to: string): string {
	if (channel === "email") {
		return new EmailNotifier().notify(to, "Welcome!");
	}
	if (channel === "sms") {
		return new SmsNotifier().notify(to, "Welcome!");
	}
	if (channel === "push") {
		return new PushNotifier().notify(to, "Welcome!");
	}
	throw new Error(`unknown channel: ${channel}`);
}

export function orderShipped(channel: string, to: string): string {
	if (channel === "email") {
		return new EmailNotifier().notify(to, "Your order was shipped");
	}
	if (channel === "sms") {
		return new SmsNotifier().notify(to, "Your order was shipped");
	}
	throw new Error(`unknown channel: ${channel}`);
}
