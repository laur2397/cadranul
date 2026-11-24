import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Decizia editorului (24.11.2026): drumurile, carburantii si avariile sunt anunturi publice; se preiau automat, cu atribuire.
// Registrele existente trec la „public_notice” si pornite; adresa si notele revin la cele din cod (src/surse/conectori.ts). (Migrare separata: valoarea noua a enum-ului trebuie intai salvata.)
const CHEI = sql`('igpr-infotrafic', 'cnair-drumuri', 'carburanti-cc', 'avarii-deo', 'avarii-apa-oltenia', 'avarii-distrigaz-sud')`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`UPDATE "data_sources" SET "legal_status" = 'public_notice', "enabled" = true, "url" = NULL, "notes" = NULL, "request_letter" = NULL WHERE "key" IN ${CHEI} AND "legal_status" = 'needs_permission'`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`UPDATE "data_sources" SET "legal_status" = 'needs_permission', "enabled" = false WHERE "key" IN ${CHEI} AND "legal_status" = 'public_notice'`)
}
