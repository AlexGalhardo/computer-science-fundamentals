import { gatewayApp } from "./apps";
import { serve } from "./serve";

serve("gateway", (telemetry, env) => gatewayApp(telemetry, env.ORDERS_URL));
