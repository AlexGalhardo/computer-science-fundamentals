-- top-posts: The most viewed published posts.
-- SQL captured from each approach by the tests. Generated file, do not edit.

-- raw (1 statement)
SELECT id, title, views FROM posts WHERE published ORDER BY views DESC, id ASC LIMIT $1;

-- prisma (1 statement)
SELECT "public"."posts"."id", "public"."posts"."title", "public"."posts"."views" FROM "public"."posts" WHERE "public"."posts"."published" = $1 ORDER BY "public"."posts"."views" DESC, "public"."posts"."id" ASC LIMIT $2 OFFSET $3;

-- drizzle (1 statement)
select "id", "title", "views" from "posts" where "posts"."published" = $1 order by "posts"."views" desc, "posts"."id" asc limit $2;
