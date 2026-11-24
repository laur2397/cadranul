import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Pista de provenienta este doar cu adaugare si la nivelul bazei de date .
// Consecinta voita: un articol care are istoric de provenienta nu poate fi sters, doar retras.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION provenienta_doar_adaugare() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'Pista de provenienta nu poate fi modificata sau stearsa (%).', TG_OP;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS provenienta_imuabila ON "provenance";
    CREATE TRIGGER provenienta_imuabila
      BEFORE UPDATE OR DELETE ON "provenance"
      FOR EACH ROW EXECUTE FUNCTION provenienta_doar_adaugare();

    DROP TRIGGER IF EXISTS provenienta_fara_golire ON "provenance";
    CREATE TRIGGER provenienta_fara_golire
      BEFORE TRUNCATE ON "provenance"
      FOR EACH STATEMENT EXECUTE FUNCTION provenienta_doar_adaugare();
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TRIGGER IF EXISTS provenienta_imuabila ON "provenance";
    DROP TRIGGER IF EXISTS provenienta_fara_golire ON "provenance";
    DROP FUNCTION IF EXISTS provenienta_doar_adaugare();
  `)
}
