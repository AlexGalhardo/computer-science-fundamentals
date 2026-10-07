-- add-post-with-comment: Insert a post and its first comment in one transaction.
-- SQL captured from each approach by the tests. Generated file, do not edit.

-- raw (4 statements)
BEGIN;

INSERT INTO posts (author_id, title) VALUES ($1, $2) RETURNING id, views, published;

INSERT INTO comments (post_id, body) VALUES ($1, $2);

COMMIT;

-- prisma (3 statements)
INSERT INTO "public"."posts" ("author_id","title","views","published") VALUES ($1,$2,$3,$4) RETURNING "public"."posts"."id", "public"."posts"."views", "public"."posts"."published";

INSERT INTO "public"."comments" ("post_id","body") VALUES ($1,$2) RETURNING "public"."comments"."id";

COMMIT;

-- drizzle (4 statements)
begin;

insert into "posts" ("id", "author_id", "title", "views", "published") values (default, $1, $2, default, default) returning "id", "views", "published";

insert into "comments" ("id", "post_id", "body") values (default, $1, $2);

commit;
