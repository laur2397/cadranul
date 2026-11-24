import type { CollectionConfig } from 'payload'
import { doarAdmin, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'

// Judetul este eticheta (pagina /judet/<slug>), nu editie.
export const Counties: CollectionConfig = {
  slug: 'counties',
  labels: { singular: 'Județ', plural: 'Județe' },
  admin: { useAsTitle: 'name', group: 'Structură', defaultColumns: ['name', 'seat', 'region', 'jobsActive'] },
  access: { read: public_, create: doarAdmin, update: editorSauAdmin, delete: doarAdmin },
  hooks: HOOKURI_DATE,
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'mapKey', label: 'Cheia pe hartă (fără diacritice, ex. Valcea)', type: 'text', required: true },
    { name: 'seat', label: 'Reședința', type: 'text', required: true },
    { name: 'region', type: 'relationship', relationTo: 'regions', required: true, index: true },
    {
      name: 'jobsActive', label: 'Anunțuri de muncă active (din importul de pe site-urile de joburi)', type: 'number', min: 0,
      admin: { description: 'Gol = se numără doar anunțurile din Cadranul. Îl actualizează importul (docs/fluxuri-date.md).' },
    },
  ],
}
