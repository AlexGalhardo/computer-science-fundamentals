-- posts-with-author: Posts of the authors of one country, with the author name.
-- SQL captured from each approach by the tests. Generated file, do not edit.

-- raw (1 statement)
SELECT p.id, p.title, a.name AS "authorName"
FROM posts p
JOIN authors a ON a.id = p.author_id
WHERE a.country = $1
ORDER BY p.id ASC
LIMIT $2;

-- prisma (2 statements)
SELECT "public"."posts"."id", "public"."posts"."title", "public"."posts"."author_id" FROM "public"."posts" LEFT JOIN "public"."authors" AS "j0" ON ("j0"."id") = ("public"."posts"."author_id") WHERE ("j0"."country" = $1 AND ("j0"."id" IS NOT NULL)) ORDER BY "public"."posts"."id" ASC LIMIT $2 OFFSET $3;

SELECT "public"."authors"."id", "public"."authors"."name" FROM "public"."authors" WHERE "public"."authors"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) OFFSET $21;

-- drizzle (1 statement)
select "posts"."id", "posts"."title", "authors"."name" from "posts" inner join "authors" on "authors"."id" = "posts"."author_id" where "authors"."country" = $1 order by "posts"."id" asc limit $2;
