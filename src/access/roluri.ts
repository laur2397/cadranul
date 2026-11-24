import type { Access, FieldAccess } from 'payload'

// Rolurile: admin (configurare), editor (publica, poate seta advertorial), reporter (scrie ciorne in regiunile lui)
type U = { roles?: string[]; regions?: (string | { id: string })[] } | null | undefined

export const are = (user: U, ...roluri: string[]) => !!user?.roles?.some((r) => roluri.includes(r))

export const autentificat: Access = ({ req }) => !!req.user
export const public_: Access = () => true
export const doarAdmin: Access = ({ req }) => are(req.user as U, 'admin')
export const editorSauAdmin: Access = ({ req }) => are(req.user as U, 'admin', 'editor')
export const campDoarEditor: FieldAccess = ({ req }) => are(req.user as U, 'admin', 'editor')

// Cititorii vad doar ce e publicat; redactia vede si ciornele
export const publicatSauRedactie: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}
