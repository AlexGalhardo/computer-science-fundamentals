-- EN: Fixed window on Redis, as ONE atomic script.
--     KEYS[1] = counter of this client. ARGV[1] = limit. ARGV[2] = window in milliseconds.
--     Returns { allowed (1 or 0), remaining, milliseconds until the window ends }.
--
--     The window starts at the first request of the client and ends when the key expires
--     (the pattern of the Redis documentation for INCR). The script reads the counter, decides
--     and writes. Done from the application as three separate commands, this is a
--     check-then-act race: two instances read 9, both decide "below 10", both increment.
--     Inside a script it is safe, because Redis runs a script from start to end without
--     letting any other command in between. That is also why a script must be short: while
--     it runs, every other client waits.
-- PT: Janela fixa no Redis, como UM script atômico.
--     KEYS[1] = contador deste cliente. ARGV[1] = limite. ARGV[2] = janela em milissegundos.
--     Devolve { admitida (1 ou 0), restantes, milissegundos até o fim da janela }.
--
--     A janela começa na primeira requisição do cliente e termina quando a chave expira
--     (o padrão da documentação do Redis para o INCR). O script lê o contador, decide e
--     escreve. Feito pela aplicação em três comandos separados, isso é uma corrida de
--     "verificar e depois agir": duas instâncias leem 9, as duas decidem "abaixo de 10", as
--     duas incrementam. Dentro de um script é seguro, porque o Redis executa um script do
--     início ao fim sem deixar nenhum outro comando entrar no meio. É também por isso que um
--     script precisa ser curto: enquanto ele roda, todos os outros clientes esperam.
-- ES: Ventana fija en Redis, como UN script atómico.
--     KEYS[1] = contador de este cliente. ARGV[1] = límite. ARGV[2] = ventana en milisegundos.
--     Devuelve { admitida (1 o 0), restantes, milisegundos hasta el fin de la ventana }.
--
--     La ventana empieza en la primera solicitud del cliente y termina cuando la clave expira
--     (el patrón de la documentación de Redis para INCR). El script lee el contador, decide y
--     escribe. Hecho por la aplicación en tres comandos separados, esto es una carrera de
--     "verificar y luego actuar": dos instancias leen 9, las dos deciden "por debajo de 10", las
--     dos incrementan. Dentro de un script es seguro, porque Redis ejecuta un script de
--     principio a fin sin dejar entrar ningún otro comando en medio. También por eso un
--     script tiene que ser corto: mientras corre, todos los demás clientes esperan.
local limit = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])

local current = tonumber(redis.call('GET', KEYS[1]) or '0')
if current >= limit then
	return { 0, 0, redis.call('PTTL', KEYS[1]) }
end

current = redis.call('INCR', KEYS[1])
-- EN: The expiry is set in the same script as the first increment. As two client commands,
--     a crash between INCR and EXPIRE would leave a counter that never expires, and the
--     client would stay blocked forever.
-- PT: A expiração é definida no mesmo script do primeiro incremento. Como dois comandos do
--     cliente, uma falha entre o INCR e o EXPIRE deixaria um contador que nunca expira, e o
--     cliente ficaria bloqueado para sempre.
-- ES: La expiración se define en el mismo script del primer incremento. Como dos comandos del
--     cliente, un fallo entre el INCR y el EXPIRE dejaría un contador que nunca expira, y el
--     cliente quedaría bloqueado para siempre.
if current == 1 then
	redis.call('PEXPIRE', KEYS[1], window_ms)
end
return { 1, limit - current, redis.call('PTTL', KEYS[1]) }
