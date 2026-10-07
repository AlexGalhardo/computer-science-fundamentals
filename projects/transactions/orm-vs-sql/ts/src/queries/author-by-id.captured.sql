-- author-by-id: One author by primary key.
-- SQL captured from each approach by the tests. Generated file, do not edit.

-- raw (1 statement)
SELECT id, name, country FROM authors WHERE id = $1;

-- prisma (1 statement)
SELECT "public"."authors"."id", "public"."authors"."name", "public"."authors"."country" FROM "public"."authors" WHERE ("public"."authors"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3;

-- drizzle (1 statement)
select "id", "name", "country" from "authors" where "authors"."id" = $1;
