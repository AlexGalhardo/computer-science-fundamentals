import { FixedWindow } from "./fixed-window";
import { LeakyBucket } from "./leaky-bucket";
import type { Algorithm, LimiterConfig, RateLimiter } from "./limiter";
import { SlidingCounter } from "./sliding-counter";
import { SlidingLog } from "./sliding-log";
import { TokenBucket } from "./token-bucket";

// EN: One limiter object holds the state of ONE client. A real service keeps a map from the
//     client key (API key, user id, IP address) to its limiter and evicts idle entries.
// PT: Um objeto limitador guarda o estado de UM cliente. Um serviço real mantém um mapa da
//     chave do cliente (chave de API, id do usuário, endereço IP) para o seu limitador e
//     remove as entradas ociosas.
export function createLimiter(algorithm: Algorithm, config: LimiterConfig): RateLimiter {
	switch (algorithm) {
		case "fixed-window":
			return new FixedWindow(config);
		case "sliding-log":
			return new SlidingLog(config);
		case "sliding-counter":
			return new SlidingCounter(config);
		case "token-bucket":
			return new TokenBucket(config);
		case "leaky-bucket":
			return new LeakyBucket(config);
	}
}
