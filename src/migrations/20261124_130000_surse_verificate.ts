import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Verificarea din Romania (24.11.2026): IGPR interzice accesul automat in robots.txt, Distributie Oltenia cere validare
// anti-robot, pagina Distrigaz e un formular legat de sesiune -> oprite, cu statutul „needs_permission”.
// CNAIR trece pe fluxul RSS, Monitorul preturilor pe formatul real: adresele si notele revin la cele din cod.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`UPDATE "data_sources" SET "legal_status" = 'needs_permission', "enabled" = false, "url" = NULL, "notes" = NULL
    WHERE "key" IN ('igpr-infotrafic', 'avarii-deo', 'avarii-distrigaz-sud')`)
  await db.execute(sql`UPDATE "data_sources" SET "url" = NULL, "notes" = NULL, "http_cache" = NULL WHERE "key" IN ('cnair-drumuri', 'carburanti-cc')`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`UPDATE "data_sources" SET "legal_status" = 'public_notice', "enabled" = true
    WHERE "key" IN ('igpr-infotrafic', 'avarii-deo', 'avarii-distrigaz-sud')`)
}
