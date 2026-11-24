// Statutul nou „public_notice”: anunt public, preluat automat cu atribuire (decizia editorului, 24.11.2026).
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_data_sources_legal_status" ADD VALUE 'public_notice' BEFORE 'needs_permission';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "data_sources" ALTER COLUMN "legal_status" SET DATA TYPE text;
  UPDATE "data_sources" SET "legal_status" = 'needs_permission', "enabled" = false WHERE "legal_status" = 'public_notice';
  ALTER TABLE "data_sources" ALTER COLUMN "legal_status" SET DEFAULT 'needs_permission'::text;
  DROP TYPE "public"."enum_data_sources_legal_status";
  CREATE TYPE "public"."enum_data_sources_legal_status" AS ENUM('public_official', 'needs_permission', 'permission_granted', 'partner_api');
  ALTER TABLE "data_sources" ALTER COLUMN "legal_status" SET DEFAULT 'needs_permission'::"public"."enum_data_sources_legal_status";
  ALTER TABLE "data_sources" ALTER COLUMN "legal_status" SET DATA TYPE "public"."enum_data_sources_legal_status" USING "legal_status"::"public"."enum_data_sources_legal_status";`)
}
