-- EN: Seed of the SQL injection lab. PostgreSQL runs this file once, when the container starts
--     with an empty data directory. Every name, password and "card" below is obviously fake.
-- PT: Carga inicial do laboratório de SQL injection. O PostgreSQL roda este arquivo uma vez,
--     quando o contêiner sobe com o diretório de dados vazio. Todo nome, senha e "cartão" abaixo
--     é claramente falso.
-- ES: Carga inicial del laboratorio de SQL injection. PostgreSQL ejecuta este archivo una vez,
--     cuando el contenedor arranca con el directorio de datos vacío. Todo nombre, contraseña y "tarjeta"
--     de abajo es claramente falso.

CREATE TABLE users (
	id integer PRIMARY KEY,
	username text NOT NULL UNIQUE,
	password_hash text NOT NULL
);

CREATE TABLE products (
	id integer PRIMARY KEY,
	name text NOT NULL,
	description text NOT NULL
);

-- EN: The "hidden" table. No route of the application reads it. It exists to show what an
--     injected query can reach when the application connects with too many privileges.
-- PT: A tabela "escondida". Nenhuma rota da aplicação a lê. Ela existe para mostrar o que uma
--     consulta injetada alcança quando a aplicação conecta com privilégios demais.
-- ES: La tabla "escondida". Ninguna ruta de la aplicación la lee. Existe para mostrar lo que una
--     consulta inyectada alcanza cuando la aplicación se conecta con demasiados privilegios.
CREATE TABLE secrets (
	id integer PRIMARY KEY,
	label text NOT NULL,
	secret_value text NOT NULL
);

-- EN: A plain SHA-256 keeps this lab focused on injection. It is NOT how passwords should be
--     stored: that needs a slow, salted algorithm (see the passwords-sessions-lab).
-- PT: Um SHA-256 simples mantém este laboratório focado em injeção. NÃO é assim que senhas devem
--     ser guardadas: isso pede um algoritmo lento e com sal (veja o passwords-sessions-lab).
-- ES: Un SHA-256 simple mantiene este laboratorio enfocado en la inyección. NO es así como deben
--     guardarse las contraseñas: eso pide un algoritmo lento y con sal (ve el passwords-sessions-lab).
INSERT INTO users (id, username, password_hash) VALUES
	(1, 'admin-fake', encode(sha256('lab-fake-admin-password'::bytea), 'hex')),
	(2, 'alice-fake', encode(sha256('lab-fake-password'::bytea), 'hex')),
	(3, 'bob-fake', encode(sha256('lab-fake-password-bob'::bytea), 'hex'));

INSERT INTO products (id, name, description) VALUES
	(1, 'Fake keyboard', 'A keyboard that exists only in this lab'),
	(2, 'Fake mouse', 'A mouse that exists only in this lab'),
	(3, 'Fake monitor', 'A monitor that exists only in this lab');

INSERT INTO secrets (id, label, secret_value) VALUES
	(1, 'fake card of alice-fake', 'FAKE-CARD-0000-0000-0000-0001'),
	(2, 'fake card of bob-fake', 'FAKE-CARD-0000-0000-0000-0002'),
	(3, 'fake api key', 'FAKE-SECRET-not-real');

-- EN: Least privilege. The fixed application connects with this role. It can only read the two
--     tables its routes need: it cannot write anything and it cannot see `secrets` at all. If a
--     query bug ever slips through, this is what limits the damage.
-- PT: Menor privilégio. A aplicação corrigida conecta com este papel. Ele só consegue ler as duas
--     tabelas que as rotas usam: não escreve nada e não enxerga `secrets`. Se um bug de consulta
--     escapar um dia, é isto que limita o estrago.
-- ES: Mínimo privilegio. La aplicación corregida se conecta con este rol. Solo puede leer las dos
--     tablas que usan las rutas: no escribe nada y no ve `secrets`. Si algún día se escapa un error de
--     consulta, esto es lo que limita el daño.
CREATE ROLE lab_readonly LOGIN PASSWORD 'lab-fake-readonly-password';
GRANT SELECT ON users, products TO lab_readonly;
