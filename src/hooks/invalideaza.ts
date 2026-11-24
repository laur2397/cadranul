import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

// Orice schimbare facuta in /admin goleste instantaneul de date al site-ului (src/site/date.ts),
// ca pagina sa arate imediat ce a salvat redactia. In scripturi (seed, importuri) nu exista server: nu face nimic.
async function goleste() {
  try {
    const { invalideazaDate } = await import('../site/date')
    invalideazaDate()
  } catch {
    // in afara serverului Next
  }
}
export const invalideazaDupaSchimbare: CollectionAfterChangeHook = async ({ doc, req }) => { if (!req.context?.importDemo) await goleste(); return doc }
export const invalideazaDupaStergere: CollectionAfterDeleteHook = async ({ doc, req }) => { if (!req.context?.importDemo) await goleste(); return doc }
export const invalideazaGlobal: GlobalAfterChangeHook = async ({ doc, req }) => { if (!req.context?.importDemo) await goleste(); return doc }
export const HOOKURI_DATE = { afterChange: [invalideazaDupaSchimbare], afterDelete: [invalideazaDupaStergere] }
