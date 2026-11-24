// npm run curata-demo: scoate de pe harta datele DEMONSTRATIVE (drumuri, avarii, coduri meteo, timpi de parcurs)
// si frazele demonstrative de sus, ca sa ramana doar ce vine din sursele reale (TomTom, CNAIR, ANM, Apa Oltenia...).
// Nu atinge: articolele, joburile, farmaciile, vremea pe orase (pentru ele inca nu exista o sursa automata),
// nici documentele importate automat sau scrise / modificate de redactie in /admin.
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

if (process.env.NEXT_PUBLIC_DEMO !== 'true') {
  console.error('Refuz: rulează doar pe instalarea demonstrativă (NEXT_PUBLIC_DEMO=true).')
  process.exit(1)
}
const payload = await getPayload({ config })
const ctx = { importDemo: true }
const faraImport = { and: [{ or: [{ importer: { exists: false } }, { importer: { equals: '' } }] }, { or: [{ editedByHuman: { equals: false } }, { editedByHuman: { exists: false } }] }] }
for (const col of ['road-events', 'outages', 'weather-alerts'] as const) {
  const r = await payload.delete({ collection: col, where: faraImport as never, overrideAccess: true, context: ctx })
  console.log(`${col}: șterse ${r.docs.length} demonstrative`)
}
// timpii de parcurs nu au inca sursa automata: toti sunt demonstrativi
const t = await payload.delete({ collection: 'travel-times', where: { id: { exists: true } } as never, overrideAccess: true, context: ctx })
console.log(`travel-times: șterse ${t.docs.length} demonstrative`)
// frazele „momentului” din seed (redactia le poate scrie din nou in /admin › Momentul)
await payload.updateGlobal({ slug: 'momentul', data: { items: [] } as never, overrideAccess: true, context: ctx })
console.log('frazele de sus: scoase (acum se compun singure din datele reale)')
console.log('Gata. Reîmprospătează pagina (harta se actualizează în cel mult un minut).')
process.exit(0)
