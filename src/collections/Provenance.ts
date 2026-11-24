import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { createHash } from 'node:crypto'

// Pista de provenienta . Doar adaugare: nimeni nu poate modifica sau sterge
// un eveniment din aplicatie. Fiecare eveniment contine amprenta celui anterior (lant).
// La nivelul bazei de date se aplica in plus REVOKE UPDATE, DELETE (migrarea provenienta_imuabila).

export const EVENIMENTE = [
  { label: 'Sursa atasata', value: 'sursa_atasata' },
  { label: 'AI folosit', value: 'ai_folosit' },
  { label: 'Editare umana', value: 'editare_umana' },
  { label: 'Poarta trecuta', value: 'poarta_trecuta' },
  { label: 'Publicat', value: 'publicat' },
  { label: 'Corectura', value: 'corectura' },
  { label: 'Import demonstrativ', value: 'import_demo' },
]

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

const inlantuie: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') throw new Error('Pista de provenienta nu poate fi modificata.')
  const articleId = typeof data.article === 'object' ? data.article?.id : data.article
  const prev = await req.payload.find({
    collection: 'provenance', where: { article: { equals: articleId } }, sort: '-createdAt', limit: 1, depth: 0, req,
  })
  const prevHash = (prev.docs[0] as { hash?: string } | undefined)?.hash || 'GENESIS'
  const at = new Date().toISOString()
  const corp = JSON.stringify({ articleId, event: data.event, actor: data.actor, tool: data.tool, task: data.task, gate: data.gate, contentHash: data.contentHash, note: data.note, at })
  return { ...data, at, prevHash, hash: sha256(prevHash + corp) }
}

export const Provenance: CollectionConfig = {
  slug: 'provenance',
  labels: { singular: 'Eveniment de provenienta', plural: 'Provenienta' },
  admin: { group: 'Redacție', defaultColumns: ['article', 'event', 'actor', 'tool', 'at'], useAsTitle: 'event' },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: () => false,
    delete: () => false,
  },
  hooks: { beforeChange: [inlantuie] },
  fields: [
    { name: 'article', type: 'relationship', relationTo: 'articles', required: true, index: true },
    { name: 'event', type: 'select', required: true, options: EVENIMENTE },
    { name: 'actor', label: 'Cine (om sau sistem)', type: 'text', required: true },
    { name: 'tool', label: 'Unealta AI', type: 'text', admin: { condition: (d) => d?.event === 'ai_folosit' } },
    { name: 'local', label: 'Ruleaza pe echipamentele redactiei', type: 'checkbox', admin: { condition: (d) => d?.event === 'ai_folosit' } },
    {
      name: 'task', label: 'Sarcina', type: 'select', admin: { condition: (d) => d?.event === 'ai_folosit' },
      options: ['transcriere', 'extragere', 'traducere', 'verificare', 'metadate', 'redactare'],
    },
    { name: 'gate', label: 'Poarta (1-6)', type: 'number', min: 1, max: 6, admin: { condition: (d) => d?.event === 'poarta_trecuta' } },
    { name: 'note', type: 'textarea' },
    { name: 'contentHash', type: 'text' },
    { name: 'at', type: 'date', admin: { readOnly: true } },
    { name: 'prevHash', type: 'text', admin: { readOnly: true } },
    { name: 'hash', type: 'text', admin: { readOnly: true } },
  ],
}
