// EN: Prisma CLI configuration. `prisma generate` only reads the schema, so the URL below is
//     never contacted at build time. The default is the fake credential of the local lab.
// PT: Configuração da CLI do Prisma. O `prisma generate` só lê o schema, então a URL abaixo nunca
//     é contatada durante o build. O padrão é a credencial falsa do laboratório local.
// ES: Configuración de la CLI de Prisma. `prisma generate` solo lee el schema, así que la URL de abajo
//     nunca se contacta durante el build. El valor por defecto es la credencial falsa del laboratorio local.
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	datasource: { url: process.env.DATABASE_URL ?? "postgres://lab:lab-fake-password@db:5432/lab" },
});
