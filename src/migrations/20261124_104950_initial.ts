import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_type" AS ENUM('stire', 'explicatie', 'analiza', 'ghid', 'opinie', 'interviu', 'ancheta', 'advertorial');
  CREATE TYPE "public"."enum_articles_image_chart" AS ENUM('energie');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_type" AS ENUM('stire', 'explicatie', 'analiza', 'ghid', 'opinie', 'interviu', 'ancheta', 'advertorial');
  CREATE TYPE "public"."enum__articles_v_version_image_chart" AS ENUM('energie');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_frontpages_edition" AS ENUM('nat', 'ne', 'se', 'sm', 'sv', 'v', 'nv', 'c', 'bi');
  CREATE TYPE "public"."enum_liveblogs_entries_kind" AS ENUM('text', 'important', 'citat', 'corectura');
  CREATE TYPE "public"."enum_liveblogs_live_state" AS ENUM('activ', 'incheiat');
  CREATE TYPE "public"."enum_liveblogs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__liveblogs_v_version_entries_kind" AS ENUM('text', 'important', 'citat', 'corectura');
  CREATE TYPE "public"."enum__liveblogs_v_version_live_state" AS ENUM('activ', 'incheiat');
  CREATE TYPE "public"."enum__liveblogs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_provenance_event" AS ENUM('sursa_atasata', 'ai_folosit', 'editare_umana', 'poarta_trecuta', 'publicat', 'corectura', 'import_demo');
  CREATE TYPE "public"."enum_provenance_task" AS ENUM('transcriere', 'extragere', 'traducere', 'verificare', 'metadate', 'redactare');
  CREATE TYPE "public"."enum_road_events_map_segment" AS ENUM('a1-buc-pit', 'a1-pit-sib', 'a1-sib-nad', 'a2', 'a3-buc-plo', 'a7', 'a10', 'a3-tur-zal', 'dx12', 'dn1-plo-bv', 'dn7-olt', 'dn7c', 'dn67c', 'dn6-buc-car', 'dn6-car-cv', 'dn6-cv-lug', 'dn66-fil-tj', 'dn66-tj-pet', 'dn66-pet-dev', 'dn67', 'dn56', 'dn65', 'dn2', 'dn1-bv-sb', 'dn13', 'dn1-cj-or', 'dn24', 'dn22-bz-gl', 'dn22-ct-tl', 'dn79', 'dn1c', 'dn15', 'dn12');
  CREATE TYPE "public"."enum_road_events_status" AS ENUM('closed', 'works', 'queue', 'ok');
  CREATE TYPE "public"."enum_travel_times_status" AS ENUM('ok', 'queue', 'works', 'closed');
  CREATE TYPE "public"."enum_outages_kind" AS ENUM('water', 'power', 'gas');
  CREATE TYPE "public"."enum_weather_alerts_code" AS ENUM('yellow', 'orange', 'red');
  CREATE TYPE "public"."enum_weather_level" AS ENUM('principal', 'secundar', 'local');
  CREATE TYPE "public"."enum_weather_cond" AS ENUM('sun', 'cloud', 'fog', 'snow', 'rain');
  CREATE TYPE "public"."enum_jobs_source" AS ENUM('direct', 'import');
  CREATE TYPE "public"."enum_regions_map_key" AS ENUM('ne', 'se', 'sm', 'sv', 'v', 'nv', 'c', 'bi');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'editor', 'reporter');
  CREATE TYPE "public"."enum_momentul_items_edition" AS ENUM('nat', 'ne', 'se', 'sm', 'sv', 'v', 'nv', 'c', 'bi');
  CREATE TABLE "articles_summary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"x" varchar
  );
  
  CREATE TABLE "articles_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "articles_updates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"x" varchar
  );
  
  CREATE TABLE "articles_corrections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"x" varchar
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"type" "enum_articles_type" DEFAULT 'stire',
  	"section_id" integer,
  	"label" varchar,
  	"region_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"priority" numeric DEFAULT 3,
  	"place_name" varchar,
  	"place_lat" numeric,
  	"place_lon" numeric,
  	"title" varchar,
  	"seo_title" varchar,
  	"dek" varchar,
  	"title_check" boolean,
  	"for_you_who" varchar,
  	"for_you_when" varchar,
  	"for_you_todo" varchar,
  	"body" jsonb,
  	"image_file_id" integer,
  	"image_src" varchar,
  	"image_alt" varchar,
  	"image_caption" varchar,
  	"image_credit" varchar,
  	"image_chart" "enum_articles_image_chart",
  	"sponsor_name" varchar,
  	"sponsor_url" varchar,
  	"reading_time" numeric,
  	"ai_assisted" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"counties_id" integer,
  	"tags_id" integer,
  	"authors_id" integer
  );
  
  CREATE TABLE "_articles_v_version_summary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"x" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_updates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"x" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v_version_corrections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"x" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_type" "enum__articles_v_version_type" DEFAULT 'stire',
  	"version_section_id" integer,
  	"version_label" varchar,
  	"version_region_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_priority" numeric DEFAULT 3,
  	"version_place_name" varchar,
  	"version_place_lat" numeric,
  	"version_place_lon" numeric,
  	"version_title" varchar,
  	"version_seo_title" varchar,
  	"version_dek" varchar,
  	"version_title_check" boolean,
  	"version_for_you_who" varchar,
  	"version_for_you_when" varchar,
  	"version_for_you_todo" varchar,
  	"version_body" jsonb,
  	"version_image_file_id" integer,
  	"version_image_src" varchar,
  	"version_image_alt" varchar,
  	"version_image_caption" varchar,
  	"version_image_credit" varchar,
  	"version_image_chart" "enum__articles_v_version_image_chart",
  	"version_sponsor_name" varchar,
  	"version_sponsor_url" varchar,
  	"version_reading_time" numeric,
  	"version_ai_assisted" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"counties_id" integer,
  	"tags_id" integer,
  	"authors_id" integer
  );
  
  CREATE TABLE "frontpages_callouts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"article_id" integer NOT NULL,
  	"dx" numeric DEFAULT 20,
  	"dy" numeric DEFAULT -60
  );
  
  CREATE TABLE "frontpages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"edition" "enum_frontpages_edition" NOT NULL,
  	"top_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "frontpages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer
  );
  
  CREATE TABLE "liveblogs_key_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"x" varchar
  );
  
  CREATE TABLE "liveblogs_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"title" varchar,
  	"x" varchar,
  	"kind" "enum_liveblogs_entries_kind" DEFAULT 'text',
  	"author_id" integer
  );
  
  CREATE TABLE "liveblogs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"title" varchar,
  	"dek" varchar,
  	"live_state" "enum_liveblogs_live_state" DEFAULT 'activ',
  	"section_id" integer,
  	"region_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"image_src" varchar,
  	"image_alt" varchar,
  	"image_caption" varchar,
  	"image_credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_liveblogs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "liveblogs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"authors_id" integer
  );
  
  CREATE TABLE "_liveblogs_v_version_key_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"x" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_liveblogs_v_version_entries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"title" varchar,
  	"x" varchar,
  	"kind" "enum__liveblogs_v_version_entries_kind" DEFAULT 'text',
  	"author_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_liveblogs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_dek" varchar,
  	"version_live_state" "enum__liveblogs_v_version_live_state" DEFAULT 'activ',
  	"version_section_id" integer,
  	"version_region_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_image_src" varchar,
  	"version_image_alt" varchar,
  	"version_image_caption" varchar,
  	"version_image_credit" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__liveblogs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_liveblogs_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"authors_id" integer
  );
  
  CREATE TABLE "authors_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar,
  	"beat" varchar,
  	"base" varchar,
  	"bio" varchar,
  	"email" varchar,
  	"photo_id" integer,
  	"initials" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"credit" varchar NOT NULL,
  	"license" varchar NOT NULL,
  	"ai_generated" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "provenance" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"article_id" integer NOT NULL,
  	"event" "enum_provenance_event" NOT NULL,
  	"actor" varchar NOT NULL,
  	"tool" varchar,
  	"local" boolean,
  	"task" "enum_provenance_task",
  	"gate" numeric,
  	"note" varchar,
  	"content_hash" varchar,
  	"at" timestamp(3) with time zone,
  	"prev_hash" varchar,
  	"hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "road_events_map_segment" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_road_events_map_segment",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "road_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"road" varchar NOT NULL,
  	"segment" varchar NOT NULL,
  	"what" varchar NOT NULL,
  	"status" "enum_road_events_status" DEFAULT 'queue' NOT NULL,
  	"delay_minutes" numeric,
  	"label" varchar,
  	"county_id" integer NOT NULL,
  	"region_id" integer,
  	"lat" numeric,
  	"lon" numeric,
  	"from" timestamp(3) with time zone,
  	"until" timestamp(3) with time zone,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "travel_times" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"route" varchar NOT NULL,
  	"region_id" integer,
  	"duration" varchar NOT NULL,
  	"delta" varchar NOT NULL,
  	"status" "enum_travel_times_status" DEFAULT 'ok' NOT NULL,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "outages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_outages_kind" NOT NULL,
  	"title" varchar NOT NULL,
  	"area" varchar NOT NULL,
  	"county_id" integer NOT NULL,
  	"city" varchar NOT NULL,
  	"region_id" integer,
  	"lat" numeric,
  	"lon" numeric,
  	"from" timestamp(3) with time zone,
  	"until" timestamp(3) with time zone,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "weather_alerts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" "enum_weather_alerts_code" DEFAULT 'yellow' NOT NULL,
  	"phenomenon" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"roads" varchar,
  	"from" timestamp(3) with time zone,
  	"until" timestamp(3) with time zone,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "weather_alerts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"counties_id" integer
  );
  
  CREATE TABLE "weather_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"h" numeric NOT NULL,
  	"t" numeric NOT NULL
  );
  
  CREATE TABLE "weather" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"city" varchar NOT NULL,
  	"map_key" varchar NOT NULL,
  	"level" "enum_weather_level" DEFAULT 'local' NOT NULL,
  	"county_id" integer,
  	"temp" numeric NOT NULL,
  	"cond" "enum_weather_cond" NOT NULL,
  	"cond_text" varchar,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "energy_prices" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"day" varchar NOT NULL,
  	"values" varchar NOT NULL,
  	"source" varchar DEFAULT 'OPCOM, piața pentru ziua următoare',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "fuel_prices" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"county_id" integer NOT NULL,
  	"day" varchar NOT NULL,
  	"petrol" numeric NOT NULL,
  	"diesel" numeric NOT NULL,
  	"lpg" numeric,
  	"cheapest_note" varchar,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pharmacies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"day" varchar NOT NULL,
  	"county_id" integer NOT NULL,
  	"city" varchar NOT NULL,
  	"address" varchar NOT NULL,
  	"hours" varchar NOT NULL,
  	"phone" varchar,
  	"sponsor" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"title" varchar NOT NULL,
  	"employer" varchar NOT NULL,
  	"county_id" integer NOT NULL,
  	"city" varchar NOT NULL,
  	"region_id" integer,
  	"salary_min" numeric,
  	"salary_max" numeric,
  	"salary_note" varchar,
  	"where" varchar,
  	"description" varchar,
  	"requirements" varchar,
  	"apply_email" varchar,
  	"apply_url" varchar,
  	"deadline" timestamp(3) with time zone,
  	"promoted" boolean DEFAULT false,
  	"promoted_until" timestamp(3) with time zone,
  	"source" "enum_jobs_source" DEFAULT 'direct',
  	"source_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"desc" varchar,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "regions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"short" varchar NOT NULL,
  	"map_key" "enum_regions_map_key" NOT NULL,
  	"city" varchar NOT NULL,
  	"city_key" varchar NOT NULL,
  	"ref_county_id" integer,
  	"launched" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"sponsor_name" varchar,
  	"sponsor_line" varchar,
  	"sponsor_url" varchar,
  	"sponsor_until" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "counties" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"map_key" varchar NOT NULL,
  	"seat" varchar NOT NULL,
  	"region_id" integer NOT NULL,
  	"jobs_active" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"short" varchar,
  	"updated" varchar,
  	"description" varchar,
  	"html" varchar NOT NULL,
  	"lawyer_reviewed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"permanent" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"author_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"regions_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer,
  	"frontpages_id" integer,
  	"liveblogs_id" integer,
  	"authors_id" integer,
  	"media_id" integer,
  	"provenance_id" integer,
  	"road_events_id" integer,
  	"travel_times_id" integer,
  	"outages_id" integer,
  	"weather_alerts_id" integer,
  	"weather_id" integer,
  	"energy_prices_id" integer,
  	"fuel_prices_id" integer,
  	"pharmacies_id" integer,
  	"jobs_id" integer,
  	"sections_id" integer,
  	"regions_id" integer,
  	"counties_id" integer,
  	"tags_id" integer,
  	"pages_id" integer,
  	"redirects_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "momentul_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"edition" "enum_momentul_items_edition" NOT NULL,
  	"until" timestamp(3) with time zone,
  	"greeting" varchar,
  	"phrase" varchar
  );
  
  CREATE TABLE "momentul" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pension_pct" numeric DEFAULT 6.1,
  	"pension_from" varchar DEFAULT '1 ianuarie 2027',
  	"next_update" varchar DEFAULT 'Următoarea actualizare mare: ediția de seară, la 18:00.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar DEFAULT 'Cadranul',
  	"tagline" varchar DEFAULT 'România, oră de oră.',
  	"publisher_legal_name" varchar DEFAULT '[Denumire SRL]',
  	"publisher_cui" varchar DEFAULT '[RO…]',
  	"publisher_orc" varchar DEFAULT '[J…/…/…]',
  	"publisher_address" varchar DEFAULT '[Adresa completă a sediului]',
  	"publisher_email" varchar DEFAULT 'redactie@cadranul.ro',
  	"publisher_phone" varchar DEFAULT '[+40 …]',
  	"publisher_dpo_email" varchar DEFAULT 'date@cadranul.ro',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "articles_summary" ADD CONSTRAINT "articles_summary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_sources" ADD CONSTRAINT "articles_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_updates" ADD CONSTRAINT "articles_updates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_corrections" ADD CONSTRAINT "articles_corrections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_image_file_id_media_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_counties_fk" FOREIGN KEY ("counties_id") REFERENCES "public"."counties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_summary" ADD CONSTRAINT "_articles_v_version_summary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_sources" ADD CONSTRAINT "_articles_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_updates" ADD CONSTRAINT "_articles_v_version_updates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_corrections" ADD CONSTRAINT "_articles_v_version_corrections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_section_id_sections_id_fk" FOREIGN KEY ("version_section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_region_id_regions_id_fk" FOREIGN KEY ("version_region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_image_file_id_media_id_fk" FOREIGN KEY ("version_image_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_counties_fk" FOREIGN KEY ("counties_id") REFERENCES "public"."counties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "frontpages_callouts" ADD CONSTRAINT "frontpages_callouts_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "frontpages_callouts" ADD CONSTRAINT "frontpages_callouts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."frontpages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "frontpages" ADD CONSTRAINT "frontpages_top_id_articles_id_fk" FOREIGN KEY ("top_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "frontpages_rels" ADD CONSTRAINT "frontpages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."frontpages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "frontpages_rels" ADD CONSTRAINT "frontpages_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "liveblogs_key_points" ADD CONSTRAINT "liveblogs_key_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."liveblogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "liveblogs_entries" ADD CONSTRAINT "liveblogs_entries_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "liveblogs_entries" ADD CONSTRAINT "liveblogs_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."liveblogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "liveblogs" ADD CONSTRAINT "liveblogs_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "liveblogs" ADD CONSTRAINT "liveblogs_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "liveblogs_rels" ADD CONSTRAINT "liveblogs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."liveblogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "liveblogs_rels" ADD CONSTRAINT "liveblogs_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "liveblogs_rels" ADD CONSTRAINT "liveblogs_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_liveblogs_v_version_key_points" ADD CONSTRAINT "_liveblogs_v_version_key_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_liveblogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_liveblogs_v_version_entries" ADD CONSTRAINT "_liveblogs_v_version_entries_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_liveblogs_v_version_entries" ADD CONSTRAINT "_liveblogs_v_version_entries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_liveblogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_liveblogs_v" ADD CONSTRAINT "_liveblogs_v_parent_id_liveblogs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."liveblogs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_liveblogs_v" ADD CONSTRAINT "_liveblogs_v_version_section_id_sections_id_fk" FOREIGN KEY ("version_section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_liveblogs_v" ADD CONSTRAINT "_liveblogs_v_version_region_id_regions_id_fk" FOREIGN KEY ("version_region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_liveblogs_v_rels" ADD CONSTRAINT "_liveblogs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_liveblogs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_liveblogs_v_rels" ADD CONSTRAINT "_liveblogs_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_liveblogs_v_rels" ADD CONSTRAINT "_liveblogs_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors_same_as" ADD CONSTRAINT "authors_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "authors" ADD CONSTRAINT "authors_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "provenance" ADD CONSTRAINT "provenance_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "road_events_map_segment" ADD CONSTRAINT "road_events_map_segment_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."road_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "road_events" ADD CONSTRAINT "road_events_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "road_events" ADD CONSTRAINT "road_events_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "travel_times" ADD CONSTRAINT "travel_times_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "outages" ADD CONSTRAINT "outages_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "outages" ADD CONSTRAINT "outages_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "weather_alerts_rels" ADD CONSTRAINT "weather_alerts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."weather_alerts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "weather_alerts_rels" ADD CONSTRAINT "weather_alerts_rels_counties_fk" FOREIGN KEY ("counties_id") REFERENCES "public"."counties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "weather_hours" ADD CONSTRAINT "weather_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."weather"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "weather" ADD CONSTRAINT "weather_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "fuel_prices" ADD CONSTRAINT "fuel_prices_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pharmacies" ADD CONSTRAINT "pharmacies_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_county_id_counties_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."counties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "jobs" ADD CONSTRAINT "jobs_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regions" ADD CONSTRAINT "regions_ref_county_id_counties_id_fk" FOREIGN KEY ("ref_county_id") REFERENCES "public"."counties"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "counties" ADD CONSTRAINT "counties_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_regions_fk" FOREIGN KEY ("regions_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_frontpages_fk" FOREIGN KEY ("frontpages_id") REFERENCES "public"."frontpages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_liveblogs_fk" FOREIGN KEY ("liveblogs_id") REFERENCES "public"."liveblogs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_provenance_fk" FOREIGN KEY ("provenance_id") REFERENCES "public"."provenance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_road_events_fk" FOREIGN KEY ("road_events_id") REFERENCES "public"."road_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_travel_times_fk" FOREIGN KEY ("travel_times_id") REFERENCES "public"."travel_times"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_outages_fk" FOREIGN KEY ("outages_id") REFERENCES "public"."outages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_weather_alerts_fk" FOREIGN KEY ("weather_alerts_id") REFERENCES "public"."weather_alerts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_weather_fk" FOREIGN KEY ("weather_id") REFERENCES "public"."weather"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_energy_prices_fk" FOREIGN KEY ("energy_prices_id") REFERENCES "public"."energy_prices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fuel_prices_fk" FOREIGN KEY ("fuel_prices_id") REFERENCES "public"."fuel_prices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pharmacies_fk" FOREIGN KEY ("pharmacies_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sections_fk" FOREIGN KEY ("sections_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_regions_fk" FOREIGN KEY ("regions_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_counties_fk" FOREIGN KEY ("counties_id") REFERENCES "public"."counties"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "momentul_items" ADD CONSTRAINT "momentul_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."momentul"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_summary_order_idx" ON "articles_summary" USING btree ("_order");
  CREATE INDEX "articles_summary_parent_id_idx" ON "articles_summary" USING btree ("_parent_id");
  CREATE INDEX "articles_sources_order_idx" ON "articles_sources" USING btree ("_order");
  CREATE INDEX "articles_sources_parent_id_idx" ON "articles_sources" USING btree ("_parent_id");
  CREATE INDEX "articles_updates_order_idx" ON "articles_updates" USING btree ("_order");
  CREATE INDEX "articles_updates_parent_id_idx" ON "articles_updates" USING btree ("_parent_id");
  CREATE INDEX "articles_corrections_order_idx" ON "articles_corrections" USING btree ("_order");
  CREATE INDEX "articles_corrections_parent_id_idx" ON "articles_corrections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_section_idx" ON "articles" USING btree ("section_id");
  CREATE INDEX "articles_region_idx" ON "articles" USING btree ("region_id");
  CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at");
  CREATE INDEX "articles_image_image_file_idx" ON "articles" USING btree ("image_file_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");
  CREATE INDEX "articles_rels_order_idx" ON "articles_rels" USING btree ("order");
  CREATE INDEX "articles_rels_parent_idx" ON "articles_rels" USING btree ("parent_id");
  CREATE INDEX "articles_rels_path_idx" ON "articles_rels" USING btree ("path");
  CREATE INDEX "articles_rels_counties_id_idx" ON "articles_rels" USING btree ("counties_id");
  CREATE INDEX "articles_rels_tags_id_idx" ON "articles_rels" USING btree ("tags_id");
  CREATE INDEX "articles_rels_authors_id_idx" ON "articles_rels" USING btree ("authors_id");
  CREATE INDEX "_articles_v_version_summary_order_idx" ON "_articles_v_version_summary" USING btree ("_order");
  CREATE INDEX "_articles_v_version_summary_parent_id_idx" ON "_articles_v_version_summary" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_sources_order_idx" ON "_articles_v_version_sources" USING btree ("_order");
  CREATE INDEX "_articles_v_version_sources_parent_id_idx" ON "_articles_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_updates_order_idx" ON "_articles_v_version_updates" USING btree ("_order");
  CREATE INDEX "_articles_v_version_updates_parent_id_idx" ON "_articles_v_version_updates" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_corrections_order_idx" ON "_articles_v_version_corrections" USING btree ("_order");
  CREATE INDEX "_articles_v_version_corrections_parent_id_idx" ON "_articles_v_version_corrections" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_section_idx" ON "_articles_v" USING btree ("version_section_id");
  CREATE INDEX "_articles_v_version_version_region_idx" ON "_articles_v" USING btree ("version_region_id");
  CREATE INDEX "_articles_v_version_version_published_at_idx" ON "_articles_v" USING btree ("version_published_at");
  CREATE INDEX "_articles_v_version_image_version_image_file_idx" ON "_articles_v" USING btree ("version_image_file_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_rels_order_idx" ON "_articles_v_rels" USING btree ("order");
  CREATE INDEX "_articles_v_rels_parent_idx" ON "_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articles_v_rels_path_idx" ON "_articles_v_rels" USING btree ("path");
  CREATE INDEX "_articles_v_rels_counties_id_idx" ON "_articles_v_rels" USING btree ("counties_id");
  CREATE INDEX "_articles_v_rels_tags_id_idx" ON "_articles_v_rels" USING btree ("tags_id");
  CREATE INDEX "_articles_v_rels_authors_id_idx" ON "_articles_v_rels" USING btree ("authors_id");
  CREATE INDEX "frontpages_callouts_order_idx" ON "frontpages_callouts" USING btree ("_order");
  CREATE INDEX "frontpages_callouts_parent_id_idx" ON "frontpages_callouts" USING btree ("_parent_id");
  CREATE INDEX "frontpages_callouts_article_idx" ON "frontpages_callouts" USING btree ("article_id");
  CREATE UNIQUE INDEX "frontpages_edition_idx" ON "frontpages" USING btree ("edition");
  CREATE INDEX "frontpages_top_idx" ON "frontpages" USING btree ("top_id");
  CREATE INDEX "frontpages_updated_at_idx" ON "frontpages" USING btree ("updated_at");
  CREATE INDEX "frontpages_created_at_idx" ON "frontpages" USING btree ("created_at");
  CREATE INDEX "frontpages_rels_order_idx" ON "frontpages_rels" USING btree ("order");
  CREATE INDEX "frontpages_rels_parent_idx" ON "frontpages_rels" USING btree ("parent_id");
  CREATE INDEX "frontpages_rels_path_idx" ON "frontpages_rels" USING btree ("path");
  CREATE INDEX "frontpages_rels_articles_id_idx" ON "frontpages_rels" USING btree ("articles_id");
  CREATE INDEX "liveblogs_key_points_order_idx" ON "liveblogs_key_points" USING btree ("_order");
  CREATE INDEX "liveblogs_key_points_parent_id_idx" ON "liveblogs_key_points" USING btree ("_parent_id");
  CREATE INDEX "liveblogs_entries_order_idx" ON "liveblogs_entries" USING btree ("_order");
  CREATE INDEX "liveblogs_entries_parent_id_idx" ON "liveblogs_entries" USING btree ("_parent_id");
  CREATE INDEX "liveblogs_entries_author_idx" ON "liveblogs_entries" USING btree ("author_id");
  CREATE UNIQUE INDEX "liveblogs_slug_idx" ON "liveblogs" USING btree ("slug");
  CREATE INDEX "liveblogs_section_idx" ON "liveblogs" USING btree ("section_id");
  CREATE INDEX "liveblogs_region_idx" ON "liveblogs" USING btree ("region_id");
  CREATE INDEX "liveblogs_updated_at_idx" ON "liveblogs" USING btree ("updated_at");
  CREATE INDEX "liveblogs_created_at_idx" ON "liveblogs" USING btree ("created_at");
  CREATE INDEX "liveblogs__status_idx" ON "liveblogs" USING btree ("_status");
  CREATE INDEX "liveblogs_rels_order_idx" ON "liveblogs_rels" USING btree ("order");
  CREATE INDEX "liveblogs_rels_parent_idx" ON "liveblogs_rels" USING btree ("parent_id");
  CREATE INDEX "liveblogs_rels_path_idx" ON "liveblogs_rels" USING btree ("path");
  CREATE INDEX "liveblogs_rels_tags_id_idx" ON "liveblogs_rels" USING btree ("tags_id");
  CREATE INDEX "liveblogs_rels_authors_id_idx" ON "liveblogs_rels" USING btree ("authors_id");
  CREATE INDEX "_liveblogs_v_version_key_points_order_idx" ON "_liveblogs_v_version_key_points" USING btree ("_order");
  CREATE INDEX "_liveblogs_v_version_key_points_parent_id_idx" ON "_liveblogs_v_version_key_points" USING btree ("_parent_id");
  CREATE INDEX "_liveblogs_v_version_entries_order_idx" ON "_liveblogs_v_version_entries" USING btree ("_order");
  CREATE INDEX "_liveblogs_v_version_entries_parent_id_idx" ON "_liveblogs_v_version_entries" USING btree ("_parent_id");
  CREATE INDEX "_liveblogs_v_version_entries_author_idx" ON "_liveblogs_v_version_entries" USING btree ("author_id");
  CREATE INDEX "_liveblogs_v_parent_idx" ON "_liveblogs_v" USING btree ("parent_id");
  CREATE INDEX "_liveblogs_v_version_version_slug_idx" ON "_liveblogs_v" USING btree ("version_slug");
  CREATE INDEX "_liveblogs_v_version_version_section_idx" ON "_liveblogs_v" USING btree ("version_section_id");
  CREATE INDEX "_liveblogs_v_version_version_region_idx" ON "_liveblogs_v" USING btree ("version_region_id");
  CREATE INDEX "_liveblogs_v_version_version_updated_at_idx" ON "_liveblogs_v" USING btree ("version_updated_at");
  CREATE INDEX "_liveblogs_v_version_version_created_at_idx" ON "_liveblogs_v" USING btree ("version_created_at");
  CREATE INDEX "_liveblogs_v_version_version__status_idx" ON "_liveblogs_v" USING btree ("version__status");
  CREATE INDEX "_liveblogs_v_created_at_idx" ON "_liveblogs_v" USING btree ("created_at");
  CREATE INDEX "_liveblogs_v_updated_at_idx" ON "_liveblogs_v" USING btree ("updated_at");
  CREATE INDEX "_liveblogs_v_latest_idx" ON "_liveblogs_v" USING btree ("latest");
  CREATE INDEX "_liveblogs_v_rels_order_idx" ON "_liveblogs_v_rels" USING btree ("order");
  CREATE INDEX "_liveblogs_v_rels_parent_idx" ON "_liveblogs_v_rels" USING btree ("parent_id");
  CREATE INDEX "_liveblogs_v_rels_path_idx" ON "_liveblogs_v_rels" USING btree ("path");
  CREATE INDEX "_liveblogs_v_rels_tags_id_idx" ON "_liveblogs_v_rels" USING btree ("tags_id");
  CREATE INDEX "_liveblogs_v_rels_authors_id_idx" ON "_liveblogs_v_rels" USING btree ("authors_id");
  CREATE INDEX "authors_same_as_order_idx" ON "authors_same_as" USING btree ("_order");
  CREATE INDEX "authors_same_as_parent_id_idx" ON "authors_same_as" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");
  CREATE INDEX "authors_photo_idx" ON "authors" USING btree ("photo_id");
  CREATE INDEX "authors_updated_at_idx" ON "authors" USING btree ("updated_at");
  CREATE INDEX "authors_created_at_idx" ON "authors" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "provenance_article_idx" ON "provenance" USING btree ("article_id");
  CREATE INDEX "provenance_updated_at_idx" ON "provenance" USING btree ("updated_at");
  CREATE INDEX "provenance_created_at_idx" ON "provenance" USING btree ("created_at");
  CREATE INDEX "road_events_map_segment_order_idx" ON "road_events_map_segment" USING btree ("order");
  CREATE INDEX "road_events_map_segment_parent_idx" ON "road_events_map_segment" USING btree ("parent_id");
  CREATE INDEX "road_events_county_idx" ON "road_events" USING btree ("county_id");
  CREATE INDEX "road_events_region_idx" ON "road_events" USING btree ("region_id");
  CREATE INDEX "road_events_until_idx" ON "road_events" USING btree ("until");
  CREATE INDEX "road_events_updated_at_idx" ON "road_events" USING btree ("updated_at");
  CREATE INDEX "road_events_created_at_idx" ON "road_events" USING btree ("created_at");
  CREATE INDEX "travel_times_region_idx" ON "travel_times" USING btree ("region_id");
  CREATE INDEX "travel_times_updated_at_idx" ON "travel_times" USING btree ("updated_at");
  CREATE INDEX "travel_times_created_at_idx" ON "travel_times" USING btree ("created_at");
  CREATE INDEX "outages_county_idx" ON "outages" USING btree ("county_id");
  CREATE INDEX "outages_region_idx" ON "outages" USING btree ("region_id");
  CREATE INDEX "outages_until_idx" ON "outages" USING btree ("until");
  CREATE INDEX "outages_updated_at_idx" ON "outages" USING btree ("updated_at");
  CREATE INDEX "outages_created_at_idx" ON "outages" USING btree ("created_at");
  CREATE INDEX "weather_alerts_until_idx" ON "weather_alerts" USING btree ("until");
  CREATE INDEX "weather_alerts_updated_at_idx" ON "weather_alerts" USING btree ("updated_at");
  CREATE INDEX "weather_alerts_created_at_idx" ON "weather_alerts" USING btree ("created_at");
  CREATE INDEX "weather_alerts_rels_order_idx" ON "weather_alerts_rels" USING btree ("order");
  CREATE INDEX "weather_alerts_rels_parent_idx" ON "weather_alerts_rels" USING btree ("parent_id");
  CREATE INDEX "weather_alerts_rels_path_idx" ON "weather_alerts_rels" USING btree ("path");
  CREATE INDEX "weather_alerts_rels_counties_id_idx" ON "weather_alerts_rels" USING btree ("counties_id");
  CREATE INDEX "weather_hours_order_idx" ON "weather_hours" USING btree ("_order");
  CREATE INDEX "weather_hours_parent_id_idx" ON "weather_hours" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "weather_map_key_idx" ON "weather" USING btree ("map_key");
  CREATE INDEX "weather_county_idx" ON "weather" USING btree ("county_id");
  CREATE INDEX "weather_updated_at_idx" ON "weather" USING btree ("updated_at");
  CREATE INDEX "weather_created_at_idx" ON "weather" USING btree ("created_at");
  CREATE UNIQUE INDEX "energy_prices_day_idx" ON "energy_prices" USING btree ("day");
  CREATE INDEX "energy_prices_updated_at_idx" ON "energy_prices" USING btree ("updated_at");
  CREATE INDEX "energy_prices_created_at_idx" ON "energy_prices" USING btree ("created_at");
  CREATE INDEX "fuel_prices_county_idx" ON "fuel_prices" USING btree ("county_id");
  CREATE INDEX "fuel_prices_day_idx" ON "fuel_prices" USING btree ("day");
  CREATE INDEX "fuel_prices_updated_at_idx" ON "fuel_prices" USING btree ("updated_at");
  CREATE INDEX "fuel_prices_created_at_idx" ON "fuel_prices" USING btree ("created_at");
  CREATE UNIQUE INDEX "county_day_idx" ON "fuel_prices" USING btree ("county_id","day");
  CREATE INDEX "pharmacies_day_idx" ON "pharmacies" USING btree ("day");
  CREATE INDEX "pharmacies_county_idx" ON "pharmacies" USING btree ("county_id");
  CREATE INDEX "pharmacies_updated_at_idx" ON "pharmacies" USING btree ("updated_at");
  CREATE INDEX "pharmacies_created_at_idx" ON "pharmacies" USING btree ("created_at");
  CREATE UNIQUE INDEX "jobs_slug_idx" ON "jobs" USING btree ("slug");
  CREATE INDEX "jobs_county_idx" ON "jobs" USING btree ("county_id");
  CREATE INDEX "jobs_region_idx" ON "jobs" USING btree ("region_id");
  CREATE INDEX "jobs_updated_at_idx" ON "jobs" USING btree ("updated_at");
  CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");
  CREATE UNIQUE INDEX "sections_slug_idx" ON "sections" USING btree ("slug");
  CREATE INDEX "sections_updated_at_idx" ON "sections" USING btree ("updated_at");
  CREATE INDEX "sections_created_at_idx" ON "sections" USING btree ("created_at");
  CREATE UNIQUE INDEX "regions_slug_idx" ON "regions" USING btree ("slug");
  CREATE UNIQUE INDEX "regions_map_key_idx" ON "regions" USING btree ("map_key");
  CREATE INDEX "regions_ref_county_idx" ON "regions" USING btree ("ref_county_id");
  CREATE INDEX "regions_updated_at_idx" ON "regions" USING btree ("updated_at");
  CREATE INDEX "regions_created_at_idx" ON "regions" USING btree ("created_at");
  CREATE UNIQUE INDEX "counties_slug_idx" ON "counties" USING btree ("slug");
  CREATE INDEX "counties_region_idx" ON "counties" USING btree ("region_id");
  CREATE INDEX "counties_updated_at_idx" ON "counties" USING btree ("updated_at");
  CREATE INDEX "counties_created_at_idx" ON "counties" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_author_idx" ON "users" USING btree ("author_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_regions_id_idx" ON "users_rels" USING btree ("regions_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_frontpages_id_idx" ON "payload_locked_documents_rels" USING btree ("frontpages_id");
  CREATE INDEX "payload_locked_documents_rels_liveblogs_id_idx" ON "payload_locked_documents_rels" USING btree ("liveblogs_id");
  CREATE INDEX "payload_locked_documents_rels_authors_id_idx" ON "payload_locked_documents_rels" USING btree ("authors_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_provenance_id_idx" ON "payload_locked_documents_rels" USING btree ("provenance_id");
  CREATE INDEX "payload_locked_documents_rels_road_events_id_idx" ON "payload_locked_documents_rels" USING btree ("road_events_id");
  CREATE INDEX "payload_locked_documents_rels_travel_times_id_idx" ON "payload_locked_documents_rels" USING btree ("travel_times_id");
  CREATE INDEX "payload_locked_documents_rels_outages_id_idx" ON "payload_locked_documents_rels" USING btree ("outages_id");
  CREATE INDEX "payload_locked_documents_rels_weather_alerts_id_idx" ON "payload_locked_documents_rels" USING btree ("weather_alerts_id");
  CREATE INDEX "payload_locked_documents_rels_weather_id_idx" ON "payload_locked_documents_rels" USING btree ("weather_id");
  CREATE INDEX "payload_locked_documents_rels_energy_prices_id_idx" ON "payload_locked_documents_rels" USING btree ("energy_prices_id");
  CREATE INDEX "payload_locked_documents_rels_fuel_prices_id_idx" ON "payload_locked_documents_rels" USING btree ("fuel_prices_id");
  CREATE INDEX "payload_locked_documents_rels_pharmacies_id_idx" ON "payload_locked_documents_rels" USING btree ("pharmacies_id");
  CREATE INDEX "payload_locked_documents_rels_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("jobs_id");
  CREATE INDEX "payload_locked_documents_rels_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("sections_id");
  CREATE INDEX "payload_locked_documents_rels_regions_id_idx" ON "payload_locked_documents_rels" USING btree ("regions_id");
  CREATE INDEX "payload_locked_documents_rels_counties_id_idx" ON "payload_locked_documents_rels" USING btree ("counties_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "momentul_items_order_idx" ON "momentul_items" USING btree ("_order");
  CREATE INDEX "momentul_items_parent_id_idx" ON "momentul_items" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "articles_summary" CASCADE;
  DROP TABLE "articles_sources" CASCADE;
  DROP TABLE "articles_updates" CASCADE;
  DROP TABLE "articles_corrections" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "articles_rels" CASCADE;
  DROP TABLE "_articles_v_version_summary" CASCADE;
  DROP TABLE "_articles_v_version_sources" CASCADE;
  DROP TABLE "_articles_v_version_updates" CASCADE;
  DROP TABLE "_articles_v_version_corrections" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_rels" CASCADE;
  DROP TABLE "frontpages_callouts" CASCADE;
  DROP TABLE "frontpages" CASCADE;
  DROP TABLE "frontpages_rels" CASCADE;
  DROP TABLE "liveblogs_key_points" CASCADE;
  DROP TABLE "liveblogs_entries" CASCADE;
  DROP TABLE "liveblogs" CASCADE;
  DROP TABLE "liveblogs_rels" CASCADE;
  DROP TABLE "_liveblogs_v_version_key_points" CASCADE;
  DROP TABLE "_liveblogs_v_version_entries" CASCADE;
  DROP TABLE "_liveblogs_v" CASCADE;
  DROP TABLE "_liveblogs_v_rels" CASCADE;
  DROP TABLE "authors_same_as" CASCADE;
  DROP TABLE "authors" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "provenance" CASCADE;
  DROP TABLE "road_events_map_segment" CASCADE;
  DROP TABLE "road_events" CASCADE;
  DROP TABLE "travel_times" CASCADE;
  DROP TABLE "outages" CASCADE;
  DROP TABLE "weather_alerts" CASCADE;
  DROP TABLE "weather_alerts_rels" CASCADE;
  DROP TABLE "weather_hours" CASCADE;
  DROP TABLE "weather" CASCADE;
  DROP TABLE "energy_prices" CASCADE;
  DROP TABLE "fuel_prices" CASCADE;
  DROP TABLE "pharmacies" CASCADE;
  DROP TABLE "jobs" CASCADE;
  DROP TABLE "sections" CASCADE;
  DROP TABLE "regions" CASCADE;
  DROP TABLE "counties" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "momentul_items" CASCADE;
  DROP TABLE "momentul" CASCADE;
  DROP TABLE "site" CASCADE;
  DROP TYPE "public"."enum_articles_type";
  DROP TYPE "public"."enum_articles_image_chart";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_type";
  DROP TYPE "public"."enum__articles_v_version_image_chart";
  DROP TYPE "public"."enum__articles_v_version_status";
  DROP TYPE "public"."enum_frontpages_edition";
  DROP TYPE "public"."enum_liveblogs_entries_kind";
  DROP TYPE "public"."enum_liveblogs_live_state";
  DROP TYPE "public"."enum_liveblogs_status";
  DROP TYPE "public"."enum__liveblogs_v_version_entries_kind";
  DROP TYPE "public"."enum__liveblogs_v_version_live_state";
  DROP TYPE "public"."enum__liveblogs_v_version_status";
  DROP TYPE "public"."enum_provenance_event";
  DROP TYPE "public"."enum_provenance_task";
  DROP TYPE "public"."enum_road_events_map_segment";
  DROP TYPE "public"."enum_road_events_status";
  DROP TYPE "public"."enum_travel_times_status";
  DROP TYPE "public"."enum_outages_kind";
  DROP TYPE "public"."enum_weather_alerts_code";
  DROP TYPE "public"."enum_weather_level";
  DROP TYPE "public"."enum_weather_cond";
  DROP TYPE "public"."enum_jobs_source";
  DROP TYPE "public"."enum_regions_map_key";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_momentul_items_edition";`)
}
