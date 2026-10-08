-- EN: Token bucket on Redis, as ONE atomic script.
--     KEYS[1] = hash with the bucket of this client. ARGV[1] = capacity. ARGV[2] = time in
--     milliseconds to refill the whole bucket.
--     Returns { allowed (1 or 0), whole tokens left, milliseconds until the next token }.
--
--     The clock is the one of the Redis server (TIME), not the clock of the application
--     instance that called. Two instances with clocks a few hundred milliseconds apart would
--     otherwise disagree about how many tokens were earned. Calling TIME and then writing is
--     allowed because Redis replicates the effects of a script (the writes), not its text.
-- PT: Token bucket no Redis, como UM script atômico.
--     KEYS[1] = hash com o balde deste cliente. ARGV[1] = capacidade. ARGV[2] = tempo em
--     milissegundos para encher o balde inteiro.
--     Devolve { admitida (1 ou 0), fichas inteiras restantes, milissegundos até a próxima ficha }.
--
--     O relógio é o do servidor Redis (TIME), não o da instância da aplicação que chamou.
--     Duas instâncias com relógios algumas centenas de milissegundos diferentes discordariam
--     sobre quantas fichas foram ganhas. Chamar TIME e depois escrever é permitido porque o
--     Redis replica os efeitos de um script (as escritas), não o seu texto.
local capacity = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])

local time = redis.call('TIME')
local now_ms = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)

-- EN: Same integer "credit" units as the in-memory version: one token is worth window_ms
--     credits, and each millisecond earns `capacity` credits. A missing key is a full bucket.
-- PT: As mesmas unidades inteiras de "crédito" da versão em memória: uma ficha vale window_ms
--     créditos, e cada milissegundo rende `capacity` créditos. Chave ausente é balde cheio.
local full = capacity * window_ms
local state = redis.call('HMGET', KEYS[1], 'credit', 'last_ms')
local credit = tonumber(state[1]) or full
local last_ms = tonumber(state[2]) or now_ms

credit = math.min(full, credit + math.max(0, now_ms - last_ms) * capacity)

local allowed = 0
if credit >= window_ms then
	credit = credit - window_ms
	allowed = 1
end

redis.call('HSET', KEYS[1], 'credit', credit, 'last_ms', now_ms)
-- EN: After window_ms without requests the bucket is full again, which is exactly what a
--     missing key means. So the key may expire and idle clients cost no memory.
-- PT: Depois de window_ms sem requisições o balde está cheio de novo, que é exatamente o que
--     uma chave ausente significa. Então a chave pode expirar e clientes ociosos não custam memória.
redis.call('PEXPIRE', KEYS[1], window_ms)

local retry_ms = 0
if allowed == 0 then
	retry_ms = math.ceil((window_ms - credit) / capacity)
end
return { allowed, math.floor(credit / window_ms), retry_ms }
