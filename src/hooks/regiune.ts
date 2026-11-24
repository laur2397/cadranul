import type { CollectionBeforeChangeHook } from 'payload'

// Regiunea se deduce din judet (redactorul alege doar judetul).
export const regiuneDinJudet: CollectionBeforeChangeHook = async ({ data, req }) => {
  const c = data?.county
  const id = c && typeof c === 'object' ? c.id : c
  if (id) {
    const j = await req.payload.findByID({ collection: 'counties', id, depth: 0, req }).catch(() => null)
    if (j) data.region = typeof j.region === 'object' ? (j.region as { id: number }).id : j.region
  }
  return data
}
