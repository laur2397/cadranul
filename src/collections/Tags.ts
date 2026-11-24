import type { CollectionConfig } from 'payload'
import { editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

// Taxonomie mica si controlata (teme urmarite). Fara mii de etichete folosite o data.
export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'Tema', plural: 'Teme' },
  admin: { useAsTitle: 'name', group: 'Structură' },
  hooks: HOOKURI_DATE,
  access: { read: public_, create: editorSauAdmin, update: editorSauAdmin, delete: editorSauAdmin },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
  ],
}
