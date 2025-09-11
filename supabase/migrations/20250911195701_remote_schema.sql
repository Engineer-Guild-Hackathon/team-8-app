drop extension if exists "pg_net";

create extension if not exists "pg_trgm" with schema "public";

create type "public"."node_type" as enum ('topic', 'resource');

create type "public"."resource_type" as enum ('book', 'article', 'video', 'course', 'repo', 'doc', 'other');


  create table "public"."edges" (
    "id" uuid not null default gen_random_uuid(),
    "from_type" node_type not null,
    "from_id" uuid not null,
    "to_type" node_type not null,
    "to_id" uuid not null,
    "weight" real not null default 1.0,
    "confidence" real,
    "is_active" boolean not null default true,
    "note" text,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."edges" enable row level security;


  create table "public"."resources" (
    "id" uuid not null default gen_random_uuid(),
    "type" resource_type not null,
    "url" text,
    "title" text not null,
    "author" text,
    "published_at" date,
    "difficulty" integer,
    "duration_min" integer,
    "cost_amount" numeric(12,2),
    "cost_currency" text,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."resources" enable row level security;


  create table "public"."study_path_items" (
    "id" uuid not null default gen_random_uuid(),
    "path_id" uuid not null,
    "position" integer not null,
    "node_type" node_type not null,
    "node_id" uuid not null,
    "note" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."study_path_items" enable row level security;


  create table "public"."study_paths" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "owner" uuid,
    "is_public" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."study_paths" enable row level security;


  create table "public"."topics" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "title" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."topics" enable row level security;

CREATE UNIQUE INDEX edges_pkey ON public.edges USING btree (id);

CREATE UNIQUE INDEX edges_unique ON public.edges USING btree (from_type, from_id, to_type, to_id);

CREATE INDEX idx_edges_from ON public.edges USING btree (from_type, from_id);

CREATE INDEX idx_edges_to ON public.edges USING btree (to_type, to_id);

CREATE INDEX idx_edges_weight ON public.edges USING btree (weight DESC);

CREATE INDEX idx_resources_title_trgm ON public.resources USING gin (title gin_trgm_ops);

CREATE INDEX idx_spi_path ON public.study_path_items USING btree (path_id, "position");

CREATE INDEX idx_topics_title_trgm ON public.topics USING gin (title gin_trgm_ops);

CREATE UNIQUE INDEX resources_pkey ON public.resources USING btree (id);

CREATE UNIQUE INDEX resources_url_key ON public.resources USING btree (url);

CREATE UNIQUE INDEX spi_unique ON public.study_path_items USING btree (path_id, "position");

CREATE UNIQUE INDEX study_path_items_pkey ON public.study_path_items USING btree (id);

CREATE UNIQUE INDEX study_paths_pkey ON public.study_paths USING btree (id);

CREATE UNIQUE INDEX topics_pkey ON public.topics USING btree (id);

CREATE UNIQUE INDEX topics_slug_key ON public.topics USING btree (slug);

alter table "public"."edges" add constraint "edges_pkey" PRIMARY KEY using index "edges_pkey";

alter table "public"."resources" add constraint "resources_pkey" PRIMARY KEY using index "resources_pkey";

alter table "public"."study_path_items" add constraint "study_path_items_pkey" PRIMARY KEY using index "study_path_items_pkey";

alter table "public"."study_paths" add constraint "study_paths_pkey" PRIMARY KEY using index "study_paths_pkey";

alter table "public"."topics" add constraint "topics_pkey" PRIMARY KEY using index "topics_pkey";

alter table "public"."edges" add constraint "edges_no_self_loop" CHECK (((from_type <> to_type) OR (from_id <> to_id))) not valid;

alter table "public"."edges" validate constraint "edges_no_self_loop";

alter table "public"."edges" add constraint "edges_unique" UNIQUE using index "edges_unique";

alter table "public"."resources" add constraint "resources_url_key" UNIQUE using index "resources_url_key";

alter table "public"."study_path_items" add constraint "spi_unique" UNIQUE using index "spi_unique";

alter table "public"."study_path_items" add constraint "study_path_items_path_id_fkey" FOREIGN KEY (path_id) REFERENCES study_paths(id) ON DELETE CASCADE not valid;

alter table "public"."study_path_items" validate constraint "study_path_items_path_id_fkey";

alter table "public"."topics" add constraint "topics_slug_key" UNIQUE using index "topics_slug_key";

create or replace view "public"."edge_readable" as  SELECT id,
    from_type,
    from_id,
        CASE
            WHEN (from_type = 'topic'::node_type) THEN ( SELECT t.title
               FROM topics t
              WHERE (t.id = e.from_id))
            ELSE ( SELECT r.title
               FROM resources r
              WHERE (r.id = e.from_id))
        END AS from_title,
    to_type,
    to_id,
        CASE
            WHEN (to_type = 'topic'::node_type) THEN ( SELECT t.title
               FROM topics t
              WHERE (t.id = e.to_id))
            ELSE ( SELECT r.title
               FROM resources r
              WHERE (r.id = e.to_id))
        END AS to_title,
    weight,
    confidence,
    is_active,
    note,
    created_at
   FROM edges e
  WHERE (is_active = true);



  create policy "read_all_edges"
  on "public"."edges"
  as permissive
  for select
  to public
using (true);



  create policy "update_edges_auth"
  on "public"."edges"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "write_edges_auth"
  on "public"."edges"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "read_all_resources"
  on "public"."resources"
  as permissive
  for select
  to public
using (true);



  create policy "update_resources_auth"
  on "public"."resources"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "write_resources_auth"
  on "public"."resources"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "delete_items_if_owner"
  on "public"."study_path_items"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM study_paths p
  WHERE ((p.id = study_path_items.path_id) AND (p.owner = auth.uid())))));



  create policy "insert_items_if_owner"
  on "public"."study_path_items"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM study_paths p
  WHERE ((p.id = study_path_items.path_id) AND (p.owner = auth.uid())))));



  create policy "read_items_if_path_ok"
  on "public"."study_path_items"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM study_paths p
  WHERE ((p.id = study_path_items.path_id) AND ((p.is_public = true) OR ((auth.role() = 'authenticated'::text) AND (p.owner = auth.uid())))))));



  create policy "update_items_if_owner"
  on "public"."study_path_items"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM study_paths p
  WHERE ((p.id = study_path_items.path_id) AND (p.owner = auth.uid())))));



  create policy "delete_paths_owner"
  on "public"."study_paths"
  as permissive
  for delete
  to public
using ((auth.uid() = owner));



  create policy "insert_paths_owner"
  on "public"."study_paths"
  as permissive
  for insert
  to public
with check ((auth.uid() = owner));



  create policy "read_public_paths"
  on "public"."study_paths"
  as permissive
  for select
  to public
using (((is_public = true) OR ((auth.role() = 'authenticated'::text) AND (owner = auth.uid()))));



  create policy "update_paths_owner"
  on "public"."study_paths"
  as permissive
  for update
  to public
using ((auth.uid() = owner));



  create policy "read_all_topics"
  on "public"."topics"
  as permissive
  for select
  to public
using (true);



  create policy "update_topics_auth"
  on "public"."topics"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "write_topics_auth"
  on "public"."topics"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



