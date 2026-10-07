-- post-count-by-author: Authors with the most posts.
-- SQL captured from each approach by the tests. Generated file, do not edit.

-- raw (1 statement)
SELECT a.id AS "authorId", a.name, count(p.id)::int AS posts
FROM authors a
LEFT JOIN posts p ON p.author_id = a.id
GROUP BY a.id, a.name
ORDER BY posts DESC, a.id ASC
LIMIT $1;

-- prisma (1 statement)
SELECT "public"."authors"."id", "public"."authors"."name", COALESCE("aggr_selection_0_Post"."_aggr_count_posts", 0) AS "_aggr_count_posts" FROM "public"."authors" LEFT JOIN (SELECT "public"."posts"."author_id", COUNT(*) AS "orderby_aggregator" FROM "public"."posts" WHERE 1=1 GROUP BY "public"."posts"."author_id") AS "orderby_1_Post" ON ("public"."authors"."id" = "orderby_1_Post"."author_id") LEFT JOIN (SELECT "public"."posts"."author_id", COUNT(*) AS "_aggr_count_posts" FROM "public"."posts" WHERE 1=1 GROUP BY "public"."posts"."author_id") AS "aggr_selection_0_Post" ON ("public"."authors"."id" = "aggr_selection_0_Post"."author_id") WHERE 1=1 ORDER BY COALESCE("orderby_1_Post"."orderby_aggregator", $1) DESC, "public"."authors"."id" ASC LIMIT $2 OFFSET $3;

-- drizzle (1 statement)
select "authors"."id", "authors"."name", count("posts"."id") from "authors" left join "posts" on "posts"."author_id" = "authors"."id" group by "authors"."id", "authors"."name" order by count("posts"."id") desc, "authors"."id" asc limit $1;
