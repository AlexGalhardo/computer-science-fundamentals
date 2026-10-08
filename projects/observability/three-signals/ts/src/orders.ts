import { ordersApp } from "./apps";
import { serve } from "./serve";

serve("orders", (telemetry, env) => ordersApp(telemetry, env.INVENTORY_URL));
