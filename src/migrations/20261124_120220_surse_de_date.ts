import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_data_sources_legal_status" AS ENUM('public_official', 'needs_permission', 'permission_granted', 'partner_api');
  CREATE TYPE "public"."enum_data_sources_last_status" AS ENUM('ok', 'neschimbat', 'eroare', 'oprit');
  CREATE TYPE "public"."enum_source_runs_status" AS ENUM('ok', 'neschimbat', 'eroare', 'oprit');
  CREATE TABLE "data_sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"legal_status" "enum_data_sources_legal_status" DEFAULT 'needs_permission' NOT NULL,
  	"url" varchar,
  	"terms_url" varchar,
  	"attribution" varchar,
  	"schedule" varchar,
  	"request_letter" varchar,
  	"notes" varchar,
  	"last_status" "enum_data_sources_last_status",
  	"last_run" timestamp(3) with time zone,
  	"last_success" timestamp(3) with time zone,
  	"consecutive_failures" numeric DEFAULT 0,
  	"items_written" numeric,
  	"last_error" varchar,
  	"http_cache" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "source_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"connector" varchar NOT NULL,
  	"started_at" timestamp(3) with time zone,
  	"duration_ms" numeric,
  	"status" "enum_source_runs_status",
  	"dry_run" boolean,
  	"created" numeric,
  	"updated" numeric,
  	"expired" numeric,
  	"skipped" numeric,
  	"message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "road_events" ADD COLUMN "importer" varchar;
  ALTER TABLE "road_events" ADD COLUMN "external_id" varchar;
  ALTER TABLE "road_events" ADD COLUMN "edited_by_human" boolean DEFAULT false;
  ALTER TABLE "outages" ADD COLUMN "importer" varchar;
  ALTER TABLE "outages" ADD COLUMN "external_id" varchar;
  ALTER TABLE "outages" ADD COLUMN "edited_by_human" boolean DEFAULT false;
  ALTER TABLE "weather_alerts" ADD COLUMN "importer" varchar;
  ALTER TABLE "weather_alerts" ADD COLUMN "external_id" varchar;
  ALTER TABLE "weather_alerts" ADD COLUMN "edited_by_human" boolean DEFAULT false;
  ALTER TABLE "energy_prices" ADD COLUMN "quarter_values" varchar;
  ALTER TABLE "energy_prices" ADD COLUMN "importer" varchar;
  ALTER TABLE "energy_prices" ADD COLUMN "external_id" varchar;
  ALTER TABLE "energy_prices" ADD COLUMN "edited_by_human" boolean DEFAULT false;
  ALTER TABLE "fuel_prices" ADD COLUMN "importer" varchar;
  ALTER TABLE "fuel_prices" ADD COLUMN "external_id" varchar;
  ALTER TABLE "fuel_prices" ADD COLUMN "edited_by_human" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "data_sources_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "source_runs_id" integer;
  CREATE UNIQUE INDEX "data_sources_key_idx" ON "data_sources" USING btree ("key");
  CREATE INDEX "data_sources_updated_at_idx" ON "data_sources" USING btree ("updated_at");
  CREATE INDEX "data_sources_created_at_idx" ON "data_sources" USING btree ("created_at");
  CREATE INDEX "source_runs_connector_idx" ON "source_runs" USING btree ("connector");
  CREATE INDEX "source_runs_started_at_idx" ON "source_runs" USING btree ("started_at");
  CREATE INDEX "source_runs_updated_at_idx" ON "source_runs" USING btree ("updated_at");
  CREATE INDEX "source_runs_created_at_idx" ON "source_runs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_data_sources_fk" FOREIGN KEY ("data_sources_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_source_runs_fk" FOREIGN KEY ("source_runs_id") REFERENCES "public"."source_runs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "road_events_importer_idx" ON "road_events" USING btree ("importer");
  CREATE INDEX "road_events_external_id_idx" ON "road_events" USING btree ("external_id");
  CREATE INDEX "outages_importer_idx" ON "outages" USING btree ("importer");
  CREATE INDEX "outages_external_id_idx" ON "outages" USING btree ("external_id");
  CREATE INDEX "weather_alerts_importer_idx" ON "weather_alerts" USING btree ("importer");
  CREATE INDEX "weather_alerts_external_id_idx" ON "weather_alerts" USING btree ("external_id");
  CREATE INDEX "energy_prices_importer_idx" ON "energy_prices" USING btree ("importer");
  CREATE INDEX "energy_prices_external_id_idx" ON "energy_prices" USING btree ("external_id");
  CREATE INDEX "fuel_prices_importer_idx" ON "fuel_prices" USING btree ("importer");
  CREATE INDEX "fuel_prices_external_id_idx" ON "fuel_prices" USING btree ("external_id");
  CREATE INDEX "payload_locked_documents_rels_data_sources_id_idx" ON "payload_locked_documents_rels" USING btree ("data_sources_id");
  CREATE INDEX "payload_locked_documents_rels_source_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("source_runs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "data_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "source_runs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "data_sources" CASCADE;
  DROP TABLE "source_runs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_data_sources_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_source_runs_fk";
  
  DROP INDEX "road_events_importer_idx";
  DROP INDEX "road_events_external_id_idx";
  DROP INDEX "outages_importer_idx";
  DROP INDEX "outages_external_id_idx";
  DROP INDEX "weather_alerts_importer_idx";
  DROP INDEX "weather_alerts_external_id_idx";
  DROP INDEX "energy_prices_importer_idx";
  DROP INDEX "energy_prices_external_id_idx";
  DROP INDEX "fuel_prices_importer_idx";
  DROP INDEX "fuel_prices_external_id_idx";
  DROP INDEX "payload_locked_documents_rels_data_sources_id_idx";
  DROP INDEX "payload_locked_documents_rels_source_runs_id_idx";
  ALTER TABLE "road_events" DROP COLUMN "importer";
  ALTER TABLE "road_events" DROP COLUMN "external_id";
  ALTER TABLE "road_events" DROP COLUMN "edited_by_human";
  ALTER TABLE "outages" DROP COLUMN "importer";
  ALTER TABLE "outages" DROP COLUMN "external_id";
  ALTER TABLE "outages" DROP COLUMN "edited_by_human";
  ALTER TABLE "weather_alerts" DROP COLUMN "importer";
  ALTER TABLE "weather_alerts" DROP COLUMN "external_id";
  ALTER TABLE "weather_alerts" DROP COLUMN "edited_by_human";
  ALTER TABLE "energy_prices" DROP COLUMN "quarter_values";
  ALTER TABLE "energy_prices" DROP COLUMN "importer";
  ALTER TABLE "energy_prices" DROP COLUMN "external_id";
  ALTER TABLE "energy_prices" DROP COLUMN "edited_by_human";
  ALTER TABLE "fuel_prices" DROP COLUMN "importer";
  ALTER TABLE "fuel_prices" DROP COLUMN "external_id";
  ALTER TABLE "fuel_prices" DROP COLUMN "edited_by_human";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "data_sources_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "source_runs_id";
  DROP TYPE "public"."enum_data_sources_legal_status";
  DROP TYPE "public"."enum_data_sources_last_status";
  DROP TYPE "public"."enum_source_runs_status";`)
}
