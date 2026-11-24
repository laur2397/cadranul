import type { CollectionConfig } from 'payload'
import { autentificat, editorSauAdmin, public_ } from '../access/roluri'
import { HOOKURI_DATE } from '../hooks/invalideaza'
import { campSursa } from './campuri'

// Preturile la carburanti pe judet, pe zi (lei/litru). Media nationala = media judetelor din acea zi.
export const FuelPrices: CollectionConfig = {
  slug: 'fuel-prices',
  labels: { singular: 'Carburant (județ, zi)', plural: 'Carburanți: prețuri' },
  admin: { useAsTitle: 'day', group: 'Date utile', defaultColumns: ['county', 'day', 'petrol', 'diesel', 'lpg'] },
  access: { read: public_, create: autentificat, update: autentificat, delete: editorSauAdmin },
  hooks: HOOKURI_DATE,
  indexes: [{ fields: ['county', 'day'], unique: true }],
  fields: [
    {
      type: 'row', fields: [
        { name: 'county', label: 'Județ', type: 'relationship', relationTo: 'counties', required: true, index: true, admin: { width: '50%' } },
        { name: 'day', label: 'Ziua (AAAA-LL-ZZ)', type: 'text', required: true, index: true, admin: { width: '50%' }, validate: (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? true : 'Format: 2026-11-24') },
      ],
    },
    {
      type: 'row', fields: [
        { name: 'petrol', label: 'Benzină standard', type: 'number', required: true, admin: { width: '33%', step: 0.01 } },
        { name: 'diesel', label: 'Motorină standard', type: 'number', required: true, admin: { width: '33%', step: 0.01 } },
        { name: 'lpg', label: 'GPL', type: 'number', admin: { width: '34%', step: 0.01 } },
      ],
    },
    { name: 'cheapestNote', label: 'Cea mai ieftină benzinărie (opțional, ex. Craiova, Calea Severinului: 7,49 lei)', type: 'text' },
    campSursa,
  ],
}
