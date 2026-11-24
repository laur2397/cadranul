import type { CollectionBeforeChangeHook, CollectionAfterChangeHook } from 'payload'
import { sha256 } from '../collections/Provenance'

// Sarcinile AI care schimba textul publicat (cele care declanseaza eticheta si regula de mai jos)
const AFECTEAZA_TEXTUL = ['redactare', 'traducere']

const amprenta = (d: Record<string, unknown>) => sha256(JSON.stringify({ t: d.title, k: d.dek, s: d.summary, b: d.body }))

// Regula de publicare, in cod : butonul „publica" e blocat daca ultima
// interventie AI asupra textului e ulterioara ultimei editari umane si ultimei porti trecute.
export const verificaPublicarea: CollectionBeforeChangeHook = async ({ data, originalDoc, req, operation }) => {
  if (data._status !== 'published') return data
  const imp = req.context?.importDemo === true
  if (!imp) {
    if (!data.titleCheck) throw new Error('Înainte de publicare: confirmă că răspunsul la titlu apare în primele două rânduri.')
    if (data.type !== 'advertorial' && !(data.authors?.length)) throw new Error('Un articol publicat are cel puțin un autor real.')
  }
  data.publishedAt = data.publishedAt || originalDoc?.publishedAt || new Date().toISOString()
  if (operation === 'update' && originalDoc?.id) {
    const ev = await req.payload.find({ collection: 'provenance', where: { article: { equals: originalDoc.id } }, sort: '-createdAt', limit: 200, depth: 0, req })
    const docs = ev.docs as { event: string; task?: string; createdAt: string }[]
    const ultim = (f: (e: (typeof docs)[number]) => boolean) => docs.find(f)?.createdAt
    const ai = ultim((e) => e.event === 'ai_folosit' && AFECTEAZA_TEXTUL.includes(e.task || ''))
    const om = [ultim((e) => e.event === 'editare_umana'), ultim((e) => e.event === 'poarta_trecuta')].filter(Boolean).sort().pop()
    if (ai && (!om || ai > om)) throw new Error('Publicare blocata: ultima interventie AI asupra textului este dupa ultima verificare umana. Un editor trebuie sa revada textul si sa treaca poarta.')
    data.aiAssisted = docs.some((e) => e.event === 'ai_folosit' && AFECTEAZA_TEXTUL.includes(e.task || ''))
  }
  return data
}

export const inregistreazaPublicarea: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc._status !== 'published') return doc
  const h = amprenta(doc)
  if (previousDoc?._status === 'published' && amprenta(previousDoc) === h) return doc
  await req.payload.create({
    collection: 'provenance', req,
    data: {
      article: doc.id,
      event: req.context?.importDemo ? 'import_demo' : 'publicat',
      actor: (req.user as { email?: string } | undefined)?.email || 'sistem',
      contentHash: h,
    },
  })
  return doc
}

