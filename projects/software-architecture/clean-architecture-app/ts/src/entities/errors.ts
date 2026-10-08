// EN: Errors of the domain are plain data with a `kind`. The entity says WHAT is wrong in the
//     language of the business. It does not say which HTTP status or which exit code that
//     becomes: those belong to the delivery mechanism, two layers out.
// PT: Os erros do domínio são dados simples com um `kind`. A entidade diz O QUE está errado na
//     linguagem do negócio. Ela não diz qual status HTTP ou qual código de saída isso vira:
//     isso pertence ao mecanismo de entrega, duas camadas para fora.
export type DomainError =
	| { readonly kind: "invalid-title"; readonly message: string }
	| { readonly kind: "invalid-body"; readonly message: string }
	| { readonly kind: "invalid-dates"; readonly message: string };
