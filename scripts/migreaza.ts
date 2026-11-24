// npm run migreaza: aduce tabelele bazei de date la zi, fara intrebari interactive.
// Scrie pe ecran fiecare pas, ca sa se vada unde s-ar opri. Iese singur la final.
import 'dotenv/config'
const t0 = Date.now()
const pas = (m: string) => console.log(`[migrare ${Math.round((Date.now() - t0) / 1000)}s] ${m}`)
pas('incarc configuratia site-ului...')
const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')
const { migrations } = await import('../src/migrations')
pas('ma conectez la baza de date...')
const payload = await getPayload({ config })
pas('conectat; aplic modificarile de tabele...')
await payload.db.migrate({ migrations: migrations as unknown as Parameters<typeof payload.db.migrate>[0] extends { migrations?: infer M } ? M : never })
pas('gata.')
process.exit(0)
