// Verifica daca baza de date chiar raspunde (nu doar ca portul e deschis). Iesire 0 = merge, 1 = nu.
// Folosit de porneste-windows.ps1 inainte de migrare, ca sa nu ramana blocat pe o baza agatata.
import pg from 'pg'
const uri = process.argv[2] || 'postgres://cadranul:cadranul@127.0.0.1:5434/cadranul'
setTimeout(() => { console.log('DB_NU_RASPUNDE (timp depasit)'); process.exit(1) }, 15000).unref()
const c = new pg.Client({ connectionString: uri, connectionTimeoutMillis: 10000, query_timeout: 10000 })
try {
  await c.connect()
  await c.query('select 1')
  await c.end()
  console.log('DB_OK')
  process.exit(0)
} catch (e) {
  console.log('DB_NU_RASPUNDE: ' + (e && e.message ? e.message : e))
  process.exit(1)
}
