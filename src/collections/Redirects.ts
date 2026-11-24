import type { CollectionConfig } from 'payload'
import { editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Redirecționare', plural: 'Redirecționări' },
  admin: { useAsTitle: 'from', group: 'Administrare' },
  hooks: HOOKURI_DATE,
  access: { read: public_, create: editorSauAdmin, update: editorSauAdmin, delete: editorSauAdmin },
  fields: [
    { name: 'from', type: 'text', required: true, unique: true },
    { name: 'to', type: 'text', required: true },
    { name: 'permanent', type: 'checkbox', defaultValue: true },
  ],
}
